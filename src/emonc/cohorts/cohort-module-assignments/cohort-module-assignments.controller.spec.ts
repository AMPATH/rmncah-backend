import { Test, TestingModule } from '@nestjs/testing';
import { CohortModuleAssignmentsController } from './cohort-module-assignments.controller.js';

describe('CohortModuleAssignmentsController', () => {
  let controller: CohortModuleAssignmentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CohortModuleAssignmentsController],
    }).compile();

    controller = module.get<CohortModuleAssignmentsController>(CohortModuleAssignmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
