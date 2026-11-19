export enum CaseType {
  MATERNAL = 'MATERNAL',
  PERINATAL = 'PERINATAL',
  NEAR_MISS = 'NEAR_MISS',
}

export enum ReportingSetting {
  FACILITY = 'FACILITY',
  COMMUNITY = 'COMMUNITY',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  UNKNOWN = 'UNKNOWN',
}

export enum PregnancyPeriod {
  ANTENATAL = 'ANTENATAL',
  INTRAPARTUM = 'INTRAPARTUM',
  POSTPARTUM = 'POSTPARTUM',
}

export enum BirthOutcome {
  STILLBIRTH = 'STILLBIRTH',
  LIVE_BIRTH = 'LIVE_BIRTH',
  UNKNOWN = 'UNKNOWN',
}

export enum PlaceOfBirth {
  HEALTH_FACILITY = 'HEALTH_FACILITY',
  HOME = 'HOME',
  EN_ROUTE_TO_FACILITY = 'EN_ROUTE_TO_FACILITY',
  OTHER = 'OTHER',
  UNKNOWN = 'UNKNOWN',
}

// Method of delivery
export enum DeliveryMode {
  SPONTANEOUS_VAGINAL = 'SPONTANEOUS_VAGINAL',
  ASSISTED_VAGINAL = 'ASSISTED_VAGINAL',
  CAESAREAN_SECTION = 'CAESAREAN_SECTION',
  OTHER = 'OTHER',
  UNKNOWN = 'UNKNOWN',
}

// Retained pending review of existing references.
export enum PregnancyOutcome {
  LIVE_BIRTH = 'LIVE_BIRTH',
  STILLBIRTH = 'STILLBIRTH',
  MISCARRIAGE = 'MISCARRIAGE',
  ABORTION = 'ABORTION',
  OTHER = 'OTHER',
  UNKNOWN = 'UNKNOWN',
}
