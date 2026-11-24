
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import type { Relation } from 'typeorm';

import { LearningMaterial } from '../../learning-materials/entities/learning-material.entity.js';
import { TrainingModule } from '../../training-modules/entities/training-module.entity.js';

@Entity('module_sections')
@Index(['trainingModuleId', 'displayOrder'])
export class ModuleSection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'int' })
  displayOrder: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'varchar', length: 36 })
  trainingModuleId: string;
//relationships
   // Relationships
  @ManyToOne(
    () => TrainingModule,
    (trainingModule) => trainingModule.sections,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'trainingModuleId' })
  trainingModule: Relation<TrainingModule>;

  @OneToMany(
    () => LearningMaterial,
    (learningMaterial) => learningMaterial.moduleSection,
  )
  learningMaterials: Relation<LearningMaterial[]>;
  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
