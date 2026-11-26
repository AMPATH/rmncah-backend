import { Test, TestingModule } from '@nestjs/testing';
import { TrainingModulesController } from './training-modules.controller.js';
import { TrainingModulesService } from './training-modules.service.js';

describe('TrainingModulesController', () => {
  let controller: TrainingModulesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrainingModulesController],
      providers: [TrainingModulesService],
    }).compile();

    controller = module.get<TrainingModulesController>(TrainingModulesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
