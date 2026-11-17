import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  Brackets,
  IsNull,
  DataSource,
  EntityManager,
  SelectQueryBuilder,
} from 'typeorm';

import { randomUUID } from 'node:crypto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { Case } from './entities/case.entity.js';
import { MaternalCaseDetail } from './entities/maternal-case-detail.entity.js';
import { PerinatalCaseDetail } from './entities/perinatal-case-detail.entity.js';
import { NearMissDetail } from './entities/near-miss-detail.entity.js';

import { CaseType, ReportingSetting } from './enums/case.enum.js';

import { CreateCaseDto } from './dto/create-case.dto.js';
import { UpdateCaseDto } from './dto/update-case.dto.js';
import { ListCasesQueryDto } from './dto/list-cases-query.dto.js';

import { CreateMaternalCaseDetailDto } from './dto/create-maternal-case-detail.dto.js';
import { CreatePerinatalCaseDetailDto } from './dto/create-perinatal-case-detail.dto.js';
import { CreateNearMissCaseDetailDto } from './dto/create-near-miss-case-detail.dto.js';

import { UserOrganizationAssignment } from '../../shared/user-organization-assignments/entities/user-organization-assignment.entity.js';
import { OrganizationLevel } from '../../shared/user-organization-assignments/enum/organization-level.enum.js';

import { Facility } from '../../facilities/entities/facility.entity.js';
import { CommunityUnit } from '../../locations/community-units/entities/community-unit.entity.js';
import { FacilityPcnMembership } from '../pcns/entities/facility-pcn-membership.entity.js';

@Injectable()
export class CasesService {
  constructor(private readonly dataSource: DataSource) {}

  // ==================================================
  // ORGANIZATION ASSIGNMENT
  // ==================================================

  /**
   * Load the selected organization assignment.
   *
   * The assignment must:
   * - Belong to the authenticated user.
   * - Still be active.
   * - Have reached its start date.
   *
   * The controller's PermissionsGuard also checks the assignment,
   * but the service verifies it independently before accessing data.
   */
  private async getActiveAssignment(
    userId: string,
    assignmentId: string,
    manager: EntityManager = this.dataSource.manager,
  ): Promise<UserOrganizationAssignment> {
    if (!userId || !assignmentId) {
      throw new BadRequestException(
        'User ID and organization assignment ID are required.',
      );
    }

    const assignment = await manager
      .getRepository(UserOrganizationAssignment)
      .findOne({
        where: {
          id: assignmentId,
          userId,
          endDate: IsNull(),
        },
      });

    if (!assignment) {
      throw new NotFoundException(
        'Active organization assignment was not found.',
      );
    }

    if (new Date(assignment.startDate).getTime() > Date.now()) {
      throw new BadRequestException(
        'This organization assignment is not yet effective.',
      );
    }

    return assignment;
  }

  // ==================================================
  // ORGANIZATIONAL FACILITY SCOPE
  // ==================================================

  /**
   * Resolve the facilities accessible through an assignment.
   *
   * PCN access is determined by active facility-PCN membership.
   * It is deliberately not inferred from the PCN's subcounty.
   */
  private async getScopedFacilityIds(
    assignment: UserOrganizationAssignment,
    manager: EntityManager = this.dataSource.manager,
  ): Promise<string[]> {
    const facilityRepository = manager.getRepository(Facility);

    switch (assignment.level) {
      case OrganizationLevel.COMMUNITY:
        // Community assignments access one community unit, not a facility.
        return [];

      case OrganizationLevel.FACILITY: {
        if (!assignment.facilityId) {
          return [];
        }

        const facility = await facilityRepository.findOne({
          where: {
            id: assignment.facilityId,
            isActive: true,
          },
          select: {
            id: true,
          },
        });

        return facility ? [facility.id] : [];
      }

      case OrganizationLevel.PCN: {
        if (!assignment.pcnId) {
          return [];
        }

        const memberships = await manager
          .getRepository(FacilityPcnMembership)
          .createQueryBuilder('membership')
          .innerJoin('membership.facility', 'facility')
          .where('membership.pcnId = :pcnId', {
            pcnId: assignment.pcnId,
          })
          .andWhere('membership.endedAt IS NULL')
          .andWhere('facility.isActive = :isActive', {
            isActive: true,
          })
          .select('membership.facilityId', 'facilityId')
          .getRawMany<{ facilityId: string }>();

        return memberships.map((membership) => membership.facilityId);
      }

      case OrganizationLevel.SUB_COUNTY: {
        if (!assignment.subCountyId) {
          return [];
        }

        const facilities = await facilityRepository.find({
          where: {
            subCountyId: assignment.subCountyId,
            isActive: true,
          },
          select: {
            id: true,
          },
        });

        return facilities.map((facility) => facility.id);
      }

      case OrganizationLevel.COUNTY: {
        if (!assignment.countyId) {
          return [];
        }

        const facilities = await facilityRepository
          .createQueryBuilder('facility')
          .innerJoin('facility.subCounty', 'subCounty')
          .where('subCounty.countyId = :countyId', {
            countyId: assignment.countyId,
          })
          .andWhere('facility.isActive = :isActive', {
            isActive: true,
          })
          .select('facility.id', 'facilityId')
          .getRawMany<{ facilityId: string }>();

        return facilities.map((facility) => facility.facilityId);
      }

      default:
        throw new BadRequestException('Unsupported organization level.');
    }
  }

  // ==================================================
  // APPLY ORGANIZATIONAL CASE SCOPE
  // ==================================================

  /**
   * Restrict a case query to the selected assignment.
   *
   * Facility-level and higher assignments can see:
   * - Facility reports belonging to their facilities.
   * - Community reports from community units linked to those facilities.
   *
   * Community-level assignments can only see cases reported
   * from their assigned community unit.
   */
  private async applyAssignmentScope(
    queryBuilder: SelectQueryBuilder<Case>,
    assignment: UserOrganizationAssignment,
    manager: EntityManager = this.dataSource.manager,
  ): Promise<void> {
    if (assignment.level === OrganizationLevel.COMMUNITY) {
      if (!assignment.communityUnitId) {
        queryBuilder.andWhere('1 = 0');
        return;
      }

      queryBuilder.andWhere('case.communityUnitId = :scopeCommunityUnitId', {
        scopeCommunityUnitId: assignment.communityUnitId,
      });

      return;
    }

    const facilityIds = await this.getScopedFacilityIds(assignment, manager);

    // An assignment without accessible facilities must not see cases.
    if (facilityIds.length === 0) {
      queryBuilder.andWhere('1 = 0');
      return;
    }

    queryBuilder.andWhere(
      new Brackets((scope) => {
        scope
          // Facility reports.
          .where('case.facilityId IN (:...scopeFacilityIds)', {
            scopeFacilityIds: facilityIds,
          })

          // Community reports linked to the accessible facilities.
          .orWhere(
            `case.communityUnitId IN (
              SELECT scopedCommunityUnit.id
              FROM communityUnits scopedCommunityUnit
              WHERE scopedCommunityUnit.facilityId IN (:...scopeFacilityIds)
                AND scopedCommunityUnit.isActive = 1
                AND scopedCommunityUnit.deletedAt IS NULL
            )`,
            {
              scopeFacilityIds: facilityIds,
            },
          );
      }),
    );
  }

  // ==================================================
  // VALIDATE REPORTING LOCATION
  // ==================================================

  /**
   * Confirm that the submitted reporting location belongs
   * to the user's selected organization assignment.
   *
   * This prevents a user from submitting a case against
   * a facility or community unit outside their scope.
   */
  private async validateReportingLocation(
    assignment: UserOrganizationAssignment,
    caseType: CaseType,
    reportingSetting: ReportingSetting,
    facilityId: string | null,
    communityUnitId: string | null,
    manager: EntityManager,
  ): Promise<void> {
    // Near misses can only originate from facilities.
    if (
      caseType === CaseType.NEAR_MISS &&
      reportingSetting !== ReportingSetting.FACILITY
    ) {
      throw new BadRequestException(
        'Near-miss cases can only be reported from a facility.',
      );
    }

    // Community-level users cannot submit facility reports
    // or maternal near-miss reports.
    if (
      assignment.level === OrganizationLevel.COMMUNITY &&
      (reportingSetting !== ReportingSetting.COMMUNITY ||
        caseType === CaseType.NEAR_MISS)
    ) {
      throw new BadRequestException(
        'Your organization assignment does not permit this type of report.',
      );
    }

    if (reportingSetting === ReportingSetting.FACILITY) {
      if (!facilityId || communityUnitId) {
        throw new BadRequestException(
          'Facility reports require facilityId and must not include communityUnitId.',
        );
      }

      const facility = await manager.getRepository(Facility).findOne({
        where: {
          id: facilityId,
          isActive: true,
        },
      });

      if (!facility) {
        throw new BadRequestException(
          'The selected facility does not exist or is inactive.',
        );
      }

      const scopedFacilityIds = await this.getScopedFacilityIds(
        assignment,
        manager,
      );

      if (!scopedFacilityIds.includes(facilityId)) {
        throw new BadRequestException(
          'You are not assigned to report cases from this facility.',
        );
      }

      return;
    }

    if (reportingSetting === ReportingSetting.COMMUNITY) {
      if (!communityUnitId || facilityId) {
        throw new BadRequestException(
          'Community reports require communityUnitId and must not include facilityId.',
        );
      }

      const communityUnit = await manager.getRepository(CommunityUnit).findOne({
        where: {
          id: communityUnitId,
          isActive: true,
        },
        relations: {
          facility: true,
        },
      });

      if (!communityUnit || !communityUnit.facility.isActive) {
        throw new BadRequestException(
          'The selected community unit or its linked facility is inactive or unavailable.',
        );
      }

      // Community assignments are restricted to their exact unit.
      if (assignment.level === OrganizationLevel.COMMUNITY) {
        if (assignment.communityUnitId !== communityUnitId) {
          throw new BadRequestException(
            'You are not assigned to this community unit.',
          );
        }

        return;
      }

      // Other organization levels must have access to the
      // facility linked to the selected community unit.
      const scopedFacilityIds = await this.getScopedFacilityIds(
        assignment,
        manager,
      );

      if (!scopedFacilityIds.includes(communityUnit.facilityId)) {
        throw new BadRequestException(
          'You are not assigned to report cases from this community unit.',
        );
      }

      return;
    }

    throw new BadRequestException('Invalid reporting setting.');
  }

  // ==================================================
  // GENERATE CASE NUMBER
  // ==================================================

  /**
   * Generate a unique MPDSR case number using the
   * Africa/Nairobi calendar date.
   */
  private generateCaseNumber(): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Nairobi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());

    const values = Object.fromEntries(
      parts.map((part) => [part.type, part.value]),
    );

    const date = `${values.year}${values.month}${values.day}`;

    return `MPDSR-${date}-${randomUUID()
      .replace(/-/g, '')
      .slice(0, 12)
      .toUpperCase()}`;
  }

  // ==================================================
  // VALIDATE CLINICAL DETAILS
  // ==================================================

  /**
   * Validate clinical details against the DTO belonging
   * to the selected case type.
   *
   * Unknown fields are rejected to prevent accidental
   * persistence of unsupported clinical information.
   */
  private async validateDetails(
    caseType: CaseType,
    details: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    if (!details || typeof details !== 'object' || Array.isArray(details)) {
      throw new BadRequestException('Clinical details must be a valid object.');
    }

    const dtoClasses: Record<CaseType, new () => object> = {
      [CaseType.MATERNAL]: CreateMaternalCaseDetailDto,
      [CaseType.PERINATAL]: CreatePerinatalCaseDetailDto,
      [CaseType.NEAR_MISS]: CreateNearMissCaseDetailDto,
    };

    const DetailDto = dtoClasses[caseType];

    if (!DetailDto) {
      throw new BadRequestException('Invalid case type.');
    }

    const instance = plainToInstance(DetailDto, details);

    const errors = await validate(instance, {
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
    });

    if (errors.length > 0) {
      const messages = errors.flatMap((error) =>
        Object.values(error.constraints ?? {}),
      );

      throw new BadRequestException({
        message: 'Invalid clinical details.',
        errors: messages,
      });
    }

    // Maternal-specific conditional validation.
    if (caseType === CaseType.MATERNAL) {
      const maternal = instance as unknown as CreateMaternalCaseDetailDto;

      if (
        maternal.deathPeriod === 'POSTPARTUM' &&
        maternal.gestationAtDeath !== undefined
      ) {
        throw new BadRequestException(
          'gestationAtDeath is not applicable to postpartum deaths.',
        );
      }

      if (
        maternal.deathPeriod !== 'POSTPARTUM' &&
        maternal.daysPostpartum !== undefined
      ) {
        throw new BadRequestException(
          'daysPostpartum is only applicable to postpartum deaths.',
        );
      }
    }

    return instance as unknown as Record<string, unknown>;
  }

  // ==================================================
  // CREATE CASE
  // ==================================================

  /**
   * Create a case under the authenticated user's selected
   * organization assignment.
   */
  async createCase(
    dto: CreateCaseDto,
    reportedBy: string,
    assignmentId: string,
  ) {
    if (!reportedBy) {
      throw new BadRequestException('Reporter ID is required.');
    }

    const details = (
      dto as CreateCaseDto & {
        details?: Record<string, unknown>;
      }
    ).details;

    if (!details) {
      throw new BadRequestException('Clinical details are required.');
    }

    // Validate clinical details before starting the transaction.
    const validatedDetails = await this.validateDetails(dto.caseType, details);

    return this.dataSource.transaction(async (manager) => {
      // Verify the authenticated user's selected assignment.
      const assignment = await this.getActiveAssignment(
        reportedBy,
        assignmentId,
        manager,
      );

      // Confirm that the selected location is within the assignment.
      await this.validateReportingLocation(
        assignment,
        dto.caseType,
        dto.reportingSetting,
        dto.facilityId ?? null,
        dto.communityUnitId ?? null,
        manager,
      );

      const caseRepository = manager.getRepository(Case);

      const newCase = caseRepository.create({
        caseNumber: this.generateCaseNumber(),
        caseType: dto.caseType,
        reportingSetting: dto.reportingSetting,
        facilityId: dto.facilityId ?? null,
        communityUnitId: dto.communityUnitId ?? null,
        reportedBy,
        dateOfBirth: dto.dateOfBirth,
        gender: dto.gender,
        notificationDate: dto.notificationDate,
        comments: dto.comments ?? null,
      });

      const savedCase = await caseRepository.save(newCase);

      // Save the clinical detail record belonging to this case type.
      switch (dto.caseType) {
        case CaseType.MATERNAL: {
          const repository = manager.getRepository(MaternalCaseDetail);

          const detail = repository.create({
            ...(validatedDetails as Partial<MaternalCaseDetail>),
            case: savedCase,
          });

          await repository.save(detail);
          break;
        }

        case CaseType.PERINATAL: {
          const repository = manager.getRepository(PerinatalCaseDetail);

          const detail = repository.create({
            ...(validatedDetails as Partial<PerinatalCaseDetail>),
            case: savedCase,
          });

          await repository.save(detail);
          break;
        }

        case CaseType.NEAR_MISS: {
          const repository = manager.getRepository(NearMissDetail);

          const detail = repository.create({
            ...(validatedDetails as Partial<NearMissDetail>),
            case: savedCase,
          });

          await repository.save(detail);
          break;
        }

        default:
          throw new BadRequestException('Invalid case type.');
      }

      // Return the case together with its clinical details.
      return caseRepository.findOne({
        where: {
          id: savedCase.id,
        },
        relations: {
          maternalDetails: true,
          perinatalDetails: true,
          nearMissDetails: true,
        },
      });
    });
  }

  // ==================================================
  // LIST AND SEARCH CASES
  // ==================================================

  /**
   * Return cases visible to the selected assignment.
   *
   * All user-supplied filters are applied in addition to
   * organizational scope. They cannot expand access.
   */
  async findAll(
    query: ListCasesQueryDto,
    userId: string,
    assignmentId: string,
  ) {
    const {
      caseType,
      reportingSetting,
      facilityId,
      communityUnitId,
      reportedBy,
      fromDate,
      toDate,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      page = 1,
      limit = 20,
    } = query;

    // Validate the notification-date filter range.
    if (fromDate && toDate && fromDate > toDate) {
      throw new BadRequestException('fromDate cannot be later than toDate.');
    }

    // Only explicitly approved columns can be used for sorting.
    const sortableColumns: Record<string, string> = {
      createdAt: 'case.createdAt',
      updatedAt: 'case.updatedAt',
      notificationDate: 'case.notificationDate',
      dateOfBirth: 'case.dateOfBirth',
      caseNumber: 'case.caseNumber',
    };

    const sortColumn = sortableColumns[sortBy];

    if (!sortColumn) {
      throw new BadRequestException('Invalid sort column.');
    }

    const safeSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));

    const assignment = await this.getActiveAssignment(userId, assignmentId);

    const queryBuilder = this.dataSource
      .getRepository(Case)
      .createQueryBuilder('case')
      .leftJoinAndSelect('case.maternalDetails', 'maternalDetails')
      .leftJoinAndSelect('case.perinatalDetails', 'perinatalDetails')
      .leftJoinAndSelect('case.nearMissDetails', 'nearMissDetails');

    // Always apply organization scope before client filters.
    await this.applyAssignmentScope(queryBuilder, assignment);

    if (caseType) {
      queryBuilder.andWhere('case.caseType = :caseType', {
        caseType,
      });
    }

    if (reportingSetting) {
      queryBuilder.andWhere('case.reportingSetting = :reportingSetting', {
        reportingSetting,
      });
    }

    if (facilityId) {
      queryBuilder.andWhere('case.facilityId = :facilityId', {
        facilityId,
      });
    }

    if (communityUnitId) {
      queryBuilder.andWhere('case.communityUnitId = :communityUnitId', {
        communityUnitId,
      });
    }

    if (reportedBy) {
      queryBuilder.andWhere('case.reportedBy = :reportedBy', {
        reportedBy,
      });
    }

    if (fromDate) {
      queryBuilder.andWhere('case.notificationDate >= :fromDate', {
        fromDate,
      });
    }

    if (toDate) {
      queryBuilder.andWhere('case.notificationDate <= :toDate', {
        toDate,
      });
    }

    // Search case number, comments and clinical summaries.
    if (search?.trim()) {
      const searchTerm = `%${search.trim()}%`;

      queryBuilder.andWhere(
        `(
          case.caseNumber LIKE :search
          OR case.comments LIKE :search
          OR maternalDetails.clinicalSummary LIKE :search
          OR perinatalDetails.clinicalSummary LIKE :search
          OR nearMissDetails.clinicalSummary LIKE :search
        )`,
        {
          search: searchTerm,
        },
      );
    }

    queryBuilder
      .orderBy(sortColumn, safeSortOrder)
      .addOrderBy('case.id', 'ASC')
      .skip((safePage - 1) * safeLimit)
      .take(safeLimit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  // ==================================================
  // GET ONE CASE
  // ==================================================

  /**
   * Retrieve one case only if it belongs to the
   * authenticated user's organizational scope.
   */
  async findOne(id: string, userId: string, assignmentId: string) {
    const assignment = await this.getActiveAssignment(userId, assignmentId);

    const queryBuilder = this.dataSource
      .getRepository(Case)
      .createQueryBuilder('case')
      .leftJoinAndSelect('case.maternalDetails', 'maternalDetails')
      .leftJoinAndSelect('case.perinatalDetails', 'perinatalDetails')
      .leftJoinAndSelect('case.nearMissDetails', 'nearMissDetails')
      .where('case.id = :caseId', {
        caseId: id,
      });

    await this.applyAssignmentScope(queryBuilder, assignment);

    const caseRecord = await queryBuilder.getOne();

    if (!caseRecord) {
      throw new NotFoundException(`Case with ID ${id} was not found.`);
    }

    return caseRecord;
  }

  // ==================================================
  // UPDATE CASE
  // ==================================================

  /**
   * Update a case only when it is accessible through
   * the authenticated user's selected assignment.
   */
  async updateCase(
    id: string,
    dto: UpdateCaseDto,
    userId: string,
    assignmentId: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const assignment = await this.getActiveAssignment(
        userId,
        assignmentId,
        manager,
      );

      const caseRepository = manager.getRepository(Case);

      // Find the case within the user's scope.
      const queryBuilder = caseRepository
        .createQueryBuilder('case')
        .leftJoinAndSelect('case.maternalDetails', 'maternalDetails')
        .leftJoinAndSelect('case.perinatalDetails', 'perinatalDetails')
        .leftJoinAndSelect('case.nearMissDetails', 'nearMissDetails')
        .where('case.id = :caseId', {
          caseId: id,
        });

      await this.applyAssignmentScope(queryBuilder, assignment, manager);

      const caseRecord = await queryBuilder.getOne();

      if (!caseRecord) {
        throw new NotFoundException(`Case with ID ${id} was not found.`);
      }

      // Case type and reporter identity remain immutable.
      const allowedFields = [
        'reportingSetting',
        'facilityId',
        'communityUnitId',
        'dateOfBirth',
        'gender',
        'notificationDate',
        'comments',
      ] as const;

      for (const field of allowedFields) {
        if (dto[field] !== undefined) {
          Object.assign(caseRecord, {
            [field]: dto[field],
          });
        }
      }

      // Validate the final location, including existing values
      // when the request only changes other case information.
      await this.validateReportingLocation(
        assignment,
        caseRecord.caseType,
        caseRecord.reportingSetting,
        caseRecord.facilityId,
        caseRecord.communityUnitId,
        manager,
      );

      // Update clinical details when supplied.
      const details = (
        dto as UpdateCaseDto & {
          details?: Record<string, unknown>;
        }
      ).details;

      if (details !== undefined) {
        let existingDetails: Record<string, unknown> | null = null;

        switch (caseRecord.caseType) {
          case CaseType.MATERNAL:
            existingDetails = caseRecord.maternalDetails
              ? ({
                  ...caseRecord.maternalDetails,
                } as unknown as Record<string, unknown>)
              : null;
            break;

          case CaseType.PERINATAL:
            existingDetails = caseRecord.perinatalDetails
              ? ({
                  ...caseRecord.perinatalDetails,
                } as unknown as Record<string, unknown>)
              : null;
            break;

          case CaseType.NEAR_MISS:
            existingDetails = caseRecord.nearMissDetails
              ? ({
                  ...caseRecord.nearMissDetails,
                } as unknown as Record<string, unknown>)
              : null;
            break;
        }

        if (!existingDetails) {
          throw new NotFoundException('Clinical detail record was not found.');
        }

        // Merge supplied clinical fields with existing details.
        const mergedDetails = {
          ...existingDetails,
          ...details,
        };

        // Remove fields managed by TypeORM.
        delete mergedDetails.id;
        delete mergedDetails.caseId;
        delete mergedDetails.case;
        delete mergedDetails.createdAt;
        delete mergedDetails.updatedAt;

        const validatedDetails = await this.validateDetails(
          caseRecord.caseType,
          mergedDetails,
        );

        switch (caseRecord.caseType) {
          case CaseType.MATERNAL: {
            const repository = manager.getRepository(MaternalCaseDetail);
            const detail = caseRecord.maternalDetails!;

            Object.assign(detail, validatedDetails);

            await repository.save(detail);
            break;
          }

          case CaseType.PERINATAL: {
            const repository = manager.getRepository(PerinatalCaseDetail);
            const detail = caseRecord.perinatalDetails!;

            Object.assign(detail, validatedDetails);

            await repository.save(detail);
            break;
          }

          case CaseType.NEAR_MISS: {
            const repository = manager.getRepository(NearMissDetail);
            const detail = caseRecord.nearMissDetails!;

            Object.assign(detail, validatedDetails);

            await repository.save(detail);
            break;
          }
        }
      }

      await caseRepository.save(caseRecord);

      // Return the updated case with all its clinical details.
      return caseRepository.findOne({
        where: {
          id,
        },
        relations: {
          maternalDetails: true,
          perinatalDetails: true,
          nearMissDetails: true,
        },
      });
    });
  }

  // ==================================================
  // SOFT DELETE CASE
  // ==================================================

  /**
   * Soft-delete a case only when it is visible to the
   * authenticated user through the selected assignment.
   */
  async softDeleteCase(id: string, userId: string, assignmentId: string) {
    return this.dataSource.transaction(async (manager) => {
      const assignment = await this.getActiveAssignment(
        userId,
        assignmentId,
        manager,
      );

      const queryBuilder = manager
        .getRepository(Case)
        .createQueryBuilder('case')
        .where('case.id = :caseId', {
          caseId: id,
        });

      await this.applyAssignmentScope(queryBuilder, assignment, manager);

      const caseRecord = await queryBuilder.getOne();

      if (!caseRecord) {
        throw new NotFoundException(
          `Case with ID ${id} was not found or has already been deleted.`,
        );
      }

      await manager.getRepository(Case).softDelete(caseRecord.id);

      return {
        message: 'Case successfully soft-deleted.',
        id,
      };
    });
  }
}
