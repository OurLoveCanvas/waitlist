import { Module } from '@nestjs/common';
import { WaitlistModule } from '../waitlist/waitlist.module';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';

@Module({
  imports: [WaitlistModule],
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}
