
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OneToMany } from 'typeorm';
import type { Relation } from 'typeorm';

import { ModuleSection } from '../../module-sections/entities/module-section.entity.js';

import { TrainingModuleStatus } from '../enum/training-module-status.enum.js';

@Entity('training_modules')
@Index('idx_training_modules_status', ['status'])
export class TrainingModule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  learningObjectives: string | null;

  @Column({ type: 'int', nullable: true })
  estimatedDurationMinutes: number | null;

  @Column({
    type: 'enum',
    enum: TrainingModuleStatus,
    default: TrainingModuleStatus.DRAFT,
  })
  status: TrainingModuleStatus;

 @Column({ type: 'datetime', nullable: true })
publishedAt: Date | null;
 
  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;

  //relationships
  @OneToMany(
  () => ModuleSection,
  (section) => section.trainingModule,
)
sections: Relation<ModuleSection[]>;
}
