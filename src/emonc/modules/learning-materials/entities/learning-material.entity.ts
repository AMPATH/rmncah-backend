
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

import { ModuleSection } from '../../module-sections/entities/module-section.entity.js';
import { LearningMaterialType } from '../enums/learning-material-type.enum.js';

@Entity('learning_materials')
@Index(['moduleSectionId'])
export class LearningMaterial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: LearningMaterialType,
  })
  type: LearningMaterialType;

  // Used for uploaded e-books and slides
  @Column({ type: 'varchar', length: 500, nullable: true })
  fileUrl: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fileName: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  mimeType: string | null;

  @Column({ type: 'bigint', nullable: true })
  fileSize: number | null;

  // Used for external video links
  @Column({ type: 'varchar', length: 1000, nullable: true })
  externalUrl: string | null;

  @Column({ type: 'int', default: 1 })
  displayOrder: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'varchar', length: 36 })
  moduleSectionId: string;

  @ManyToOne(
    () => ModuleSection,
    (moduleSection) => moduleSection.learningMaterials,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'moduleSectionId' })
  moduleSection: Relation<ModuleSection>;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
