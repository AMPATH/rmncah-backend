import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  Brackets,
  DataSource,
  EntityManager,
  IsNull,
  In,
  SelectQueryBuilder,
} from 'typeorm';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { Case } from './entities/case.entity.js';
import { CaseContributingFactor } from './entities/case-contributing-factor.entity.js';
import { ContributingFactor } from '../contributing-factors/entities/contributing-factor.entity.js';
import { MaternalCaseDetail } from './entities/maternal-case-detail.entity.js';
import { PerinatalCaseDetail } from './entities/perinatal-case-detail.entity.js';
import { NearMissDetail } from './entities/near-miss-detail.entity.js';

import { CaseType, ReportingSetting, Gender } from './enums/case.enum.js';

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
import { Icd11CauseType, Icd11CauseCaseType } from '../causes-of-death/entities/icd11-cause-type.entity.js';

type ClinicalDetails = Record<string, unknown>;

@Injectable()
export class CasesService {
  constructor(private readonly dataSource: DataSource) {}

  // DATE HELPERS

  /**
   * Normalizes a Date or an ISO string to a strict YYYY-MM-DD string.
   * Returns undefined when the value is not a valid date-only value, so
   * string comparison of the results is always chronologically correct.
   */
  private normalizeDate(value: unknown): string | undefined {
    if (value instanceof Date) {
      return Number.isNaN(value.getTime())
        ? undefined
        : value.toISOString().slice(0, 10);
    }

    if (typeof value === 'string') {
      const datePart = value.slice(0, 10);
      return /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : undefined;
    }

    return undefined;
  }

  private requireDate(value: unknown, fieldName: string): string {
    const normalized = this.normalizeDate(value);

    if (!normalized) {
      throw new BadRequestException(
        `${fieldName} must be a valid date in YYYY-MM-DD format.`,
      );
    }

    return normalized;
  }

  // DATE VALIDATION
  private validateCaseDates(
    caseType: CaseType,
    rawDateOfBirth: unknown,
    rawNotificationDate: unknown,
    details: ClinicalDetails,
  ): void {
    const dateOfBirth = this.requireDate(rawDateOfBirth, 'dateOfBirth');
    const notificationDate = this.requireDate(
      rawNotificationDate,
      'notificationDate',
    );

    if (dateOfBirth > notificationDate) {
      throw new BadRequestException(
        'notificationDate cannot be earlier than dateOfBirth.',
      );
    }

    switch (caseType) {
      case CaseType.MATERNAL:
      case CaseType.PERINATAL: {
        if (details.dateOfDeath === undefined || details.dateOfDeath === null) {
          throw new BadRequestException(
            'dateOfDeath is required for this case type.',
          );
        }

        const dateOfDeath = this.requireDate(
          details.dateOfDeath,
          'dateOfDeath',
        );

        if (dateOfDeath < dateOfBirth) {
          throw new BadRequestException(
            'dateOfDeath cannot be earlier than dateOfBirth.',
          );
        }

        if (dateOfDeath > notificationDate) {
          throw new BadRequestException(
            'notificationDate cannot be earlier than dateOfDeath.',
          );
        }

        return;
      }

      case CaseType.NEAR_MISS: {
        if (
          details.dateOfComplication === undefined ||
          details.dateOfComplication === null ||
          details.dateOfAdmission === undefined ||
          details.dateOfAdmission === null
        ) {
          throw new BadRequestException(
            'dateOfComplication and dateOfAdmission are required for near-miss cases.',
          );
        }

        const dateOfComplication = this.requireDate(
          details.dateOfComplication,
          'dateOfComplication',
        );
        const dateOfAdmission = this.requireDate(
          details.dateOfAdmission,
          'dateOfAdmission',
        );

        if (dateOfComplication < dateOfBirth) {
          throw new BadRequestException(
            'dateOfComplication cannot be earlier than dateOfBirth.',
          );
        }

        if (dateOfAdmission < dateOfComplication) {
          throw new BadRequestException(
            'dateOfAdmission cannot be earlier than dateOfComplication.',
          );
        }

        if (dateOfComplication > notificationDate) {
          throw new BadRequestException(
            'notificationDate cannot be earlier than dateOfComplication.',
          );
        }

        if (dateOfAdmission > notificationDate) {
          throw new BadRequestException(
            'notificationDate cannot be earlier than dateOfAdmission.',
          );
        }

        if (
          details.dateOfDischarge !== undefined &&
          details.dateOfDischarge !== null
        ) {
          const dateOfDischarge = this.requireDate(
            details.dateOfDischarge,
            'dateOfDischarge',
          );

          if (dateOfDischarge < dateOfAdmission) {
            throw new BadRequestException(
              'dateOfDischarge cannot be earlier than dateOfAdmission.',
            );
          }
        }

        return;
      }

      default:
        throw new BadRequestException('Invalid case type.');
    }
  }

  // ORGANIZATION ASSIGNMENT

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

  // ORGANIZATIONAL FACILITY SCOPE

  private async getScopedFacilityIds(
    assignment: UserOrganizationAssignment,
    manager: EntityManager = this.dataSource.manager,
  ): Promise<string[]> {
    const facilityRepository = manager.getRepository(Facility);

    switch (assignment.level) {
      case OrganizationLevel.COMMUNITY:
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

        return memberships.map((item) => item.facilityId);
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

        return facilities.map((item) => item.facilityId);
      }

      default:
        throw new BadRequestException('Unsupported organization level.');
    }
  }

  // APPLY ORGANIZATIONAL CASE SCOPE
  // Community assignments see only their assigned community unit.

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

    if (facilityIds.length === 0) {
      queryBuilder.andWhere('1 = 0');
      return;
    }

    // Community cases are scoped using the facility responsible when
    // the case was reported, not the Community Unit's current facility.
    queryBuilder.andWhere(
      new Brackets((scope) => {
        scope
          .where('case.facilityId IN (:...scopeFacilityIds)')
          .orWhere('case.responsibleFacilityId IN (:...scopeFacilityIds)');
      }),
    );

    queryBuilder.setParameter('scopeFacilityIds', facilityIds);
  }

  // VALIDATE REPORTING LOCATION

  private async validateReportingLocation(
    assignment: UserOrganizationAssignment,
    caseType: CaseType,
    reportingSetting: ReportingSetting,
    facilityId: string | null,
    communityUnitId: string | null,
    manager: EntityManager,
  ): Promise<Facility> {
    if (
      caseType === CaseType.NEAR_MISS &&
      reportingSetting !== ReportingSetting.FACILITY
    ) {
      throw new BadRequestException(
        'Near-miss cases can only be reported from a facility.',
      );
    }

    if (
      assignment.level === OrganizationLevel.COMMUNITY &&
      (reportingSetting !== ReportingSetting.COMMUNITY ||
        caseType === CaseType.NEAR_MISS)
    ) {
      throw new ForbiddenException(
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
        lock: {
          mode: 'pessimistic_write',
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
        throw new ForbiddenException(
          'You are not assigned to report cases from this facility.',
        );
      }

      return facility;
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
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!communityUnit) {
        throw new BadRequestException(
          'The selected community unit is inactive or unavailable.',
        );
      }

      const facility = await manager.getRepository(Facility).findOne({
        where: {
          id: communityUnit.facilityId,
          isActive: true,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!facility) {
        throw new BadRequestException(
          'The community unit linked facility is inactive or unavailable.',
        );
      }

      if (assignment.level === OrganizationLevel.COMMUNITY) {
        if (assignment.communityUnitId !== communityUnitId) {
          throw new ForbiddenException(
            'You are not assigned to this community unit.',
          );
        }

        return facility;
      }

      const scopedFacilityIds = await this.getScopedFacilityIds(
        assignment,
        manager,
      );

      if (!scopedFacilityIds.includes(communityUnit.facilityId)) {
        throw new ForbiddenException(
          'You are not assigned to report cases from this community unit.',
        );
      }

      return facility;
    }

    throw new BadRequestException('Invalid reporting setting.');
  }

  // GENERATE CASE NUMBER

  private getNairobiYear(): string {
    return new Intl.DateTimeFormat('en', {
      timeZone: 'Africa/Nairobi',
      year: 'numeric',
    }).format(new Date());
  }

  /**
   * The caller must hold a pessimistic write lock on this facility row.
   * This serializes sequence allocation for this facility and year.
   */
  private async generateCaseNumber(
    manager: EntityManager,
    facility: Facility,
  ): Promise<string> {
    const year = this.getNairobiYear();
    const prefix = `MPDSR-${facility.mflCode}-${year}-`;

    const latest = await manager
      .getRepository(Case)
      .createQueryBuilder('case')
      .withDeleted()
      .select(
        "MAX(CAST(SUBSTRING_INDEX(case.caseNumber, '-', -1) AS UNSIGNED))",
        'maxSequence',
      )
      .where('case.caseNumber LIKE :prefix', {
        prefix: `${prefix}%`,
      })
      .getRawOne<{ maxSequence: string | null }>();

    const nextSequence = Number(latest?.maxSequence ?? 0) + 1;

    return `${prefix}${String(nextSequence).padStart(6, '0')}`;
  }

  // VALIDATE PROVISIONAL ICD-11 CAUSE

  private async validateProvisionalCause(
    caseType: CaseType,
    details: ClinicalDetails,
    manager: EntityManager,
  ): Promise<void> {
    if (caseType === CaseType.NEAR_MISS) {
      return;
    }

    const provisionalCauseId = details.provisionalCauseId;

    if (typeof provisionalCauseId !== 'string') {
      throw new BadRequestException('A provisional ICD-11 cause is required.');
    }

    const expectedCauseType =
      caseType === CaseType.MATERNAL
        ? Icd11CauseCaseType.MATERNAL
        : Icd11CauseCaseType.PERINATAL;

    const causeType = await manager
      .getRepository(Icd11CauseType)
      .findOne({
        where: {
          causeId: provisionalCauseId,
          caseType: expectedCauseType,
        },
      });

    if (!causeType) {
      throw new BadRequestException(
        `The selected provisional cause does not exist or is not classified for ${caseType.toLowerCase()} cases.`,
      );
    }
  }

  // Reuse the case-specific ICD-11 validation during facility review.
  async validateCauseForReview(
    caseType: CaseType,
    causeId: string,
    manager: EntityManager,
  ): Promise<void> {
    await this.validateProvisionalCause(
      caseType,
      { provisionalCauseId: causeId },
      manager,
    );
  }

  // SEARCH HELPERS

  private escapeLike(term: string): string {
    return term.replace(/[!%_]/g, (char) => `!${char}`);
  }

  // CLINICAL DETAIL HELPERS

  private stripUndefined(value: ClinicalDetails): ClinicalDetails {
    return Object.fromEntries(
      Object.entries(value).filter(([, item]) => item !== undefined),
    );
  }

  // VALIDATE CLINICAL DETAILS

  private async validateDetails(
    caseType: CaseType,
    details: ClinicalDetails,
  ): Promise<ClinicalDetails> {
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

    if (caseType === CaseType.MATERNAL) {
      const maternal = instance as CreateMaternalCaseDetailDto;

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

    // Plain object without undefined keys, so a later Object.assign can
    // never overwrite a stored column with undefined.
    return this.stripUndefined({ ...(instance as ClinicalDetails) });
  }

  private getExistingDetails(caseRecord: Case): ClinicalDetails {
    let details: ClinicalDetails | null = null;

    switch (caseRecord.caseType) {
      case CaseType.MATERNAL:
        details = caseRecord.maternalDetails
          ? { ...caseRecord.maternalDetails }
          : null;
        break;

      case CaseType.PERINATAL:
        details = caseRecord.perinatalDetails
          ? { ...caseRecord.perinatalDetails }
          : null;
        break;

      case CaseType.NEAR_MISS:
        details = caseRecord.nearMissDetails
          ? { ...caseRecord.nearMissDetails }
          : null;
        break;

      default:
        throw new BadRequestException('Invalid case type.');
    }

    if (!details) {
      throw new NotFoundException('Clinical detail record was not found.');
    }

    // Persistence-only fields that are not part of the input DTOs.
    delete details.id;
    delete details.caseId;
    delete details.case;
    delete details.createdAt;
    delete details.updatedAt;
    delete details.deletedAt;

    const cleaned: ClinicalDetails = {};

    for (const [key, value] of Object.entries(details)) {
      // Null columns are treated as "not provided" so optional validators
      // accept the merged object.
      if (value === null || value === undefined) {
        continue;
      }

      // Date columns may be hydrated as Date objects; the DTOs expect
      // YYYY-MM-DD strings.
      if (value instanceof Date && key.startsWith('date')) {
        cleaned[key] = value.toISOString().slice(0, 10);
        continue;
      }

      cleaned[key] = value;
    }

    return cleaned;
  }

  // Persist validated clinical details to the matching detail table.

  private async saveClinicalDetails(
    caseRecord: Case,
    details: ClinicalDetails,
    manager: EntityManager,
  ): Promise<void> {
    const definedDetails = this.stripUndefined(details);

    switch (caseRecord.caseType) {
      case CaseType.MATERNAL: {
        const repository = manager.getRepository(MaternalCaseDetail);
        const detail = caseRecord.maternalDetails!;

        Object.assign(detail, definedDetails);
        await repository.save(detail);
        return;
      }

      case CaseType.PERINATAL: {
        const repository = manager.getRepository(PerinatalCaseDetail);
        const detail = caseRecord.perinatalDetails!;

        Object.assign(detail, definedDetails);
        await repository.save(detail);
        return;
      }

      case CaseType.NEAR_MISS: {
        const repository = manager.getRepository(NearMissDetail);
        const detail = caseRecord.nearMissDetails!;

        Object.assign(detail, definedDetails);
        await repository.save(detail);
        return;
      }

      default:
        throw new BadRequestException('Invalid case type.');
    }
  }

  // CREATE CASE

  private async saveReporterContributingFactors(
    caseId: string,
    contributingFactorIds: string[],
    manager: EntityManager,
  ): Promise<void> {
    const requestedIds = [...new Set(contributingFactorIds)];

    const factorRepository = manager.getRepository(ContributingFactor);
    const activeFactors = requestedIds.length
      ? await factorRepository.find({
          where: {
            id: In(requestedIds),
            isActive: true,
          },
        })
      : [];

    if (activeFactors.length !== requestedIds.length) {
      throw new BadRequestException(
        'One or more contributing factors are invalid or inactive.',
      );
    }

    const selectionRepository = manager.getRepository(CaseContributingFactor);
    const existingRows = await selectionRepository.find({
      where: { caseId },
    });

    const selectedIds = new Set(requestedIds);
    const existingByFactorId = new Map(
      existingRows.map((row) => [row.contributingFactorId, row]),
    );

    const rowsToSave: CaseContributingFactor[] = [];

    for (const row of existingRows) {
      const selected = selectedIds.has(row.contributingFactorId);

      row.reporterSelected = selected;
      row.reviewerSelected = selected;

      rowsToSave.push(row);
    }

    for (const factorId of requestedIds) {
      if (existingByFactorId.has(factorId)) {
        continue;
      }

      rowsToSave.push(
        selectionRepository.create({
          caseId,
          contributingFactorId: factorId,
          reporterSelected: true,
          reviewerSelected: true,
          reviewedBy: null,
          reviewedAt: null,
          reviewerNotes: null,
        }),
      );
    }

    if (rowsToSave.length) {
      await selectionRepository.save(rowsToSave);
    }
  }

  async createCase(
    dto: CreateCaseDto,
    reportedBy: string,
    assignmentId: string,
  ) {
    if (!reportedBy) {
      throw new BadRequestException('Reporter ID is required.');
    }

    const validatedDetails = await this.validateDetails(
      dto.caseType,
      dto.details,
    );

    this.validateCaseDates(
      dto.caseType,
      dto.dateOfBirth,
      dto.notificationDate,
      validatedDetails,
    );

    return this.dataSource.transaction(async (manager) => {
      const assignment = await this.getActiveAssignment(
        reportedBy,
        assignmentId,
        manager,
      );

      const reportingFacility = await this.validateReportingLocation(
        assignment,
        dto.caseType,
        dto.reportingSetting,
        dto.facilityId ?? null,
        dto.communityUnitId ?? null,
        manager,
      );

      await this.validateProvisionalCause(
        dto.caseType,
        validatedDetails,
        manager,
      );

      const caseRepository = manager.getRepository(Case);

      const newCase = caseRepository.create({
        caseNumber: await this.generateCaseNumber(manager, reportingFacility),
        caseType: dto.caseType,
        reportingSetting: dto.reportingSetting,
        facilityId: dto.facilityId ?? null,
        communityUnitId: dto.communityUnitId ?? null,
        responsibleFacilityId:
          dto.reportingSetting === ReportingSetting.COMMUNITY
            ? reportingFacility.id
            : null,
        reportedBy,
        dateOfBirth: dto.dateOfBirth,
        gender:
          dto.caseType === CaseType.PERINATAL
            ? dto.gender!
            : Gender.FEMALE,
        notificationDate: dto.notificationDate,
        comments: dto.comments ?? null,
      });

      const savedCase = await caseRepository.save(newCase);

      if (dto.contributingFactorIds !== undefined) {
        await this.saveReporterContributingFactors(
          savedCase.id,
          dto.contributingFactorIds,
          manager,
        );
      }

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

      return caseRepository.findOneOrFail({
        where: {
          id: savedCase.id,
        },
        relations: {
          maternalDetails: true,
          perinatalDetails: true,
          nearMissDetails: true,
          contributingFactors: {
            contributingFactor: true,
          },
        },
      });
    });
  }

  // LIST AND SEARCH CASES

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

    if (fromDate && toDate && fromDate > toDate) {
      throw new BadRequestException('fromDate cannot be later than toDate.');
    }

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

    if (sortOrder !== 'ASC' && sortOrder !== 'DESC') {
      throw new BadRequestException('Invalid sort order.');
    }

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));

    const assignment = await this.getActiveAssignment(userId, assignmentId);

    const queryBuilder = this.dataSource
      .getRepository(Case)
      .createQueryBuilder('case')
      .leftJoinAndSelect('case.maternalDetails', 'maternalDetails')
      .leftJoinAndSelect('case.perinatalDetails', 'perinatalDetails')
      .leftJoinAndSelect('case.nearMissDetails', 'nearMissDetails');

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

    if (search?.trim()) {
      // Case-insensitive on every database, with wildcards matched literally.
      const searchTerm = `%${this.escapeLike(search.trim().toLowerCase())}%`;

      queryBuilder.andWhere(
        `(
          LOWER(case.caseNumber) LIKE :search ESCAPE '!'
          OR LOWER(case.comments) LIKE :search ESCAPE '!'
          OR LOWER(nearMissDetails.clinicalSummary) LIKE :search ESCAPE '!'
        )`,
        {
          search: searchTerm,
        },
      );
    }

    queryBuilder
      .orderBy(sortColumn, sortOrder)
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

  // GET ONE CASE

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

  // UPDATE CASE

  async updateCase(
    id: string,
    dto: UpdateCaseDto,
    userId: string,
    assignmentId: string,
  ) {
    if (dto.details === null) {
      throw new BadRequestException('details cannot be null.');
    }

    return this.dataSource.transaction(async (manager) => {
      const assignment = await this.getActiveAssignment(
        userId,
        assignmentId,
        manager,
      );

      const caseRepository = manager.getRepository(Case);

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

      // Reporting location, case type, case number and reporter identity
      // are immutable after case creation.
      const nonNullableFields = [
        'dateOfBirth',
        'notificationDate',
      ] as const;

      for (const field of nonNullableFields) {
        if (dto[field] === null) {
          throw new BadRequestException(`${field} cannot be null.`);
        }
      }

      const allowedFields = [
        'dateOfBirth',
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

      if (dto.contributingFactorIds !== undefined) {
        if (caseRecord.status !== 'NOTIFIED') {
          throw new BadRequestException(
            'Reporter contributing factors can only be changed before review starts.',
          );
        }

        await this.saveReporterContributingFactors(
          caseRecord.id,
          dto.contributingFactorIds,
          manager,
        );
      }

      const detailsChanged = dto.details !== undefined;
      const datesChanged =
        dto.dateOfBirth !== undefined || dto.notificationDate !== undefined;

      let finalDetails = this.getExistingDetails(caseRecord);

      // Validate details only when the request supplied them, so legacy
      // records can still receive unrelated edits.
      if (detailsChanged) {
        finalDetails = await this.validateDetails(caseRecord.caseType, {
          ...finalDetails,
          ...(dto.details ?? {}),
        });

        await this.validateProvisionalCause(
          caseRecord.caseType,
          finalDetails,
          manager,
        );
      }

      if (detailsChanged || datesChanged) {
        this.validateCaseDates(
          caseRecord.caseType,
          caseRecord.dateOfBirth,
          caseRecord.notificationDate,
          finalDetails,
        );
      }

      if (detailsChanged) {
        await this.saveClinicalDetails(caseRecord, finalDetails, manager);
      }

      await caseRepository.save(caseRecord);

      return caseRepository.findOneOrFail({
        where: {
          id,
        },
        relations: {
          maternalDetails: true,
          perinatalDetails: true,
          nearMissDetails: true,
          contributingFactors: {
            contributingFactor: true,
          },
        },
      });
    });
  }

  // SOFT DELETE CASE
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
