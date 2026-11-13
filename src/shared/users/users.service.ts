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

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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

    // Prepare the new user
    const newUser = this.userRepository.create({
      ...createUserDto,
      email,
      passwordHash: null,
      mustChangePassword: true,
      status: AccountStatus.PENDING,
      createdBy: createdBy ?? null,
    });

    // Save user in the database
    return this.userRepository.save(newUser);
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

  // Update the user's last successful login timestamp
  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, {
      lastLoginAt: new Date(),
    });
  }

  // Update user details and, where authorized, account status
  async update(
    id: string,
    updateData: UpdateUserDto & { status?: AccountStatus },
  ): Promise<User> {
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
