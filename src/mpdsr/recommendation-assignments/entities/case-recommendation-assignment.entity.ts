import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';

import { CaseRecommendation } from '../../recommendations/entities/case-recommendation.entity.js';
import { County } from '../../../locations/counties/entities/county.entity.js';
import { SubCounty } from '../../../locations/sub-counties/entities/sub-county.entity.js';
import { Facility } from '../../../facilities/entities/facility.entity.js';
import { CommunityUnit } from '../../../locations/community-units/entities/community-unit.entity.js';
import { User } from '../../../shared/users/entities/user.entity.js';

import {
  RecommendationAssignmentLevel,
  RecommendationAssignmentStatus,
  RecommendationClassification,
} from '../enums/recommendation-assignment.enum.js';

@Entity('caseRecommendationAssignments')
@Check(
  'CHK_caseRecommendationAssignments_exactlyOneTarget',
  `(
    (targetLevel = 'COUNTY' AND countyId IS NOT NULL AND subCountyId IS NULL AND facilityId IS NULL AND communityUnitId IS NULL)
    OR
    (targetLevel = 'SUB_COUNTY' AND countyId IS NULL AND subCountyId IS NOT NULL AND facilityId IS NULL AND communityUnitId IS NULL)
    OR
    (targetLevel = 'FACILITY' AND countyId IS NULL AND subCountyId IS NULL AND facilityId IS NOT NULL AND communityUnitId IS NULL)
    OR
    (targetLevel = 'COMMUNITY' AND countyId IS NULL AND subCountyId IS NULL AND facilityId IS NULL AND communityUnitId IS NOT NULL)
  )`,
)
@Index('IDX_caseRecommendationAssignments_recommendationId', ['recommendationId'])
@Index('IDX_caseRecommendationAssignments_status', ['status'])
@Index('IDX_caseRecommendationAssignments_responsibleUserId', ['responsibleUserId'])
@Index(
  'UQ_caseRecommendationAssignments_previousAssignmentId',
  ['previousAssignmentId'],
  { unique: true },
)
export class CaseRecommendationAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  recommendationId: string;

  @ManyToOne(() => CaseRecommendation, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'recommendationId' })
  recommendation: Relation<CaseRecommendation>;

  @Column({
    type: 'enum',
    enum: RecommendationClassification,
  })
  classification: RecommendationClassification;

  @Column({
    type: 'enum',
    enum: RecommendationAssignmentLevel,
  })
  targetLevel: RecommendationAssignmentLevel;

  @Column({ type: 'varchar', length: 36, nullable: true })
  countyId: string | null;

  @ManyToOne(() => County, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'countyId' })
  county: Relation<County> | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  subCountyId: string | null;

  @ManyToOne(() => SubCounty, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'subCountyId' })
  subCounty: Relation<SubCounty> | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  facilityId: string | null;

  @ManyToOne(() => Facility, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'facilityId' })
  facility: Relation<Facility> | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  communityUnitId: string | null;

  @ManyToOne(() => CommunityUnit, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'communityUnitId' })
  communityUnit: Relation<CommunityUnit> | null;

  @Column({ type: 'varchar', length: 36 })
  responsibleUserId: string;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'responsibleUserId' })
  responsibleUser: Relation<User>;

  @Column({ type: 'varchar', length: 36 })
  assignedBy: string;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'assignedBy' })
  assigner: Relation<User>;

  // The implementation deadline is set during the initial assignment.
  // Ordinary handovers must preserve this date and classification.
  @Column({ type: 'date' })
  dueDate: string;

  @Column({ type: 'text', nullable: true })
  instructions: string | null;

  @Column({ type: 'text', nullable: true })
  declineReason: string | null;

  @Column({ type: 'text', nullable: true })
  reassignmentReason: string | null;

  @Column({
    type: 'enum',
    enum: RecommendationAssignmentStatus,
    default: RecommendationAssignmentStatus.PENDING_ACCEPTANCE,
  })
  status: RecommendationAssignmentStatus;

  @Column({ type: 'varchar', length: 36, nullable: true })
  previousAssignmentId: string | null;

  @ManyToOne(() => CaseRecommendationAssignment, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'previousAssignmentId' })
  previousAssignment: Relation<CaseRecommendationAssignment> | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
