import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WaitlistService {
  constructor(private readonly prisma: PrismaService) {}

  async join(email: string, ipAddress?: string) {
    const existing = await this.prisma.waitlist.findUnique({
      where: { email },
    });

    if (existing) {
      throw new ConflictException('This email is already on the waitlist.');
    }

    try {
      return await this.prisma.waitlist.create({
        data: { email, ipAddress },
        select: { id: true, email: true, createdAt: true },
      });
    } catch {
      throw new InternalServerErrorException('Could not save your email. Please try again.');
    }
  }

  async findAll() {
    return this.prisma.waitlist.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, ipAddress: true, createdAt: true },
    });
  }
}
