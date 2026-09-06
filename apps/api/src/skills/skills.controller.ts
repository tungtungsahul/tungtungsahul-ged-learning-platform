import { Body, Controller, Get, Post } from "@nestjs/common";
import { IsString, MaxLength } from "class-validator";
import { SkillsService } from "./skills.service";

class EssayDto {
  @IsString()
  @MaxLength(25000)
  essay!: string;

  @IsString()
  @MaxLength(5000)
  prompt!: string;
}

@Controller("skills")
export class SkillsController {
  constructor(private readonly service: SkillsService) {}
  @Get("analytics") analytics() { return this.service.analytics(); }
  @Get("mistakes") mistakes() { return this.service.mistakes(); }
  @Get("flashcards") flashcards() { return this.service.flashcards(); }
  @Post("essay/score") scoreEssay(@Body() dto: EssayDto) { return this.service.scoreEssay(dto.essay, dto.prompt); }
}
