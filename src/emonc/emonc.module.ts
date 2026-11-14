import { Module } from '@nestjs/common';
import { MentorsModule } from './mentors/mentors.module.js';
import { MenteesModule } from './mentees/mentees.module.js';
import { CohortsModule } from './cohorts/cohorts.module.js';

@Module({
    imports: [
        MentorsModule,
        MenteesModule,
        CohortsModule
    ],


  controllers: [],
  providers: [],
  exports: [],
})
export class EmoncModule {}
