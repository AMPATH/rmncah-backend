import { Column, Entity, PrimaryGeneratedColumn,
    CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
 } from 'typeorm';


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
 
}



@Entity('users')

export class User {
    @PrimaryGeneratedColumn('uuid')
    id : string;
    @Column({
      name:'firstName',
      type:'varchar',
      length:255,
    })
    firstName : string;
    @Column({
      name:'lastName',
      type:'varchar',
      length:255,
    })
    lastName : string;
    @Column({
      name:'email',
      type:'varchar',
      length:255,
      unique:true
    })
    email : string;

    @Column( {
      name:'phoneNumber',
      type:'varchar',
      unique:true,
      nullable:true, length:20})
    phoneNumber : string;

//     @Column({
//   name: 'invitationAcceptedAt',
//   type: 'datetime',
//   nullable: true,
// })
// invitationAcceptedAt: Date | null;


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
    default: AccountStatus.PENDING,
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



