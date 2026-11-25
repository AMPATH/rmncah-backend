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
import { PregnancyPeriod } from '../enums/case.enum.js';

@Entity('maternalCaseDetails')
@Index('IDX_MATERNAL_PROVISIONAL_CAUSE', ['provisionalCauseId'])
@Index('IDX_MATERNAL_FINAL_CAUSE', ['finalCauseId'])
export class MaternalCaseDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36, unique: true })
  caseId: string;

  @OneToOne(() => Case, (caseRecord) => caseRecord.maternalDetails, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'caseId' })
  case: Relation<Case>;

  @Column({ type: 'date' })
  dateOfDeath: string;

  @Column({
    type: 'enum',
    enum: PregnancyPeriod,
  })
  deathPeriod: PregnancyPeriod;

  @Column({ type: 'int', nullable: true })
  gestationAtDeath: number | null;

  @Column({ type: 'int', nullable: true })
  daysPostpartum: number | null;

  @Column({ type: 'varchar', length: 36 })
  provisionalCauseId: string;

  @ManyToOne(() => Icd11Cause, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'provisionalCauseId' })
  provisionalCause: Relation<Icd11Cause>;

  @Column({ type: 'varchar', length: 36, nullable: true })
  finalCauseId: string | null;

  @ManyToOne(() => Icd11Cause, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'finalCauseId' })
  finalCause: Relation<Icd11Cause> | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
