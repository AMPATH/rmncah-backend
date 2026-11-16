import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import type { Relation } from 'typeorm';
import { User } from '../../entities/user.entity.js';
import { Facility } from '../../../../facilities/entities/facility.entity.js';

@Entity('user_locations')
@Index(['userId', 'facilityId'], { unique: true })
export class UserLocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'userId',
    type: 'varchar',
    length: 36,
  })
  userId: string;

  @Column({
    name: 'facilityId',
    type: 'varchar',
    length: 36,
  })
  facilityId: string;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user: Relation<User>;

  @ManyToOne(() => Facility, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'facilityId', referencedColumnName: 'id' })
  facility: Relation<Facility>;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}