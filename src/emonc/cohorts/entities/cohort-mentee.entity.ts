
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
import { CohortMembershipStatus } from '../enum/cohorts.enum.js';
import type { Relation } from 'typeorm';

@Entity('cohortMentees')
@Index(['menteeId', 'status'])
@Index(['cohortId', 'status'])
export class CohortMentee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'cohortId',
    type: 'varchar',
    length: 36,
  })
  cohortId: string;

  @Column({
    name: 'menteeId',
    type: 'varchar',
    length: 36,
  })
  menteeId: string;

  @Column({
    type: 'enum',
    enum: CohortMembershipStatus,
    default: CohortMembershipStatus.ACTIVE,
  })
  status: CohortMembershipStatus;

  @Column({
    name: 'assignedAt',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  assignedAt: Date;

  @Column({
    name: 'pausedAt',
    type: 'datetime',
    nullable: true,
  })
  pausedAt: Date | null;

  @Column({
    name: 'resumedAt',
    type: 'datetime',
    nullable: true,
  })
  resumedAt: Date | null;

  @Column({
    name: 'completedAt',
    type: 'datetime',
    nullable: true,
  })
  completedAt: Date | null;

  @Column({
    name: 'transferredAt',
    type: 'datetime',
    nullable: true,
  })
  transferredAt: Date | null;

  @Column({
    name: 'removedAt',
    type: 'datetime',
    nullable: true,
  })
  removedAt: Date | null;

  // Relationship with cohort.
  @ManyToOne(() => Cohort, (cohort) => cohort.memberships, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'cohortId',
    referencedColumnName: 'id',
  })
  cohort: Relation<Cohort>;

  // Relationship with mentee.
  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'menteeId',
    referencedColumnName: 'id',
  })
  mentee: Relation<User>;

  @CreateDateColumn({
    name: 'createdAt',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updatedAt',
  })
  updatedAt: Date;
}
