
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  SelectQueryBuilder,
  Brackets,
} from 'typeorm';

import { User } from '../../shared/users/entities/user.entity.js';

import {
  AccountStatus,
  OrganizationLevel,
} from '../../shared/users/enum/users.enum.js';

@Injectable()
export class MenteesService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Select only the user information needed by the Mentees module.
  private createMenteeQuery(): SelectQueryBuilder<User> {
    return this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.firstName',
        'user.lastName',
        'user.email',
        'user.phoneNumber',
        'user.level',
        'user.status',
        'user.cadreId',
        'user.createdAt',
      ])
      .where('user.level = :level', {
        level: OrganizationLevel.FACILITY,
      });
  }

  // 1. Get all mentees with search, status filtering and pagination.
  async findAll(query: {
    search?: string;
    status?: AccountStatus;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number(query.limit) || 20),
    );

    const queryBuilder = this.createMenteeQuery();

    if (query.status) {
      queryBuilder.andWhere('user.status = :status', {
        status: query.status,
      });
    }

    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;

      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('user.firstName LIKE :search', { search })
            .orWhere('user.lastName LIKE :search', { search })
            .orWhere('user.email LIKE :search', { search })
            .orWhere('user.phoneNumber LIKE :search', { search });
        }),
      );
    }

    queryBuilder
      .orderBy('user.firstName', 'ASC')
      .addOrderBy('user.lastName', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [mentees, total] = await queryBuilder.getManyAndCount();

    return {
      data: mentees,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // 2. Get one mentee by ID.
  async findOne(id: string) {
    const mentee = await this.createMenteeQuery()
      .andWhere('user.id = :id', { id })
      .getOne();

    if (!mentee) {
      throw new NotFoundException(
        `Mentee with ID ${id} not found`,
      );
    }

    return mentee;
  }

  // 3. Get eligible mentees.
  // Eligible -active facility-level users.
  async findEligible() {
    return this.createMenteeQuery()
      .andWhere('user.status = :status', {
        status: AccountStatus.ACTIVE,
      })
      .orderBy('user.firstName', 'ASC')
      .addOrderBy('user.lastName', 'ASC')
      .getMany();
  }

  // 4. Get mentee counts grouped by account status.
  async getStatistics() {
    const results = await this.userRepository
      .createQueryBuilder('user')
      .select('user.status', 'status')
      .addSelect('COUNT(user.id)', 'count')
      .where('user.level = :level', {
        level: OrganizationLevel.FACILITY,
      })
      .groupBy('user.status')
      .getRawMany();

    const statistics = {
      total: 0,
      active: 0,
      inactive: 0,
      pending: 0,
      deactivated: 0,
    };

    for (const result of results) {
      const count = Number(result.count);

      statistics.total += count;

      switch (result.status) {
        case AccountStatus.ACTIVE:
          statistics.active = count;
          break;

        case AccountStatus.INACTIVE:
          statistics.inactive = count;
          break;

        case AccountStatus.PENDING:
          statistics.pending = count;
          break;

        case AccountStatus.DEACTIVATED:
          statistics.deactivated = count;
          break;
      }
    }

    return statistics;
  }

  // 5. Get the logged in mentee's personal dashboard.
  async getMyDashboard(userId: string) {
    const mentee = await this.createMenteeQuery()
      .andWhere('user.id = :userId', { userId })
      .andWhere('user.status = :status', {
        status: AccountStatus.ACTIVE,
      })
      .getOne();

    if (!mentee) {
      throw new NotFoundException(
        'Active mentee account not found',
      );
    }

    return {
      message: 'Mentee dashboard retrieved successfully',

      profile: {
        id: mentee.id,
        firstName: mentee.firstName,
        lastName: mentee.lastName,
        fullName: `${mentee.firstName} ${mentee.lastName}`,
        email: mentee.email,
        phoneNumber: mentee.phoneNumber,
        level: mentee.level,
        status: mentee.status,
        cadreId: mentee.cadreId,
        joinedAt: mentee.createdAt,
      },

      cohort: null,
      mentor: null,

      learningSummary: {
        totalModules: 0,
        completedModules: 0,
        inProgressModules: 0,
        overallProgress: 0,
      },

      modules: [],
      upcomingSessions: [],

      assessments: {
        pending: [],
        completed: [],
      },
    };
  }

}
