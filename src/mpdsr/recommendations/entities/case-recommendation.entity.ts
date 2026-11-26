import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';

import { Case } from '../../cases/entities/case.entity.js';
import { CaseContributingFactor } from '../../cases/entities/case-contributing-factor.entity.js';
import {
  CaseRecommendationReviewStatus,
  CaseRecommendationSource,
} from '../enums/case-recommendation.enum.js';

@Entity('caseRecommendations')
@Index('IDX_caseRecommendations_caseId', ['caseId'])
@Index(
  'IDX_caseRecommendations_caseContributingFactorId',
  ['caseContributingFactorId'],
)
export class CaseRecommendation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  caseId: string;

  @ManyToOne(() => Case, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'caseId' })
  case: Relation<Case>;

  @Column({ type: 'varchar', length: 36 })
  caseContributingFactorId: string;

  @ManyToOne(() => CaseContributingFactor, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'caseContributingFactorId' })
  caseContributingFactor: Relation<CaseContributingFactor>;

  // Original text submitted by the reporter, or the initial text for a Chair-added item.
  @Column({ type: 'text' })
  recommendation: string;

  // The committee-approved wording. Populated when the Chair confirms or edits the item.
  @Column({ type: 'text', nullable: true })
  approvedRecommendation: string | null;

  @Column({
    type: 'enum',
    enum: CaseRecommendationSource,
    default: CaseRecommendationSource.REPORTER,
  })
  source: CaseRecommendationSource;

  @Column({
    type: 'enum',
    enum: CaseRecommendationReviewStatus,
    default: CaseRecommendationReviewStatus.PENDING,
  })
  reviewStatus: CaseRecommendationReviewStatus;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
