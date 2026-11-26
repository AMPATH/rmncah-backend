import { Test, TestingModule } from '@nestjs/testing';
import { ModuleSectionsController } from './module-sections.controller.js';
import { ModuleSectionsService } from './module-sections.service.js';

describe('ModuleSectionsController', () => {
  let controller: ModuleSectionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ModuleSectionsController],
      providers: [ModuleSectionsService],
    }).compile();

    controller = module.get<ModuleSectionsController>(ModuleSectionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
