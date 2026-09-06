import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.course.findMany({
      orderBy: { subject: "asc" },
      include: {
        modules: { include: { lessons: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } },
        exams: { orderBy: { createdAt: "desc" }, take: 5 }
      }
    });
  }

  async detail(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        modules: { include: { lessons: true }, orderBy: { order: "asc" } },
        exams: { include: { schedules: true }, orderBy: { createdAt: "desc" } },
        flashcards: true
      }
    });
    if (!course) throw new NotFoundException("Course not found.");
    return course;
  }
}
