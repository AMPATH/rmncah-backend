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
} from 'typeorm';

import type { Relation } from 'typeorm';

import { FacilityPcnMembership } from './facility-pcn-membership.entity.js';
import { SubCounty } from '../../../locations/sub-counties/entities/sub-county.entity.js';

@Entity('primaryCareNetworks')
@Index(['subCountyId', 'name'], { unique: true })
export class PrimaryCareNetwork {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'char', length: 36 })
  subCountyId: string;

  @Column({
    type: 'varchar',
    length: 150,
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 30,
    unique: true,
    nullable: true,
  })
  code: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ManyToOne(() => SubCounty, (subCounty) => subCounty.pcns, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'subCountyId' })
  subCounty: Relation<SubCounty>;

  @OneToMany(() => FacilityPcnMembership, (membership) => membership.pcn)
  facilityMemberships: Relation<FacilityPcnMembership[]>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
