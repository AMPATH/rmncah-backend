import { Test, TestingModule } from '@nestjs/testing';
import { LearningMaterialsController } from './learning-materials.controller.js';
import { LearningMaterialsService } from './learning-materials.service.js';

describe('LearningMaterialsController', () => {
  let controller: LearningMaterialsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LearningMaterialsController],
      providers: [LearningMaterialsService],
    }).compile();

    controller = module.get<LearningMaterialsController>(LearningMaterialsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
