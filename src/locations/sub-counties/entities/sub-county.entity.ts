import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  DeleteDateColumn,
} from 'typeorm';

import type { Relation } from 'typeorm';

import { County } from '../../counties/entities/county.entity.js';
import { Facility } from '../../../facilities/entities/facility.entity.js';

@Entity('subCounties')
@Index(['countyId', 'name'], { unique: true })
export class SubCounty {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 10, unique: true })
  code: string;

  @Column({ type: 'char', length: 36 })
  countyId: string;

  @ManyToOne(() => County, (county) => county.subCounties, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'countyId' })
  county: Relation<County>;

  @OneToMany(() => Facility, (facility) => facility.subCounty)
  facilities: Relation<Facility[]>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date | null;
}
