import { Controller, Get, Param } from "@nestjs/common";
import { CoursesService } from "./courses.service";

@Controller("courses")
export class CoursesController {
  constructor(private readonly service: CoursesService) {}
  @Get() list() { return this.service.list(); }
  @Get(":id") detail(@Param("id") id: string) { return this.service.detail(id); }
}
