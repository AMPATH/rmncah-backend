
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import { User } from '../../../shared/users/entities/user.entity.js';
import { Cohort } from './cohort.entity.js';

import {
  CohortTransferRequestStatus,
  CohortTransferReason,
} from '../enum/cohorts.enum.js';

@Entity('cohortTransferRequests')
@Index(['menteeId', 'status'])
@Index(['status', 'createdAt'])
export class CohortTransferRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Mentee submitting the transfer request.
  @Column({
    name: 'menteeId',
    type: 'varchar',
    length: 36,
  })
  menteeId: string;

  // Mentee's current cohort.
  @Column({
    name: 'currentCohortId',
    type: 'varchar',
    length: 36,
  })
  currentCohortId: string;

  // Optional cohort preferred by the mentee.
  @Column({
    name: 'requestedCohortId',
    type: 'varchar',
    length: 36,
    nullable: true,
  })
  requestedCohortId: string | null;

  // Actual destination selected during approval.
  @Column({
    name: 'approvedCohortId',
    type: 'varchar',
    length: 36,
    nullable: true,
  })
  approvedCohortId: string | null;

  @Column({
    type: 'enum',
    enum: CohortTransferReason,
  })
  reason: CohortTransferReason;

  // Detailed explanation provided by the mentee.
  @Column({
    type: 'text',
  })
  description: string;

  @Column({
    type: 'enum',
    enum: CohortTransferRequestStatus,
    default: CohortTransferRequestStatus.PENDING,
  })
  status: CohortTransferRequestStatus;

  // County RH officer who reviews the request.
  @Column({
    name: 'reviewedById',
    type: 'varchar',
    length: 36,
    nullable: true,
  })
  reviewedById: string | null;

  @Column({
    name: 'reviewedAt',
    type: 'datetime',
    nullable: true,
  })
  reviewedAt: Date | null;

  @Column({
    name: 'reviewComments',
    type: 'text',
    nullable: true,
  })
  reviewComments: string | null;

  // Mentee relationship.
  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'menteeId',
    referencedColumnName: 'id',
  })
  mentee: User;

  // Current cohort relationship.
  @ManyToOne(() => Cohort, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'currentCohortId',
    referencedColumnName: 'id',
  })
  currentCohort: Cohort;

  // Mentee's preferred destination.
  @ManyToOne(() => Cohort, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'requestedCohortId',
    referencedColumnName: 'id',
  })
  requestedCohort: Cohort | null;

  // Destination selected by County RH during approval.
  @ManyToOne(() => Cohort, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'approvedCohortId',
    referencedColumnName: 'id',
  })
  approvedCohort: Cohort | null;

  // Reviewer relationship.
  @ManyToOne(() => User, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'reviewedById',
    referencedColumnName: 'id',
  })
  reviewedBy: User | null;

  @CreateDateColumn({
    name: 'createdAt',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updatedAt',
  })
  updatedAt: Date;
}
