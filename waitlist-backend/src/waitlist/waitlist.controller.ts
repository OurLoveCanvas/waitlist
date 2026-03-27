import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { WaitlistService } from './waitlist.service';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';

@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async join(@Body() dto: CreateWaitlistDto) {
    const entry = await this.waitlistService.join(dto.email);
    return {
      success: true,
      message: 'You have been added to the waitlist!',
      data: entry,
      timestamp: new Date(),
    };
  }
}
