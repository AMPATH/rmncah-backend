
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import { UpdateUserDto } from './dto/update-user.dto.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { AccountStatus } from './entities/user.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity.js';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}


  //create 
  
// Create a new user account
async create(createUserDto: CreateUserDto): Promise<User> {
  const email = createUserDto.email.toLowerCase();

  // Check whether email already exists
  const existingUser = await this.findByEmail(email);

  if (existingUser) {
    throw new ConflictException('Email is already registered');
  }

  // Prepare the new user
  const newUser = this.userRepository.create({
    ...createUserDto,
    email,
    passwordHash: null,
    mustChangePassword: true,
    status: AccountStatus.PENDING,
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
      throw new NotFoundException(
        `User with ID ${id} not found`,
      );
    }

    return user;
  }

  // Find user by email
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  // Update user details
  async update(
    id: string,
    updateData: UpdateUserDto,
  ): Promise<User> {
    const user = await this.findOne(id);

    if (updateData.email) {
      const email = updateData.email.toLowerCase();

      const existingUser = await this.findByEmail(email);

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException(
          'Email is already registered',
        );
      }

      updateData.email = email;
    }

    Object.assign(user, updateData);

    return this.userRepository.save(user);
  }

  // delete user
  async delete(id: string): Promise<void> {
    const user = await this.findOne(id);

    await this.userRepository.delete(id);
  }
}
