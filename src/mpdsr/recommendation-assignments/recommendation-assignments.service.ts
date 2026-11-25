import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { CasesService } from '../cases/cases.service.js';
import { Case } from '../cases/entities/case.entity.js';
import { CaseStatusHistory } from '../cases/entities/case-status-history.entity.js';
import { CaseStatus } from '../cases/enums/case.enum.js';
import { CaseRecommendation } from '../recommendations/entities/case-recommendation.entity.js';
import { CaseRecommendationReviewStatus } from '../recommendations/enums/case-recommendation.enum.js';

import { User } from '../../shared/users/entities/user.entity.js';
import { AccountStatus } from '../../shared/users/enum/users.enum.js';
import { UserOrganizationAssignment } from '../../shared/user-organization-assignments/entities/user-organization-assignment.entity.js';
import { OrganizationLevel } from '../../shared/user-organization-assignments/enum/organization-level.enum.js';

import { County } from '../../locations/counties/entities/county.entity.js';
import { SubCounty } from '../../locations/sub-counties/entities/sub-county.entity.js';
import { Facility } from '../../facilities/entities/facility.entity.js';
import { CommunityUnit } from '../../locations/community-units/entities/community-unit.entity.js';

import { CreateRecommendationAssignmentDto } from './dto/create-recommendation-assignment.dto.js';
import { ReassignRecommendationAssignmentDto } from './dto/reassign-recommendation-assignment.dto.js';
import { CaseRecommendationAssignment } from './entities/case-recommendation-assignment.entity.js';
import {
  RecommendationAssignmentLevel,
  RecommendationAssignmentStatus,
  RecommendationClassification,
} from './enums/recommendation-assignment.enum.js';

@Injectable()
export class RecommendationAssignmentsService {
  constructor(
    private readonly casesService: CasesService,

    @InjectRepository(CaseRecommendation)
    private readonly recommendationRepository: Repository<CaseRecommendation>,

    @InjectRepository(CaseRecommendationAssignment)
    private readonly assignmentRepository: Repository<CaseRecommendationAssignment>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(UserOrganizationAssignment)
    private readonly userOrganizationAssignmentRepository: Repository<UserOrganizationAssignment>,

    @InjectRepository(County)
    private readonly countyRepository: Repository<County>,

    @InjectRepository(SubCounty)
    private readonly subCountyRepository: Repository<SubCounty>,

    @InjectRepository(Facility)
    private readonly facilityRepository: Repository<Facility>,

    @InjectRepository(CommunityUnit)
    private readonly communityUnitRepository: Repository<CommunityUnit>,
  ) {}

  async createInitialAssignment(
    recommendationId: string,
    dto: CreateRecommendationAssignmentDto,
    userId: string,
    organizationAssignmentId: string,
  ) {
    return this.recommendationRepository.manager.transaction(
      async (manager) => {
        const recommendationRepository =
          manager.getRepository(CaseRecommendation);

        const assignmentRepository =
          manager.getRepository(CaseRecommendationAssignment);

        // Lock the recommendation row to prevent concurrent initial assignments.
        const recommendation = await recommendationRepository.findOne({
          where: { id: recommendationId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!recommendation) {
          throw new NotFoundException('Recommendation was not found.');
        }

        // Verify that the Chair can access the case through their active assignment.
        await this.casesService.findOne(
          recommendation.caseId,
          userId,
          organizationAssignmentId,
        );

        const caseRecord = await manager
          .getRepository(Case)
          .createQueryBuilder('case')
          .setLock('pessimistic_write')
          .where('case.id = :caseId', { caseId: recommendation.caseId })
          .getOne();

        if (!caseRecord) {
          throw new NotFoundException('The recommendation case was not found.');
        }

        if (
          caseRecord.status !== CaseStatus.REVIEW_COMPLETED &&
          caseRecord.status !== CaseStatus.RESPONSE_IN_PROGRESS
        ) {
          throw new BadRequestException(
            'Recommendations can only be assigned after review finalisation and before the case is closed or voided.',
          );
        }

        if (
          ![
            CaseRecommendationReviewStatus.CONFIRMED,
            CaseRecommendationReviewStatus.EDITED,
          ].includes(recommendation.reviewStatus) ||
          !recommendation.approvedRecommendation?.trim()
        ) {
          throw new BadRequestException(
            'Only confirmed or edited recommendations with approved wording can be assigned.',
          );
        }

        // Initial assignment is allowed only once.
        // Later transfers must use the reassignment workflow.
        const existingAssignment = await assignmentRepository.findOne({
          where: { recommendationId },
        });

        if (existingAssignment) {
          throw new ConflictException(
            'This recommendation already has assignment history. Use the reassignment workflow instead.',
          );
        }

        const targetId = this.getTargetId(dto);

        await this.validateTarget(manager, dto.targetLevel, targetId);

        const responsibleUser = await this.userRepository.findOne({
          where: {
            id: dto.responsibleUserId,
            status: AccountStatus.ACTIVE,
          },
        });

        if (!responsibleUser) {
          throw new BadRequestException(
            'The responsible person must have an active user account.',
          );
        }

        await this.validateResponsiblePerson(
          manager,
          responsibleUser.id,
          dto.targetLevel,
          targetId,
        );

        const assignmentDate = this.getNairobiDate();

        this.validateDueDate(
          dto.classification,
          assignmentDate,
          dto.dueDate,
        );

        const status =
          dto.targetLevel === RecommendationAssignmentLevel.COMMUNITY ||
          dto.targetLevel === RecommendationAssignmentLevel.FACILITY
            ? RecommendationAssignmentStatus.ACTIVE
            : RecommendationAssignmentStatus.PENDING_ACCEPTANCE;

        const assignment = assignmentRepository.create({
          recommendationId,
          classification: dto.classification,
          targetLevel: dto.targetLevel,
          countyId:
            dto.targetLevel === RecommendationAssignmentLevel.COUNTY
              ? targetId
              : null,
          subCountyId:
            dto.targetLevel === RecommendationAssignmentLevel.SUB_COUNTY
              ? targetId
              : null,
          facilityId:
            dto.targetLevel === RecommendationAssignmentLevel.FACILITY
              ? targetId
              : null,
          communityUnitId:
            dto.targetLevel === RecommendationAssignmentLevel.COMMUNITY
              ? targetId
              : null,
          responsibleUserId: responsibleUser.id,
          assignedBy: userId,
          dueDate: dto.dueDate,
          instructions: dto.instructions?.trim() || null,
          status,
          previousAssignmentId: null,
        });

        const savedAssignment = await assignmentRepository.save(assignment);

        if (
          status === RecommendationAssignmentStatus.ACTIVE &&
          caseRecord.status === CaseStatus.REVIEW_COMPLETED
        ) {
          const previousStatus = caseRecord.status;
          caseRecord.status = CaseStatus.RESPONSE_IN_PROGRESS;
          await manager.getRepository(Case).save(caseRecord);

          const historyRepository = manager.getRepository(CaseStatusHistory);
          await historyRepository.save(
            historyRepository.create({
              caseId: caseRecord.id,
              fromStatus: previousStatus,
              toStatus: CaseStatus.RESPONSE_IN_PROGRESS,
              changedBy: userId,
              reason: 'Recommendation implementation started.',
              remarks: null,
            }),
          );
        }

        return savedAssignment;
      },
    );
  }

  async findAssignmentHistory(
    recommendationId: string,
    userId: string,
    organizationAssignmentId: string,
  ) {
    const recommendation = await this.recommendationRepository.findOne({
      where: { id: recommendationId },
    });

    if (!recommendation) {
      throw new NotFoundException('Recommendation was not found.');
    }

    // Enforce the caller's existing case-level access before returning history.
    const caseRecord = await this.casesService.findOne(
      recommendation.caseId,
      userId,
      organizationAssignmentId,
    );

    const assignments = await this.assignmentRepository
      .createQueryBuilder('assignment')
      .leftJoin('assignment.responsibleUser', 'responsibleUser')
      .addSelect([
        'responsibleUser.id',
        'responsibleUser.firstName',
        'responsibleUser.lastName',
        'responsibleUser.email',
      ])
      .leftJoin('assignment.assigner', 'assigner')
      .addSelect([
        'assigner.id',
        'assigner.firstName',
        'assigner.lastName',
        'assigner.email',
      ])
      .leftJoin('assignment.county', 'county')
      .addSelect(['county.id', 'county.name', 'county.code'])
      .leftJoin('assignment.subCounty', 'subCounty')
      .addSelect(['subCounty.id', 'subCounty.name', 'subCounty.code'])
      .leftJoin('assignment.facility', 'facility')
      .addSelect(['facility.id', 'facility.name', 'facility.mflCode'])
      .leftJoin('assignment.communityUnit', 'communityUnit')
      .addSelect(['communityUnit.id', 'communityUnit.name', 'communityUnit.code'])
      .where('assignment.recommendationId = :recommendationId', {
        recommendationId,
      })
      .orderBy('assignment.createdAt', 'ASC')
      .getMany();

    return {
      recommendation: {
        id: recommendation.id,
        caseId: recommendation.caseId,
        caseNumber: caseRecord.caseNumber,
        recommendation: recommendation.recommendation,
        approvedRecommendation: recommendation.approvedRecommendation,
        reviewStatus: recommendation.reviewStatus,
      },
      assignments,
    };
  }

  async reassignAssignment(
    assignmentId: string,
    dto: ReassignRecommendationAssignmentDto,
    userId: string,
    organizationAssignmentId: string,
  ) {
    const reason = dto.reason?.trim();

    if (!reason || reason.length < 3) {
      throw new BadRequestException(
        'A reassignment reason of at least three characters is required.',
      );
    }

    return this.assignmentRepository.manager.transaction(async (manager) => {
      const assignmentRepository = manager.getRepository(
        CaseRecommendationAssignment,
      );

      // Lock the previous assignment so concurrent handovers cannot both proceed.
      const previousAssignment = await assignmentRepository.findOne({
        where: { id: assignmentId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!previousAssignment) {
        throw new NotFoundException(
          'Recommendation assignment was not found.',
        );
      }

      const allowedStatuses = [
        RecommendationAssignmentStatus.ACTIVE,
        RecommendationAssignmentStatus.PENDING_ACCEPTANCE,
        RecommendationAssignmentStatus.DECLINED,
      ];

      if (!allowedStatuses.includes(previousAssignment.status)) {
        throw new ConflictException(
          'Only active, pending acceptance, or declined assignments can be reassigned.',
        );
      }

      const recommendation = await manager
        .getRepository(CaseRecommendation)
        .findOne({
          where: { id: previousAssignment.recommendationId },
          lock: { mode: 'pessimistic_write' },
        });

      if (!recommendation) {
        throw new NotFoundException('Recommendation was not found.');
      }

      // Verify the Chair's access to the case.
      await this.casesService.findOne(
        recommendation.caseId,
        userId,
        organizationAssignmentId,
      );

      // Lock the case while validating its workflow status.
      const caseRecord = await manager
        .getRepository(Case)
        .createQueryBuilder('case')
        .setLock('pessimistic_write')
        .where('case.id = :caseId', { caseId: recommendation.caseId })
        .getOne();

      if (!caseRecord) {
        throw new NotFoundException('The recommendation case was not found.');
      }

      if (
        caseRecord.status !== CaseStatus.REVIEW_COMPLETED &&
        caseRecord.status !== CaseStatus.RESPONSE_IN_PROGRESS
      ) {
        throw new BadRequestException(
          'Recommendations can only be reassigned while the case is awaiting or undergoing implementation.',
        );
      }

      // An assignment with a successor is no longer the current assignment.
      // This avoids relying on timestamp ordering, which may be ambiguous
      // when multiple records are created within the same second.
      const existingSuccessor = await assignmentRepository.findOne({
        where: { previousAssignmentId: previousAssignment.id },
        select: { id: true },
      });

      if (existingSuccessor) {
        throw new ConflictException(
          'Only the current assignment in the recommendation history can be reassigned.',
        );
      }

      const targetId = this.getTargetId(dto);

      await this.validateTarget(manager, dto.targetLevel, targetId);

      const responsibleUser = await manager
        .getRepository(User)
        .findOne({
          where: {
            id: dto.responsibleUserId,
            status: AccountStatus.ACTIVE,
          },
        });

      if (!responsibleUser) {
        throw new BadRequestException(
          'The new responsible person must have an active user account.',
        );
      }

      await this.validateResponsiblePerson(
        manager,
        responsibleUser.id,
        dto.targetLevel,
        targetId,
      );

      const replacement = assignmentRepository.create({
        recommendationId: previousAssignment.recommendationId,
        classification: previousAssignment.classification,
        targetLevel: dto.targetLevel,
        countyId:
          dto.targetLevel === RecommendationAssignmentLevel.COUNTY
            ? targetId
            : null,
        subCountyId:
          dto.targetLevel === RecommendationAssignmentLevel.SUB_COUNTY
            ? targetId
            : null,
        facilityId:
          dto.targetLevel === RecommendationAssignmentLevel.FACILITY
            ? targetId
            : null,
        communityUnitId:
          dto.targetLevel === RecommendationAssignmentLevel.COMMUNITY
            ? targetId
            : null,
        responsibleUserId: responsibleUser.id,
        assignedBy: userId,
        dueDate: previousAssignment.dueDate,
        instructions: dto.instructions?.trim() || null,
        reassignmentReason: reason,
        declineReason: null,
        status: RecommendationAssignmentStatus.PENDING_ACCEPTANCE,
        previousAssignmentId: previousAssignment.id,
      });

      // Keep declined history intact, including its original decline reason.
      if (
        previousAssignment.status !== RecommendationAssignmentStatus.DECLINED
      ) {
        previousAssignment.status =
          RecommendationAssignmentStatus.SUPERSEDED;
        await assignmentRepository.save(previousAssignment);
      }

      return assignmentRepository.save(replacement);
    });
  }

  async acceptAssignment(
    assignmentId: string,
    userId: string,
    organizationAssignmentId: string,
  ) {
    return this.respondToAssignment(
      assignmentId,
      userId,
      organizationAssignmentId,
      RecommendationAssignmentStatus.ACTIVE,
    );
  }

  async declineAssignment(
    assignmentId: string,
    reason: string,
    userId: string,
    organizationAssignmentId: string,
  ) {
    const trimmedReason = reason?.trim();

    if (!trimmedReason || trimmedReason.length < 3) {
      throw new BadRequestException(
        'A decline reason of at least three characters is required.',
      );
    }

    return this.respondToAssignment(
      assignmentId,
      userId,
      organizationAssignmentId,
      RecommendationAssignmentStatus.DECLINED,
      trimmedReason,
    );
  }

  private async respondToAssignment(
    assignmentId: string,
    userId: string,
    organizationAssignmentId: string,
    newStatus:
      | RecommendationAssignmentStatus.ACTIVE
      | RecommendationAssignmentStatus.DECLINED,
    declineReason: string | null = null,
  ) {
    return this.assignmentRepository.manager.transaction(async (manager) => {
      const assignmentRepository = manager.getRepository(
        CaseRecommendationAssignment,
      );

      const assignment = await assignmentRepository.findOne({
        where: { id: assignmentId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!assignment) {
        throw new NotFoundException(
          'Recommendation assignment was not found.',
        );
      }

      if (assignment.responsibleUserId !== userId) {
        throw new ForbiddenException(
          'Only the currently assigned responsible person can respond to this assignment.',
        );
      }

      if (
        assignment.status !== RecommendationAssignmentStatus.PENDING_ACCEPTANCE
      ) {
        throw new ConflictException(
          'Only assignments pending acceptance can be accepted or declined.',
        );
      }

      const now = new Date();
      const selectedOrganizationAssignment = await manager
        .getRepository(UserOrganizationAssignment)
        .createQueryBuilder('organizationAssignment')
        .where('organizationAssignment.id = :organizationAssignmentId', {
          organizationAssignmentId,
        })
        .andWhere('organizationAssignment.userId = :userId', { userId })
        .andWhere('organizationAssignment.endDate IS NULL')
        .andWhere('organizationAssignment.startDate <= :now', { now })
        .getOne();

      if (
        !selectedOrganizationAssignment ||
        !this.organizationAssignmentMatchesTarget(
          selectedOrganizationAssignment,
          assignment,
        )
      ) {
        throw new ForbiddenException(
          'Your selected active organisation assignment must match this recommendation assignment target.',
        );
      }

      let caseRecord: Case | null = null;

      if (newStatus === RecommendationAssignmentStatus.ACTIVE) {
        const recommendation = await manager
          .getRepository(CaseRecommendation)
          .findOne({
            where: { id: assignment.recommendationId },
          });

        if (!recommendation) {
          throw new NotFoundException('The recommendation was not found.');
        }

        caseRecord = await manager
          .getRepository(Case)
          .createQueryBuilder('case')
          .setLock('pessimistic_write')
          .where('case.id = :caseId', { caseId: recommendation.caseId })
          .getOne();

        if (!caseRecord) {
          throw new NotFoundException('The recommendation case was not found.');
        }

        if (
          caseRecord.status !== CaseStatus.REVIEW_COMPLETED &&
          caseRecord.status !== CaseStatus.RESPONSE_IN_PROGRESS
        ) {
          throw new ConflictException(
            'This case is not in a state that allows recommendation implementation to start.',
          );
        }
      }

      assignment.status = newStatus;
      assignment.declineReason = declineReason;

      const savedAssignment = await assignmentRepository.save(assignment);

      if (
        newStatus === RecommendationAssignmentStatus.ACTIVE &&
        caseRecord?.status === CaseStatus.REVIEW_COMPLETED
      ) {
        const previousStatus = caseRecord.status;
        caseRecord.status = CaseStatus.RESPONSE_IN_PROGRESS;
        await manager.getRepository(Case).save(caseRecord);

        const historyRepository = manager.getRepository(CaseStatusHistory);
        await historyRepository.save(
          historyRepository.create({
            caseId: caseRecord.id,
            fromStatus: previousStatus,
            toStatus: CaseStatus.RESPONSE_IN_PROGRESS,
            changedBy: userId,
            reason: 'Recommendation implementation started.',
            remarks: null,
          }),
        );
      }

      return savedAssignment;
    });
  }

  private organizationAssignmentMatchesTarget(
    organizationAssignment: UserOrganizationAssignment,
    assignment: CaseRecommendationAssignment,
  ): boolean {
    switch (assignment.targetLevel) {
      case RecommendationAssignmentLevel.COUNTY:
        return (
          organizationAssignment.level === OrganizationLevel.COUNTY &&
          organizationAssignment.countyId === assignment.countyId
        );

      case RecommendationAssignmentLevel.SUB_COUNTY:
        return (
          organizationAssignment.level === OrganizationLevel.SUB_COUNTY &&
          organizationAssignment.subCountyId === assignment.subCountyId
        );

      case RecommendationAssignmentLevel.FACILITY:
        return (
          organizationAssignment.level === OrganizationLevel.FACILITY &&
          organizationAssignment.facilityId === assignment.facilityId
        );

      case RecommendationAssignmentLevel.COMMUNITY:
        return (
          organizationAssignment.level === OrganizationLevel.COMMUNITY &&
          organizationAssignment.communityUnitId === assignment.communityUnitId
        );
    }

    return false;
  }

  private getTargetId(dto: {
    targetLevel: RecommendationAssignmentLevel;
    countyId?: string;
    subCountyId?: string;
    facilityId?: string;
    communityUnitId?: string;
  }): string {
    const targets = [
      dto.countyId,
      dto.subCountyId,
      dto.facilityId,
      dto.communityUnitId,
    ].filter((value): value is string => Boolean(value));

    if (targets.length !== 1) {
      throw new BadRequestException(
        'Exactly one target organisation ID must be supplied.',
      );
    }

    const expectedTarget = {
      [RecommendationAssignmentLevel.COUNTY]: dto.countyId,
      [RecommendationAssignmentLevel.SUB_COUNTY]: dto.subCountyId,
      [RecommendationAssignmentLevel.FACILITY]: dto.facilityId,
      [RecommendationAssignmentLevel.COMMUNITY]: dto.communityUnitId,
    }[dto.targetLevel];

    if (!expectedTarget || targets[0] !== expectedTarget) {
      throw new BadRequestException(
        'The supplied organisation ID must match the selected target level.',
      );
    }

    return expectedTarget;
  }

  private async validateTarget(
    manager: EntityManager,
    targetLevel: RecommendationAssignmentLevel,
    targetId: string,
  ) {
    let exists = false;

    switch (targetLevel) {
      case RecommendationAssignmentLevel.COUNTY:
        exists = Boolean(
          await manager.getRepository(County).findOne({
            where: { id: targetId },
          }),
        );
        break;

      case RecommendationAssignmentLevel.SUB_COUNTY:
        exists = Boolean(
          await manager.getRepository(SubCounty).findOne({
            where: { id: targetId },
          }),
        );
        break;

      case RecommendationAssignmentLevel.FACILITY: {
        const facility = await manager.getRepository(Facility).findOne({
          where: { id: targetId, isActive: true },
        });
        exists = Boolean(facility);
        break;
      }

      case RecommendationAssignmentLevel.COMMUNITY: {
        const communityUnit = await manager.getRepository(CommunityUnit).findOne({
          where: { id: targetId, isActive: true },
          relations: { facility: true },
        });
        exists = Boolean(communityUnit?.facility?.isActive);
        break;
      }
    }

    if (!exists) {
      throw new BadRequestException(
        'The selected target organisation does not exist or is inactive.',
      );
    }
  }

  private async validateResponsiblePerson(
    manager: EntityManager,
    userId: string,
    targetLevel: RecommendationAssignmentLevel,
    targetId: string,
  ) {
    const levelMap = {
      [RecommendationAssignmentLevel.COUNTY]: OrganizationLevel.COUNTY,
      [RecommendationAssignmentLevel.SUB_COUNTY]: OrganizationLevel.SUB_COUNTY,
      [RecommendationAssignmentLevel.FACILITY]: OrganizationLevel.FACILITY,
      [RecommendationAssignmentLevel.COMMUNITY]: OrganizationLevel.COMMUNITY,
    };

    const targetColumnMap = {
      [RecommendationAssignmentLevel.COUNTY]: 'countyId',
      [RecommendationAssignmentLevel.SUB_COUNTY]: 'subCountyId',
      [RecommendationAssignmentLevel.FACILITY]: 'facilityId',
      [RecommendationAssignmentLevel.COMMUNITY]: 'communityUnitId',
    };

    const targetColumn = targetColumnMap[targetLevel];

    const matchingAssignment = await manager
      .getRepository(UserOrganizationAssignment)
      .createQueryBuilder('assignment')
      .where('assignment.userId = :userId', { userId })
      .andWhere('assignment.level = :level', {
        level: levelMap[targetLevel],
      })
      .andWhere(`assignment.${targetColumn} = :targetId`, { targetId })
      .andWhere('assignment.endDate IS NULL')
      .andWhere('assignment.startDate <= :now', { now: new Date() })
      .getOne();

    if (!matchingAssignment) {
      throw new BadRequestException(
        'The responsible person must have an active organisation assignment at the exact selected target.',
      );
    }
  }

  private getNairobiDate(): string {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Nairobi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());

    const values = Object.fromEntries(
      parts.map((part) => [part.type, part.value]),
    );

    return `${values.year}-${values.month}-${values.day}`;
  }

  private validateDueDate(
    classification: RecommendationClassification,
    assignmentDate: string,
    dueDate: string,
  ) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      throw new BadRequestException(
        'Due date must use YYYY-MM-DD format.',
      );
    }

    const parsedDueDate = new Date(`${dueDate}T00:00:00.000Z`);

    if (
      Number.isNaN(parsedDueDate.getTime()) ||
      parsedDueDate.toISOString().slice(0, 10) !== dueDate
    ) {
      throw new BadRequestException(
        'Due date is not a valid calendar date.',
      );
    }

    const maximumMonths = {
      [RecommendationClassification.IMMEDIATE]: 1,
      [RecommendationClassification.INTERMEDIATE]: 3,
      [RecommendationClassification.LONG_TERM]: 6,
    }[classification];

    const maximumDueDate = this.addCalendarMonths(
      assignmentDate,
      maximumMonths,
    );

    const absoluteMaximumDueDate = this.addCalendarMonths(
      assignmentDate,
      6,
    );

    if (dueDate > absoluteMaximumDueDate) {
      throw new BadRequestException(
        `Due date cannot exceed six months from the initial assignment date (${absoluteMaximumDueDate}).`,
      );
    }

    if (dueDate < assignmentDate) {
      throw new BadRequestException(
        'Due date cannot be in the past. Select today or a future date.',
      );
    }

    if (dueDate > maximumDueDate) {
      throw new BadRequestException(
        `The due date for ${classification} recommendations cannot exceed ${maximumDueDate}.`,
      );
    }
  }

  private addCalendarMonths(date: string, months: number): string {
    const [year, month, day] = date.split('-').map(Number);

    const monthIndex = month - 1 + months;
    const targetYear = year + Math.floor(monthIndex / 12);
    const targetMonth = (monthIndex % 12) + 1;

    const lastDay = new Date(
      Date.UTC(targetYear, targetMonth, 0),
    ).getUTCDate();

    const targetDay = Math.min(day, lastDay);

    return [
      targetYear,
      String(targetMonth).padStart(2, '0'),
      String(targetDay).padStart(2, '0'),
    ].join('-');
  }
}
