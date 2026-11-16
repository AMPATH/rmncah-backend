
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserLocation } from './entities/user-location.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([UserLocation])],
  exports: [TypeOrmModule],
})
export class UserLocationsModule {}
  