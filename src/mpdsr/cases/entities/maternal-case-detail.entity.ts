import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import type { Relation } from 'typeorm';

import { Case } from './case.entity.js';
import { PregnancyPeriod } from '../enums/case.enum.js';

@Entity('maternalCaseDetails')
export class MaternalCaseDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36, unique: true })
  caseId: string;

  @OneToOne(() => Case, (caseRecord) => caseRecord.maternalDetails, {
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

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
