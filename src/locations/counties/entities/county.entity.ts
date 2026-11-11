import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';

import type { Relation } from 'typeorm';

import { SubCounty } from '../../sub-counties/entities/sub-county.entity.js';

@Entity('counties')
export class County {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  name: string;

  @Column({ type: 'char', length: 3, unique: true })
  code: string;

  @OneToMany(() => SubCounty, (subCounty) => subCounty.county)
  subCounties: Relation<SubCounty[]>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date | null;
}
