import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Req,
  Headers,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserResponseDto } from './dto/responses/user-response.dto.js';

import { ApiStandardSuccessResponse } from '../../common/decorators/api-success-response.decorator.js';
import { ApiErrorResponseDto } from '../../common/dto/api-error-response.dto.js';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { SystemModule } from '../rbac/enum/system-module.enum.js';
import { RequirePermissions } from '../rbac/authorization/decorators/permissions.decorator.js';
import { PermissionsGuard } from '../rbac/authorization/guards/permissions.guard.js';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Create a new user.
  @Post()
  @RequirePermissions(SystemModule.PLATFORM, 'platform.users.create')
  @ApiOperation({
    summary: 'Create a user',
    description:
      'Creates a new user account. Requires the platform.users.create permission.',
  })
  @ApiStandardSuccessResponse(UserResponseDto, {
    status: 201,
    description: 'User account created successfully.',
  })
  @ApiBadRequestResponse({
    type: ApiErrorResponseDto,
    description: 'The supplied user details are invalid.',
  })
  @ApiUnauthorizedResponse({
    type: ApiErrorResponseDto,
    description: 'Authentication is required.',
  })
  @ApiForbiddenResponse({
    type: ApiErrorResponseDto,
    description: 'The user lacks the required permission.',
  })
  @ApiConflictResponse({
    type: ApiErrorResponseDto,
    description: 'A user with the supplied email or phone number already exists.',
  })
  create(
    @Body() createUserDto: CreateUserDto,
    @Req() request: { user: { id: string } },
  ) {
    return this.usersService.create(createUserDto, request.user.id);
  }

  // Create a shared user account for EmONC Mentor or Mentee onboarding.
  // Role and facility assignment are handled separately.
  @ApiHeader({
    name: 'x-organization-assignment-id',
    required: true,
    description: 'UUID of the Program Lead\'s active county organizational assignment.',
  })
  @Post('emonc-mentor-mentees')
  @RequirePermissions(
    SystemModule.EMONC,
    'emonc.users.create_mentor_mentee',
  )
  @ApiOperation({
    summary: 'Create an EmONC mentor or mentee account',
    description:
      'Creates a pending shared user account and sends an invitation. The Program Lead can subsequently assign only the MENTOR or MENTEE role within their authorised county.',
  })
  @ApiStandardSuccessResponse(UserResponseDto, {
    status: 201,
    description: 'Pending EmONC user account created and invitation issued.',
  })
  createEmoncMentorMentee(
    @Body() createUserDto: CreateUserDto,
    @Req() request: { user: { id: string } },
    @Headers('x-organization-assignment-id')
    organizationAssignmentId: string,
  ) {
    return this.usersService.createEmoncMentorMentee(
      createUserDto,
      request.user.id,
      organizationAssignmentId,
    );
  }

  // Retrieve all users.
  @Get()
  @RequirePermissions(SystemModule.PLATFORM, 'platform.users.read')
  @ApiOperation({
    summary: 'List users',
    description:
      'Retrieves all users. Requires the platform.users.read permission.',
  })
  @ApiStandardSuccessResponse(UserResponseDto, {
    isArray: true,
    description: 'Users retrieved successfully.',
  })
  @ApiUnauthorizedResponse({
    type: ApiErrorResponseDto,
    description: 'Authentication is required.',
  })
  @ApiForbiddenResponse({
    type: ApiErrorResponseDto,
    description: 'The user lacks the required permission.',
  })
  findAll() {
    return this.usersService.findAll();
  }

  // Retrieve one user.
  @Get(':id')
  @RequirePermissions(SystemModule.PLATFORM, 'platform.users.read')
  @ApiOperation({
    summary: 'Get a user',
    description:
      'Retrieves a user by their UUID. Requires the platform.users.read permission.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the user.',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiStandardSuccessResponse(UserResponseDto, {
    description: 'User retrieved successfully.',
  })
  @ApiBadRequestResponse({
    type: ApiErrorResponseDto,
    description: 'The supplied user ID is not a valid UUID.',
  })
  @ApiUnauthorizedResponse({
    type: ApiErrorResponseDto,
    description: 'Authentication is required.',
  })
  @ApiForbiddenResponse({
    type: ApiErrorResponseDto,
    description: 'The user lacks the required permission.',
  })
  @ApiNotFoundResponse({
    type: ApiErrorResponseDto,
    description: 'The requested user was not found.',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  // Update user details.
  @Patch(':id')
  @RequirePermissions(SystemModule.PLATFORM, 'platform.users.update')
  @ApiOperation({
    summary: 'Update a user',
    description:
      'Updates an existing user account. Requires the platform.users.update permission.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the user to update.',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiStandardSuccessResponse(UserResponseDto, {
    description: 'User updated successfully.',
  })
  @ApiBadRequestResponse({
    type: ApiErrorResponseDto,
    description: 'The supplied user ID or update details are invalid.',
  })
  @ApiUnauthorizedResponse({
    type: ApiErrorResponseDto,
    description: 'Authentication is required.',
  })
  @ApiForbiddenResponse({
    type: ApiErrorResponseDto,
    description: 'The user lacks the required permission.',
  })
  @ApiNotFoundResponse({
    type: ApiErrorResponseDto,
    description: 'The requested user was not found.',
  })
  @ApiConflictResponse({
    type: ApiErrorResponseDto,
    description: 'The updated email or phone number conflicts with another user.',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  // Deactivate a user account.
  @Delete(':id')
  @RequirePermissions(SystemModule.PLATFORM, 'platform.users.deactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Deactivate a user',
    description:
      'Deactivates a user account. Requires the platform.users.deactivate permission.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the user to deactivate.',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiNoContentResponse({
    description: 'User account deactivated successfully. No response body.',
  })
  @ApiBadRequestResponse({
    type: ApiErrorResponseDto,
    description: 'The supplied user ID is not a valid UUID.',
  })
  @ApiUnauthorizedResponse({
    type: ApiErrorResponseDto,
    description: 'Authentication is required.',
  })
  @ApiForbiddenResponse({
    type: ApiErrorResponseDto,
    description: 'The user lacks the required permission.',
  })
  @ApiNotFoundResponse({
    type: ApiErrorResponseDto,
    description: 'The requested user was not found.',
  })
  @ApiConflictResponse({
    type: ApiErrorResponseDto,
    description: 'The user account is already deactivated or cannot be deactivated.',
  })
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: { user: { id: string } },
  ) {
    return this.usersService.deactivate(id, request.user.id);
  }

  // Restore a previously deactivated user account.
  @Patch(':id/restore')
  @RequirePermissions(SystemModule.PLATFORM, 'platform.users.restore')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Restore a user',
    description:
      'Restores a previously deactivated user account. Requires the platform.users.restore permission.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the user to restore.',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiNoContentResponse({
    description: 'User account restored successfully. No response body.',
  })
  @ApiBadRequestResponse({
    type: ApiErrorResponseDto,
    description: 'The supplied user ID is not a valid UUID.',
  })
  @ApiUnauthorizedResponse({
    type: ApiErrorResponseDto,
    description: 'Authentication is required.',
  })
  @ApiForbiddenResponse({
    type: ApiErrorResponseDto,
    description: 'The user lacks the required permission.',
  })
  @ApiNotFoundResponse({
    type: ApiErrorResponseDto,
    description: 'The requested user was not found.',
  })
  @ApiConflictResponse({
    type: ApiErrorResponseDto,
    description: 'The user account is not in a restorable state.',
  })
  restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.restore(id);
  }
}
