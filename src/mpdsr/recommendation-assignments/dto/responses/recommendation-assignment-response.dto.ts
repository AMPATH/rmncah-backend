import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  RecommendationAssignmentLevel,
  RecommendationAssignmentStatus,
  RecommendationClassification,
} from '../../enums/recommendation-assignment.enum.js';

export class RecommendationAssignmentResponseDto {
  @ApiProperty({ description: 'Unique assignment identifier.', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'ID of the recommendation being assigned.', format: 'uuid' })
  recommendationId: string;

  @ApiProperty({ enum: RecommendationClassification })
  classification: RecommendationClassification;

  @ApiProperty({ enum: RecommendationAssignmentLevel })
  targetLevel: RecommendationAssignmentLevel;

  @ApiProperty({ type: String, nullable: true, format: 'uuid' })
  countyId: string | null;

  @ApiProperty({ type: String, nullable: true, format: 'uuid' })
  subCountyId: string | null;

  @ApiProperty({ type: String, nullable: true, format: 'uuid' })
  facilityId: string | null;

  @ApiProperty({ type: String, nullable: true, format: 'uuid' })
  communityUnitId: string | null;

  @ApiProperty({ description: 'ID of the user responsible for the assignment.', format: 'uuid' })
  responsibleUserId: string;

  @ApiProperty({ description: 'ID of the user who created the assignment.', format: 'uuid' })
  assignedBy: string;

  @ApiProperty({ type: String, format: 'date', description: 'Assignment due date.' })
  dueDate: string;

  @ApiProperty({ type: String, nullable: true })
  instructions: string | null;

  @ApiProperty({ type: String, nullable: true })
  declineReason: string | null;

  @ApiProperty({ type: String, nullable: true })
  reassignmentReason: string | null;

  @ApiProperty({ enum: RecommendationAssignmentStatus })
  status: RecommendationAssignmentStatus;

  @ApiProperty({ type: String, nullable: true, format: 'uuid' })
  previousAssignmentId: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Responsible user details. Included in assignment history responses.',
    type: 'object',
    nullable: true,
    additionalProperties: true,
    properties: {
      id: { type: 'string', format: 'uuid' },
      firstName: { type: 'string' },
      lastName: { type: 'string' },
      email: { type: 'string', format: 'email' },
    },
  })
  responsibleUser?: Record<string, unknown> | null;

  @ApiPropertyOptional({
    description: 'User who created the assignment. Included in assignment history responses.',
    type: 'object',
    nullable: true,
    additionalProperties: true,
    properties: {
      id: { type: 'string', format: 'uuid' },
      firstName: { type: 'string' },
      lastName: { type: 'string' },
      email: { type: 'string', format: 'email' },
    },
  })
  assigner?: Record<string, unknown> | null;

  @ApiPropertyOptional({
    description: 'County details, when the assignment targets a county.',
    type: 'object',
    nullable: true,
    additionalProperties: true,
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      code: { type: 'string' },
    },
  })
  county?: Record<string, unknown> | null;

  @ApiPropertyOptional({
    description: 'Sub-county details, when the assignment targets a sub-county.',
    type: 'object',
    nullable: true,
    additionalProperties: true,
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      code: { type: 'string' },
    },
  })
  subCounty?: Record<string, unknown> | null;

  @ApiPropertyOptional({
    description: 'Facility details, when the assignment targets a facility.',
    type: 'object',
    nullable: true,
    additionalProperties: true,
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      mflCode: { type: 'string' },
    },
  })
  facility?: Record<string, unknown> | null;

  @ApiPropertyOptional({
    description: 'Community unit details, when the assignment targets a community unit.',
    type: 'object',
    nullable: true,
    additionalProperties: true,
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      code: { type: 'string' },
    },
  })
  communityUnit?: Record<string, unknown> | null;
}
