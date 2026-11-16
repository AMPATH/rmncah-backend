import { Module } from '@nestjs/common';
import { MenteesController } from './mentees.controller.js';
import { MenteesService } from './mentees.service.js';
import { User } from '../../shared/users/entities/user.entity.js';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [MenteesController],
  providers: [MenteesService]
})
export class MenteesModule {}
