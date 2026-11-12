import { PartialType } from '@nestjs/mapped-types';
import { CreateFacilityDto } from './create-facility.dto.js';

export class UpdateFacilityDto extends PartialType(CreateFacilityDto) {}
