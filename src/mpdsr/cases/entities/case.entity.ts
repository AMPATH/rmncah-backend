import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  OneToOne,
} from 'typeorm';
import type { Relation } from 'typeorm';

import { CaseType, Gender, ReportingSetting } from '../enums/case.enum.js';

import { MaternalCaseDetail } from './maternal-case-detail.entity.js';
import { PerinatalCaseDetail } from './perinatal-case-detail.entity.js';
import { NearMissDetail } from './near-miss-detail.entity.js';

@Entity('cases')
@Index('IDX_CASE_FACILITY', ['facilityId'])
@Index('IDX_CASE_COMMUNITY_UNIT', ['communityUnitId'])
@Index('IDX_CASE_REPORTER', ['reportedBy'])
@Index('IDX_CASE_CREATED_AT', ['createdAt'])
export class Case {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  caseNumber: string;

  @Column({
    type: 'enum',
    enum: CaseType,
  })
  caseType: CaseType;

  @Column({
    type: 'enum',
    enum: ReportingSetting,
  })
  reportingSetting: ReportingSetting;

  // Shared location references
  @Column({ type: 'varchar', length: 36, nullable: true })
  facilityId: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  communityUnitId: string | null;

  // Reporting user reference
  @Column({ type: 'varchar', length: 36 })
  reportedBy: string;

  // Person information
  @Column({ type: 'date' })
  dateOfBirth: string;

  @Column({
    type: 'enum',
    enum: Gender,
  })
  gender: Gender;

  // Reporting information
  @Column({ type: 'date' })
  notificationDate: string;

  @Column({ type: 'text', nullable: true })
  comments: string | null;

  // Clinical detail relationships
  @OneToOne(() => MaternalCaseDetail, (detail) => detail.case)
  maternalDetails: Relation<MaternalCaseDetail> | null;

  @OneToOne(() => PerinatalCaseDetail, (detail) => detail.case)
  perinatalDetails: Relation<PerinatalCaseDetail> | null;

  @OneToOne(() => NearMissDetail, (detail) => detail.case)
  nearMissDetails: Relation<NearMissDetail> | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deletedAt: Date | null;
}
