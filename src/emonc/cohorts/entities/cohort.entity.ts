
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,

} from 'typeorm';
import  type { Relation } from 'typeorm';

import { User } from '../../../shared/users/entities/user.entity.js';
import { CohortMentee } from './cohort-mentee.entity.js';
import { CohortStatus } from '../enum/cohorts.enum.js';
import { Facility } from '../../../facilities/entities/facility.entity.js';

@Entity('cohorts')
@Index(['facilityId', 'status'])
@Index(['mentorId', 'status'])
export class Cohort {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 150,
  })
  name: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description: string | null;

  @Column({
    name: 'facilityId',
    type: 'varchar',
    length: 36,
  })
  facilityId: string;

  @Column({
    name: 'mentorId',
    type: 'varchar',
    length: 36,
  })
  mentorId: string;

  @Column({
    name: 'startDate',
    type: 'date',
    nullable: true,
  })
  startDate: string;

  @Column({
    name: 'endDate',
    type: 'date',
    nullable: true,
  })
  endDate: string;

  @Column({
    type: 'enum',
    enum: CohortStatus,
    default: CohortStatus.DRAFT,
  })
  status: CohortStatus;

  // Relationship with the assigned facility.
  @ManyToOne(() => Facility, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'facilityId',
    referencedColumnName: 'id',
  })
  facility: Relation<Facility>;

  // Relationship with the assigned mentor.
  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'mentorId',
    referencedColumnName: 'id',
  })
  mentor: Relation<User>;

  // Relationship with cohort mentee memberships.
  @OneToMany(
    () => CohortMentee,
    (cohortMentee) => cohortMentee.cohort,
  )
  memberships: Relation<CohortMentee[]>;

  @CreateDateColumn({
    name: 'createdAt',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updatedAt',
  })
  updatedAt: Date;
}
