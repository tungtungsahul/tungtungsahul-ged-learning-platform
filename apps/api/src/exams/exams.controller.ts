import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { AnswerDto } from "./dto";
import { ExamsService } from "./exams.service";

@Controller("exams")
export class ExamsController {
  constructor(private readonly service: ExamsService) {}

  @Get() list() { return this.service.list(); }
  @Get(":id") get(@Param("id") id: string) { return this.service.get(id); }

  @Post(":id/start")
  start(@Param("id") id: string) { return this.service.start(id); }

  @Get(":id/attempts/:attemptId")
  attempt(@Param("attemptId") attemptId: string) { return this.service.getAttempt(attemptId); }

  @Post(":id/attempts/:attemptId/answers")
  answer(@Param("attemptId") attemptId: string, @Body() dto: AnswerDto) {
    return this.service.saveAnswer(attemptId, dto);
  }

  @Post(":id/attempts/:attemptId/submit")
  submit(@Param("attemptId") attemptId: string) {
    return this.service.submit(attemptId);
  }

  @Get(":id/attempts/:attemptId/result")
  result(@Param("attemptId") attemptId: string) {
    return this.service.result(attemptId);
  }
}
