import { ApiProperty } from '@nestjs/swagger';

import { DelayLevel } from '../../enums/delay-level.enum.js';

export class ContributingFactorsListResponseDto {
  @ApiProperty({
    description: 'List of active contributing factors.',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          description: 'Unique contributing factor identifier.',
        },
        code: {
          type: 'string',
          description: 'Unique contributing factor code.',
        },
        name: {
          type: 'string',
          description: 'Name of the contributing factor.',
        },
        delayLevel: {
          type: 'string',
          enum: Object.values(DelayLevel),
          description: 'Delay level associated with the factor.',
        },
        isActive: {
          type: 'boolean',
          description: 'Whether the contributing factor is active.',
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
        },
      },
    },
  })
  data: Record<string, unknown>[];

  @ApiProperty({
    description: 'Total number of active contributing factors returned.',
    example: 0,
  })
  total: number;
}
