import { Test, TestingModule } from '@nestjs/testing';
import { CohortModuleAssignmentsService } from './cohort-module-assignments.service.js';

describe('CohortModuleAssignmentsService', () => {
  let service: CohortModuleAssignmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CohortModuleAssignmentsService],
    }).compile();

    service = module.get<CohortModuleAssignmentsService>(CohortModuleAssignmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
