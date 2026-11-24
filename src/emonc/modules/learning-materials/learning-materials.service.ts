
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { unlink } from 'node:fs/promises';
import { basename, join } from 'node:path';

import { LearningMaterial } from './entities/learning-material.entity.js';
import { ModuleSection } from '../module-sections/entities/module-section.entity.js';

import { CreateLearningMaterialDto } from './dto/create-learning-material.dto.js';
import { UpdateLearningMaterialDto } from './dto/update-learning-material.dto.js';
import { LearningMaterialQueryDto } from './dto/learning-material-query.dto.js';

import { LearningMaterialType } from './enums/learning-material-type.enum.js';
import { TrainingModuleStatus } from '../training-modules/enum/training-module-status.enum.js';

@Injectable()
export class LearningMaterialsService {
  constructor(
    @InjectRepository(LearningMaterial)
    private readonly learningMaterialRepository: Repository<LearningMaterial>,

    @InjectRepository(ModuleSection)
    private readonly moduleSectionRepository: Repository<ModuleSection>,
  ) {}

  // Find and validate the parent section
  private async findModuleSection(id: string): Promise<ModuleSection> {
    const section = await this.moduleSectionRepository.findOne({
      where: { id },
      relations: {
        trainingModule: true,
      },
    });

    if (!section) {
      throw new NotFoundException(
        `Module section with ID ${id} not found`,
      );
    }

    return section;
  }

  // Ensure the parent training module is editable
  private async ensureModuleIsEditable(
    moduleSectionId: string,
  ): Promise<ModuleSection> {
    const section = await this.findModuleSection(moduleSectionId);

    if (
      section.trainingModule.status === TrainingModuleStatus.PUBLISHED
    ) {
      throw new BadRequestException(
        'Unpublish the training module before modifying its learning materials',
      );
    }

    return section;
  }

  // Create a learning material
  async create(
    createLearningMaterialDto: CreateLearningMaterialDto,
    file?: Express.Multer.File,
  ): Promise<LearningMaterial> {
    const { moduleSectionId, ...materialData } =
      createLearningMaterialDto;

    const section = await this.ensureModuleIsEditable(moduleSectionId);

    if (materialData.type === LearningMaterialType.VIDEO) {
      if (file) {
        throw new BadRequestException(
          'Video materials must use an external URL',
        );
      }

      if (!materialData.externalUrl) {
        throw new BadRequestException(
          'An external URL is required for video materials',
        );
      }
    } else {
      if (!file) {
        throw new BadRequestException(
          'Upload a file for e-book or slide materials',
        );
      }
    }

    const material = this.learningMaterialRepository.create({
      ...materialData,
      moduleSectionId,
      moduleSection: section,
      fileUrl: file
        ? `/uploads/learning-materials/${file.filename}`
        : null,
      fileName: file?.originalname ?? null,
      mimeType: file?.mimetype ?? null,
      fileSize: file?.size ?? null,
      externalUrl:
        materialData.type === LearningMaterialType.VIDEO
          ? materialData.externalUrl!
          : null,
      displayOrder: materialData.displayOrder ?? 1,
      isActive: true,
    });

    return this.learningMaterialRepository.save(material);
  }

  // Retrieve learning materials belonging to a section
  async findAll(
    moduleSectionId: string,
    query: LearningMaterialQueryDto,
  ) {
    await this.findModuleSection(moduleSectionId);

    const { page = 1, limit = 10, type, isActive } = query;

    const queryBuilder = this.learningMaterialRepository
      .createQueryBuilder('material')
      .where('material.moduleSectionId = :moduleSectionId', {
        moduleSectionId,
      });

    if (type) {
      queryBuilder.andWhere('material.type = :type', { type });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('material.isActive = :isActive', {
        isActive,
      });
    }

    const [data, total] = await queryBuilder
      .orderBy('material.displayOrder', 'ASC')
      .addOrderBy('material.createdAt', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

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

  // Retrieve one learning material
  async findOne(id: string): Promise<LearningMaterial> {
    const material = await this.learningMaterialRepository.findOne({
      where: { id },
    });

    if (!material) {
      throw new NotFoundException(
        `Learning material with ID ${id} not found`,
      );
    }

    return material;
  }

  // Update a learning material
 
  // Update a learning material and optionally replace its file
  async update(
    id: string,
    updateLearningMaterialDto: UpdateLearningMaterialDto,
    file?: Express.Multer.File,
  ): Promise<LearningMaterial> {
    const material = await this.findOne(id);

    await this.ensureModuleIsEditable(material.moduleSectionId);

    const { moduleSectionId, type, ...updateData } =
      updateLearningMaterialDto;

    if (
      moduleSectionId &&
      moduleSectionId !== material.moduleSectionId
    ) {
      throw new BadRequestException(
        'A learning material cannot be moved to another section',
      );
    }

    if (type && type !== material.type) {
      throw new BadRequestException(
        'Changing the material type is not allowed. Create a new material instead',
      );
    }

    if (file && material.type === LearningMaterialType.VIDEO) {
      throw new BadRequestException(
        'Video materials must use an external URL, not an uploaded file',
      );
    }

    const oldFileUrl = material.fileUrl;

    // Update metadata
    Object.assign(material, updateData);

    // Replace file details when a new file is uploaded
    if (file) {
      material.fileUrl = `/uploads/learning-materials/${file.filename}`;
      material.fileName = file.originalname;
      material.mimeType = file.mimetype;
      material.fileSize = file.size;
    }

    // Save the updated material first
    const updatedMaterial =
      await this.learningMaterialRepository.save(material);

    // Delete the old file only after successful database save
    if (file && oldFileUrl) {
      await this.deletePhysicalFile(oldFileUrl);
    }

    return updatedMaterial;
  }


  // Delete physical file from storage
  private async deletePhysicalFile(
    fileUrl: string | null,
  ): Promise<void> {
    if (!fileUrl) {
      return;
    }

    // Extract only the filename to prevent directory traversal
    const filename = basename(fileUrl);

    const filePath = join(
      process.cwd(),
      'uploads',
      'learning-materials',
      filename,
    );

    try {
      await unlink(filePath);
    } catch (error) {
      // Ignore the error if the file has already been deleted
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        return;
      }

      throw error;
    }
  }

  // Delete a learning material
  async remove(id: string): Promise<void> {
    const material = await this.findOne(id);

    await this.ensureModuleIsEditable(material.moduleSectionId);

    await this.learningMaterialRepository.remove(material);

    await this.deletePhysicalFile(material.fileUrl);
  }
}
