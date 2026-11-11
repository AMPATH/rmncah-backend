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

import { SubCounty } from '../../locations/sub-counties/entities/sub-county.entity.js';
import { FacilityPcnMembership } from '../../mpdsr/pcns/entities/facility-pcn-membership.entity.js';
import { CommunityUnit } from '../../locations/community-units/entities/community-unit.entity.js';

import {
  FacilityLevel,
  FacilityOwnership,
  FacilityType,
} from '../enums/facility.enum.js';

@Entity('facilities')
@Index(['subCountyId'])
export class Facility {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'char', length: 36 })
  subCountyId: string;

  @Column({
    type: 'varchar',
    length: 200,
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
  })
  mflCode: string;

  @Column({
    type: 'enum',
    enum: FacilityLevel,
    nullable: false,
  })
  level: FacilityLevel;

  @Column({
    type: 'enum',
    enum: FacilityType,
    nullable: true,
  })
  type: FacilityType | null;

  @Column({
    type: 'enum',
    enum: FacilityOwnership,
    nullable: true,
  })
  ownership: FacilityOwnership | null;

  @Column({
    type: 'boolean',
    default: true,
  })
  isActive: boolean;

  // Relationships

  @ManyToOne(() => SubCounty, (subCounty) => subCounty.facilities, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'subCountyId' })
  subCounty: Relation<SubCounty>;

  @OneToMany(() => FacilityPcnMembership, (membership) => membership.facility)
  pcnMemberships: Relation<FacilityPcnMembership[]>;

  @OneToMany(() => CommunityUnit, (communityUnit) => communityUnit.facility)
  communityUnits: Relation<CommunityUnit[]>;

  // Timestamps

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
