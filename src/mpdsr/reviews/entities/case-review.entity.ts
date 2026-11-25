import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';

import { Case } from '../../cases/entities/case.entity.js';
import { User } from '../../../shared/users/entities/user.entity.js';
import { CaseReviewChange } from './case-review-change.entity.js';

@Entity('caseReviews')
@Index('IDX_caseReviews_reviewedBy', ['reviewedBy'])
export class CaseReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  caseId: string;

  @OneToOne(() => Case, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'caseId' })
  case: Relation<Case>;

  @Column({ type: 'varchar', length: 36 })
  reviewedBy: string;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'reviewedBy' })
  reviewer: Relation<User>;

  @Column({ type: 'date' })
  reviewDate: string;

  @Column({ type: 'boolean', default: false })
  causeReviewed: boolean;

  @Column({ type: 'boolean', default: false })
  contributingFactorsReviewed: boolean;

  @Column({ type: 'boolean', default: false })
  recommendationsReviewed: boolean;

  @OneToMany(() => CaseReviewChange, (change) => change.review)
  changes: Relation<CaseReviewChange[]>;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
