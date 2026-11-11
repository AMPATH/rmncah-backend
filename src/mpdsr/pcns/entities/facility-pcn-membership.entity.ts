import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import type { Relation } from 'typeorm';

import { PrimaryCareNetwork } from './primary-care-network.entity.js';
import { Facility } from '../../../facilities/entities/facility.entity.js';

@Entity('facilityPcnMemberships')
@Index(['activeFacilityId'], { unique: true })
export class FacilityPcnMembership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'char', length: 36 })
  facilityId: string;

  @Column({ type: 'char', length: 36 })
  pcnId: string;

  // A generated column: populated only while the membership is active.
  // MySQL allows multiple NULL values in a unique index.
  @Column({
    type: 'char',
    length: 36,
    asExpression: 'CASE WHEN `endedAt` IS NULL THEN `facilityId` ELSE NULL END',
    generatedType: 'VIRTUAL',
    nullable: true,
    insert: false,
    update: false,
  })
  activeFacilityId: string | null;

  @ManyToOne(() => Facility, (facility) => facility.pcnMemberships, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'facilityId' })
  facility: Relation<Facility>;

  @ManyToOne(() => PrimaryCareNetwork, (pcn) => pcn.facilityMemberships, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'pcnId' })
  pcn: Relation<PrimaryCareNetwork>;

  @CreateDateColumn()
  createdAt: Date;

  @Column({
    type: 'datetime',
    nullable: true,
  })
  endedAt: Date | null;
}
