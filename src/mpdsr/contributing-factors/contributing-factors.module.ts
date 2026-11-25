import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RbacModule } from '../../shared/rbac/rbac.module.js';

import { ContributingFactor } from './entities/contributing-factor.entity.js';
import { ContributingFactorsController } from './contributing-factors.controller.js';
import { ContributingFactorsService } from './contributing-factors.service.js';

@Module({
  imports: [
    RbacModule,
    TypeOrmModule.forFeature([ContributingFactor]),
  ],
  controllers: [ContributingFactorsController],
  providers: [ContributingFactorsService],
  exports: [ContributingFactorsService],
})
export class ContributingFactorsModule {}
