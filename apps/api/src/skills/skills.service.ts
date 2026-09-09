import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import OpenAI from "openai";

@Injectable()
export class SkillsService {
  constructor(private prisma: PrismaService) {}

  private learnerId(value?: string) {
    if (!value || !/^anon_[0-9a-f-]{36}$/i.test(value)) throw new BadRequestException("Anonymous learner identity is required.");
    return value;
  }

  async analytics(requestedLearnerId?: string) {
    const learnerId = this.learnerId(requestedLearnerId);
    const attempts = await this.prisma.result.findMany({
      where: { attempt: { learnerId } },
      include: { attempt: { include: { exam: true } } },
      orderBy: { percentage: "desc" }
    });
    const topics = await this.prisma.mistake.groupBy({
      by: ["topic"],
      where: { learnerId },
      _count: { id: true }
    });

    const subjectScores = ["MATH", "SCIENCE", "SOCIAL_STUDIES", "RLA"].map(subject => {
      const rows = attempts.filter(a => a.attempt.exam.subject === subject);
      return { subject, score: rows.length ? Math.round(rows.reduce((s, x) => s + x.percentage, 0) / rows.length) : 0 };
    });

    return {
      subjectScores,
      topicGaps: topics.map(t => ({ topic: t.topic, misses: t._count.id })),
      adaptivePlan: topics
        .sort((a, b) => b._count.id - a._count.id)
        .slice(0, 5)
        .map((t, i) => ({ priority: i + 1, topic: t.topic, activity: "10-minute targeted practice + 5 flashcards" }))
    };
  }

  mistakes(requestedLearnerId?: string) {
    const learnerId = this.learnerId(requestedLearnerId);
    return this.prisma.mistake.findMany({
      where: { learnerId },
      orderBy: { createdAt: "desc" },
      take: 100
    });
  }

  async markMistakeReviewed(id: string, requestedLearnerId?: string) {
    const learnerId = this.learnerId(requestedLearnerId);
    const result = await this.prisma.mistake.updateMany({ where: { id, learnerId }, data: { reviewed: true } });
    if (!result.count) throw new BadRequestException("Mistake not found.");
    return { reviewed: true };
  }

  flashcards() {
    return this.prisma.flashcard.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  }

  async scoreEssay(essay: string, prompt: string) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      const words = essay.trim() ? essay.trim().split(/\s+/).length : 0;
      const sentenceCount = essay.split(/[.!?]+/).filter(Boolean).length;
      const trait1 = words >= 250 ? 2 : words >= 120 ? 1 : 0;
      const trait2 = sentenceCount >= 8 ? 2 : sentenceCount >= 4 ? 1 : 0;
      const trait3 = /[.!?]/.test(essay) && /,|;/.test(essay) ? 1 : 0;
      const corrections = essay.split(/(?<=[.!?])\s+/).map((sentence, index) => {
        const issues: string[] = [];
        if (sentence.trim().split(/\s+/).length > 35) issues.push("Consider splitting this long sentence for clarity.");
        if (/\b(very|really|things|stuff)\b/i.test(sentence)) issues.push("Replace vague wording with a specific academic term.");
        if (!/[.!?]$/.test(sentence.trim())) issues.push("Check sentence ending punctuation.");
        return issues.length ? { sentence: index + 1, text: sentence, issues } : null;
      }).filter(Boolean);
      return {
        provider: "fallback",
        score: trait1 + trait2 + trait3,
        traits: [
          { id: 1, name: "Analysis & Evidence", score: trait1, max: 2, feedback: "State a precise claim and connect evidence to that claim." },
          { id: 2, name: "Development & Organization", score: trait2, max: 2, feedback: "Use paragraphs with topic sentences and logical transitions." },
          { id: 3, name: "Language & Conventions", score: trait3, max: 2, feedback: "Check sentence boundaries, punctuation, agreement and concise academic phrasing." }
        ],
        corrections,
        summary: `Practice-only fallback review for: ${prompt}`
      };
    }

    const openai = new OpenAI({ apiKey });
    const out = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Analyze a GED-style extended response for practice. Score three traits from 0-2 each: analysis/evidence, development/organization, language/conventions. Include specific sentence-level corrections when clear. Do not claim official exam scoring."
        },
        { role: "user", content: JSON.stringify({ prompt, essay }) }
      ]
    });
    return JSON.parse(out.choices[0]?.message?.content ?? "{}");
  }

  async analyzeSpeaking(audio: { buffer?: Buffer; originalname?: string; mimetype?: string } | undefined, locale = "en-US") {
    if (!audio?.buffer?.length) throw new BadRequestException("Audio recording is required.");
    const endpoint = process.env.AZURE_SPEECH_ENDPOINT?.replace(/\/$/, "");
    const key = process.env.AZURE_SPEECH_KEY;
    if (!endpoint || !key) throw new BadRequestException("Azure Speech is not configured. Set AZURE_SPEECH_ENDPOINT and AZURE_SPEECH_KEY.");
    const form = new FormData();
    const bytes = new Uint8Array(audio.buffer.byteLength); bytes.set(audio.buffer);
    form.append("audio", new Blob([bytes.buffer], { type: audio.mimetype || "audio/webm" }), audio.originalname || "recording.webm");
    form.append("definition", JSON.stringify({ locales: [locale] }));
    const response = await fetch(`${endpoint}/speechtotext/transcriptions:transcribe?api-version=2025-10-15`, { method: "POST", headers: { "Ocp-Apim-Subscription-Key": key }, body: form });
    const data: any = await response.json().catch(() => ({}));
    if (!response.ok) throw new BadRequestException(data.error?.message || "Azure Speech transcription failed.");
    const transcript = data.combinedPhrases?.map((phrase: any) => phrase.text).join(" ") || data.phrases?.map((phrase: any) => phrase.text).join(" ") || "";
    const durationSeconds = Math.max(1, Math.round((data.durationMilliseconds || 0) / 1000));
    const words = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
    const gaps = (data.phrases || []).slice(1).map((phrase: any, index: number) => Math.max(0, (phrase.offsetMilliseconds || 0) - ((data.phrases[index].offsetMilliseconds || 0) + (data.phrases[index].durationMilliseconds || 0))));
    const longPauses = gaps.filter((gap: number) => gap >= 1000).length;
    const confidenceValues = (data.phrases || []).map((phrase: any) => Number(phrase.confidence)).filter(Number.isFinite);
    const confidence = confidenceValues.length ? Math.round((confidenceValues.reduce((sum: number, value: number) => sum + value, 0) / confidenceValues.length) * 100) : null;
    return { provider: "azure-speech", transcript, durationSeconds, wordsPerMinute: Math.round(words / (durationSeconds / 60)), longPauses, confidence, pronunciation: { status: "Reference text required for Azure pronunciation assessment." } };
  }
}
