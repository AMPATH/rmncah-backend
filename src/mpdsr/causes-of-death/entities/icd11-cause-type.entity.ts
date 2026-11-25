import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import type { Relation } from 'typeorm';

import { Icd11Cause } from './icd11-cause.entity.js';

export enum Icd11CauseCaseType {
  MATERNAL = 'MATERNAL',
  PERINATAL = 'PERINATAL',
}

@Entity('icd11CauseTypes')
@Unique('UQ_icd11CauseTypes_cause_caseType', ['causeId', 'caseType'])
export class Icd11CauseType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  causeId: string;

  @ManyToOne(() => Icd11Cause, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'causeId' })
  cause: Relation<Icd11Cause>;

  @Column({
    type: 'enum',
    enum: Icd11CauseCaseType,
  })
  caseType: Icd11CauseCaseType;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;
}
