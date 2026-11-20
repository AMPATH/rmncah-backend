import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, In } from 'typeorm';

import { CasesService } from '../cases/cases.service.js';
import { Case } from '../cases/entities/case.entity.js';
import { CaseStatusHistory } from '../cases/entities/case-status-history.entity.js';
import { CaseContributingFactor } from '../cases/entities/case-contributing-factor.entity.js';
import { CaseStatus } from '../cases/enums/case.enum.js';
import { ContributingFactor } from '../contributing-factors/entities/contributing-factor.entity.js';
import { CaseReview } from './entities/case-review.entity.js';
import { UpdateCaseReviewDto } from './dto/update-case-review.dto.js';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly casesService: CasesService,
  ) {}

  async startReview(
    caseId: string,
    userId: string,
    assignmentId: string,
  ) {
    // Reuse the existing assignment-scoped case access check.
    await this.casesService.findOne(caseId, userId, assignmentId);

    return this.dataSource.transaction(async (manager) => {
      const caseRecord = await manager
        .getRepository(Case)
        .createQueryBuilder('case')
        .setLock('pessimistic_write')
        .where('case.id = :caseId', { caseId })
        .getOne();

      if (!caseRecord) {
        throw new NotFoundException(`Case with ID ${caseId} was not found.`);
      }

      if (caseRecord.status !== CaseStatus.NOTIFIED) {
        throw new ConflictException(
          `A review cannot be started while the case is ${caseRecord.status}.`,
        );
      }

      const reviewRepository = manager.getRepository(CaseReview);
      const existingReview = await reviewRepository.findOne({
        where: { caseId },
      });

      if (existingReview) {
        throw new ConflictException(
          'A review record already exists for this case.',
        );
      }

      const review = reviewRepository.create({
        caseId,
        reviewedBy: userId,
        reviewDate: new Date().toISOString().slice(0, 10),
      });

      const savedReview = await reviewRepository.save(review);

      const previousStatus = caseRecord.status;
      caseRecord.status = CaseStatus.UNDER_REVIEW;
      await manager.getRepository(Case).save(caseRecord);

      await manager.getRepository(CaseStatusHistory).save(
        manager.getRepository(CaseStatusHistory).create({
          caseId,
          fromStatus: previousStatus,
          toStatus: CaseStatus.UNDER_REVIEW,
          changedBy: userId,
          reason: 'Facility MPDSR case review started.',
          remarks: null,
        }),
      );

      return savedReview;
    });
  }

  async findOne(
    caseId: string,
    userId: string,
    assignmentId: string,
  ) {
    const caseRecord = await this.casesService.findOne(
      caseId,
      userId,
      assignmentId,
    );

    const review = await this.dataSource
      .getRepository(CaseReview)
      .findOne({
        where: { caseId },
        relations: {
          reviewer: true,
        },
      });

    if (!review) {
      throw new NotFoundException(
        `No review has been started for case ${caseId}.`,
      );
    }

    const contributingFactors = await this.dataSource
      .getRepository(CaseContributingFactor)
      .find({
        where: { caseId },
        relations: {
          contributingFactor: true,
          reviewer: true,
        },
        order: {
          createdAt: 'ASC',
        },
      });

    return {
      review,
      case: caseRecord,
      contributingFactors,
    };
  }

  async update(
    caseId: string,
    dto: UpdateCaseReviewDto,
    userId: string,
    assignmentId: string,
  ) {
    // Enforce the same organization-assignment scope as case access.
    await this.casesService.findOne(caseId, userId, assignmentId);

    if (!Array.isArray(dto.contributingFactorIds)) {
      throw new BadRequestException(
        'contributingFactorIds must be an array.',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const caseRecord = await manager
        .getRepository(Case)
        .createQueryBuilder('case')
        .setLock('pessimistic_write')
        .where('case.id = :caseId', { caseId })
        .getOne();

      if (!caseRecord) {
        throw new NotFoundException(`Case with ID ${caseId} was not found.`);
      }

      if (caseRecord.status !== CaseStatus.UNDER_REVIEW) {
        throw new ConflictException(
          'Contributing factors can only be updated while the case is under review.',
        );
      }

      const review = await manager.getRepository(CaseReview).findOne({
        where: { caseId },
      });

      if (!review) {
        throw new NotFoundException(
          `No review has been started for case ${caseId}.`,
        );
      }

      const requestedIds = [...new Set(dto.contributingFactorIds)];

      const activeFactors = requestedIds.length
        ? await manager.getRepository(ContributingFactor).find({
            where: {
              id: In(requestedIds),
              isActive: true,
            },
          })
        : [];

      if (activeFactors.length !== requestedIds.length) {
        throw new BadRequestException(
          'One or more selected contributing factors are invalid or inactive.',
        );
      }

      const factorRepository = manager.getRepository(CaseContributingFactor);
      const existingRows = await factorRepository.find({
        where: { caseId },
      });

      const selectedIds = new Set(requestedIds);
      const existingByFactorId = new Map(
        existingRows.map((row) => [row.contributingFactorId, row]),
      );

      const reviewedAt = new Date();
      const rowsToSave: CaseContributingFactor[] = [];

      for (const row of existingRows) {
        row.reviewerSelected = selectedIds.has(row.contributingFactorId);
        row.reviewedBy = userId;
        row.reviewedAt = reviewedAt;

        if (dto.reviewerNotes !== undefined) {
          row.reviewerNotes = dto.reviewerNotes;
        }

        rowsToSave.push(row);
      }

      for (const factorId of requestedIds) {
        if (existingByFactorId.has(factorId)) {
          continue;
        }

        rowsToSave.push(
          factorRepository.create({
            caseId,
            contributingFactorId: factorId,
            reporterSelected: false,
            reviewerSelected: true,
            reviewedBy: userId,
            reviewedAt,
            reviewerNotes: dto.reviewerNotes ?? null,
          }),
        );
      }

      if (rowsToSave.length) {
        await factorRepository.save(rowsToSave);
      }

      return factorRepository.find({
        where: { caseId },
        relations: {
          contributingFactor: true,
          reviewer: true,
        },
        order: {
          createdAt: 'ASC',
        },
      });
    });
  }

  async finalize(
    caseId: string,
    userId: string,
    assignmentId: string,
  ) {
    await this.casesService.findOne(caseId, userId, assignmentId);

    return this.dataSource.transaction(async (manager) => {
      const caseRecord = await manager
        .getRepository(Case)
        .createQueryBuilder('case')
        .setLock('pessimistic_write')
        .where('case.id = :caseId', { caseId })
        .getOne();

      if (!caseRecord) {
        throw new NotFoundException(`Case with ID ${caseId} was not found.`);
      }

      if (caseRecord.status !== CaseStatus.UNDER_REVIEW) {
        throw new ConflictException(
          'Only a case under review can be finalized.',
        );
      }

      const review = await manager.getRepository(CaseReview).findOne({
        where: { caseId },
      });

      if (!review) {
        throw new NotFoundException(
          `No review has been started for case ${caseId}.`,
        );
      }

      const previousStatus = caseRecord.status;
      caseRecord.status = CaseStatus.REVIEW_COMPLETED;
      await manager.getRepository(Case).save(caseRecord);

      await manager.getRepository(CaseStatusHistory).save(
        manager.getRepository(CaseStatusHistory).create({
          caseId,
          fromStatus: previousStatus,
          toStatus: CaseStatus.REVIEW_COMPLETED,
          changedBy: userId,
          reason: 'Facility MPDSR case review finalized.',
          remarks: null,
        }),
      );

      return review;
    });
  }
}
