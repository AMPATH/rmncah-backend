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
import { User } from '../../../shared/users/entities/user.entity.js';

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

  @Column({ type: 'boolean', default: false })
  reviewerSelected: boolean;

  @Column({ type: 'varchar', length: 36, nullable: true })
  reviewedBy: string | null;

  @ManyToOne(() => User, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'reviewedBy' })
  reviewer: Relation<User> | null;

  @Column({ type: 'datetime', nullable: true })
  reviewedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  reviewerNotes: string | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
