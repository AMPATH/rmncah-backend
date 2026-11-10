import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';

import { Case } from './case.entity.js';
import { PregnancyPeriod } from '../enums/case.enum.js';

@Entity('nearMissDetails')
export class NearMissDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36, unique: true })
  caseId: string;

  @OneToOne(() => Case, (caseRecord) => caseRecord.nearMissDetails, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'caseId' })
  case: Relation<Case>;

  @Column({ type: 'date' })
  dateOfComplication: string;

  @Column({ type: 'date' })
  dateOfAdmission: string;

  @Column({ type: 'date', nullable: true })
  dateOfDischarge: string | null;

  @Column({
    type: 'enum',
    enum: PregnancyPeriod,
  })
  periodOfComplication: PregnancyPeriod;

  @Column({ type: 'int' })
  parity: number;

  @Column({ type: 'int', nullable: true })
  gestationalAgeAtComplication: number | null;

  @Column({ type: 'text' })
  clinicalSummary: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
