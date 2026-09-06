import { Body, Controller, Post } from "@nestjs/common";
import { IsArray, IsInt, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { AdminService } from "./admin.service";

class CreateExamDto {
  @IsString() courseId!: string;
  @IsString() title!: string;
  @IsString() description!: string;
  @IsString() subject!: string;
  @IsInt() durationSeconds!: number;
  @IsOptional() @IsInt() passingScore?: number;
}

class ImportDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  questions!: Record<string, unknown>[];
}

@Controller("admin")
export class AdminController {
  constructor(private readonly service: AdminService) {}

  @Post("exams") createExam(@Body() dto: CreateExamDto) { return this.service.createExam(dto); }
  @Post("import/questions") importQuestions(@Body() dto: ImportDto) { return this.service.importQuestions(dto.questions); }
}
