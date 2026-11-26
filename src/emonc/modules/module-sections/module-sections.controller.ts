
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { ModuleSectionsService } from './module-sections.service.js';

import { CreateModuleSectionDto } from './dto/create-module-section.dto.js';
import { UpdateModuleSectionDto } from './dto/update-module-section.dto.js';

import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard.js';

import { RolesGuard } from '../../../shared/rbac/roles/guards/roles.guard.js';
import { Roles } from '../../../shared/rbac/roles/decorators/roles.decorator.js';

import { SystemModule } from '../../../shared/rbac/enum/system-module.enum.js';
import { EmoncRole } from '../../../shared/enums/emonc-role.enum.js';


@Controller('emonc/module-sections')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SystemModule.EMONC, EmoncRole.PROGRAM_LEAD)
export class ModuleSectionsController {
  constructor(
    private readonly moduleSectionsService: ModuleSectionsService,
  ) {}

  // Create a section under a training module
  @Post()
  create(@Body() createModuleSectionDto: CreateModuleSectionDto) {
    return this.moduleSectionsService.create(createModuleSectionDto);
  }

  // Retrieve all sections belonging to a training module
  @Get('module/:moduleId')
  findAll(
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
  ) {
    return this.moduleSectionsService.findAll(moduleId);
  }

  // Retrieve one section
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.moduleSectionsService.findOne(id);
  }

  // Update a section
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateModuleSectionDto: UpdateModuleSectionDto,
  ) {
    return this.moduleSectionsService.update(id, updateModuleSectionDto);
  }

  // Delete a section
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.moduleSectionsService.remove(id);
  }
}
