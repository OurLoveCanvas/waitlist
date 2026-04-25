import { Module } from '@nestjs/common';
import { WaitlistModule } from '../waitlist/waitlist.module';
import { ReportService } from './report.service';

@Module({
  imports: [WaitlistModule],
  providers: [ReportService],
})
export class ReportModule {}
