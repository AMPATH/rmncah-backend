
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

import { Progress } from './progress.entity.js';
import { ModuleSection } from '../../modules/module-sections/entities/module-section.entity.js';
import { SectionProgressStatus } from '../enums/section-progress-status.enum.js';


@Entity('sectionProgress')
@Index(
  'UQ_section_progress_progress_section',
  ['progressId', 'moduleSectionId'],
  { unique: true },
)
@Index('IDX_section_progress_progress', ['progressId'])
@Index('IDX_section_progress_section', ['moduleSectionId'])
export class SectionProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Links this section progress to the mentee's overall progress.
  @Column({
    type: 'char',
    length: 36,
  })
  progressId: string;

 //
  @Column({
    type: 'char',
    length: 36,
  })
  moduleSectionId: string;

  //progress status
  @Column({
    type: 'enum',
    enum: SectionProgressStatus,
    default: SectionProgressStatus.NOT_STARTED,
  })
  status: SectionProgressStatus;

//start date
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
    () => Progress,
    { nullable: false, onDelete: 'CASCADE' },
  )
  @JoinColumn({
    name: 'progressId',
    referencedColumnName: 'id',
  })
  progress: Relation<Progress>;

  @ManyToOne(
    () => ModuleSection,
    { nullable: false, onDelete: 'RESTRICT' },
  )
  @JoinColumn({
    name: 'moduleSectionId',
    referencedColumnName: 'id',
  })
  moduleSection: Relation<ModuleSection>;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
