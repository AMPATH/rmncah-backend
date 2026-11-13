import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import type { Relation } from 'typeorm';

import { SystemModule } from '../../enum/system-module.enum.js';
import { RolePermission } from '../../role-permissions/entities/role-permission.entity.js';
import { UserRoleAssignment } from '../../user-role-assignments/entities/user-role-assignment.entity.js';

@Entity('roles')
@Index(['code'], { unique: true })
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: SystemModule,
  })
  module: SystemModule;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
  permissions: Relation<RolePermission[]>;

  @OneToMany(
    () => UserRoleAssignment,
    (userRoleAssignment) => userRoleAssignment.role,
  )
  userAssignments: Relation<UserRoleAssignment[]>;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
