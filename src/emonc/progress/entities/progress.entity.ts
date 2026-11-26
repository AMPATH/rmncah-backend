
import {
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

import { User } from '../../../shared/users/entities/user.entity.js';

import { CohortModuleAssignment } from '../../cohorts/cohort-module-assignments/entities/cohort-module-assignment.entity.js';
import { ProgressStatus } from '../enums/progress-status.enum.js';



@Entity('learningProgress')
@Index(
  'UQ_progress_mentee_assignment',
  ['menteeId', 'assignmentId'],
  { unique: true },
)
@Index('IDX_progress_mentee', ['menteeId'])
@Index('IDX_progress_assignment', ['assignmentId'])
export class Progress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Mentee whose progress is being tracked.
  @Column({
    type: 'char',
    length: 36,
  })
  menteeId: string;

  // Cohort-module assignment being tracked.
  @Column({
    type: 'char',
    length: 36,
  })
  assignmentId: string;


  @Column({
    type: 'int',
    default: 0,
  })
  progressPercentage: number;

 
  @Column({
    type: 'enum',
    enum: ProgressStatus,
    default: ProgressStatus.NOT_STARTED,
  })
  status: ProgressStatus;

  @Column({
    type: 'datetime',
    nullable: true,
  })
  startedAt: Date | null;

  @Column({
    type: 'datetime',
    nullable: true,
  })
  completedAt: Date | null;
//relationships
  @ManyToOne(
    () => User,
    { nullable: false, onDelete: 'RESTRICT' },
  )
  @JoinColumn({
    name: 'menteeId',
    referencedColumnName: 'id',
  })
  mentee: Relation<User>;

  @ManyToOne(
    () => CohortModuleAssignment,
    { nullable: false, onDelete: 'CASCADE' },
  )
  @JoinColumn({
    name: 'assignmentId',
    referencedColumnName: 'id',
  })
  assignment: Relation<CohortModuleAssignment>;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
