
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

import { SectionProgress } from './section-progress.entity.js';
import { LearningMaterialProgressStatus } from '../enums/learning-progress-status.enum.js';
import { LearningMaterial } from '../../modules/learning-materials/entities/learning-material.entity.js';

@Entity('learningMaterialProgress')
@Index(
  'UQ_material_progress_section_material',
  ['sectionProgressId', 'learningMaterialId'],
  { unique: true },
)
@Index('IDX_material_progress_section', ['sectionProgressId'])
export class LearningMaterialProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'char',
    length: 36,
  })
  sectionProgressId: string;

  @Column({
    type: 'char',
    length: 36,
  })
  learningMaterialId: string;

  // Amount of video watched, expressed as a percentage.
  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  watchedPercentage: number;

  // Video duration in seconds
  @Column({
    type: 'int',
    nullable: true,
  })
  durationSeconds: number | null;

  // Last recorded playback position in seconds.
  @Column({
    type: 'int',
    default: 0,
  })
  lastPositionSeconds: number;


  @Column({
  type: 'enum',
  enum: LearningMaterialProgressStatus,
  default: LearningMaterialProgressStatus.NOT_STARTED,
})
status: LearningMaterialProgressStatus;

  
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
    () => SectionProgress,
    { nullable: false, onDelete: 'CASCADE' },
  )
  @JoinColumn({
    name: 'sectionProgressId',
    referencedColumnName: 'id',
  })
  sectionProgress: Relation<SectionProgress>;

  @ManyToOne(
    () => LearningMaterial,
    { nullable: false, onDelete: 'RESTRICT' },
  )
  @JoinColumn({
    name: 'learningMaterialId',
    referencedColumnName: 'id',
  })
  learningMaterial: Relation<LearningMaterial>;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
