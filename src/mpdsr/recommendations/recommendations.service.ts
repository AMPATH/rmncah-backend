import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CasesService } from '../cases/cases.service.js';
import { CaseContributingFactor } from '../cases/entities/case-contributing-factor.entity.js';
import { CaseStatus } from '../cases/enums/case.enum.js';

import { CaseRecommendation } from './entities/case-recommendation.entity.js';
import { CreateCaseRecommendationDto } from './dto/create-case-recommendation.dto.js';

@Injectable()
export class RecommendationsService {
  constructor(
    private readonly casesService: CasesService,
    @InjectRepository(CaseRecommendation)
    private readonly recommendationRepository: Repository<CaseRecommendation>,
    @InjectRepository(CaseContributingFactor)
    private readonly caseContributingFactorRepository: Repository<CaseContributingFactor>,
  ) {}

  async create(
    caseId: string,
    dto: CreateCaseRecommendationDto,
    userId: string,
    assignmentId: string,
  ) {
    // Enforce the user's active organization-assignment scope.
    // Enforce the user's active organization-assignment scope.
    const caseRecord = await this.casesService.findOne(
      caseId,
      userId,
      assignmentId,
    );

    // Only the original reporter may submit recommendations.
    // Only the original reporter may submit recommendations.
    if (caseRecord.reportedBy !== userId) {
      throw new ForbiddenException(
        'Only the original case reporter can submit recommendations.',
      );
    }

    if (caseRecord.status !== CaseStatus.NOTIFIED) {
      throw new BadRequestException(
        'Recommendations can only be submitted before committee review begins.',
      );
    }

    // A recommendation must address a gap selected by the reporter.
    // A recommendation must address a gap selected by the reporter.
    const caseFactor = await this.caseContributingFactorRepository.findOne({
      where: {
        id: dto.caseContributingFactorId,
        caseId,
        reporterSelected: true,
      },
    });

    if (!caseFactor) {
      throw new BadRequestException(
        'The selected contributing factor is not a reporter-selected gap for this case.',
      );
    }

    // Preserve the reporter's original recommendation for committee review.
    // Preserve the reporter's original recommendation for committee review.
    const recommendation = this.recommendationRepository.create({
      caseId,
      caseContributingFactorId: caseFactor.id,
      recommendation: dto.recommendation.trim(),
    });

    return this.recommendationRepository.save(recommendation);
  }

  async findAll(
    caseId: string,
    userId: string,
    assignmentId: string,
  ) {
    await this.casesService.findOne(caseId, userId, assignmentId);

    return this.recommendationRepository.find({
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
  }
}
