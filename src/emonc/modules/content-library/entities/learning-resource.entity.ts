
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import type { Relation } from 'typeorm';

import { User } from '../../../../shared/users/entities/user.entity.js';
import { LearningResourceType } from '../enum/learning-resource-type.enum.js';

@Entity('learning_resources')
@Index(['type', 'isActive'])
@Index(['uploadedById'])
export class LearningResource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 200,
  })
  title: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description: string | null;

  @Column({
    type: 'enum',
    enum: LearningResourceType,
  })
  type: LearningResourceType;

  @Column({
    name: 'fileName',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  fileName: string | null;

  @Column({
    name: 'filePath',
    type: 'text',
    nullable: true,
  })
  filePath: string | null;

  @Column({
    name: 'mimeType',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  mimeType: string | null;

  @Column({
    name: 'fileSize',
    type: 'bigint',
    nullable: true,
  })
  fileSize: string | null;

  @Column({
    name: 'externalUrl',
    type: 'text',
    nullable: true,
  })
  externalUrl: string | null;

  @Column({
    name: 'isActive',
    type: 'boolean',
    default: true,
  })
  isActive: boolean;

  @Column({
    name: 'uploadedById',
    type: 'varchar',
    length: 36,
  })
  uploadedById: string;

  // Relationship with the user who uploaded the resource.
  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'uploadedById',
    referencedColumnName: 'id',
  })
  uploadedBy: Relation<User>;

  @CreateDateColumn({
    name: 'createdAt',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updatedAt',
  })
  updatedAt: Date;
}
