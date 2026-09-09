import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { AnswerDto } from "./dto";
import { AttemptStatus, Subject } from "@prisma/client";

@Injectable()
export class ExamsService {
  constructor(private prisma: PrismaService) {}

  private learnerId(value?: string) {
    if (!value || !/^anon_[0-9a-f-]{36}$/i.test(value)) {
      throw new BadRequestException("A valid anonymous learner identity is required.");
    }
    return value;
  }

  /** Practice-only, non-linear conversion; it is not an official GED scale. */
  private scaleGed(percentage: number) {
    const anchors = [[0, 100], [20, 120], [40, 140], [60, 155], [75, 165], [90, 180], [100, 200]];
    const raw = Math.max(0, Math.min(100, percentage));
    for (let i = 1; i < anchors.length; i++) {
      const [leftRaw, leftScore] = anchors[i - 1];
      const [rightRaw, rightScore] = anchors[i];
      if (raw <= rightRaw) return Math.round(leftScore + ((raw - leftRaw) / (rightRaw - leftRaw)) * (rightScore - leftScore));
    }
    return 200;
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

  async start(examId: string, requestedLearnerId?: string) {
    const learnerId = this.learnerId(requestedLearnerId);
    const exam = await this.get(examId);
    const active = await this.prisma.attempt.findFirst({
      where: { learnerId, examId, status: AttemptStatus.IN_PROGRESS }
    });

    if (active) {
      if (active.expiresAt > new Date()) return this.getAttempt(active.id, learnerId);
      await this.expire(active.id, learnerId);
    }

    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + exam.durationSeconds * 1000);
    const attempt = await this.prisma.attempt.create({
      data: { learnerId, examId, startedAt, expiresAt }
    });

    return this.getAttempt(attempt.id, learnerId);
  }

  async getAttempt(attemptId: string, requestedLearnerId?: string): Promise<any> {
    const learnerId = this.learnerId(requestedLearnerId);
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
    if (!attempt || attempt.learnerId !== learnerId) throw new NotFoundException("Attempt not found.");

    if (attempt.status === AttemptStatus.IN_PROGRESS && attempt.expiresAt <= new Date()) {
      await this.expire(attempt.id, learnerId);
      return this.getAttempt(attempt.id, learnerId);
    }
    return attempt;
  }

  async saveAnswer(attemptId: string, dto: AnswerDto, requestedLearnerId?: string) {
    const learnerId = this.learnerId(requestedLearnerId);
    const attempt = await this.prisma.attempt.findUnique({ where: { id: attemptId } });
    if (!attempt || attempt.learnerId !== learnerId) throw new NotFoundException("Attempt not found.");
    if (attempt.status !== AttemptStatus.IN_PROGRESS) throw new BadRequestException("Attempt is not active.");
    if (attempt.expiresAt <= new Date()) {
      await this.expire(attempt.id, learnerId);
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

  async saveWorkspaceState(attemptId: string, state: Record<string, unknown>, requestedLearnerId?: string) {
    const learnerId = this.learnerId(requestedLearnerId);
    const attempt = await this.prisma.attempt.findUnique({ where: { id: attemptId } });
    if (!attempt || attempt.learnerId !== learnerId) throw new NotFoundException("Attempt not found.");
    if (attempt.status !== AttemptStatus.IN_PROGRESS) throw new BadRequestException("Attempt is not active.");
    await this.prisma.attempt.update({ where: { id: attemptId }, data: { workspaceState: state as any } });
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

  async submit(attemptId: string, requestedLearnerId?: string) {
    const learnerId = this.learnerId(requestedLearnerId);
    const calc = await this.calculate(attemptId);
    if (calc.attempt.learnerId !== learnerId) throw new NotFoundException("Attempt not found.");
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
          learnerId: calc.attempt.learnerId,
          questionId: q.id,
          topic: q.topic
        }
      }).catch(() => undefined);
    }

    return this.result(attemptId, learnerId);
  }

  private async expire(attemptId: string, learnerId: string) {
    return this.submit(attemptId, learnerId);
  }

  async result(attemptId: string, requestedLearnerId?: string) {
    const learnerId = this.learnerId(requestedLearnerId);
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
    if (!result || result.attempt.learnerId !== learnerId) throw new NotFoundException("Result not found.");

    return {
      ...result,
      scoreLabel: "Simulated GED Practice Score",
      scoreBand: result.gedScore < 145 ? "Below 145" : result.gedScore < 165 ? "145–164" : result.gedScore < 175 ? "165–174" : "175–200",
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
