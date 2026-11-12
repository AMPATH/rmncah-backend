
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';

import { MentorsService } from './mentors.service.js';
import { CreateMentorDto } from './dto/create-mentor.dto.js';
import { UpdateMentorDto } from './dto/update-mentor.dto.js';

@Controller('mentors')
export class MentorsController {
  constructor(
    private readonly mentorsService: MentorsService,
  ) {}

  // 1. Create a mentor account
  @Post()
  create(@Body() createMentorDto: CreateMentorDto) {
    return this.mentorsService.create(createMentorDto);
  }

  // 2. Resend mentor invitation
  @Post(':id/resend-invitation')
  resendInvitation(@Param('id', ParseUUIDPipe) id: string) {
    return this.mentorsService.resendInvitation(id);
  }

  // 3. Get all mentors
  @Get()
  findAll() {
    return this.mentorsService.findAll();
  }

  // 4. Get one mentor by UUID
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.mentorsService.findOne(id);
  }

  // 5. Update mentor details
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMentorDto: UpdateMentorDto,
  ) {
    return this.mentorsService.update(id, updateMentorDto);
  }

  // 6. Deactivate mentor
  @Patch(':id/deactivate')
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.mentorsService.deactivate(id);
  }
}
