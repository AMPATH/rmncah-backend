import { PartialType } from '@nestjs/mapped-types';
import { CreateContentLibraryDto } from './create-content-library.dto.js';

export class UpdateContentLibraryDto extends PartialType(CreateContentLibraryDto) {}
