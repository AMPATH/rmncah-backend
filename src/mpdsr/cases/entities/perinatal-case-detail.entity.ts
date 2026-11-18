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
import { BirthOutcome, PlaceOfBirth } from '../enums/case.enum.js';

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

  // Outcome at birth: live birth or stillbirth.
  @Column({
    type: 'enum',
    enum: BirthOutcome,
  })
  birthOutcome: BirthOutcome;

  // Gestational age at birth, recorded as total days.
  @Column({ type: 'int', nullable: true })
  gestationalAgeDays: number | null;

  // Birth weight stored in grams.
  @Column({ type: 'int', nullable: true })
  birthWeightGrams: number | null;

  @Column({
    type: 'enum',
    enum: PlaceOfBirth,
  })
  placeOfBirth: PlaceOfBirth;

  @Column({ type: 'date' })
  dateOfDeath: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
