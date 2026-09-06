import { IsObject, IsOptional, IsString } from "class-validator";

export class AnswerDto {
  @IsString()
  questionId!: string;

  @IsOptional()
  @IsString()
  selectedOptionId?: string;

  @IsOptional()
  @IsString()
  textValue?: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
