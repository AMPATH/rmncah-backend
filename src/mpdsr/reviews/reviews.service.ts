import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { CasesService } from '../cases/cases.service.js';
import { Case } from '../cases/entities/case.entity.js';
import { CaseStatusHistory } from '../cases/entities/case-status-history.entity.js';
import { CaseContributingFactor } from '../cases/entities/case-contributing-factor.entity.js';
import { ContributingFactor } from '../contributing-factors/entities/contributing-factor.entity.js';
import { MaternalCaseDetail } from '../cases/entities/maternal-case-detail.entity.js';
import { PerinatalCaseDetail } from '../cases/entities/perinatal-case-detail.entity.js';
import { CaseStatus, CaseType } from '../cases/enums/case.enum.js';
import { CaseRecommendation } from '../recommendations/entities/case-recommendation.entity.js';
import {
  CaseRecommendationReviewStatus,
  CaseRecommendationSource,
} from '../recommendations/enums/case-recommendation.enum.js';
import {
  CaseContributingFactorReviewAction,
  CaseContributingFactorReviewStatus,
  CaseContributingFactorSource,
} from '../cases/enums/case-contributing-factor.enum.js';
import { CaseReview } from './entities/case-review.entity.js';
import { CaseReviewChange } from './entities/case-review-change.entity.js';
import {
  CaseReviewChangeAction,
  CaseReviewChangeItemType,
} from './enums/case-review-change.enum.js';
import { ReviewCaseCauseDto } from './dto/review-case-cause.dto.js';
import { ReviewCaseContributingFactorDto } from './dto/review-case-contributing-factor.dto.js';
import {
  CaseRecommendationReviewAction,
  ReviewCaseRecommendationDto,
} from './dto/review-case-recommendation.dto.js';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly casesService: CasesService,
  ) {}

  async startReview(caseId: string, userId: string, assignmentId: string) {
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

  async findOne(caseId: string, userId: string, assignmentId: string) {
    const caseRecord = await this.casesService.findOne(
      caseId,
      userId,
      assignmentId,
    );

    const review = await this.dataSource.getRepository(CaseReview).findOne({
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

    // Return every factor so the Chair can see reporter selections,
    // deselections, Chair additions, and review decisions.
    const contributingFactors = await this.dataSource
      .getRepository(CaseContributingFactor)
      .find({
        where: { caseId },
        relations: {
          contributingFactor: true,
        },
        order: {
          createdAt: 'ASC',
        },
      });

    // Recommendations are retrieved independently of factor selection/status.
    // This preserves visibility of recommendations linked to removed factors.
    const recommendations = await this.dataSource
      .getRepository(CaseRecommendation)
      .find({
        where: { caseId },
        relations: {
          caseContributingFactor: {
            contributingFactor: true,
          },
        },
        order: {
          createdAt: 'ASC',
        },
      });

    return {
      review,
      case: caseRecord,
      contributingFactors,
      recommendations,
    };
  }

  async reviewContributingFactor(
    caseId: string,
    dto: ReviewCaseContributingFactorDto,
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
          'Contributing factors can only be reviewed while the case is under review.',
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

      const isAdd = dto.action === CaseContributingFactorReviewAction.ADD;

      if (
        (isAdd &&
          (!dto.contributingFactorId || dto.caseContributingFactorId)) ||
        (!isAdd && (!dto.caseContributingFactorId || dto.contributingFactorId))
      ) {
        throw new BadRequestException(
          isAdd
            ? 'ADD requires contributingFactorId only.'
            : 'CONFIRM and REMOVE require caseContributingFactorId only.',
        );
      }

      const factorRepository = manager.getRepository(CaseContributingFactor);
      let caseFactor: CaseContributingFactor;
      let action: CaseReviewChangeAction;
      let previousValue: Record<string, unknown> | null;

      if (isAdd) {
        const catalogueFactor = await manager
          .getRepository(ContributingFactor)
          .findOne({
            where: { id: dto.contributingFactorId!, isActive: true },
          });

        if (!catalogueFactor) {
          throw new NotFoundException(
            'The selected contributing factor was not found or is inactive.',
          );
        }

        const existing = await factorRepository.findOne({
          where: {
            caseId,
            contributingFactorId: catalogueFactor.id,
          },
          relations: { contributingFactor: true },
        });

        if (existing) {
          if (
            existing.reviewStatus !== CaseContributingFactorReviewStatus.REMOVED
          ) {
            throw new ConflictException(
              'This contributing factor is already included in the case.',
            );
          }

          caseFactor = existing;
          previousValue = {
            id: existing.id,
            contributingFactorId: existing.contributingFactorId,
            source: existing.source,
            reporterSelected: existing.reporterSelected,
            reviewStatus: existing.reviewStatus,
          };

          // Preserve original provenance when reactivating the existing row.
          caseFactor.reviewStatus =
            CaseContributingFactorReviewStatus.CONFIRMED;
        } else {
          caseFactor = factorRepository.create({
            caseId,
            contributingFactorId: catalogueFactor.id,
            reporterSelected: false,
            source: CaseContributingFactorSource.CHAIR,
            reviewStatus: CaseContributingFactorReviewStatus.CONFIRMED,
            contributingFactor: catalogueFactor,
          });
          previousValue = null;
        }

        caseFactor = await factorRepository.save(caseFactor);
        caseFactor.contributingFactor = catalogueFactor;
        action = CaseReviewChangeAction.ADDED;
      } else {
        const existing = await factorRepository.findOne({
          where: {
            id: dto.caseContributingFactorId!,
            caseId,
          },
          relations: { contributingFactor: true },
        });

        if (!existing) {
          throw new NotFoundException(
            'The contributing factor record was not found for this case.',
          );
        }

        if (
          existing.reviewStatus === CaseContributingFactorReviewStatus.REMOVED
        ) {
          throw new ConflictException(
            'This contributing factor has already been removed. Use ADD to re-add it.',
          );
        }

        previousValue = {
          id: existing.id,
          contributingFactorId: existing.contributingFactorId,
          source: existing.source,
          reporterSelected: existing.reporterSelected,
          reviewStatus: existing.reviewStatus,
        };

        caseFactor = existing;

        if (dto.action === CaseContributingFactorReviewAction.CONFIRM) {
          if (
            existing.reviewStatus ===
            CaseContributingFactorReviewStatus.CONFIRMED
          ) {
            throw new ConflictException(
              'This contributing factor has already been confirmed.',
            );
          }

          caseFactor.reviewStatus =
            CaseContributingFactorReviewStatus.CONFIRMED;
          action = CaseReviewChangeAction.CONFIRMED;
        } else if (dto.action === CaseContributingFactorReviewAction.REMOVE) {
          caseFactor.reviewStatus = CaseContributingFactorReviewStatus.REMOVED;
          action = CaseReviewChangeAction.REMOVED;
        } else {
          throw new BadRequestException(
            'Unsupported contributing factor action.',
          );
        }

        caseFactor = await factorRepository.save(caseFactor);
      }

      const newValue = {
        id: caseFactor.id,
        contributingFactorId: caseFactor.contributingFactorId,
        factorCode: caseFactor.contributingFactor.code,
        factorName: caseFactor.contributingFactor.name,
        delayLevel: caseFactor.contributingFactor.delayLevel,
        source: caseFactor.source,
        reporterSelected: caseFactor.reporterSelected,
        reviewStatus: caseFactor.reviewStatus,
      };

      // Any factor change requires the Chair to complete this section again.
      review.contributingFactorsReviewed = false;
      await manager.getRepository(CaseReview).save(review);

      await manager.getRepository(CaseReviewChange).save(
        manager.getRepository(CaseReviewChange).create({
          caseReviewId: review.id,
          itemType: CaseReviewChangeItemType.CONTRIBUTING_FACTOR,
          itemId: caseFactor.id,
          action,
          previousValue,
          newValue,
          changedBy: userId,
          remarks: dto.remarks ?? null,
        }),
      );

      return {
        contributingFactor: caseFactor,
        action,
      };
    });
  }

  async reviewRecommendation(
    caseId: string,
    dto: ReviewCaseRecommendationDto,
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
          'Recommendations can only be reviewed while the case is under review.',
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

      const recommendationRepository =
        manager.getRepository(CaseRecommendation);

      let recommendation: CaseRecommendation;
      let action: CaseReviewChangeAction;
      let previousValue: Record<string, unknown> | null = null;

      if (dto.action === CaseRecommendationReviewAction.ADD) {
        if (
          dto.caseRecommendationId ||
          !dto.caseContributingFactorId ||
          !dto.recommendation?.trim()
        ) {
          throw new BadRequestException(
            'ADD requires caseContributingFactorId and recommendation only.',
          );
        }

        const caseFactor = await manager
          .getRepository(CaseContributingFactor)
          .findOne({
            where: {
              id: dto.caseContributingFactorId,
              caseId,
            },
          });

        if (!caseFactor) {
          throw new NotFoundException(
            'The contributing factor was not found for this case.',
          );
        }

        if (
          caseFactor.reviewStatus === CaseContributingFactorReviewStatus.REMOVED
        ) {
          throw new BadRequestException(
            'A recommendation cannot be added to a removed contributing factor.',
          );
        }

        const wording = dto.recommendation.trim();

        recommendation = recommendationRepository.create({
          caseId,
          caseContributingFactorId: caseFactor.id,
          recommendation: wording,
          approvedRecommendation: wording,
          source: CaseRecommendationSource.CHAIR,
          reviewStatus: CaseRecommendationReviewStatus.CONFIRMED,
        });

        recommendation = await recommendationRepository.save(recommendation);

        action = CaseReviewChangeAction.ADDED;
      } else {
        if (!dto.caseRecommendationId || dto.caseContributingFactorId) {
          throw new BadRequestException(
            'CONFIRM, EDIT and REMOVE require caseRecommendationId only.',
          );
        }

        if (
          dto.action === CaseRecommendationReviewAction.EDIT &&
          !dto.recommendation?.trim()
        ) {
          throw new BadRequestException(
            'EDIT requires updated recommendation wording.',
          );
        }

        if (
          dto.action !== CaseRecommendationReviewAction.EDIT &&
          dto.recommendation !== undefined
        ) {
          throw new BadRequestException(
            'Updated recommendation wording is only accepted with EDIT.',
          );
        }

        const existing = await recommendationRepository.findOne({
          where: {
            id: dto.caseRecommendationId,
            caseId,
          },
        });

        if (!existing) {
          throw new NotFoundException(
            'The recommendation was not found for this case.',
          );
        }

        if (existing.reviewStatus === CaseRecommendationReviewStatus.REMOVED) {
          throw new ConflictException(
            'This recommendation has already been removed.',
          );
        }

        previousValue = {
          id: existing.id,
          caseContributingFactorId: existing.caseContributingFactorId,
          recommendation: existing.recommendation,
          approvedRecommendation: existing.approvedRecommendation,
          source: existing.source,
          reviewStatus: existing.reviewStatus,
        };

        recommendation = existing;

        if (dto.action === CaseRecommendationReviewAction.CONFIRM) {
          if (
            existing.reviewStatus !== CaseRecommendationReviewStatus.PENDING
          ) {
            throw new ConflictException(
              'Only a pending recommendation can be confirmed.',
            );
          }

          recommendation.approvedRecommendation = recommendation.recommendation;
          recommendation.reviewStatus =
            CaseRecommendationReviewStatus.CONFIRMED;
          action = CaseReviewChangeAction.CONFIRMED;
        } else if (dto.action === CaseRecommendationReviewAction.EDIT) {
          recommendation.approvedRecommendation = dto.recommendation!.trim();
          recommendation.reviewStatus = CaseRecommendationReviewStatus.EDITED;
          action = CaseReviewChangeAction.CHANGED;
        } else if (dto.action === CaseRecommendationReviewAction.REMOVE) {
          recommendation.reviewStatus = CaseRecommendationReviewStatus.REMOVED;
          action = CaseReviewChangeAction.REMOVED;
        } else {
          throw new BadRequestException(
            'Unsupported recommendation review action.',
          );
        }

        recommendation = await recommendationRepository.save(recommendation);
      }

      const newValue = {
        id: recommendation.id,
        caseContributingFactorId: recommendation.caseContributingFactorId,
        recommendation: recommendation.recommendation,
        approvedRecommendation: recommendation.approvedRecommendation,
        source: recommendation.source,
        reviewStatus: recommendation.reviewStatus,
      };

      // Any recommendation change requires this section to be completed again.
      review.recommendationsReviewed = false;
      await manager.getRepository(CaseReview).save(review);

      await manager.getRepository(CaseReviewChange).save(
        manager.getRepository(CaseReviewChange).create({
          caseReviewId: review.id,
          itemType: CaseReviewChangeItemType.RECOMMENDATION,
          itemId: recommendation.id,
          action,
          previousValue,
          newValue,
          changedBy: userId,
          remarks: dto.remarks ?? null,
        }),
      );

      return {
        recommendation,
        action,
      };
    });
  }

  async reviewCause(
    caseId: string,
    dto: ReviewCaseCauseDto,
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

      if (caseRecord.status !== CaseStatus.UNDER_REVIEW) {
        throw new ConflictException(
          'The cause can only be reviewed while the case is under review.',
        );
      }

      if (caseRecord.caseType === CaseType.NEAR_MISS) {
        throw new BadRequestException(
          'Cause-of-death review does not apply to near-miss cases.',
        );
      }

      const reviewRepository = manager.getRepository(CaseReview);
      const review = await reviewRepository.findOne({
        where: { caseId },
      });

      if (!review) {
        throw new NotFoundException(
          `No review has been started for case ${caseId}.`,
        );
      }

      let detail: MaternalCaseDetail | PerinatalCaseDetail | null;

      if (caseRecord.caseType === CaseType.MATERNAL) {
        detail = await manager.getRepository(MaternalCaseDetail).findOne({
          where: { caseId },
        });
      } else {
        detail = await manager.getRepository(PerinatalCaseDetail).findOne({
          where: { caseId },
        });
      }

      if (!detail) {
        throw new NotFoundException(
          `The case details required for cause review were not found.`,
        );
      }

      const selectedCauseId = dto.causeId ?? detail.provisionalCauseId;

      await this.casesService.validateCauseForReview(
        caseRecord.caseType,
        selectedCauseId,
        manager,
      );

      const previousValue = {
        provisionalCauseId: detail.provisionalCauseId,
        finalCauseId: detail.finalCauseId,
      };

      const action =
        selectedCauseId === detail.provisionalCauseId
          ? CaseReviewChangeAction.CONFIRMED
          : CaseReviewChangeAction.CHANGED;

      detail.finalCauseId = selectedCauseId;

      // Recording the final cause does not complete the Chair's cause review.
      review.causeReviewed = false;

      if (caseRecord.caseType === CaseType.MATERNAL) {
        await manager
          .getRepository(MaternalCaseDetail)
          .save(detail as MaternalCaseDetail);
      } else {
        await manager
          .getRepository(PerinatalCaseDetail)
          .save(detail as PerinatalCaseDetail);
      }

      const savedReview = await reviewRepository.save(review);

      await manager.getRepository(CaseReviewChange).save(
        manager.getRepository(CaseReviewChange).create({
          caseReviewId: review.id,
          itemType: CaseReviewChangeItemType.CAUSE,
          itemId: null,
          action,
          previousValue,
          newValue: {
            provisionalCauseId: detail.provisionalCauseId,
            finalCauseId: selectedCauseId,
          },
          changedBy: userId,
          remarks: dto.remarks ?? null,
        }),
      );

      return {
        review: savedReview,
        cause: {
          provisionalCauseId: detail.provisionalCauseId,
          finalCauseId: selectedCauseId,
          sectionCompleted: false,
        },
      };
    });
  }

  async completeSection(
    caseId: string,
    section: 'CAUSE' | 'CONTRIBUTING_FACTORS' | 'RECOMMENDATIONS',
    userId: string,
    assignmentId: string,
  ) {
    // Check organization scope before changing review data.
    await this.casesService.findOne(caseId, userId, assignmentId);

    return this.dataSource.transaction(async (manager) => {
      // Lock the case so item edits and section completion cannot race.
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
          'Review sections can only be completed while the case is under review.',
        );
      }

      const reviewRepository = manager.getRepository(CaseReview);
      const review = await reviewRepository.findOne({ where: { caseId } });

      if (!review) {
        throw new NotFoundException(
          `No review has been started for case ${caseId}.`,
        );
      }

      if (section === 'CAUSE') {
        if (caseRecord.caseType === CaseType.NEAR_MISS) {
          throw new BadRequestException(
            'Cause-of-death review does not apply to near-miss cases.',
          );
        }

        const detailRepository =
          caseRecord.caseType === CaseType.MATERNAL
            ? manager.getRepository(MaternalCaseDetail)
            : manager.getRepository(PerinatalCaseDetail);
        const detail = await detailRepository.findOne({ where: { caseId } });

        if (!detail?.finalCauseId) {
          throw new ConflictException(
            'A final cause of death must be recorded before completing this section.',
          );
        }

        review.causeReviewed = true;
      } else if (section === 'CONTRIBUTING_FACTORS') {
        // Only reporter-selected factors are active gaps; deselected history remains visible.
        const factors = await manager
          .getRepository(CaseContributingFactor)
          .find({
            where: { caseId, reporterSelected: true },
          });
        const pendingFactor = factors.find(
          (factor) =>
            factor.reviewStatus === CaseContributingFactorReviewStatus.PENDING,
        );

        if (pendingFactor) {
          throw new ConflictException(
            'All reporter-selected contributing factors must be confirmed or removed first.',
          );
        }

        review.contributingFactorsReviewed = true;
      } else if (section === 'RECOMMENDATIONS') {
        // Recommendations remain reviewable even when their linked factor was removed.
        const recommendations = await manager
          .getRepository(CaseRecommendation)
          .find({ where: { caseId } });
        const pendingRecommendation = recommendations.find(
          (recommendation) =>
            recommendation.reviewStatus ===
            CaseRecommendationReviewStatus.PENDING,
        );

        if (pendingRecommendation) {
          throw new ConflictException(
            'All recommendations must be confirmed, edited, or removed first.',
          );
        }

        review.recommendationsReviewed = true;
      } else {
        throw new BadRequestException('Unsupported review section.');
      }

      return reviewRepository.save(review);
    });
  }

  async finalize(caseId: string, userId: string, assignmentId: string) {
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

      // Require explicit completion of every applicable review section.
      if (caseRecord.caseType !== CaseType.NEAR_MISS && !review.causeReviewed) {
        throw new ConflictException(
          'The cause review section is not complete.',
        );
      }

      if (!review.contributingFactorsReviewed) {
        throw new ConflictException(
          'The contributing-factors review section is not complete.',
        );
      }

      if (!review.recommendationsReviewed) {
        throw new ConflictException(
          'The recommendations review section is not complete.',
        );
      }

      // Recheck the underlying records so stale flags cannot bypass finalization.
      const pendingFactor = await manager
        .getRepository(CaseContributingFactor)
        .findOne({
          where: {
            caseId,
            reporterSelected: true,
            reviewStatus: CaseContributingFactorReviewStatus.PENDING,
          },
        });

      if (pendingFactor) {
        throw new ConflictException(
          'There are still pending contributing factors to review.',
        );
      }

      const pendingRecommendation = await manager
        .getRepository(CaseRecommendation)
        .findOne({
          where: {
            caseId,
            reviewStatus: CaseRecommendationReviewStatus.PENDING,
          },
        });

      if (pendingRecommendation) {
        throw new ConflictException(
          'There are still pending recommendations to review.',
        );
      }

      if (caseRecord.caseType !== CaseType.NEAR_MISS) {
        const detailRepository =
          caseRecord.caseType === CaseType.MATERNAL
            ? manager.getRepository(MaternalCaseDetail)
            : manager.getRepository(PerinatalCaseDetail);
        const detail = await detailRepository.findOne({ where: { caseId } });

        if (!detail?.finalCauseId) {
          throw new ConflictException(
            'A final cause of death must be recorded before finalizing the review.',
          );
        }
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
