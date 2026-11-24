
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CohortModuleAssignment } from './entities/cohort-module-assignment.entity.js';

import { Cohort } from '../entities/cohort.entity.js';
import { TrainingModule } from '../../modules/training-modules/entities/training-module.entity.js';
import { User } from '../../../shared/users/entities/user.entity.js';

import { TrainingModuleStatus } from '../../modules/training-modules/enum/training-module-status.enum.js';

@Injectable()
export class CohortModuleAssignmentsService {
  constructor(
    @InjectRepository(CohortModuleAssignment)
    private readonly assignmentRepository: Repository<CohortModuleAssignment>,

    @InjectRepository(Cohort)
    private readonly cohortRepository: Repository<Cohort>,

    @InjectRepository(TrainingModule)
    private readonly trainingModuleRepository: Repository<TrainingModule>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Assign a published training module to a cohort
  async assignModule(
    cohortId: string,
    trainingModuleId: string,
    assignedBy: string,
  ): Promise<CohortModuleAssignment> {
    const cohort = await this.cohortRepository.findOne({
      where: { id: cohortId },
    });

    if (!cohort) {
      throw new NotFoundException(
        `Cohort with ID ${cohortId} not found`,
      );
    }

    const trainingModule =
      await this.trainingModuleRepository.findOne({
        where: { id: trainingModuleId },
      });

    if (!trainingModule) {
      throw new NotFoundException(
        `Training module with ID ${trainingModuleId} not found`,
      );
    }

    if (trainingModule.status !== TrainingModuleStatus.PUBLISHED) {
      throw new BadRequestException(
        'Only published training modules can be assigned to cohorts',
      );
    }

    const user = await this.userRepository.findOne({
      where: { id: assignedBy },
    });

    if (!user) {
      throw new NotFoundException(
        `Assigning user with ID ${assignedBy} not found`,
      );
    }

    const existingAssignment =
      await this.assignmentRepository.findOne({
        where: {
          cohortId,
          trainingModuleId,
        },
      });

    if (existingAssignment) {
      throw new ConflictException(
        'This training module is already assigned to this cohort',
      );
    }

    const assignment = this.assignmentRepository.create({
      cohortId,
      trainingModuleId,
      assignedBy,
    });

    return this.assignmentRepository.save(assignment);
  }

  // Retrieve all modules assigned to a cohort
  async findByCohort(
    cohortId: string,
  ): Promise<CohortModuleAssignment[]> {
    const cohort = await this.cohortRepository.findOne({
      where: { id: cohortId },
    });

    if (!cohort) {
      throw new NotFoundException(
        `Cohort with ID ${cohortId} not found`,
      );
    }

    return this.assignmentRepository.find({
      where: { cohortId },
      relations: {
        trainingModule: true,
        assigner: true,
      },
      order: {
        assignedAt: 'DESC',
      },
    });
  }

  // Remove a module assignment from a cohort
  async removeAssignment(
    cohortId: string,
    assignmentId: string,
  ): Promise<{ message: string }> {
    const assignment = await this.assignmentRepository.findOne({
      where: {
        id: assignmentId,
        cohortId,
      },
    });

    if (!assignment) {
      throw new NotFoundException(
        'Module assignment not found for this cohort',
      );
    }

    await this.assignmentRepository.remove(assignment);

    return {
      message: 'Training module removed from cohort successfully',
    };
  }
}
