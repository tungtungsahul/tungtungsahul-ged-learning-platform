import { Controller, Get } from '@nestjs/common';

@Controller('dashboard')
export class DashboardController {
  @Get()
  getDashboardData() {
    return {
      learner: {
        id: "demo-learner",
        name: "Demo Learner"
      },
      currentPath: [],
      nextExams: [],
      mistakeCount: 0,
      recentAttempts: []
    };
  }
}