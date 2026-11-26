
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';


import { CohortModuleAssignment } from '../entities/cohort-module-assignment.entity.js';

import { CreateTrainingSessionDto } from './dto/create-training-session.dto.js';
import { UpdateTrainingSessionDto } from './dto/update-training-session.dto.js';
import { UpdateTrainingSessionStatusDto } from './dto/update-training-session-status.dto.js';

import { TrainingModuleStatus } from '../../../modules/training-modules/enum/training-module-status.enum.js';
import { TrainingSessionStatus } from './enums/training-session-status.enum.js';
import { TrainingSession } from './entities/training-sessions.entity.js';

@Injectable()
export class TrainingSessionsService {
  constructor(
    @InjectRepository(TrainingSession)
    private readonly trainingSessionRepository: Repository<TrainingSession>,

    @InjectRepository(CohortModuleAssignment)
    private readonly assignmentRepository: Repository<CohortModuleAssignment>,
  ) {}

  private validateSchedule(
    startDate: string,
    startTime: string,
    endDate: string,
    endTime: string,
  ): void {
    const start = `${startDate}T${startTime}`;
    const end = `${endDate}T${endTime}`;

    if (end <= start) {
      throw new BadRequestException(
        'Training end date and time must be after the start date and time',
      );
    }
  }

  private async getAssignment(
    assignmentId: string,
    userId: string,
  ): Promise<CohortModuleAssignment> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
      relations: {
        cohort: true,
        trainingModule: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException('Cohort module assignment not found');
    }

    // A mentor can only manage training for their own cohort.
    if (assignment.cohort.mentorId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to manage training for this cohort',
      );
    }

    if (
      assignment.trainingModule.status !== TrainingModuleStatus.PUBLISHED
    ) {
      throw new BadRequestException(
        'Training can only be scheduled for published modules',
      );
    }

    return assignment;
  }

  async create(
    assignmentId: string,
    dto: CreateTrainingSessionDto,
    userId: string,
  ): Promise<TrainingSession> {
    await this.getAssignment(assignmentId, userId);

    this.validateSchedule(
      dto.startDate,
      dto.startTime,
      dto.endDate,
      dto.endTime,
    );

    const session = this.trainingSessionRepository.create({
      ...dto,
      assignmentId,
      status: TrainingSessionStatus.PLANNED,
    });

    return this.trainingSessionRepository.save(session);
  }

  async findByAssignment(
    assignmentId: string,
    userId: string,
  ): Promise<TrainingSession[]> {
    await this.getAssignment(assignmentId, userId);

    return this.trainingSessionRepository.find({
      where: { assignmentId },
      order: {
        startDate: 'ASC',
        startTime: 'ASC',
      },
    });
  }

  async findOne(
    sessionId: string,
    userId: string,
  ): Promise<TrainingSession> {
    const session = await this.trainingSessionRepository.findOne({
      where: { id: sessionId },
      relations: {
        assignment: {
          cohort: true,
          trainingModule: true,
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Training session not found');
    }

    if (session.assignment.cohort.mentorId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to view this training session',
      );
    }

    return session;
  }

  async update(
    sessionId: string,
    dto: UpdateTrainingSessionDto,
    userId: string,
  ): Promise<TrainingSession> {
    const session = await this.findOne(sessionId, userId);

    if (
      session.status === TrainingSessionStatus.COMPLETED ||
      session.status === TrainingSessionStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Completed or cancelled sessions cannot be updated',
      );
    }

    const updatedValues = {
      startDate: dto.startDate ?? session.startDate,
      startTime: dto.startTime ?? session.startTime,
      endDate: dto.endDate ?? session.endDate,
      endTime: dto.endTime ?? session.endTime,
    };

    this.validateSchedule(
      updatedValues.startDate,
      updatedValues.startTime,
      updatedValues.endDate,
      updatedValues.endTime,
    );

    Object.assign(session, dto);

    return this.trainingSessionRepository.save(session);
  }

  async updateStatus(
    sessionId: string,
    dto: UpdateTrainingSessionStatusDto,
    userId: string,
  ): Promise<TrainingSession> {
    const session = await this.findOne(sessionId, userId);

    if (
      session.status === TrainingSessionStatus.COMPLETED ||
      session.status === TrainingSessionStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'This training session has already been completed or cancelled',
      );
    }

    session.status = dto.status;

    return this.trainingSessionRepository.save(session);
  }

  async remove(
    sessionId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const session = await this.findOne(sessionId, userId);

    if (session.status === TrainingSessionStatus.COMPLETED) {
      throw new BadRequestException(
        'Completed training sessions cannot be deleted',
      );
    }

    await this.trainingSessionRepository.remove(session);

    return {
      message: 'Training session deleted successfully',
    };
  }
}
