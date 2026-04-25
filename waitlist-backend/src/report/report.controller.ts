import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ReportService } from './report.service';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post('send-now')
  @HttpCode(HttpStatus.OK)
  async sendNow(@Headers('x-api-key') apiKey: string) {
    if (!apiKey || apiKey !== process.env.DASHBOARD_API_KEY) {
      throw new UnauthorizedException('Invalid API key');
    }
    await this.reportService.sendDailyReport();
    return { success: true, message: 'Report sent successfully.' };
  }
}
