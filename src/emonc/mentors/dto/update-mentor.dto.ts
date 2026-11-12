import { PartialType } from '@nestjs/mapped-types';
import { CreateMentorDto } from './create-mentor.dto.js';

export class UpdateMentorDto extends PartialType(CreateMentorDto) {}
