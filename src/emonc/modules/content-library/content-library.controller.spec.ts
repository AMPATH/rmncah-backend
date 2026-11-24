import { Test, TestingModule } from '@nestjs/testing';
import { ContentLibraryController } from './content-library.controller.js';
import { ContentLibraryService } from './content-library.service.js';

describe('ContentLibraryController', () => {
  let controller: ContentLibraryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContentLibraryController],
      providers: [ContentLibraryService],
    }).compile();

    controller = module.get<ContentLibraryController>(ContentLibraryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
