import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { Subject } from "@prisma/client";

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  createExam(dto: any) {
    return this.prisma.exam.create({
      data: {
        courseId: dto.courseId,
        title: dto.title,
        description: dto.description,
        subject: dto.subject as Subject,
        durationSeconds: dto.durationSeconds,
        passingScore: dto.passingScore ?? 60
      }
    });
  }

  async importQuestions(rows: Record<string, unknown>[]) {
    let created = 0;
    for (const row of rows) {
      if (!row.examId || !row.text || !row.type) throw new BadRequestException("Each row needs examId, text and type.");
      await this.prisma.question.create({
        data: {
          examId: String(row.examId),
          text: String(row.text),
          type: String(row.type) as any,
          explanation: String(row.explanation ?? ""),
          topic: String(row.topic ?? "Imported"),
          difficulty: String(row.difficulty ?? "MEDIUM") as any,
          points: Number(row.points ?? 1),
          order: Number(row.order ?? created + 1),
          data: (row.data as any) ?? undefined
        }
      });
      created++;
    }
    return { created };
  }
}
