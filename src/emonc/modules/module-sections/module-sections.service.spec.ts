import { Test, TestingModule } from '@nestjs/testing';
import { ModuleSectionsService } from './module-sections.service.js';

describe('ModuleSectionsService', () => {
  let service: ModuleSectionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ModuleSectionsService],
    }).compile();

    service = module.get<ModuleSectionsService>(ModuleSectionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
