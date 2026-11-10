import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

function isValidDateOnly(value: unknown): value is string {
  if (typeof value !== 'string') return false;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split('-').map(Number);

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function getTodayInKenya(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Nairobi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

@ValidatorConstraint({ name: 'isNotFutureDate', async: false })
export class IsNotFutureDateConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (value === undefined || value === null) return true;

    if (!isValidDateOnly(value)) return false;

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

@ValidatorConstraint({ name: 'isSameOrAfterDate', async: false })
export class IsSameOrAfterDateConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    if (value === undefined || value === null) return true;

    if (!isValidDateOnly(value)) return false;

    const [relatedProperty] = args.constraints;
    const relatedDate = (args.object as Record<string, unknown>)[
      relatedProperty
    ];

    if (relatedDate === undefined || relatedDate === null) return true;

    if (!isValidDateOnly(relatedDate)) return false;

    return value >= relatedDate;
  }

  defaultMessage(args: ValidationArguments): string {
    const [relatedProperty] = args.constraints;

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
