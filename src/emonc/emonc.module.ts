import { Module } from '@nestjs/common';
import { MentorsModule } from './mentors/mentors.module.js';

@Module({
    imports: [
        MentorsModule
    ],


  controllers: [],
  providers: [],
  exports: [],
})
export class EmoncModule {}
