
import { Injectable, NotFoundException } from '@nestjs/common';

import { CreateMentorDto } from './dto/create-mentor.dto.js';
import { UpdateMentorDto } from './dto/update-mentor.dto.js';

import { UsersService } from '../../shared/users/users.service.js';


import { InvitationsService } from './invitations/invitations.service.js';
import { AccountStatus } from '../../shared/users/enum/users.enum.js';
import { User } from '../../shared/users/entities/user.entity.js';

@Injectable()
export class MentorsService {
  constructor(
    private readonly usersService: UsersService,
    private readonly invitationsService: InvitationsService,
  ) {}

  // 1. Create a new mentor and generate an invitation
  async create(
    createMentorDto: CreateMentorDto,
    createdBy?: string,
  ) {
    const mentor = await this.usersService.create(
      createMentorDto,
      createdBy,
    );

    const pendingMentor = await this.usersService.update(mentor.id, {
      status: AccountStatus.PENDING,
    } as any);

    const invitation = await this.invitationsService.createInvitation(
      pendingMentor.id,
    );

    return {
      message: 'Mentor created and invitation sent successfully',
      mentor: pendingMentor,
      invitation: {
        id: invitation.invitationId,
        expiresAt: invitation.expiresAt,
      },
    };
  }

  // 2. Resend invitation to an existing mentor
  async resendInvitation(userId: string) {
    return this.invitationsService.resendInvitation(userId);
  }

  // 3. Get all mentors
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  // 4. Get one mentor by ID
  async findOne(id: string): Promise<User> {
    const mentor = await this.usersService.findOne(id);

    if (!mentor) {
      throw new NotFoundException(`Mentor with ID ${id} not found`);
    }

    return mentor;
  }

  // 5. Update mentor details
  async update(
    id: string,
    updateMentorDto: UpdateMentorDto,
  ): Promise<User> {
    return this.usersService.update(id, updateMentorDto);
  }

  // 6. Deactivate mentor
  async deactivate(id: string): Promise<User> {
    const mentor = await this.usersService.findOne(id);

    if (!mentor) {
      throw new NotFoundException(`Mentor with ID ${id} not found`);
    }

    return this.usersService.update(id, {
      status: AccountStatus.DEACTIVATED,
    } as any);
  }
}
