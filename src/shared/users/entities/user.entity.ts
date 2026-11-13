import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { AccountStatus, OrganizationLevel } from '../enum/users.enum.js';

export { AccountStatus, OrganizationLevel };

import { UserOrganizationAssignment } from '../../user-organization-assignments/entities/user-organization-assignment.entity.js';

@Entity('users')
@Index('IDX_users_email', ['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'firstName',
    type: 'varchar',
    length: 255,
  })
  firstName: string;

  @Column({
    name: 'lastName',
    type: 'varchar',
    length: 255,
  })
  lastName: string;

  @Column({
    name: 'email',
    type: 'varchar',
    length: 255,
  })
  email: string;

  @Column({
    name: 'phoneNumber',
    type: 'varchar',
    length: 20,
    unique: true,
    nullable: true,
  })
  phoneNumber: string | null;

  @Column({
    name: 'invitationAcceptedAt',
    type: 'datetime',
    nullable: true,
  })
  invitationAcceptedAt: Date | null;

  @Column({
    name: 'passwordHash',
    type: 'varchar',
    length: 255,
    select: false,
    nullable: true,
  })
  passwordHash: string | null;

  @Column({
    name: 'mustChangePassword',
    type: 'boolean',
    default: true,
  })
  mustChangePassword: boolean;

  @Column({
    name: 'cadreId',
    type: 'char',
    length: 36,
    nullable: true,
  })
  cadreId: string | null;

  @Column({
    name: 'status',
    type: 'enum',
    enum: AccountStatus,
    default: AccountStatus.PENDING,
  })
  status: AccountStatus;

  @Column({
    name: 'lastLoginAt',
    type: 'datetime',
    nullable: true,
  })
  lastLoginAt: Date | null;

  @Column({
    name: 'createdBy',
    type: 'char',
    length: 36,
    nullable: true,
  })
  createdBy: string | null;

  @CreateDateColumn({
    name: 'createdAt',
    type: 'datetime',
    precision: 0,
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updatedAt',
    type: 'datetime',
    precision: 0,
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @DeleteDateColumn({
    name: 'deletedAt',
    type: 'datetime',
    precision: 0,
    nullable: true,
  })
  deletedAt: Date | null;

  @OneToMany(() => UserOrganizationAssignment, (assignment) => assignment.user)
  organizationAssignments: UserOrganizationAssignment[];
}
