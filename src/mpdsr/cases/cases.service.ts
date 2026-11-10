import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DataSource } from 'typeorm';

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

@Injectable()
export class CasesService {
  constructor(private readonly dataSource: DataSource) {}

  // --------------------------------------------------
  // GENERATE CASE NUMBER
  // --------------------------------------------------

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

  // --------------------------------------------------
  // VALIDATE CLINICAL DETAILS
  // --------------------------------------------------

  private async validateDetails(
    caseType: CaseType,
    details: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    if (!details || typeof details !== 'object' || Array.isArray(details)) {
      throw new BadRequestException('Clinical details must be a valid object.');
    }

    // Explicit constructor type supports all three DTO classes.
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

    // Validate maternal-specific conditional fields.
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

  // --------------------------------------------------
  // CREATE CASE
  // --------------------------------------------------

  async createCase(dto: CreateCaseDto, reportedBy: string) {
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

    const validatedDetails = await this.validateDetails(dto.caseType, details);

    return this.dataSource.transaction(async (manager) => {
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

      return caseRepository.findOne({
        where: { id: savedCase.id },
        relations: {
          maternalDetails: true,
          perinatalDetails: true,
          nearMissDetails: true,
        },
      });
    });
  }

  // --------------------------------------------------
  // LIST AND SEARCH CASES
  // --------------------------------------------------

  async findAll(query: ListCasesQueryDto) {
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

    // Validate date range.
    if (fromDate && toDate && fromDate > toDate) {
      throw new BadRequestException('fromDate cannot be later than toDate.');
    }

    // Explicitly whitelist sortable columns.
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

    const queryBuilder = this.dataSource
      .getRepository(Case)
      .createQueryBuilder('case')
      .leftJoinAndSelect('case.maternalDetails', 'maternalDetails')
      .leftJoinAndSelect('case.perinatalDetails', 'perinatalDetails')
      .leftJoinAndSelect('case.nearMissDetails', 'nearMissDetails');

    //  exclude soft-deleted records

    if (caseType) {
      queryBuilder.andWhere('case.caseType = :caseType', { caseType });
    }

    if (reportingSetting) {
      queryBuilder.andWhere('case.reportingSetting = :reportingSetting', {
        reportingSetting,
      });
    }

    if (facilityId) {
      queryBuilder.andWhere('case.facilityId = :facilityId', { facilityId });
    }

    if (communityUnitId) {
      queryBuilder.andWhere('case.communityUnitId = :communityUnitId', {
        communityUnitId,
      });
    }

    if (reportedBy) {
      queryBuilder.andWhere('case.reportedBy = :reportedBy', { reportedBy });
    }

    if (fromDate) {
      queryBuilder.andWhere('case.notificationDate >= :fromDate', { fromDate });
    }

    if (toDate) {
      queryBuilder.andWhere('case.notificationDate <= :toDate', { toDate });
    }

    // Search across case number, comments and all clinical summaries.
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
        { search: searchTerm },
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

  // --------------------------------------------------
  // GET ONE CASE
  // --------------------------------------------------

  async findOne(id: string) {
    const caseRecord = await this.dataSource.getRepository(Case).findOne({
      where: { id },
      relations: {
        maternalDetails: true,
        perinatalDetails: true,
        nearMissDetails: true,
      },
    });

    if (!caseRecord) {
      throw new NotFoundException(`Case with ID ${id} was not found.`);
    }

    return caseRecord;
  }

  // --------------------------------------------------
  // UPDATE CASE
  // --------------------------------------------------

  async updateCase(id: string, dto: UpdateCaseDto) {
    return this.dataSource.transaction(async (manager) => {
      const caseRepository = manager.getRepository(Case);

      const caseRecord = await caseRepository.findOne({
        where: { id },
        relations: {
          maternalDetails: true,
          perinatalDetails: true,
          nearMissDetails: true,
        },
      });

      if (!caseRecord) {
        throw new NotFoundException(`Case with ID ${id} was not found.`);
      }

      // Case type and reporter identity are immutable.
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

      // Validate reporting location consistency.
      if (
        caseRecord.caseType === CaseType.NEAR_MISS &&
        caseRecord.reportingSetting !== ReportingSetting.FACILITY
      ) {
        throw new BadRequestException(
          'Near-miss cases can only be reported from a facility.',
        );
      }

      if (
        caseRecord.reportingSetting === ReportingSetting.FACILITY &&
        (!caseRecord.facilityId || caseRecord.communityUnitId)
      ) {
        throw new BadRequestException(
          'Facility reports require facilityId and must not include communityUnitId.',
        );
      }

      if (
        caseRecord.reportingSetting === ReportingSetting.COMMUNITY &&
        (!caseRecord.communityUnitId || caseRecord.facilityId)
      ) {
        throw new BadRequestException(
          'Community reports require communityUnitId and must not include facilityId.',
        );
      }

      // Update clinical details if supplied.
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

        const mergedDetails = {
          ...existingDetails,
          ...details,
        };

        // Remove entity-managed properties.
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

      return caseRepository.findOne({
        where: { id },
        relations: {
          maternalDetails: true,
          perinatalDetails: true,
          nearMissDetails: true,
        },
      });
    });
  }

  // --------------------------------------------------
  // SOFT DELETE CASE
  // --------------------------------------------------

  async softDeleteCase(id: string) {
    const result = await this.dataSource.getRepository(Case).softDelete(id);

    if (!result.affected) {
      throw new NotFoundException(
        `Case with ID ${id} was not found or has already been deleted.`,
      );
    }

    return {
      message: 'Case successfully soft-deleted.',
      id,
    };
  }
}
