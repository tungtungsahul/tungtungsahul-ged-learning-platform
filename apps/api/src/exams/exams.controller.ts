import { Body, Controller, Get, Headers, Param, Post } from "@nestjs/common";
import { AnswerDto, WorkspaceStateDto } from "./dto";
import { ExamsService } from "./exams.service";

@Controller("exams")
export class ExamsController {
  constructor(private readonly service: ExamsService) {}

  @Get() list() { return this.service.list(); }
  @Get(":id") get(@Param("id") id: string) { return this.service.get(id); }

  @Post(":id/start")
  start(@Param("id") id: string, @Headers("x-learner-id") learnerId?: string) { return this.service.start(id, learnerId); }

  @Get(":id/attempts/:attemptId")
  attempt(@Param("attemptId") attemptId: string, @Headers("x-learner-id") learnerId?: string) { return this.service.getAttempt(attemptId, learnerId); }

  @Post(":id/attempts/:attemptId/answers")
  answer(@Param("attemptId") attemptId: string, @Body() dto: AnswerDto, @Headers("x-learner-id") learnerId?: string) {
    return this.service.saveAnswer(attemptId, dto, learnerId);
  }

  @Post(":id/attempts/:attemptId/workspace")
  workspace(@Param("attemptId") attemptId: string, @Body() dto: WorkspaceStateDto, @Headers("x-learner-id") learnerId?: string) {
    return this.service.saveWorkspaceState(attemptId, dto.state, learnerId);
  }

  @Post(":id/attempts/:attemptId/submit")
  submit(@Param("attemptId") attemptId: string, @Headers("x-learner-id") learnerId?: string) {
    return this.service.submit(attemptId, learnerId);
  }

  @Get(":id/attempts/:attemptId/result")
  result(@Param("attemptId") attemptId: string, @Headers("x-learner-id") learnerId?: string) {
    return this.service.result(attemptId, learnerId);
  }
}
