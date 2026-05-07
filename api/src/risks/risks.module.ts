import { Module } from '@nestjs/common';
import { RisksService } from './risks.service';
import { RisksController } from './risks.controller';

@Module({
  // REST controller + business logic for risks and related entities.
  providers: [RisksService],
  controllers: [RisksController],
})
export class RisksModule {}
