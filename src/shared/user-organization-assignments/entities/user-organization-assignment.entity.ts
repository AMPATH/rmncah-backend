import {
  Check,
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

import { User } from '../../users/entities/user.entity.js';
import { County } from '../../../locations/counties/entities/county.entity.js';
import { SubCounty } from '../../../locations/sub-counties/entities/sub-county.entity.js';
import { PrimaryCareNetwork } from '../../../mpdsr/pcns/entities/primary-care-network.entity.js';
import { Facility } from '../../../facilities/entities/facility.entity.js';
import { CommunityUnit } from '../../../locations/community-units/entities/community-unit.entity.js';

import { OrganizationLevel } from '../enum/organization-level.enum.js';

@Entity('userOrganizationAssignments')
@Check(
  'CHK_userOrganizationAssignments_exactlyOneOrganization',
  `(
    (level = 'COUNTY' AND countyId IS NOT NULL AND subCountyId IS NULL AND pcnId IS NULL AND facilityId IS NULL AND communityUnitId IS NULL)
    OR
    (level = 'SUB_COUNTY' AND countyId IS NULL AND subCountyId IS NOT NULL AND pcnId IS NULL AND facilityId IS NULL AND communityUnitId IS NULL)
    OR
    (level = 'PCN' AND countyId IS NULL AND subCountyId IS NULL AND pcnId IS NOT NULL AND facilityId IS NULL AND communityUnitId IS NULL)
    OR
    (level = 'FACILITY' AND countyId IS NULL AND subCountyId IS NULL AND pcnId IS NULL AND facilityId IS NOT NULL AND communityUnitId IS NULL)
    OR
    (level = 'COMMUNITY' AND countyId IS NULL AND subCountyId IS NULL AND pcnId IS NULL AND facilityId IS NULL AND communityUnitId IS NOT NULL)

  )`,
)
@Index(['userId', 'level'])
@Index(['userId', 'activeCountyId'], { unique: true })
@Index(['userId', 'activeSubCountyId'], { unique: true })
@Index(['userId', 'activePcnId'], { unique: true })
@Index(['userId', 'activeFacilityId'], { unique: true })
@Index(['userId', 'activeCommunityUnitId'], { unique: true })
@Index(['countyId'])
@Index(['subCountyId'])
@Index(['pcnId'])
@Index(['facilityId'])
@Index(['communityUnitId'])
export class UserOrganizationAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'userId' })
  user: Relation<User>;

  @Column({
    type: 'enum',
    enum: OrganizationLevel,
  })
  level: OrganizationLevel;

  @Column({ type: 'varchar', length: 36, nullable: true })
  countyId: string | null;

  @ManyToOne(() => County, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'countyId' })
  county: Relation<County> | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  subCountyId: string | null;

  @ManyToOne(() => SubCounty, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'subCountyId' })
  subCounty: Relation<SubCounty> | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  pcnId: string | null;

  @ManyToOne(() => PrimaryCareNetwork, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'pcnId' })
  pcn: Relation<PrimaryCareNetwork> | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  facilityId: string | null;

  @ManyToOne(() => Facility, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'facilityId' })
  facility: Relation<Facility> | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  communityUnitId: string | null;

  @ManyToOne(() => CommunityUnit, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'communityUnitId' })
  communityUnit: Relation<CommunityUnit> | null;

  @Column({
    type: 'char',
    length: 36,
    asExpression: 'CASE WHEN `endDate` IS NULL THEN `countyId` ELSE NULL END',
    generatedType: 'VIRTUAL',
    nullable: true,
    insert: false,
    update: false,
  })
  activeCountyId: string | null;

  @Column({
    type: 'char',
    length: 36,
    asExpression:
      'CASE WHEN `endDate` IS NULL THEN `subCountyId` ELSE NULL END',
    generatedType: 'VIRTUAL',
    nullable: true,
    insert: false,
    update: false,
  })
  activeSubCountyId: string | null;

  @Column({
    type: 'char',
    length: 36,
    asExpression: 'CASE WHEN `endDate` IS NULL THEN `pcnId` ELSE NULL END',
    generatedType: 'VIRTUAL',
    nullable: true,
    insert: false,
    update: false,
  })
  activePcnId: string | null;

  @Column({
    type: 'char',
    length: 36,
    asExpression: 'CASE WHEN `endDate` IS NULL THEN `facilityId` ELSE NULL END',
    generatedType: 'VIRTUAL',
    nullable: true,
    insert: false,
    update: false,
  })
  activeFacilityId: string | null;

  @Column({
    type: 'char',
    length: 36,
    asExpression:
      'CASE WHEN `endDate` IS NULL THEN `communityUnitId` ELSE NULL END',
    generatedType: 'VIRTUAL',
    nullable: true,
    insert: false,
    update: false,
  })
  activeCommunityUnitId: string | null;

  @Column({ type: 'datetime' })
  startDate: Date;

  @Column({ type: 'datetime', nullable: true })
  endDate: Date | null;

  @Column({ type: 'char', length: 36, nullable: true })
  assignedBy: string | null;

  @ManyToOne(() => User, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'assignedBy' })
  assignedByUser: Relation<User> | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
