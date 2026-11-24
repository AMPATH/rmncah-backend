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

import { Case } from './case.entity.js';
import { ContributingFactor } from '../../contributing-factors/entities/contributing-factor.entity.js';
import {
  CaseContributingFactorReviewStatus,
  CaseContributingFactorSource,
} from '../enums/case-contributing-factor.enum.js';

@Entity('caseContributingFactors')
@Index(
  'UQ_caseContributingFactors_case_factor',
  ['caseId', 'contributingFactorId'],
  { unique: true },
)
@Index('IDX_caseContributingFactors_contributingFactorId', ['contributingFactorId'])
export class CaseContributingFactor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  caseId: string;

  @ManyToOne(() => Case, (caseRecord) => caseRecord.contributingFactors, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'caseId' })
  case: Relation<Case>;

  @Column({ type: 'varchar', length: 36 })
  contributingFactorId: string;

  @ManyToOne(() => ContributingFactor, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'contributingFactorId' })
  contributingFactor: Relation<ContributingFactor>;

  @Column({ type: 'boolean', default: false })
  reporterSelected: boolean;

  @Column({
    type: 'enum',
    enum: CaseContributingFactorSource,
    default: CaseContributingFactorSource.REPORTER,
  })
  source: CaseContributingFactorSource;

  @Column({
    type: 'enum',
    enum: CaseContributingFactorReviewStatus,
    default: CaseContributingFactorReviewStatus.PENDING,
  })
  reviewStatus: CaseContributingFactorReviewStatus;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
