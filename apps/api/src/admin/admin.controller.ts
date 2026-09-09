import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { IsArray, IsIn, IsInt, IsOptional, IsString, MaxLength, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { AdminService } from "./admin.service";

class ExamDto {
  @IsString() courseId!: string;
  @IsString() @MaxLength(200) title!: string;
  @IsString() description!: string;
  @IsString() subject!: string;
  @IsOptional() @IsString() mode?: string;
  @IsInt() durationSeconds!: number;
  @IsOptional() @IsInt() passingScore?: number;
}
class ImportDto { @IsArray() @ValidateNested({ each: true }) @Type(() => Object) questions!: Record<string, unknown>[]; }
class ImportTextDto { @IsIn(["json", "csv"]) format!: "json" | "csv"; @IsString() @MaxLength(2_000_000) content!: string; }

@Controller("admin")
export class AdminController {
  constructor(private readonly service: AdminService) {}
  @Get("courses") courses() { return this.service.courses(); }
  @Get("exams") exams() { return this.service.exams(); }
  @Get("exams/:id") exam(@Param("id") id: string) { return this.service.exam(id); }
  @Post("exams") createExam(@Body() dto: ExamDto) { return this.service.createExam(dto); }
  @Patch("exams/:id") updateExam(@Param("id") id: string, @Body() dto: ExamDto) { return this.service.updateExam(id, dto); }
  @Delete("exams/:id") deleteExam(@Param("id") id: string) { return this.service.deleteExam(id); }
  @Post("exams/:id/passages") passage(@Param("id") id: string, @Body() dto: any) { return this.service.createPassage(id, dto); }
  @Post("exams/:id/questions") question(@Param("id") id: string, @Body() dto: any) { return this.service.createQuestion(id, dto); }
  @Patch("questions/:id") updateQuestion(@Param("id") id: string, @Body() dto: any) { return this.service.updateQuestion(id, dto); }
  @Delete("questions/:id") deleteQuestion(@Param("id") id: string) { return this.service.deleteQuestion(id); }
  @Post("import/preview") previewImport(@Body() dto: ImportTextDto) { return this.service.previewImport(dto); }
  @Post("import") importText(@Body() dto: ImportTextDto) { return this.service.importText(dto); }
  @Post("import/questions") importQuestions(@Body() dto: ImportDto) { return this.service.importQuestions(dto.questions); }
}
