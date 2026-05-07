import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// Global DB provider to avoid repeated imports in feature modules.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
