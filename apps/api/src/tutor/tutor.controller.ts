import { Body, Controller, Headers, Post } from "@nestjs/common";
import { IsObject, IsOptional, IsString, MaxLength } from "class-validator";
import { TutorService } from "./tutor.service";

class ChatDto {
  @IsString()
  @MaxLength(4000)
  message!: string;

  @IsOptional()
  @IsObject()
  context?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  conversationId?: string;
}

@Controller("tutor")
export class TutorController {
  constructor(private readonly service: TutorService) {}
  @Post("chat") chat(@Body() dto: ChatDto, @Headers("x-learner-id") learnerId?: string) { return this.service.chat(dto.message, dto.context, learnerId, dto.conversationId); }
}
