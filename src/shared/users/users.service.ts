import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UpdateUserDto } from './dto/update-user.dto.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { User } from './entities/user.entity.js';
import { AccountStatus } from './enum/users.enum.js';
import { InvitationsService } from '../invitations/invitations.service.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly invitationsService: InvitationsService,
  ) {}

  // Create a new user account
  async create(
    createUserDto: CreateUserDto,
    createdBy?: string,
  ): Promise<User> {
    const email = createUserDto.email.toLowerCase();

    // Check whether email already exists
    const existingUser = await this.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    // Check whether phone number already exists, if provided
    if (createUserDto.phoneNumber) {
      const existingPhoneNumber = await this.userRepository.findOne({
        where: { phoneNumber: createUserDto.phoneNumber },
      });

      if (existingPhoneNumber) {
        throw new ConflictException('Phone number is already registered');
      }
    }

    // Prepare the new pending user account
    const newUser = this.userRepository.create({
      ...createUserDto,
      email,
      passwordHash: null,
      mustChangePassword: true,
      status: AccountStatus.PENDING,
      createdBy: createdBy ?? null,
    });

    const user = await this.userRepository.save(newUser);

    // Automatically invite the newly created pending account.
    await this.invitationsService.issueInvitation(
      user.id,
      createdBy ?? null,
    );

    return user;
  }

  // Retrieve all users
  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  // Retrieve one user by ID
  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  // Find user by email
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  // Find user by email, including password hash for authentication
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', {
        email: email.toLowerCase(),
      })
      .getOne();
  }

  // Find a user by ID and explicitly include the password hash.
  async findByIdWithPassword(id: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.id = :id', { id })
      .getOne();
  }

  // Update the password only if the verified hash has not changed.
  async updatePasswordIfUnchanged(
    id: string,
    currentPasswordHash: string,
    newPasswordHash: string,
  ): Promise<boolean> {
    const result = await this.userRepository.update(
      { id, passwordHash: currentPasswordHash },
      {
        passwordHash: newPasswordHash,
        mustChangePassword: false,
      },
    );

    return (result.affected ?? 0) === 1;
  }

  // Update the user's last successful login timestamp
  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, {
      lastLoginAt: new Date(),
    });
  }

  // Update user details
  async update(id: string, updateData: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateData.email) {
      const email = updateData.email.toLowerCase();

      const existingUser = await this.findByEmail(email);

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Email is already registered');
      }

      updateData.email = email;
    }

    Object.assign(user, updateData);

    return this.userRepository.save(user);
  }

  // Delete user
  async delete(id: string): Promise<void> {
    await this.findOne(id);
    await this.userRepository.delete(id);
  }
}
