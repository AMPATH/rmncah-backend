import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { County } from './entities/county.entity.js';
import { SubCounty } from '../sub-counties/entities/sub-county.entity.js';

import { CountiesController } from './counties.controller.js';
import { CountiesService } from './counties.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([County, SubCounty])],
  controllers: [CountiesController],
  providers: [CountiesService],
  exports: [CountiesService],
})
export class CountiesModule {}
