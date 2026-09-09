import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import OpenAI from "openai";

@Injectable()
export class TutorService {
  private openai?: OpenAI;

  constructor(private prisma: PrismaService) {
    if (process.env.OPENAI_API_KEY) this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  private fallback(message: string, context?: Record<string, unknown>) {
    const normalized = message.toLowerCase();

    if (normalized.includes("capital expenditure")) {
      return "Capital expenditure (CapEx) is spending on long-term assets such as equipment, buildings, or machinery. A simple way to remember it: money spent to create or improve something that will provide value for a long time.";
    }
    if (normalized.includes("main idea") || normalized.includes("main claim")) {
      return "Look for the claim that the author keeps supporting across the passage. A strong answer usually explains the passage as a whole rather than focusing on one detail.";
    }
    if (normalized.includes("inference")) {
      return "An inference is a conclusion supported by clues in the text. Ask: What does the passage strongly suggest, even if it does not say it word-for-word?";
    }
    if (normalized.includes("equation") || normalized.includes("algebra")) {
      return "For an algebra question, identify what is unknown, write the relationship as an equation, simplify one step at a time, and check the result against the original statement.";
    }

    const subject = context?.subject ? ` for ${String(context.subject)}` : "";
    return `I can help you reason through this${subject}. Focus on the evidence in the question, eliminate clearly unsupported choices, and explain why the remaining choice fits the prompt. Ask me about a specific term, concept, or step and I will guide you without simply giving away an active-test answer.`;
  }

  async chat(message: string, context?: Record<string, unknown>, learnerId?: string, conversationId?: string) {
    if (!learnerId || !/^anon_[0-9a-f-]{36}$/i.test(learnerId)) throw new BadRequestException("Anonymous learner identity is required.");
    let conversation = conversationId ? await this.prisma.tutorConversation.findFirst({ where: { id: conversationId, learnerId } }) : null;
    if (!conversation) conversation = await this.prisma.tutorConversation.create({ data: { learnerId, subject: context?.subject as any, examId: context?.examId as string | undefined, attemptId: context?.attemptId as string | undefined } });
    await this.prisma.tutorMessage.create({ data: { conversationId: conversation.id, role: "user", content: message } });
    let reply: string, provider: string;
    if (!this.openai) {
      reply = this.fallback(message, context); provider = "fallback";
    } else {
      const system = ["You are GED AI Tutor.", "For active exams, coach the learner without revealing the correct answer choice.", "You may explain vocabulary, concepts, reasoning steps, and how to use evidence.", "Never expose hidden answer keys or private metadata.", `Context: ${JSON.stringify(context ?? {})}`].join("\n");
      const completion = await this.openai.chat.completions.create({ model: "gpt-4.1-mini", messages: [{ role: "system", content: system }, { role: "user", content: message }] });
      reply = completion.choices[0]?.message?.content ?? "I couldn't generate a response."; provider = "openai";
    }
    await this.prisma.tutorMessage.create({ data: { conversationId: conversation.id, role: "assistant", content: reply } });
    return { reply, provider, conversationId: conversation.id };
  }

  async scoreEssay(essay: string, prompt: string) {
    if (!this.openai) {
      const sentences = essay.split(/[.!?]+/).filter(Boolean).length;
      const words = essay.trim() ? essay.trim().split(/\s+/).length : 0;
      const trait1 = Math.max(0, Math.min(2, Math.round((words >= 250 ? 2 : words >= 120 ? 1 : 0))));
      const trait2 = Math.max(0, Math.min(2, Math.round((sentences >= 8 ? 2 : sentences >= 4 ? 1 : 0))));
      const trait3 = Math.max(0, Math.min(2, Math.round((essay.includes(",") || essay.includes(";")) ? 1 : 0)));
      return {
        provider: "fallback",
        score: trait1 + trait2 + trait3,
        traits: {
          trait1: { score: trait1, feedback: "Make the claim explicit and connect each example to evidence from the source." },
          trait2: { score: trait2, feedback: "Use a clear introduction, logical body paragraphs and a conclusion that reinforces your reasoning." },
          trait3: { score: trait3, feedback: "Review sentence boundaries, punctuation, agreement and concise academic wording." }
        },
        summary: `Fallback practice analysis for the prompt: ${prompt.slice(0, 140)}`
      };
    }

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Score a GED-style extended response using three practice traits: analysis/evidence, development/organization, and language/conventions. Do not claim official scoring authority. Return JSON with score 0-6, each trait score 0-2, feedback, and summary."
        },
        { role: "user", content: JSON.stringify({ prompt, essay }) }
      ]
    });

    return JSON.parse(completion.choices[0]?.message?.content ?? "{}");
  }
}
