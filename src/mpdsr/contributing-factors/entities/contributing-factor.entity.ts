import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { DelayLevel } from '../enums/delay-level.enum.js';

@Entity('contributingFactors')
@Index('UQ_contributingFactors_code', ['code'], { unique: true })
@Index('IDX_contributingFactors_delayLevel_isActive', [
  'delayLevel',
  'isActive',
])
export class ContributingFactor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 30 })
  code: string;

  @Column({
    type: 'enum',
    enum: DelayLevel,
  })
  delayLevel: DelayLevel;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
