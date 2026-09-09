import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async summary(learnerId?: string) {
    if (!learnerId || !/^anon_[0-9a-f-]{36}$/i.test(learnerId)) throw new BadRequestException("Anonymous learner identity is required.");
    const courses = await this.prisma.course.findMany({ orderBy: { subject: "asc" } });
    const upcoming = await this.prisma.examSchedule.findMany({
      where: { scheduledAt: { gt: new Date() } },
      orderBy: { scheduledAt: "asc" },
      take: 3,
      include: { exam: true }
    });
    const mistakes = await this.prisma.mistake.count({ where: { learnerId, reviewed: false } });
    const attempts = await this.prisma.attempt.findMany({
      where: { learnerId, status: "SUBMITTED" },
      include: { exam: true, result: true },
      orderBy: { submittedAt: "desc" },
      take: 8
    });

    return {
      learner: { id: learnerId, name: "Practice Learner" },
      currentPath: courses,
      nextExams: upcoming,
      mistakeCount: mistakes,
      recentAttempts: attempts
    };
  }
}
