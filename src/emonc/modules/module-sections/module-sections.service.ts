
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ModuleSection } from './entities/module-section.entity.js';
import { TrainingModule } from '../training-modules/entities/training-module.entity.js';

import { CreateModuleSectionDto } from './dto/create-module-section.dto.js';
import { UpdateModuleSectionDto } from './dto/update-module-section.dto.js';

import { TrainingModuleStatus } from '../training-modules/enum/training-module-status.enum.js';

@Injectable()
export class ModuleSectionsService {
  constructor(
    @InjectRepository(ModuleSection)
    private readonly moduleSectionRepository: Repository<ModuleSection>,

    @InjectRepository(TrainingModule)
    private readonly trainingModuleRepository: Repository<TrainingModule>,
  ) {}

  // Verify that a training module exists
  private async findTrainingModule(id: string): Promise<TrainingModule> {
    const trainingModule = await this.trainingModuleRepository.findOne({
      where: { id },
    });

    if (!trainingModule) {
      throw new NotFoundException(
        `Training module with ID ${id} not found`,
      );
    }

    return trainingModule;
  }

  // Ensure that the parent module can still be edited
  private async ensureModuleIsEditable(
    trainingModuleId: string,
  ): Promise<TrainingModule> {
    const trainingModule = await this.findTrainingModule(trainingModuleId);

    if (trainingModule.status === TrainingModuleStatus.PUBLISHED) {
      throw new BadRequestException(
        'Unpublish the training module before modifying its sections',
      );
    }

    return trainingModule;
  }

  // Create a section under a training module
  async create(
    createModuleSectionDto: CreateModuleSectionDto,
  ): Promise<ModuleSection> {
    const { trainingModuleId, ...sectionData } = createModuleSectionDto;

    const trainingModule =
      await this.ensureModuleIsEditable(trainingModuleId);

    const section = this.moduleSectionRepository.create({
      ...sectionData,
      trainingModule,
      trainingModuleId,
      description: sectionData.description ?? null,
      isActive: true,
    });

    return this.moduleSectionRepository.save(section);
  }

  // Retrieve all sections belonging to a training module
  async findAll(trainingModuleId: string): Promise<ModuleSection[]> {
    await this.findTrainingModule(trainingModuleId);

    return this.moduleSectionRepository.find({
      where: { trainingModuleId },
      order: {
        displayOrder: 'ASC',
        createdAt: 'ASC',
      },
    });
  }

  // Retrieve one section
  async findOne(id: string): Promise<ModuleSection> {
    const section = await this.moduleSectionRepository.findOne({
      where: { id },
    });

    if (!section) {
      throw new NotFoundException(
        `Module section with ID ${id} not found`,
      );
    }

    return section;
  }

  // Update a section
  async update(
    id: string,
    updateModuleSectionDto: UpdateModuleSectionDto,
  ): Promise<ModuleSection> {
    const section = await this.findOne(id);

    await this.ensureModuleIsEditable(section.trainingModuleId);

    const { trainingModuleId, ...sectionData } =
      updateModuleSectionDto;

    if (
      trainingModuleId &&
      trainingModuleId !== section.trainingModuleId
    ) {
      throw new BadRequestException(
        'A section cannot be moved to another training module',
      );
    }

    Object.assign(section, sectionData);

    return this.moduleSectionRepository.save(section);
  }

  // Delete a section
  async remove(id: string): Promise<void> {
    const section = await this.findOne(id);

    await this.ensureModuleIsEditable(section.trainingModuleId);

    await this.moduleSectionRepository.remove(section);
  }
}
