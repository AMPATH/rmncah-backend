import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum SystemBootstrapStatus {
  PENDING_INVITATION = 'PENDING_INVITATION',
  INVITATION_SENT = 'INVITATION_SENT',
  COMPLETED = 'COMPLETED',
}

@Entity('systemBootstrap')
export class SystemBootstrap {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  bootstrapKey: string;

  @Column({ type: 'varchar', length: 36, unique: true })
  initialAdminUserId: string;

  @Column({
    type: 'varchar',
    length: 30,
    default: SystemBootstrapStatus.PENDING_INVITATION,
  })
  status: SystemBootstrapStatus;

  @CreateDateColumn({ type: 'datetime', precision: 0 })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', precision: 0 })
  updatedAt: Date;
}
