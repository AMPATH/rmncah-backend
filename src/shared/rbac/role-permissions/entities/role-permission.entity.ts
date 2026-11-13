import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import type { Relation } from 'typeorm';

import { Permission } from '../../permissions/entities/permission.entity.js';
import { Role } from '../../roles/entities/role.entity.js';

@Entity('rolePermissions')
@Unique(['roleId', 'permissionId'])
export class RolePermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  roleId: string;

  @Column({ type: 'varchar', length: 36 })
  permissionId: string;

  @ManyToOne(() => Role, (role) => role.permissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'roleId' })
  role: Relation<Role>;

  @ManyToOne(() => Permission, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'permissionId' })
  permission: Relation<Permission>;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;
}
