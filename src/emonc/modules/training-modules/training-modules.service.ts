
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TrainingModule } from './entities/training-module.entity.js';
import { ModuleSection } from '../module-sections/entities/module-section.entity.js';

import { CreateTrainingModuleDto } from './dto/create-training-module.dto.js';
import { UpdateTrainingModuleDto } from './dto/update-training-module.dto.js';
import { TrainingModuleQueryDto } from './dto/training-module-query.dto.js';

import { TrainingModuleStatus } from './enum/training-module-status.enum.js';

@Injectable()
export class TrainingModulesService {
  constructor(
    @InjectRepository(TrainingModule)
    private readonly trainingModuleRepository: Repository<TrainingModule>,

    @InjectRepository(ModuleSection)
    private readonly moduleSectionRepository: Repository<ModuleSection>,
  ) {}

  // Create a training module
  async create(
    createTrainingModuleDto: CreateTrainingModuleDto,
  ): Promise<TrainingModule> {
    const trainingModule = this.trainingModuleRepository.create({
      ...createTrainingModuleDto,
      status: TrainingModuleStatus.DRAFT,
      publishedAt: null,
    });

    return this.trainingModuleRepository.save(trainingModule);
  }

  // Retrieve all training modules with pagination and filtering
  async findAll(query: TrainingModuleQueryDto) {
    const { page = 1, limit = 10, status } = query;

    const [data, total] =
      await this.trainingModuleRepository.findAndCount({
        where: status ? { status } : {},
        order: {
          createdAt: 'DESC',
        },
        skip: (page - 1) * limit,
        take: limit,
      });

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

  // Retrieve one training module
  async findOne(id: string): Promise<TrainingModule> {
    const trainingModule =
      await this.trainingModuleRepository.findOne({
        where: { id },
      });

    if (!trainingModule) {
      throw new NotFoundException(
        `Training module with ID ${id} not found`,
      );
    }

    return trainingModule;
  }

  // Update a training module
  async update(
    id: string,
    updateTrainingModuleDto: UpdateTrainingModuleDto,
  ): Promise<TrainingModule> {
    const trainingModule = await this.findOne(id);

    if (trainingModule.status === TrainingModuleStatus.PUBLISHED) {
      throw new BadRequestException(
        'Unpublish the training module before updating it',
      );
    }

    Object.assign(trainingModule, updateTrainingModuleDto);

    return this.trainingModuleRepository.save(trainingModule);
  }

  // Publish a training module
  async publish(id: string): Promise<TrainingModule> {
    const trainingModule = await this.findOne(id);

    if (trainingModule.status === TrainingModuleStatus.PUBLISHED) {
      throw new BadRequestException(
        'Training module is already published',
      );
    }

    const activeSections = await this.moduleSectionRepository
      .createQueryBuilder('section')
      .leftJoinAndSelect(
        'section.learningMaterials',
        'material',
        'material.isActive = :isActive',
        { isActive: true },
      )
      .where('section.trainingModuleId = :moduleId', {
        moduleId: id,
      })
      .andWhere('section.isActive = :sectionActive', {
        sectionActive: true,
      })
      .getMany();

    if (activeSections.length === 0) {
      throw new BadRequestException(
        'A training module must have at least one active section before publishing',
      );
    }

    const sectionsWithoutMaterials = activeSections.filter(
      (section) => !section.learningMaterials?.length,
    );

    if (sectionsWithoutMaterials.length > 0) {
      throw new BadRequestException(
        'Every active section must have at least one active learning material before publishing',
      );
    }

    trainingModule.status = TrainingModuleStatus.PUBLISHED;
    trainingModule.publishedAt = new Date();

    return this.trainingModuleRepository.save(trainingModule);
  }

  // Unpublish a training module
  async unpublish(id: string): Promise<TrainingModule> {
    const trainingModule = await this.findOne(id);

    if (trainingModule.status !== TrainingModuleStatus.PUBLISHED) {
      throw new BadRequestException(
        'Training module is not currently published',
      );
    }

    trainingModule.status = TrainingModuleStatus.DRAFT;
    trainingModule.publishedAt = null;

    return this.trainingModuleRepository.save(trainingModule);
  }

  // Delete a training module
  async remove(id: string): Promise<void> {
    const trainingModule = await this.findOne(id);

    if (trainingModule.status === TrainingModuleStatus.PUBLISHED) {
      throw new BadRequestException(
        'Unpublish the training module before deleting it',
      );
    }

    await this.trainingModuleRepository.remove(trainingModule);
  }
}
