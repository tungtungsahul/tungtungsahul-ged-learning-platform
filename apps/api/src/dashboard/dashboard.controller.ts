import { Controller, Get, Headers } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get()
  getDashboardData(@Headers("x-learner-id") learnerId?: string) {
    return this.service.summary(learnerId);
  }
}
