import { PartialType } from '@nestjs/swagger';
import { CreateProgressDto } from './create-progress.dto.js';

export class UpdateProgressDto extends PartialType(CreateProgressDto) {}
