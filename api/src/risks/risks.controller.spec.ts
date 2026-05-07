import { Test, TestingModule } from '@nestjs/testing';
import { RisksController } from './risks.controller';
import { RisksService } from './risks.service';

describe('RisksController', () => {
  let controller: RisksController;

  beforeEach(async () => {
    // Controller unit tests only need a mocked service dependency.
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RisksController],
      providers: [
        {
          provide: RisksService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<RisksController>(RisksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
