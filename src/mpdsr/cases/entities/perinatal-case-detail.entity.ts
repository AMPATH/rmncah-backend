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
import { DeliveryMode } from '../enums/case.enum.js';

@Entity('perinatalCaseDetails')
export class PerinatalCaseDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36, unique: true })
  caseId: string;

  @OneToOne(() => Case, (caseRecord) => caseRecord.perinatalDetails, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'caseId' })
  case: Relation<Case>;

  @Column({ type: 'date' })
  dateOfDeath: string; // Date the baby died

  @Column({ type: 'int', nullable: true })
  gestationalAgeAtBirth: number | null; // Pregnancy duration at birth in completed weeks

  @Column({ type: 'enum', enum: DeliveryMode })
  modeOfDelivery: DeliveryMode; // Method of delivery, e.g. vaginal or caesarean

  @Column({ type: 'varchar', length: 36 })
  causeOfDeathId: string; // Links to the ICD-11 cause of death

  @Column({ type: 'text' })
  clinicalSummary: string; // Summary of the clinical circumstances

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date; // Date and time the record was created

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date; // Date and time the record was last updated
}
