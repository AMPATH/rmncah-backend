import { Module } from '@nestjs/common';
import { MentorsModule } from './mentors/mentors.module.js';
import { MenteesModule } from './mentees/mentees.module.js';

@Module({
    imports: [
        MentorsModule,
        MenteesModule
    ],


  controllers: [],
  providers: [],
  exports: [],
})
export class EmoncModule {}
