import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Validate a date-only value in strict YYYY-MM-DD format.
 *
 * This checks the actual calendar date without relying on
 * JavaScript's special handling of years 0 through 99.
 */
function isValidDateOnly(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);

  if (year < 1 || month < 1 || month > 12 || day < 1) {
    return false;
  }

  const isLeapYear = year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);

  const daysInMonth = [
    31,
    isLeapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  return day <= daysInMonth[month - 1];
}

/**
 * Get today's date according to the Kenya timezone.
 *
 * This is important because the application server may run
 * in a different timezone.
 */
function getTodayInKenya(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Nairobi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const values: Record<string, string> = {};

  for (const part of parts) {
    values[part.type] = part.value;
  }

  return `${values.year}-${values.month}-${values.day}`;
}

@ValidatorConstraint({
  name: 'isNotFutureDate',
  async: false,
})
export class IsNotFutureDateConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    // Optional fields are handled by their DTO decorators.
    if (value === undefined || value === null) {
      return true;
    }

    if (!isValidDateOnly(value)) {
      return false;
    }

    return value <= getTodayInKenya();
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a valid date that is not in the future.`;
  }
}

export function IsNotFutureDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: IsNotFutureDateConstraint,
    });
  };
}

@ValidatorConstraint({
  name: 'isSameOrAfterDate',
  async: false,
})
export class IsSameOrAfterDateConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    if (value === undefined || value === null) {
      return true;
    }

    if (!isValidDateOnly(value)) {
      return false;
    }

    const [relatedProperty] = args.constraints as [string];

    const relatedDate = (args.object as Record<string, unknown>)[
      relatedProperty
    ];

    // Important for PATCH requests: the related property may
    // not be included in a partial update.
    if (relatedDate === undefined || relatedDate === null) {
      return true;
    }

    if (!isValidDateOnly(relatedDate)) {
      return false;
    }

    // Strict YYYY-MM-DD strings can be compared lexicographically.
    return value >= relatedDate;
  }

  defaultMessage(args: ValidationArguments): string {
    const [relatedProperty] = args.constraints as [string];

    return `${args.property} must be on or after ${relatedProperty}.`;
  }
}

export function IsSameOrAfterDate(
  relatedProperty: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [relatedProperty],
      validator: IsSameOrAfterDateConstraint,
    });
  };
}


/**
 * Validate a perinatal death date against the parent Case dateOfBirth.
 * Applied to CreateCaseDto.details because the two dates belong to
 * separate DTO objects.
 */
@ValidatorConstraint({
  name: 'isPerinatalDeathDateOnOrAfterBirthDate',
  async: false,
})
export class IsPerinatalDeathDateOnOrAfterBirthDateConstraint
  implements ValidatorConstraintInterface
{
  validate(details: unknown, args: ValidationArguments): boolean {
    if (!details || typeof details !== 'object') {
      return true;
    }

    const parent = args.object as Record<string, unknown>;
    const detail = details as Record<string, unknown>;

    const birthDate = parent.dateOfBirth;
    const deathDate = detail.dateOfDeath;

    // Other validators handle missing required dates.
    if (
      birthDate === undefined ||
      birthDate === null ||
      deathDate === undefined ||
      deathDate === null
    ) {
      return true;
    }

    if (!isValidDateOnly(birthDate) || !isValidDateOnly(deathDate)) {
      return false;
    }

    return deathDate >= birthDate;
  }

  defaultMessage(): string {
    return 'Perinatal dateOfDeath must be on or after the Case dateOfBirth.';
  }
}

export function IsPerinatalDeathDateOnOrAfterBirthDate(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: IsPerinatalDeathDateOnOrAfterBirthDateConstraint,
    });
  };
}
