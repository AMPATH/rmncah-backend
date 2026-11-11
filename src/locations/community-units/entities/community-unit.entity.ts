import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import type { Relation } from 'typeorm';
import { Facility } from '../../../facilities/entities/facility.entity.js';

@Entity('communityUnits')
@Index(['facilityId', 'name'], { unique: true })
export class CommunityUnit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'char', length: 36 })
  facilityId: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  code: string | null;

  @Column({
    type: 'boolean',
    default: true,
  })
  isActive: boolean;

  @ManyToOne(() => Facility, (facility) => facility.communityUnits, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'facilityId' })
  facility: Relation<Facility>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date | null;
}
