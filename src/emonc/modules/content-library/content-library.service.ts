
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ContentLibrary } from './entities/content-library.entity.js';

import { CreateContentLibraryDto } from './dto/create-content-library.dto.js';
import { UpdateContentLibraryDto } from './dto/update-content-library.dto.js';
import { ContentLibraryQueryDto } from './dto/content-library-query.dto.js';

import { LearningMaterialType } from '../learning-materials/enums/learning-material-type.enum.js';

@Injectable()
export class ContentLibraryService {
  constructor(
    @InjectRepository(ContentLibrary)
    private readonly contentLibraryRepository: Repository<ContentLibrary>,
  ) {}

  async create(
    createContentLibraryDto: CreateContentLibraryDto,
    file?: Express.Multer.File,
  ): Promise<ContentLibrary> {
    const { type, externalUrl } = createContentLibraryDto;

    this.validateResource(type, file, externalUrl);

    const content = this.contentLibraryRepository.create({
      ...createContentLibraryDto,

      fileUrl: file
        ? `/uploads/content-library/${file.filename}`
        : null,

      fileName: file?.originalname ?? null,
      mimeType: file?.mimetype ?? null,
      fileSize: file?.size ?? null,

      externalUrl:
        type === LearningMaterialType.VIDEO
          ? externalUrl ?? null
          : null,
    });

    return this.contentLibraryRepository.save(content);
  }

  async findAll(query: ContentLibraryQueryDto) {
    const {
      page = 1,
      limit = 10,
      type,
      isActive,
    } = query;

    const queryBuilder = this.contentLibraryRepository
      .createQueryBuilder('content');

    if (type) {
      queryBuilder.andWhere('content.type = :type', { type });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('content.isActive = :isActive', {
        isActive,
      });
    }

    queryBuilder
      .orderBy('content.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<ContentLibrary> {
    const content = await this.contentLibraryRepository.findOne({
      where: { id },
    });

    if (!content) {
      throw new NotFoundException(
        `Content library resource with ID ${id} not found`,
      );
    }

    return content;
  }

  async update(
    id: string,
    updateContentLibraryDto: UpdateContentLibraryDto,
    file?: Express.Multer.File,
  ): Promise<ContentLibrary> {
    const content = await this.findOne(id);

    const updatedType =
      updateContentLibraryDto.type ?? content.type;

    const updatedExternalUrl =
      updateContentLibraryDto.externalUrl !== undefined
        ? updateContentLibraryDto.externalUrl
        : content.externalUrl;

    this.validateResource(
      updatedType,
      file,
      updatedExternalUrl,
      !file && !content.fileUrl,
    );

    Object.assign(content, updateContentLibraryDto);

    if (file) {
      content.fileUrl =
        `/uploads/content-library/${file.filename}`;

      content.fileName = file.originalname;
      content.mimeType = file.mimetype;
      content.fileSize = file.size;
    }

    if (updatedType === LearningMaterialType.VIDEO) {
      content.fileUrl = null;
      content.fileName = null;
      content.mimeType = null;
      content.fileSize = null;
      content.externalUrl = updatedExternalUrl ?? null;
    } else {
      content.externalUrl = null;
    }

    return this.contentLibraryRepository.save(content);
  }

  async deactivate(id: string): Promise<ContentLibrary> {
    const content = await this.findOne(id);

    content.isActive = false;

    return this.contentLibraryRepository.save(content);
  }

  async remove(id: string): Promise<{ message: string }> {
    const content = await this.findOne(id);

    await this.contentLibraryRepository.remove(content);

    return {
      message: 'Content library resource deleted successfully',
    };
  }

  private validateResource(
    type: LearningMaterialType,
    file?: Express.Multer.File,
    externalUrl?: string | null,
    allowMissingFile = false,
  ): void {
    if (type === LearningMaterialType.VIDEO) {
      if (!externalUrl) {
        throw new BadRequestException(
          'An external video URL is required for VIDEO resources',
        );
      }

      if (file) {
        throw new BadRequestException(
          'VIDEO resources must use an external URL, not an uploaded file',
        );
      }

      return;
    }

    if (!file && !allowMissingFile) {
      throw new BadRequestException(
        'A file upload is required for EBOOK and SLIDES resources',
      );
    }

    if (!file) return;

    if (
      type === LearningMaterialType.EBOOK &&
      file.mimetype !== 'application/pdf'
    ) {
      throw new BadRequestException(
        'EBOOK resources must be PDF files',
      );
    }

    if (
      type === LearningMaterialType.SLIDES &&
      ![
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      ].includes(file.mimetype)
    ) {
      throw new BadRequestException(
        'SLIDES resources must be PPT or PPTX files',
      );
    }
  }
}
