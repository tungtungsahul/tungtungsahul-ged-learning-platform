import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import OpenAI from "openai";

@Injectable()
export class SkillsService {
  constructor(private prisma: PrismaService) {}

  async analytics() {
    const attempts = await this.prisma.result.findMany({
      where: { attempt: { learnerId: "demo-learner" } },
      include: { attempt: { include: { exam: true } } },
      orderBy: { percentage: "desc" }
    });
    const topics = await this.prisma.mistake.groupBy({
      by: ["topic"],
      where: { learnerId: "demo-learner" },
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

  mistakes() {
    return this.prisma.mistake.findMany({
      where: { learnerId: "demo-learner" },
      orderBy: { createdAt: "desc" },
      take: 100
    });
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
      return {
        provider: "fallback",
        score: trait1 + trait2 + trait3,
        traits: [
          { id: 1, name: "Analysis & Evidence", score: trait1, max: 2, feedback: "State a precise claim and connect evidence to that claim." },
          { id: 2, name: "Development & Organization", score: trait2, max: 2, feedback: "Use paragraphs with topic sentences and logical transitions." },
          { id: 3, name: "Language & Conventions", score: trait3, max: 2, feedback: "Check sentence boundaries, punctuation, agreement and concise academic phrasing." }
        ],
        corrections: [],
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
}
