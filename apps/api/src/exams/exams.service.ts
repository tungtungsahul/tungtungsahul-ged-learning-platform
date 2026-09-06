import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { AnswerDto } from "./dto";
import { AttemptStatus, Subject } from "@prisma/client";

@Injectable()
export class ExamsService {
  constructor(private prisma: PrismaService) {}

  private scaleGed(percentage: number) {
    return Math.round(100 + percentage);
  }

  private normalizeAnswer(q: any, answer: any) {
    if (!answer) return false;
    if (q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE" || q.type === "DROPDOWN") {
      return !!answer.selectedOption?.isCorrect;
    }
    if (q.type === "FILL_BLANK" || q.type === "SHORT_ANSWER") {
      const expected = String((q.data as any)?.acceptedAnswer ?? "").trim().toLowerCase();
      const actual = String(answer.textValue ?? "").trim().toLowerCase();
      return expected.length > 0 && actual === expected;
    }
    if (q.type === "DRAG_DROP") {
      return JSON.stringify(answer.payload ?? null) === JSON.stringify((q.data as any)?.correctPayload ?? null);
    }
    return false;
  }

  list() {
    return this.prisma.exam.findMany({
      orderBy: { createdAt: "desc" },
      include: { course: true, schedules: true }
    });
  }

  async get(id: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: {
        course: true,
        passages: { orderBy: { order: "asc" }, include: { audio: true } },
        questions: {
          orderBy: { order: "asc" },
          include: { options: { select: { id: true, label: true, text: true } } }
        }
      }
    });
    if (!exam) throw new NotFoundException("Exam not found.");
    return exam;
  }

  async start(examId: string) {
    const exam = await this.get(examId);
    const active = await this.prisma.attempt.findFirst({
      where: { learnerId: "demo-learner", examId, status: AttemptStatus.IN_PROGRESS }
    });

    if (active) {
      if (active.expiresAt > new Date()) return this.getAttempt(active.id);
      await this.expire(active.id);
    }

    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + exam.durationSeconds * 1000);
    const attempt = await this.prisma.attempt.create({
      data: { learnerId: "demo-learner", examId, startedAt, expiresAt }
    });

    return this.getAttempt(attempt.id);
  }

  async getAttempt(attemptId: string): Promise<any> {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          include: {
            course: true,
            passages: { orderBy: { order: "asc" }, include: { audio: true } },
            questions: {
              orderBy: { order: "asc" },
              include: { options: { select: { id: true, label: true, text: true } } }
            }
          }
        },
        answers: { select: { questionId: true, selectedOptionId: true, textValue: true, payload: true } }
      }
    });
    if (!attempt) throw new NotFoundException("Attempt not found.");

    if (attempt.status === AttemptStatus.IN_PROGRESS && attempt.expiresAt <= new Date()) {
      await this.expire(attempt.id);
      return this.getAttempt(attempt.id);
    }
    return attempt;
  }

  async saveAnswer(attemptId: string, dto: AnswerDto) {
    const attempt = await this.prisma.attempt.findUnique({ where: { id: attemptId } });
    if (!attempt) throw new NotFoundException("Attempt not found.");
    if (attempt.status !== AttemptStatus.IN_PROGRESS) throw new BadRequestException("Attempt is not active.");
    if (attempt.expiresAt <= new Date()) {
      await this.expire(attempt.id);
      throw new BadRequestException("EXAM_EXPIRED");
    }

    const question = await this.prisma.question.findFirst({ where: { id: dto.questionId, examId: attempt.examId } });
    if (!question) throw new BadRequestException("Question does not belong to this exam.");

    if (dto.selectedOptionId) {
      const option = await this.prisma.option.findFirst({ where: { id: dto.selectedOptionId, questionId: dto.questionId } });
      if (!option) throw new BadRequestException("Invalid option.");
    }

    await this.prisma.answer.upsert({
      where: { attemptId_questionId: { attemptId, questionId: dto.questionId } },
      update: { selectedOptionId: dto.selectedOptionId, textValue: dto.textValue, payload: (dto.payload as any) ?? undefined },
      create: {
        attemptId,
        questionId: dto.questionId,
        selectedOptionId: dto.selectedOptionId,
        textValue: dto.textValue,
        payload: (dto.payload as any) ?? undefined
      }
    });
    return { saved: true, savedAt: new Date().toISOString() };
  }

  private async calculate(attemptId: string) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: { exam: true, answers: { include: { selectedOption: true } } }
    });
    if (!attempt) throw new NotFoundException("Attempt not found.");

    const questions = await this.prisma.question.findMany({
      where: { examId: attempt.examId },
      orderBy: { order: "asc" }
    });

    const correctQuestions = questions.filter(q => {
      const a = attempt.answers.find(x => x.questionId === q.id);
      return this.normalizeAnswer(q, a);
    });

    const correct = correctQuestions.length;
    const unanswered = questions.filter(q => !attempt.answers.some(a => a.questionId === q.id)).length;
    const incorrect = Math.max(0, questions.length - unanswered - correct);
    const percentage = questions.length ? Math.round((correct / questions.length) * 100) : 0;
    const gedScore = this.scaleGed(percentage);
    const now = new Date();
    const timeUsedSeconds = Math.min(
      attempt.exam.durationSeconds,
      Math.max(0, Math.floor((now.getTime() - attempt.startedAt.getTime()) / 1000))
    );

    return { attempt, questions, correct, incorrect, unanswered, percentage, gedScore, timeUsedSeconds };
  }

  async submit(attemptId: string) {
    const calc = await this.calculate(attemptId);
    const expired = new Date() >= calc.attempt.expiresAt;
    const status = expired ? AttemptStatus.EXPIRED : AttemptStatus.SUBMITTED;

    await this.prisma.$transaction([
      this.prisma.attempt.update({
        where: { id: attemptId },
        data: {
          status,
          submittedAt: new Date(),
          score: calc.correct,
          percentage: calc.percentage,
          gedScore: calc.gedScore
        }
      }),
      this.prisma.result.upsert({
        where: { attemptId },
        update: {
          correctAnswers: calc.correct,
          incorrectAnswers: calc.incorrect,
          unanswered: calc.unanswered,
          percentage: calc.percentage,
          gedScore: calc.gedScore,
          passed: calc.gedScore >= 145,
          timeUsedSeconds: calc.timeUsedSeconds
        },
        create: {
          attemptId,
          correctAnswers: calc.correct,
          incorrectAnswers: calc.incorrect,
          unanswered: calc.unanswered,
          percentage: calc.percentage,
          gedScore: calc.gedScore,
          passed: calc.gedScore >= 145,
          timeUsedSeconds: calc.timeUsedSeconds
        }
      })
    ]);

    const missed = calc.questions.filter(q => {
      const a = calc.attempt.answers.find(x => x.questionId === q.id);
      return !this.normalizeAnswer(q, a);
    });

    for (const q of missed) {
      await this.prisma.mistake.upsert({
        where: {
          id: `${attemptId}-${q.id}`
        },
        update: {},
        create: {
          id: `${attemptId}-${q.id}`,
          courseId: calc.attempt.exam ? (await this.prisma.exam.findUnique({ where: { id: calc.attempt.examId } }))!.courseId : "",
          learnerId: "demo-learner",
          questionId: q.id,
          topic: q.topic
        }
      }).catch(() => undefined);
    }

    return this.result(attemptId);
  }

  private async expire(attemptId: string) {
    return this.submit(attemptId);
  }

  async result(attemptId: string) {
    const result = await this.prisma.result.findUnique({
      where: { attemptId },
      include: {
        attempt: {
          include: {
            exam: { include: { questions: { orderBy: { order: "asc" }, include: { options: true } } } },
            answers: { include: { selectedOption: true } }
          }
        }
      }
    });
    if (!result) throw new NotFoundException("Result not found.");

    return {
      ...result,
      questions: result.attempt.exam.questions.map(q => {
        const a = result.attempt.answers.find(x => x.questionId === q.id);
        const correct = q.options.find(o => o.isCorrect);
        return {
          id: q.id,
          order: q.order,
          text: q.text,
          topic: q.topic,
          explanation: q.explanation,
          studentAnswer: a?.selectedOption ? { label: a.selectedOption.label, text: a.selectedOption.text } : a?.textValue ?? null,
          correctAnswer: correct ? { label: correct.label, text: correct.text } : (q.data as any)?.acceptedAnswer ?? null
        };
      })
    };
  }
}
