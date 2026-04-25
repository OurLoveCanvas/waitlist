import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as nodemailer from 'nodemailer';
import * as ExcelJS from 'exceljs';
import { WaitlistService } from '../waitlist/waitlist.service';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(private readonly waitlistService: WaitlistService) {}

  private createTransporter() {
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  async generateExcelBuffer(): Promise<Buffer> {
    const entries = await this.waitlistService.findAll();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'OurLoveCanvas';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Waitlist');

    sheet.columns = [
      { header: 'No', key: 'id', width: 8 },
      { header: 'E-posta', key: 'email', width: 36 },
      { header: 'IP Adresi', key: 'ipAddress', width: 18 },
      { header: 'Kayıt Tarihi', key: 'createdAt', width: 22 },
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD4688A' },
    };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    for (const entry of entries) {
      const date = new Date(entry.createdAt);
      const formatted = date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      sheet.addRow({
        id: entry.id,
        email: entry.email,
        ipAddress: entry.ipAddress ?? '',
        createdAt: formatted,
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async sendDailyReport(): Promise<void> {
    const entries = await this.waitlistService.findAll();

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const todayCount = entries.filter(
      (e) => new Date(e.createdAt) >= todayStart,
    ).length;

    const weekCount = entries.filter(
      (e) => new Date(e.createdAt) >= weekAgo,
    ).length;

    const dateStr = now.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const fileDateStr = now.toISOString().slice(0, 10);
    const excelBuffer = await this.generateExcelBuffer();

    const transporter = this.createTransporter();

    await transporter.sendMail({
      from: `"OurLoveCanvas" <${process.env.GMAIL_USER}>`,
      to: 'ekindkoseoglu@gmail.com',
      subject: `OurLoveCanvas Günlük Rapor — ${dateStr}`,
      text: [
        'OurLoveCanvas Günlük Waitlist Raporu',
        '=====================================',
        `Tarih: ${dateStr}`,
        '',
        'İstatistikler:',
        `• Toplam kayıt: ${entries.length}`,
        `• Bugün gelen: ${todayCount}`,
        `• Son 7 günde gelen: ${weekCount}`,
        '',
        'Excel listesi ekte bulunmaktadır.',
      ].join('\n'),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
          <div style="background: #D4688A; padding: 24px 32px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">OurLoveCanvas</h1>
            <p style="color: rgba(255,255,255,0.85); margin: 4px 0 0; font-size: 14px;">Günlük Waitlist Raporu</p>
          </div>
          <div style="background: #f9f9f9; padding: 28px 32px; border: 1px solid #e5e5e5;">
            <p style="color: #666; font-size: 14px; margin: 0 0 20px;">📅 ${dateStr}</p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 16px; background: white; border: 1px solid #e5e5e5; border-radius: 8px 0 0 0; font-size: 13px; color: #888;">Toplam Kayıt</td>
                <td style="padding: 12px 16px; background: white; border: 1px solid #e5e5e5; font-size: 22px; font-weight: 700; color: #D4688A; text-align: right;">${entries.length}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; background: white; border: 1px solid #e5e5e5; font-size: 13px; color: #888;">Bugün Gelen</td>
                <td style="padding: 12px 16px; background: white; border: 1px solid #e5e5e5; font-size: 22px; font-weight: 700; color: #4ade80; text-align: right;">${todayCount}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; background: white; border: 1px solid #e5e5e5; border-radius: 0 0 0 8px; font-size: 13px; color: #888;">Son 7 Günde Gelen</td>
                <td style="padding: 12px 16px; background: white; border: 1px solid #e5e5e5; font-size: 22px; font-weight: 700; color: #333; text-align: right;">${weekCount}</td>
              </tr>
            </table>
            <p style="color: #999; font-size: 12px; margin: 20px 0 0;">Excel listesi ekte bulunmaktadır.</p>
          </div>
          <div style="background: #f0f0f0; padding: 12px 32px; border-radius: 0 0 12px 12px; border: 1px solid #e5e5e5; border-top: none;">
            <p style="color: #aaa; font-size: 11px; margin: 0;">OurLoveCanvas · ourlovecanvas.com</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `waitlist-${fileDateStr}.xlsx`,
          content: excelBuffer,
          contentType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      ],
    });

    this.logger.log(
      `Daily report sent — total: ${entries.length}, today: ${todayCount}, week: ${weekCount}`,
    );
  }

  // UTC 06:00 = Istanbul (UTC+3) 09:00
  @Cron('0 6 * * *')
  async dailyReportCron(): Promise<void> {
    this.logger.log('Running daily report cron job...');
    try {
      await this.sendDailyReport();
    } catch (error: unknown) {
      this.logger.error(
        'Daily report failed',
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
