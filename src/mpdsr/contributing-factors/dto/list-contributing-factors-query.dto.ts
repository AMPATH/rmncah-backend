import { IsEnum, IsOptional } from 'class-validator';

import { DelayLevel } from '../enums/delay-level.enum.js';

export class ListContributingFactorsQueryDto {
  @IsOptional()
  @IsEnum(DelayLevel)
  delayLevel?: DelayLevel;
}
