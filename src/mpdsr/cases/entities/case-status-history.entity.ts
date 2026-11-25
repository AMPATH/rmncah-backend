import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';

import { Case } from './case.entity.js';
import { CaseStatus } from '../enums/case.enum.js';

@Entity('caseStatusHistory')
@Index('IDX_CASE_STATUS_HISTORY_CASE', ['caseId'])
@Index('IDX_CASE_STATUS_HISTORY_CHANGED_AT', ['changedAt'])
export class CaseStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  caseId: string;

  @ManyToOne(() => Case, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'caseId' })
  case: Relation<Case>;

  @Column({
    type: 'enum',
    enum: CaseStatus,
    nullable: true,
  })
  fromStatus: CaseStatus | null;

  @Column({
    type: 'enum',
    enum: CaseStatus,
  })
  toStatus: CaseStatus;

  @Column({ type: 'varchar', length: 36 })
  changedBy: string;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'text', nullable: true })
  remarks: string | null;

  @CreateDateColumn({ type: 'datetime' })
  changedAt: Date;
}
