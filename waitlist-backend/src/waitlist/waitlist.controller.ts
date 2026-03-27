import {
  Body,
  Controller,
  Post,
  Get,
  HttpCode,
  HttpStatus,
  Req,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { WaitlistService } from './waitlist.service';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';

@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async join(@Body() dto: CreateWaitlistDto, @Req() req: Request) {
    const forwarded = req.headers['x-forwarded-for'] as string;
    const ipAddress = forwarded ? forwarded.split(',')[0].trim() : req.ip;
    const entry = await this.waitlistService.join(dto.email, ipAddress);
    return {
      success: true,
      message: 'You have been added to the waitlist!',
      data: entry,
      timestamp: new Date(),
    };
  }

  @Get()
  async list(@Headers('x-api-key') apiKey: string) {
    if (!apiKey || apiKey !== process.env.DASHBOARD_API_KEY) {
      throw new UnauthorizedException('Invalid API key');
    }
    const entries = await this.waitlistService.findAll();
    return {
      success: true,
      message: 'Waitlist entries fetched.',
      data: entries,
      timestamp: new Date(),
    };
  }
}
