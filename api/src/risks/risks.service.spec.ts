import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { RisksService } from './risks.service';

describe('RisksService', () => {
  let service: RisksService;

  beforeEach(async () => {
    // Service unit tests can inject a minimal Prisma stub.
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RisksService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<RisksService>(RisksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
