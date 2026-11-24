
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

import { ContentLibraryService } from './content-library.service.js';

import { CreateContentLibraryDto } from './dto/create-content-library.dto.js';
import { UpdateContentLibraryDto } from './dto/update-content-library.dto.js';
import { ContentLibraryQueryDto } from './dto/content-library-query.dto.js';

import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard.js';

import { RolesGuard } from '../../../shared/rbac/roles/guards/roles.guard.js';
import { Roles } from '../../../shared/rbac/roles/decorators/roles.decorator.js';

import { SystemModule } from '../../../shared/rbac/enum/system-module.enum.js';
import { EmoncRole } from '../../../shared/enums/emonc-role.enum.js';

const contentLibraryUpload = () =>
  FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/content-library',

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

@Controller('emonc/content-library')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SystemModule.EMONC, EmoncRole.PROGRAM_LEAD)
export class ContentLibraryController {
  constructor(
    private readonly contentLibraryService: ContentLibraryService,
  ) {}

  // Create a content library resource
  @Post()
  @UseInterceptors(contentLibraryUpload())
  create(
    @Body() dto: CreateContentLibraryDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.contentLibraryService.create(dto, file);
  }

  // Retrieve all resources with pagination and filters
  @Get()
  findAll(@Query() query: ContentLibraryQueryDto) {
    return this.contentLibraryService.findAll(query);
  }

  // Retrieve one resource
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.contentLibraryService.findOne(id);
  }

  // Update resource details or replace its file
  @Patch(':id')
  @UseInterceptors(contentLibraryUpload())
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContentLibraryDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.contentLibraryService.update(id, dto, file);
  }

  // Deactivate a resource
  @Patch(':id/deactivate')
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.contentLibraryService.deactivate(id);
  }

  // Delete a resource
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.contentLibraryService.remove(id);
  }
}
