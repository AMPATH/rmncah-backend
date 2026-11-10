import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  // ManyToOne, // Uncomment when Icd11Cause entity is ready
} from 'typeorm';

import type { Relation } from 'typeorm';

import { Case } from './case.entity.js';
// import { Icd11Cause } from './icd11-cause.entity.js';

import {
  PregnancyPeriod,
  PregnancyOutcome,
  DeliveryMode,
} from '../enums/case.enum.js';

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

  @Column({ type: 'enum', enum: PregnancyPeriod })
  deathPeriod: PregnancyPeriod; // Period when the maternal death occurred

  @Column({ type: 'int' })
  parity: number; // Number of previous pregnancies carried to a viable gestational period

  @Column({ type: 'int', nullable: true })
  gestationAtDeath: number | null; // Gestational age in completed weeks at death

  @Column({ type: 'int', nullable: true })
  daysPostpartum: number | null; // Number of days after delivery when death occurred

  @Column({ type: 'enum', enum: PregnancyOutcome })
  pregnancyOutcome: PregnancyOutcome; // Outcome of the pregnancy

  @Column({ type: 'enum', enum: DeliveryMode })
  deliveryMode: DeliveryMode; // Method of delivery

  @Column({ type: 'varchar', length: 36 })
  causeOfDeathId: string; // Intended foreign key to the ICD-11 cause table

  // Add the ICD-11 relationship when the Icd11Cause entity is ready
  // @ManyToOne(() => Icd11Cause, {
  //   nullable: false,
  //   onDelete: 'RESTRICT',
  // })
  // @JoinColumn({ name: 'causeOfDeathId' })
  // causeOfDeath: Relation<Icd11Cause>;

  @Column({ type: 'text' })
  clinicalSummary: string; // Summary of the clinical circumstances

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
