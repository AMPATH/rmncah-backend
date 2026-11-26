import { Test, TestingModule } from '@nestjs/testing';
import { TrainingModulesService } from './training-modules.service.js';

describe('TrainingModulesService', () => {
  let service: TrainingModulesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TrainingModulesService],
    }).compile();

    service = module.get<TrainingModulesService>(TrainingModulesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
