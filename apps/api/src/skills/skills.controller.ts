import { Body, Controller, Get, Headers, Param, Patch, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
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
  @Get("analytics") analytics(@Headers("x-learner-id") learnerId?: string) { return this.service.analytics(learnerId); }
  @Get("mistakes") mistakes(@Headers("x-learner-id") learnerId?: string) { return this.service.mistakes(learnerId); }
  @Patch("mistakes/:id/reviewed") reviewed(@Param("id") id: string, @Headers("x-learner-id") learnerId?: string) { return this.service.markMistakeReviewed(id, learnerId); }
  @Get("flashcards") flashcards() { return this.service.flashcards(); }
  @Post("essay/score") scoreEssay(@Body() dto: EssayDto) { return this.service.scoreEssay(dto.essay, dto.prompt); }
  @Post("speaking/analyze")
  @UseInterceptors(FileInterceptor("audio", { limits: { fileSize: 25 * 1024 * 1024 } }))
  speaking(@UploadedFile() audio: any, @Body("locale") locale?: string) { return this.service.analyzeSpeaking(audio, locale); }
}
