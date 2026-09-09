import { DashboardService } from './dashboard/dashboard.service';
import { DashboardController } from './dashboard/dashboard.controller';
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaService } from "./prisma.service";
import { HealthController } from "./health.controller";
import { DashboardModule } from "./dashboard/dashboard.module";
import { CoursesModule } from "./courses/courses.module";
import { ExamsModule } from "./exams/exams.module";
import { TutorModule } from "./tutor/tutor.module";
import { SkillsModule } from "./skills/skills.module";
import { AdminModule } from "./admin/admin.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DashboardModule,
    CoursesModule,
    ExamsModule,
    TutorModule,
    SkillsModule,
    AdminModule
  ],
  controllers: [DashboardController,HealthController],
  providers: [PrismaService, DashboardService]
})
export class AppModule {}
