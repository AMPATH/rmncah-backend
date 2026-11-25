export enum RecommendationAssignmentLevel {
  COUNTY = 'COUNTY',
  SUB_COUNTY = 'SUB_COUNTY',
  FACILITY = 'FACILITY',
  COMMUNITY = 'COMMUNITY',
}

export enum RecommendationClassification {
  IMMEDIATE = 'IMMEDIATE',
  INTERMEDIATE = 'INTERMEDIATE',
  LONG_TERM = 'LONG_TERM',
}

export enum RecommendationAssignmentStatus {
  PENDING_ACCEPTANCE = 'PENDING_ACCEPTANCE',
  ACTIVE = 'ACTIVE',
  DECLINED = 'DECLINED',
  SUPERSEDED = 'SUPERSEDED',
  CANCELLED = 'CANCELLED',
}
