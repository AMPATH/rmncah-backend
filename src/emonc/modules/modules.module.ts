
import { Module } from '@nestjs/common';

import { TrainingModulesModule } from './training-modules/training-modules.module.js';
import { ModuleSectionsModule } from './module-sections/module-sections.module.js';
import { LearningMaterialsModule } from './learning-materials/learning-materials.module.js';
import { ContentLibraryModule } from './content-library/content-library.module.js';

@Module({
  imports: [
    TrainingModulesModule,
    ModuleSectionsModule,
    LearningMaterialsModule,
    ContentLibraryModule,
  ],
})
export class ModulesModule {}
