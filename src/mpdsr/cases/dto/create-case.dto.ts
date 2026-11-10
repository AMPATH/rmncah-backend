import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  IsDefined,
  IsObject,
} from 'class-validator';

import { CaseType, ReportingSetting, Gender } from '../enums/case.enum.js';

import {
  IsNotFutureDate,
  IsSameOrAfterDate,
} from './validators/date.validators.js';

// Validates reporting setting, location IDs and near-miss restrictions.
@ValidatorConstraint({ name: 'reportingLocation', async: false })
class ReportingLocationConstraint implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments): boolean {
    const dto = args.object as CreateCaseDto;

    // Let enum validators handle missing or invalid enum values.
    if (!dto.caseType || !dto.reportingSetting) {
      return true;
    }

    // Near-miss cases can only be reported from facilities.
    if (
      dto.caseType === CaseType.NEAR_MISS &&
      dto.reportingSetting !== ReportingSetting.FACILITY
    ) {
      return false;
    }

    // Facility reports require facilityId and prohibit communityUnitId.
    if (dto.reportingSetting === ReportingSetting.FACILITY) {
      return Boolean(dto.facilityId) && !dto.communityUnitId;
    }

    // Community reports require communityUnitId and prohibit facilityId.
    if (dto.reportingSetting === ReportingSetting.COMMUNITY) {
      return Boolean(dto.communityUnitId) && !dto.facilityId;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    const dto = args.object as CreateCaseDto;

    if (
      dto.caseType === CaseType.NEAR_MISS &&
      dto.reportingSetting !== ReportingSetting.FACILITY
    ) {
      return 'Near-miss cases can only be reported from a facility.';
    }

    if (dto.reportingSetting === ReportingSetting.FACILITY) {
      return 'Facility reports require facilityId and must not include communityUnitId.';
    }

    return 'Community reports require communityUnitId and must not include facilityId.';
  }
}

export class CreateCaseDto {
  @IsEnum(CaseType)
  caseType: CaseType;

  @IsEnum(ReportingSetting)
  @Validate(ReportingLocationConstraint)
  reportingSetting: ReportingSetting;

  // Validate UUID only when a facility ID is supplied.
  @ValidateIf((dto) => dto.facilityId !== undefined && dto.facilityId !== null)
  @IsUUID()
  facilityId?: string;

  // Validate UUID only when a community unit ID is supplied.
  @ValidateIf(
    (dto) => dto.communityUnitId !== undefined && dto.communityUnitId !== null,
  )
  @IsUUID()
  communityUnitId?: string;

  // Must be a valid date and cannot be in the future.
  @IsDateString({ strict: true })
  @IsNotFutureDate()
  dateOfBirth: string;

  @IsEnum(Gender)
  gender: Gender;

  // Must be valid, cannot be in the future,
  // and cannot be earlier than dateOfBirth.
  @IsDateString({ strict: true })
  @IsNotFutureDate()
  @IsSameOrAfterDate('dateOfBirth')
  notificationDate: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  comments?: string;

  @IsDefined()
  @IsObject()
  details: Record<string, unknown>;
}
