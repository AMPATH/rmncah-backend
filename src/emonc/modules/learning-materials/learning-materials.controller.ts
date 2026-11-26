
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
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { diskStorage } from 'multer';
import { extname } from 'node:path';

import { LearningMaterialsService } from './learning-materials.service.js';

import { CreateLearningMaterialDto } from './dto/create-learning-material.dto.js';
import { UpdateLearningMaterialDto } from './dto/update-learning-material.dto.js';
import { LearningMaterialQueryDto } from './dto/learning-material-query.dto.js';

import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard.js';

import { RolesGuard } from '../../../shared/rbac/roles/guards/roles.guard.js';
import { Roles } from '../../../shared/rbac/roles/decorators/roles.decorator.js';

import { SystemModule } from '../../../shared/rbac/enum/system-module.enum.js';
import { EmoncRole } from '../../../shared/enums/emonc-role.enum.js';

@Controller('emonc/learning-materials')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SystemModule.EMONC, EmoncRole.PROGRAM_LEAD)
export class LearningMaterialsController {
  constructor(
    private readonly learningMaterialsService: LearningMaterialsService,
  ) {}

  // Reusable upload configuration
  private readonly uploadInterceptor = FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/learning-materials',
      filename: (req, file, callback) => {
        const uniqueSuffix =
          `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

        callback(
          null,
          `${uniqueSuffix}${extname(file.originalname)}`,
        );
      },
    }),
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (req, file, callback) => {
      const allowedMimeTypes = [
        'application/pdf',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      ];

      if (!allowedMimeTypes.includes(file.mimetype)) {
        return callback(
          new BadRequestException(
            'Only PDF, PPT and PPTX files are allowed',
          ),
          false,
        );
      }

      callback(null, true);
    },
  });

  // Create a learning material
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/learning-materials',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

          callback(
            null,
            `${uniqueSuffix}${extname(file.originalname)}`,
          );
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (req, file, callback) => {
        const allowedMimeTypes = [
          'application/pdf',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
          return callback(
            new BadRequestException(
              'Only PDF, PPT and PPTX files are allowed',
            ),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  create(
    @Body() createLearningMaterialDto: CreateLearningMaterialDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.learningMaterialsService.create(
      createLearningMaterialDto,
      file,
    );
  }

  // Retrieve materials belonging to a section
  @Get('section/:moduleSectionId')
  findAll(
    @Param('moduleSectionId', ParseUUIDPipe) moduleSectionId: string,
    @Query() query: LearningMaterialQueryDto,
  ) {
    return this.learningMaterialsService.findAll(
      moduleSectionId,
      query,
    );
  }

  // Retrieve one learning material
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.learningMaterialsService.findOne(id);
  }

  // Update a learning material, optionally replacing its file
  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/learning-materials',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

          callback(
            null,
            `${uniqueSuffix}${extname(file.originalname)}`,
          );
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (req, file, callback) => {
        const allowedMimeTypes = [
          'application/pdf',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
          return callback(
            new BadRequestException(
              'Only PDF, PPT and PPTX files are allowed',
            ),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateLearningMaterialDto: UpdateLearningMaterialDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.learningMaterialsService.update(
      id,
      updateLearningMaterialDto,
      file,
    );
  }

  // Delete a learning material
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.learningMaterialsService.remove(id);
  }
}
