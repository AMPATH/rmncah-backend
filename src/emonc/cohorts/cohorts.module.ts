
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CohortsService } from './cohorts.service.js';
import { CohortsController } from './cohorts.controller.js';

import { Cohort } from './entities/cohort.entity.js';
import { CohortMentee } from './entities/cohort-mentee.entity.js';

import { Facility } from '../../facilities/entities/facility.entity.js';
import { User } from '../../shared/users/entities/user.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Cohort,
      CohortMentee,
      Facility,
      User,
    ]),
  ],
  controllers: [CohortsController],
  providers: [CohortsService],
  exports: [CohortsService],
})
export class CohortsModule {}
