
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import { User } from '../../../../shared/users/entities/user.entity.js';
import { MentorInvitationStatus } from '../enum/invitation.enum.js';

@Entity('mentor_invitations')
@Index(['userId', 'status'])
export class MentorInvitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'userId',
    type: 'char',
    length: 36,
  })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    name: 'tokenHash',
    type: 'varchar',
    length: 64,
    unique: true,
  })
  tokenHash: string;

  @Column({
    name: 'otpHash',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  otpHash: string | null;

  @Column({
    name: 'status',
    type: 'enum',
    enum: MentorInvitationStatus,
    default: MentorInvitationStatus.PENDING,
  })
  status: MentorInvitationStatus;

  @Column({
    name: 'expiresAt',
    type: 'datetime',
  })
  expiresAt: Date;

  @Column({
    name: 'otpExpiresAt',
    type: 'datetime',
    nullable: true,
  })
  otpExpiresAt: Date | null;

  @Column({
    name: 'attempts',
    type: 'int',
    default: 0,
  })
  attempts: number;

  @Column({
    name: 'acceptedAt',
    type: 'datetime',
    nullable: true,
  })
  acceptedAt: Date | null;

  @Column({
    name: 'verifiedAt',
    type: 'datetime',
    nullable: true,
  })
  verifiedAt: Date | null;

  @Column({
    name: 'completedAt',
    type: 'datetime',
    nullable: true,
  })
  completedAt: Date | null;

  @CreateDateColumn({
    name: 'createdAt',
    type: 'datetime',
  })
  createdAt: Date;
}
