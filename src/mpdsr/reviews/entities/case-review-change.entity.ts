import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';

import { User } from '../../../shared/users/entities/user.entity.js';
import { CaseReview } from './case-review.entity.js';
import {
  CaseReviewChangeAction,
  CaseReviewChangeItemType,
} from '../enums/case-review-change.enum.js';

@Entity('caseReviewChanges')
@Index('IDX_caseReviewChanges_reviewId', ['caseReviewId'])
@Index('IDX_caseReviewChanges_item', ['itemType', 'itemId'])
@Index('IDX_caseReviewChanges_changedBy', ['changedBy'])
export class CaseReviewChange {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  caseReviewId: string;

  @ManyToOne(() => CaseReview, (review) => review.changes, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'caseReviewId' })
  review: Relation<CaseReview>;

  @Column({
    type: 'enum',
    enum: CaseReviewChangeItemType,
  })
  itemType: CaseReviewChangeItemType;

  // Null for case-level cause decisions.
  @Column({ type: 'varchar', length: 36, nullable: true })
  itemId: string | null;

  @Column({
    type: 'enum',
    enum: CaseReviewChangeAction,
  })
  action: CaseReviewChangeAction;

  // Snapshots preserve the values before and after the review decision.
  @Column({ type: 'json', nullable: true })
  previousValue: Record<string, unknown> | null;

  @Column({ type: 'json', nullable: true })
  newValue: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 36 })
  changedBy: string;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'changedBy' })
  actor: Relation<User>;

  @Column({ type: 'text', nullable: true })
  remarks: string | null;

  @CreateDateColumn({ type: 'datetime' })
  changedAt: Date;
}
