
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

import { CohortModuleAssignment } from '../../entities/cohort-module-assignment.entity.js';

import { TrainingType } from '../enums/training-type.enum.js';
import { TrainingSessionStatus } from '../enums/training-session-status.enum.js';

@Entity('training_sessions')
@Index('IDX_training_session_assignment', ['assignmentId'])
@Index('IDX_training_session_start', ['startDate', 'startTime'])
export class TrainingSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  assignmentId: string;

  @Column({
    type: 'enum',
    enum: TrainingType,
  })
  trainingType: TrainingType;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'date' })
  endDate: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  venue: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({
    type: 'enum',
    enum: TrainingSessionStatus,
    default: TrainingSessionStatus.PLANNED,
  })
  status: TrainingSessionStatus;

  @ManyToOne(
    () => CohortModuleAssignment,
    (assignment) => assignment.trainingSessions,
    { nullable: false, onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'assignmentId', referencedColumnName: 'id' })
  assignment: Relation<CohortModuleAssignment>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
