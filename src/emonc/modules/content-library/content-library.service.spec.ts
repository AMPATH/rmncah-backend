import { Test, TestingModule } from '@nestjs/testing';
import { ContentLibraryService } from './content-library.service.js';

describe('ContentLibraryService', () => {
  let service: ContentLibraryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContentLibraryService],
    }).compile();

    service = module.get<ContentLibraryService>(ContentLibraryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
