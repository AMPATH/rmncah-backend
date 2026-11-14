
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Cohort } from './entities/cohort.entity.js';
import { CohortMentee } from './entities/cohort-mentee.entity.js';

import { Facility } from '../../facilities/entities/facility.entity.js';
import { User } from '../../shared/users/entities/user.entity.js';

import { CreateCohortDto } from './dto/create-cohort.dto.js';
import { UpdateCohortDto } from './dto/update-cohort.dto.js';
import { AddMenteeDto } from './dto/add-mentee.dto.js';

import {
  CohortStatus,
  CohortMembershipStatus,
} from './enum/cohorts.enum.js';

@Injectable()
export class CohortsService {
  constructor(
    @InjectRepository(Cohort)
    private readonly cohortRepository: Repository<Cohort>,

    @InjectRepository(CohortMentee)
    private readonly cohortMenteeRepository: Repository<CohortMentee>,

    @InjectRepository(Facility)
    private readonly facilityRepository: Repository<Facility>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly dataSource: DataSource,
  ) {}

  // CREATE COHORT
  async create(dto: CreateCohortDto): Promise<Cohort> {
    const facility = await this.facilityRepository.findOne({
      where: { id: dto.facilityId },
    });

    if (!facility) {
      throw new NotFoundException('Facility not found');
    }

    const mentor = await this.userRepository.findOne({
      where: { id: dto.mentorId },
    });

    if (!mentor) {
      throw new NotFoundException('Mentor not found');
    }

    if (!dto.startDate || !dto.endDate) {
      throw new BadRequestException(
        'Start date and end date are required',
      );
    }

    if (dto.endDate < dto.startDate) {
      throw new BadRequestException(
        'End date cannot be earlier than start date',
      );
    }

    const cohort = this.cohortRepository.create({
      name: dto.name,
      description: dto.description ?? null,
      facilityId: dto.facilityId,
      mentorId: dto.mentorId,
      startDate: dto.startDate,
      endDate: dto.endDate,
      status: CohortStatus.DRAFT,
    });

    return this.cohortRepository.save(cohort);
  }

  // GET ALL COHORTS
  async findAll(): Promise<Cohort[]> {
    return this.cohortRepository.find({
      relations: {
        facility: true,
        mentor: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  // GET ONE COHORT
  async findOne(id: string): Promise<Cohort> {
    const cohort = await this.cohortRepository.findOne({
      where: { id },
      relations: {
        facility: true,
        mentor: true,
        memberships: {
          mentee: true,
        },
      },
    });

    if (!cohort) {
      throw new NotFoundException(
        `Cohort with ID ${id} not found`,
      );
    }

    return cohort;
  }

  // UPDATE COHORT DETAILS
  async update(
    id: string,
    dto: UpdateCohortDto,
  ): Promise<Cohort> {
    const cohort = await this.findOne(id);

    if (dto.facilityId && dto.facilityId !== cohort.facilityId) {
      const facility = await this.facilityRepository.findOne({
        where: { id: dto.facilityId },
      });

      if (!facility) {
        throw new NotFoundException('Facility not found');
      }

      cohort.facilityId = dto.facilityId;
    }

    // A mentor can only be changed while the cohort is a draft.
    if (dto.mentorId && dto.mentorId !== cohort.mentorId) {
      if (cohort.status !== CohortStatus.DRAFT) {
        throw new BadRequestException(
          'The mentor cannot be changed after the cohort has been activated',
        );
      }

      const mentor = await this.userRepository.findOne({
        where: { id: dto.mentorId },
      });

      if (!mentor) {
        throw new NotFoundException('Mentor not found');
      }

      cohort.mentorId = dto.mentorId;
    }

    if (dto.startDate !== undefined && dto.startDate !== null) {
      cohort.startDate = dto.startDate;
    }

    if (dto.endDate !== undefined && dto.endDate !== null) {
      cohort.endDate = dto.endDate;
    }

    if (cohort.endDate < cohort.startDate) {
      throw new BadRequestException(
        'End date cannot be earlier than start date',
      );
    }

    if (dto.name !== undefined) {
      cohort.name = dto.name;
    }

    if (dto.description !== undefined) {
      cohort.description = dto.description;
    }

    return this.cohortRepository.save(cohort);
  }

  // UPDATE COHORT STATUS
  async updateStatus(
    id: string,
    newStatus: CohortStatus,
  ): Promise<Cohort> {
    const cohort = await this.findOne(id);

    if (
      cohort.status === CohortStatus.COMPLETED ||
      cohort.status === CohortStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot change the status of a ${cohort.status} cohort`,
      );
    }

    if (cohort.status === newStatus) {
      throw new BadRequestException(
        `The cohort is already ${newStatus}`,
      );
    }

    if (
      cohort.status === CohortStatus.DRAFT &&
      newStatus !== CohortStatus.ACTIVE &&
      newStatus !== CohortStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'A draft cohort can only be activated or cancelled',
      );
    }

    if (
      cohort.status === CohortStatus.ACTIVE &&
      newStatus !== CohortStatus.COMPLETED &&
      newStatus !== CohortStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'An active cohort can only be completed or cancelled',
      );
    }

    cohort.status = newStatus;

    return this.cohortRepository.save(cohort);
  }

  // ADD MENTEE TO COHORT
  async addMentee(
    cohortId: string,
    dto: AddMenteeDto,
  ): Promise<CohortMentee> {
    return this.dataSource.transaction(async (manager) => {
      // Lock the mentee row.
      const mentee = await manager.findOne(User, {
        where: { id: dto.menteeId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!mentee) {
        throw new NotFoundException('Mentee not found');
      }

      // Find and lock the destination cohort.
      const cohort = await manager.findOne(Cohort, {
        where: { id: cohortId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!cohort) {
        throw new NotFoundException('Cohort not found');
      }

      if (
        cohort.status !== CohortStatus.DRAFT &&
        cohort.status !== CohortStatus.ACTIVE
      ) {
        throw new BadRequestException(
          'Mentees can only be assigned to draft or active cohorts',
        );
      }

      // Prevent assignment when an active or paused membership exists.
      const existingMembership = await manager.findOne(
        CohortMentee,
        {
          where: [
            {
              menteeId: dto.menteeId,
              status: CohortMembershipStatus.ACTIVE,
            },
            {
              menteeId: dto.menteeId,
              status: CohortMembershipStatus.PAUSED,
            },
          ],
        },
      );

      if (existingMembership) {
        throw new BadRequestException(
          'This mentee already has an active or paused cohort membership',
        );
      }

      const membership = manager.create(CohortMentee, {
        cohortId: cohort.id,
        menteeId: mentee.id,
        status: CohortMembershipStatus.ACTIVE,
      });

      return manager.save(CohortMentee, membership);
    });
  }

  // GET MENTEES IN A SPECIFIC COHORT
  async findCohortMentees(
    cohortId: string,
  ): Promise<CohortMentee[]> {
    const cohort = await this.cohortRepository.findOne({
      where: { id: cohortId },
    });

    if (!cohort) {
      throw new NotFoundException('Cohort not found');
    }

    return this.cohortMenteeRepository.find({
      where: {
        cohortId,
        status: CohortMembershipStatus.ACTIVE,
      },
      relations: {
        mentee: true,
      },
      order: {
        assignedAt: 'DESC',
      },
    });
  }

  // GET A MENTEE'S COHORT MEMBERSHIP HISTORY
  async findMenteeMembershipHistory(
    menteeId: string,
  ): Promise<CohortMentee[]> {
    const mentee = await this.userRepository.findOne({
      where: { id: menteeId },
    });

    if (!mentee) {
      throw new NotFoundException('Mentee not found');
    }

    return this.cohortMenteeRepository.find({
      where: {
        menteeId,
      },
      relations: {
        cohort: {
          facility: true,
          mentor: true,
        },
      },
      order: {
        assignedAt: 'DESC',
      },
    });
  }

  // PAUSE A MENTEE'S MEMBERSHIP
  async pauseMentee(
    cohortId: string,
    menteeId: string,
  ): Promise<CohortMentee> {
    const membership = await this.cohortMenteeRepository.findOne({
      where: {
        cohortId,
        menteeId,
        status: CohortMembershipStatus.ACTIVE,
      },
    });

    if (!membership) {
      throw new NotFoundException(
        'Active mentee membership not found in this cohort',
      );
    }

    membership.status = CohortMembershipStatus.PAUSED;
    membership.pausedAt = new Date();

    return this.cohortMenteeRepository.save(membership);
  }

  // RESUME A MENTEE'S MEMBERSHIP
  async resumeMentee(
    cohortId: string,
    menteeId: string,
  ): Promise<CohortMentee> {
    const membership = await this.cohortMenteeRepository.findOne({
      where: {
        cohortId,
        menteeId,
        status: CohortMembershipStatus.PAUSED,
      },
    });

    if (!membership) {
      throw new NotFoundException(
        'Paused mentee membership not found in this cohort',
      );
    }

    membership.status = CohortMembershipStatus.ACTIVE;
    membership.resumedAt = new Date();

    return this.cohortMenteeRepository.save(membership);
  }

  // REMOVE A MENTEE FROM A COHORT
  async removeMentee(
    cohortId: string,
    menteeId: string,
  ): Promise<CohortMentee> {
    const membership = await this.cohortMenteeRepository.findOne({
      where: [
        {
          cohortId,
          menteeId,
          status: CohortMembershipStatus.ACTIVE,
        },
        {
          cohortId,
          menteeId,
          status: CohortMembershipStatus.PAUSED,
        },
      ],
    });

    if (!membership) {
      throw new NotFoundException(
        'Active or paused mentee membership not found in this cohort',
      );
    }

    membership.status = CohortMembershipStatus.REMOVED;
    membership.removedAt = new Date();

    return this.cohortMenteeRepository.save(membership);
  }
  //cohort completion
}
