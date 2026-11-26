
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import type { Relation } from 'typeorm';

import { Cohort } from '../../entities/cohort.entity.js';
import { TrainingModule } from '../../../modules/training-modules/entities/training-module.entity.js';
import { User } from '../../../../shared/users/entities/user.entity.js';
import { TrainingSession } from '../training-sessions/entities/training-sessions.entity.js';

@Entity('cohort_module_assignments')
@Index(
  'UQ_cohort_module_assignment',
  ['cohortId', 'trainingModuleId'],
  { unique: true },
)
@Index('IDX_cohort_module_assignment_cohort', ['cohortId'])
@Index('IDX_cohort_module_assignment_module', ['trainingModuleId'])
export class CohortModuleAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  cohortId: string;

  @Column({ type: 'varchar', length: 36 })
  trainingModuleId: string;

  @Column({ type: 'varchar', length: 36 })
  assignedBy: string;

  @ManyToOne(() => Cohort, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cohortId', referencedColumnName: 'id' })
  cohort: Relation<Cohort>;

  @ManyToOne(() => TrainingModule, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'trainingModuleId',
    referencedColumnName: 'id',
  })
  trainingModule: Relation<TrainingModule>;
//relationships
  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'assignedBy', referencedColumnName: 'id' })
  assigner: Relation<User>;

  @OneToMany(
  () => TrainingSession,
  (session) => session.assignment,
)
trainingSessions: Relation<TrainingSession[]>;

  @CreateDateColumn({ type: 'datetime' })
  assignedAt: Date;
}
