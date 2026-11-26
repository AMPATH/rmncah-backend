import { Test, TestingModule } from '@nestjs/testing';
import { TrainingSessionsService } from './training-sessions.service.js';

describe('TrainingSessionsService', () => {
  let service: TrainingSessionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TrainingSessionsService],
    }).compile();

    service = module.get<TrainingSessionsService>(TrainingSessionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
