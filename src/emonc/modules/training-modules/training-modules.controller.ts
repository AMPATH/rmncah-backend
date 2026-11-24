
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { TrainingModulesService } from './training-modules.service.js';

import { CreateTrainingModuleDto } from './dto/create-training-module.dto.js';
import { UpdateTrainingModuleDto } from './dto/update-training-module.dto.js';
import { TrainingModuleQueryDto } from './dto/training-module-query.dto.js';

import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard.js';

import { RolesGuard } from '../../../shared/rbac/roles/guards/roles.guard.js';
import { Roles } from '../../../shared/rbac/roles/decorators/roles.decorator.js';

import { SystemModule } from '../../../shared/rbac/enum/system-module.enum.js';
import { EmoncRole } from '../../../shared/enums/emonc-role.enum.js';

@Controller('emonc/training-modules')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SystemModule.EMONC, EmoncRole.PROGRAM_LEAD)
export class TrainingModulesController {
  constructor(
    private readonly trainingModulesService: TrainingModulesService,
  ) {}

  // Create a training module
  @Post()
  create(@Body() createTrainingModuleDto: CreateTrainingModuleDto) {
    return this.trainingModulesService.create(createTrainingModuleDto);
  }

  // Retrieve all training modules
  @Get()
  findAll(@Query() query: TrainingModuleQueryDto) {
    return this.trainingModulesService.findAll(query);
  }

  // Retrieve one training module
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.trainingModulesService.findOne(id);
  }

  // Update a training module
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTrainingModuleDto: UpdateTrainingModuleDto,
  ) {
    return this.trainingModulesService.update(id, updateTrainingModuleDto);
  }

  // Publish a training module
  @Patch(':id/publish')
  publish(@Param('id', ParseUUIDPipe) id: string) {
    return this.trainingModulesService.publish(id);
  }

  // Unpublish a training module
  @Patch(':id/unpublish')
  unpublish(@Param('id', ParseUUIDPipe) id: string) {
    return this.trainingModulesService.unpublish(id);
  }

  // Delete a training module
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.trainingModulesService.remove(id);
  }
}
