import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Difficulty, ExamMode, QuestionType, Subject } from "@prisma/client";
import { PrismaService } from "../prisma.service";

type ImportRow = Record<string, unknown>;
const subjects = new Set(Object.values(Subject));
const modes = new Set(Object.values(ExamMode));
const questionTypes = new Set(Object.values(QuestionType));
const difficulties = new Set(Object.values(Difficulty));

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  courses() { return this.prisma.course.findMany({ orderBy: { subject: "asc" }, select: { id: true, title: true, subject: true } }); }
  exams() { return this.prisma.exam.findMany({ orderBy: { updatedAt: "desc" }, include: { course: true, _count: { select: { questions: true, passages: true } } } }); }
  async exam(id: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id }, include: { course: true, passages: { orderBy: { order: "asc" } }, questions: { orderBy: { order: "asc" }, include: { options: true } } } });
    if (!exam) throw new NotFoundException("Exam not found.");
    return exam;
  }
  private validateExam(dto: any) {
    if (!subjects.has(dto.subject)) throw new BadRequestException("Invalid subject.");
    if (dto.mode && !modes.has(dto.mode)) throw new BadRequestException("Invalid exam mode.");
    if (dto.durationSeconds < 60) throw new BadRequestException("Duration must be at least 60 seconds.");
  }
  async createExam(dto: any) {
    this.validateExam(dto);
    return this.prisma.exam.create({ data: { courseId: dto.courseId, title: dto.title, description: dto.description, subject: dto.subject, mode: dto.mode ?? ExamMode.PRACTICE, durationSeconds: dto.durationSeconds, passingScore: dto.passingScore ?? 60 } });
  }
  async updateExam(id: string, dto: any) {
    this.validateExam(dto); await this.exam(id);
    return this.prisma.exam.update({ where: { id }, data: { courseId: dto.courseId, title: dto.title, description: dto.description, subject: dto.subject, mode: dto.mode ?? ExamMode.PRACTICE, durationSeconds: dto.durationSeconds, passingScore: dto.passingScore ?? 60 } });
  }
  async deleteExam(id: string) { await this.exam(id); return this.prisma.exam.delete({ where: { id } }); }
  async createPassage(examId: string, dto: any) {
    await this.exam(examId);
    const order = dto.order ?? await this.prisma.passage.count({ where: { examId } }) + 1;
    return this.prisma.passage.create({ data: { examId, title: String(dto.title || "Untitled passage"), content: String(dto.content || ""), assetUrl: dto.assetUrl, order: Number(order) } });
  }
  async createQuestion(examId: string, dto: any) {
    await this.exam(examId); const type = this.normaliseType(String(dto.type || "MULTIPLE_CHOICE")) as QuestionType;
    if (!questionTypes.has(type)) throw new BadRequestException("Invalid question type.");
    const order = dto.order ?? await this.prisma.question.count({ where: { examId } }) + 1;
    return this.prisma.question.create({ data: { examId, passageId: dto.passageId, text: String(dto.text || ""), type, explanation: String(dto.explanation || ""), topic: String(dto.topic || "General"), difficulty: String(dto.difficulty || "MEDIUM").toUpperCase() as Difficulty, points: Number(dto.points || 1), order: Number(order), data: dto.data, options: Array.isArray(dto.options) ? { create: dto.options.map((o: any, i: number) => ({ label: String(o.label || String.fromCharCode(65 + i)), text: String(o.text || ""), isCorrect: Boolean(o.isCorrect) })) } : undefined } });
  }
  async updateQuestion(id: string, dto: any) {
    const existing = await this.prisma.question.findUnique({ where: { id } }); if (!existing) throw new NotFoundException("Question not found.");
    return this.prisma.question.update({ where: { id }, data: { text: dto.text ?? existing.text, explanation: dto.explanation ?? existing.explanation, topic: dto.topic ?? existing.topic, difficulty: dto.difficulty ?? existing.difficulty, points: dto.points ?? existing.points, data: dto.data ?? existing.data } });
  }
  async deleteQuestion(id: string) { return this.prisma.question.delete({ where: { id } }); }

  private normaliseType(value: string) { return value.toUpperCase().replace(/\s+/g, "_").replace("MCQ", "MULTIPLE_CHOICE").replace("FILL", "FILL_BLANK"); }
  private parseCsv(content: string): ImportRow[] {
    const lines = content.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) throw new BadRequestException("CSV needs a header row and at least one question.");
    const parseLine = (line: string) => { const cells: string[] = []; let cell = "", quoted = false; for (let i = 0; i < line.length; i++) { const char = line[i]; if (char === '"') { if (quoted && line[i + 1] === '"') { cell += char; i++; } else quoted = !quoted; } else if (char === "," && !quoted) { cells.push(cell.trim()); cell = ""; } else cell += char; } cells.push(cell.trim()); return cells; };
    const headers = parseLine(lines[0]).map(x => x.toLowerCase());
    return lines.slice(1).map((line, index) => {
      const values = parseLine(line), row: ImportRow = {}; headers.forEach((header, i) => row[header] = values[i] ?? "");
      const correct = String(row.correct ?? "").trim();
      const options = ["a", "b", "c", "d"].filter(key => row[key]).map(key => ({ label: key.toUpperCase(), text: String(row[key]), isCorrect: key.toUpperCase() === correct.toUpperCase() }));
      return { examId: row.examid ?? row.exam_id, text: row.question ?? row.text, type: this.normaliseType(String(row.type ?? "")), topic: row.topic, difficulty: row.difficulty, points: row.points, explanation: row.explanation, order: Number(row.order || index + 1), data: correct && options.length === 0 ? { acceptedAnswer: correct } : undefined, options };
    });
  }
  private parseImport(dto: { format: "json" | "csv"; content: string }) {
    try { const rows = dto.format === "json" ? JSON.parse(dto.content) : this.parseCsv(dto.content); if (!Array.isArray(rows)) throw new Error(); return rows as ImportRow[]; } catch (error) { if (error instanceof BadRequestException) throw error; throw new BadRequestException("Unable to parse import content."); }
  }
  private rowErrors(row: ImportRow) {
    const errors: string[] = [];
    if (!row.examId) errors.push("examId is required"); if (!row.text) errors.push("question text is required");
    if (!questionTypes.has(this.normaliseType(String(row.type ?? "")) as QuestionType)) errors.push("invalid question type");
    if (row.difficulty && !difficulties.has(String(row.difficulty).toUpperCase() as Difficulty)) errors.push("invalid difficulty");
    return errors;
  }
  async previewImport(dto: { format: "json" | "csv"; content: string }) {
    const rows = this.parseImport(dto), errors = rows.flatMap((row, index) => this.rowErrors(row).map(message => ({ row: index + 1, message })));
    return { total: rows.length, valid: rows.length - new Set(errors.map(x => x.row)).size, errors, rows: rows.slice(0, 20) };
  }
  async importText(dto: { format: "json" | "csv"; content: string }) { return this.importQuestions(this.parseImport(dto)); }
  async importQuestions(rows: ImportRow[]) {
    const errors = rows.flatMap((row, index) => this.rowErrors(row).map(message => `Row ${index + 1}: ${message}`)); if (errors.length) throw new BadRequestException(errors);
    const created = await this.prisma.$transaction(rows.map((row, index) => this.prisma.question.create({ data: {
      examId: String(row.examId), text: String(row.text), type: this.normaliseType(String(row.type)) as QuestionType, explanation: String(row.explanation ?? ""), topic: String(row.topic ?? "Imported"), difficulty: String(row.difficulty ?? "MEDIUM").toUpperCase() as Difficulty, points: Number(row.points ?? 1), order: Number(row.order ?? index + 1), data: row.data as any,
      options: Array.isArray(row.options) ? { create: (row.options as any[]).map(option => ({ label: String(option.label), text: String(option.text), isCorrect: Boolean(option.isCorrect) })) } : undefined
    } })));
    return { created: created.length };
  }
}
