import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ContentLibrary } from './entities/content-library.entity.js';
import { ContentLibraryService } from './content-library.service.js';
import { ContentLibraryController } from './content-library.controller.js';
import { UserRoleAssignment } from '../../../shared/rbac/user-role-assignments/entities/user-role-assignment.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([ContentLibrary,
       UserRoleAssignment,

    ]),
  ],
  controllers: [ContentLibraryController],
  providers: [ContentLibraryService],
  exports: [ContentLibraryService],
})
export class ContentLibraryModule {}