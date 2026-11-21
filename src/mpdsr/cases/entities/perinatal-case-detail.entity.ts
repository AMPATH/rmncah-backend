import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

import type { Relation } from 'typeorm';

import { Case } from './case.entity.js';
import { Icd11Cause } from '../../causes-of-death/entities/icd11-cause.entity.js';
import { BirthOutcome } from '../enums/case.enum.js';

@Entity('perinatalCaseDetails')
@Index('IDX_PERINATAL_PROVISIONAL_CAUSE', ['provisionalCauseId'])
export class PerinatalCaseDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36, unique: true })
  caseId: string;

  @OneToOne(() => Case, (caseRecord) => caseRecord.perinatalDetails, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'caseId' })
  case: Relation<Case>;

  @Column({
    type: 'enum',
    enum: BirthOutcome,
  })
  birthOutcome: BirthOutcome;

  @Column({ type: 'date' })
  dateOfDeath: string;

  @Column({ type: 'int', nullable: true })
  gestationalAgeDays: number | null;

  @Column({ type: 'varchar', length: 36 })
  provisionalCauseId: string;

  @ManyToOne(() => Icd11Cause, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'provisionalCauseId' })
  provisionalCause: Relation<Icd11Cause>;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
