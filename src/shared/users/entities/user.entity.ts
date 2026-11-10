import { Column, Entity, PrimaryGeneratedColumn,
    CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
 } from 'typeorm';
 import {CreateUserDto} from '../dto/create-user.dto.js';

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  DEACTIVATED = 'DEACTIVATED'
}
export enum OrganizationLevel {
  COUNTY = 'COUNTY',
  SUB_COUNTY = 'SUB_COUNTY',
  FACILITY = 'FACILITY',
  COMMUNITY = 'COMMUNITY',
  OTHER = 'OTHER',
}



@Entity('users')

export class User {
    @PrimaryGeneratedColumn('uuid')
    id : string;
    @Column()
    firstName : string;
    @Column()
    lastName : string;
    @Column({unique:true})
    email : string;
    @Column( {nullable:true, length:20})
    phoneNumber : string;
@Column({
  name: 'password_hash',
  type: 'varchar',
  length: 255,
  select: false,
  nullable: true,
})
passwordHash: string | null;

     @Column({ name: 'must_change_password', default: true })
  mustChangePassword: boolean;

  @Column({ name: 'cadre_id', type: 'char', length: 36, nullable: true })
  cadreId: string;

  @Column({
    type: 'enum',
    enum: OrganizationLevel,
    name: 'level',
  })
  level: OrganizationLevel;
  
   @Column({
    type: 'enum',
    enum: AccountStatus,
    default: AccountStatus.ACTIVE,
  })
  status: AccountStatus;
 @Column({ name: 'last_login_at', nullable: true })
  lastLoginAt: Date;

  @Column({ name: 'created_by', type: 'char', length: 36, nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date;

}



