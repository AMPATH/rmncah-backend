# RMNCAH Platform – RBAC Implementation Guide

**Backend:** NestJS, TypeORM, MySQL  
**Frontend:** React  
**Architecture:** Role-Based Access Control (RBAC) with organizational scope  
**Status:** Implementation planning

## 1. Purpose

This document defines how Role-Based Access Control (RBAC) will be implemented in the RMNCAH platform.

The platform supports MPDSR and EmONC workflows. Both modules share a common user-management and authorization infrastructure.

The implementation must ensure that users can only perform authorized actions within their assigned organizational scope.

## 2. Architecture principles

1. One user account per person across the platform.
2. A user can have multiple roles.
3. Roles determine what a user can do.
4. Organizational assignments determine where a user can perform those actions.
5. Permissions are explicitly assigned to roles.
6. Authorization is enforced on the backend.
7. Technical administration does not automatically grant clinical-data access.
8. Historical role and organizational assignments must be retained.
9. System roles and permissions are managed through database seeds.

## 3. System modules

The platform will use three module identifiers:

| Module   | Description                                            |
| -------- | ------------------------------------------------------ |
| PLATFORM | Shared platform administration                         |
| MPDSR    | Maternal and Perinatal Death Surveillance and Response |
| EMONC    | Emergency Obstetric and Newborn Care                   |

RMNCAH is the overall platform, not a separate module.

## 4. Initial role catalogue

### 4.1 Shared platform

| Role code    | Display name         |
| ------------ | -------------------- |
| SYSTEM_ADMIN | System Administrator |

System Administrator handles technical administration and configuration. It does not automatically grant access to identifiable clinical records.

### 4.2 MPDSR

| Role code                | Display name              | Scope          |
| ------------------------ | ------------------------- | -------------- |
| CHP                      | Community Health Provider | Community unit |
| FACILITY_REPORTER        | Facility Reporter         | Facility       |
| FACILITY_CHAIR           | Facility MPDSR Chair      | Facility       |
| PCN_COORDINATOR          | PCN Coordinator           | PCN            |
| SUBCOUNTY_COORDINATOR    | Sub-county Coordinator    | Sub-county     |
| COUNTY_SURVEILLANCE_LEAD | County Surveillance Lead  | County         |

### 4.3 EmONC

| Role code        | Display name         | Scope           |
| ---------------- | -------------------- | --------------- |
| PROGRAM_LEAD     | EmONC Programme Lead | Programme       |
| COUNTY_MENTOR_RH | County Mentor / RH   | County          |
| MENTOR           | EmONC Mentor         | Facility/cohort |
| MENTEE           | Mentee               | Cohort          |

There are 11 initial roles in total.

**Action Owner is not a separate role.** It is an assignment-level responsibility attached to an MPDSR recommendation action.

## 5. Database design

RBAC will use four principal tables.

### 5.1 roles

Stores the standard platform roles.

Proposed fields:

- id
- code
- name
- description
- module
- isActive
- createdAt
- updatedAt

### 5.2 permissions

Stores individual system permissions.

Proposed fields:

- id
- code
- name
- description
- module
- createdAt
- updatedAt

Example permission codes:

- users.create
- users.update
- users.deactivate
- mpdsr.incident.create
- mpdsr.incident.view
- mpdsr.incident.review
- mpdsr.recommendation.assign
- mpdsr.action.update
- emonc.module.publish
- emonc.cohort.create
- emonc.assessment.create
- emonc.feedback.review

### 5.3 rolePermissions

Maps permissions to roles.

Proposed fields:

- id
- roleId
- permissionId
- createdAt

A role can have multiple permissions, and a permission can belong to multiple roles.

### 5.4 userRoleAssignments

Connects users to roles and organizational assignments.

Proposed fields:

- id
- userId
- roleId
- organizationAssignmentId
- assignedBy
- assignedAt
- expiresAt
- revokedAt
- revokedBy
- createdAt
- updatedAt

The organizationAssignmentId references the existing userOrganizationAssignments table.

It can be nullable for platform-wide roles such as SYSTEM_ADMIN.

## 6. Organizational scope

The platform already has userOrganizationAssignments.

It supports:

- COUNTY
- SUB_COUNTY
- PCN
- FACILITY
- COMMUNITY

RBAC must reuse this existing implementation.

It must not create another organizational assignment table or duplicate organizational IDs in userRoleAssignments.

For cohort-level authorization, additional cohort membership and assignment checks will be implemented in the EmONC domain.

## 7. Authorization workflow

For every protected request, the backend must:

1. Authenticate the user.
2. Confirm the account is active.
3. Retrieve the user's active role assignments.
4. Confirm the role applies to the requested module.
5. Check whether the role has the required permission.
6. Resolve the user's organizational scope.
7. Confirm the requested resource belongs to that scope.
8. Apply additional data-sensitivity restrictions.
9. Allow or reject the request.
10. Record relevant security and audit events.

The frontend must never be trusted to determine authorization.

## 8. NestJS implementation

The RBAC implementation will contain:

- Roles module
- Permissions module
- Role permissions service
- User role assignments module
- Authorization service
- Permissions decorator
- Permissions guard

The Permissions decorator will declare the permissions required by a controller endpoint.

The Permissions guard will enforce the declared permissions using the authorization service.

Organizational scope and resource ownership must also be checked server-side.

## 9. Seeding

The standard roles and permissions will be inserted through a database seed under:

`src/database/seeds/rbac.seed.ts`

The seed must be idempotent: running it more than once must not create duplicate roles or permissions.

The seed will create:

- 11 standard roles
- Approved permission definitions
- Role-to-permission mappings

It will not create real users, user-role assignments or organizational assignments.

## 10. Security requirements

- Never grant clinical access merely because a user has SYSTEM_ADMIN.
- Prevent users from assigning themselves elevated roles.
- Validate role assignments against authorized organizational scope.
- Prevent expired and revoked assignments from granting access.
- Prevent access across unauthorized counties, facilities, PCNs and community units.
- Retain assignment history.
- Apply audit logging to sensitive administrative and clinical actions.
- Do not expose password hashes, tokens or secrets in API responses or audit records.
- Apply data-sensitivity restrictions to reports, assessments and exports.

## 11. Testing strategy

Tests must cover:

- Role creation and retrieval.
- Permission mapping.
- Multiple roles assigned to one user.
- Multiple organizational assignments.
- Expired role assignments.
- Revoked role assignments.
- Unauthorized module access.
- Cross-county access attempts.
- Cross-facility access attempts.
- PCN Coordinator escalation permissions.
- System Administrator without automatic clinical access.
- EmONC County Mentor/RH account-management permissions.

## 12. Implementation sequence

| Step | Implementation                            |
| ---- | ----------------------------------------- |
| 1    | Define module and role enums              |
| 2    | Create Role entity                        |
| 3    | Create Permission entity                  |
| 4    | Create RolePermission entity              |
| 5    | Create UserRoleAssignment entity          |
| 6    | Generate and execute migrations           |
| 7    | Implement database seeds                  |
| 8    | Implement role and permission services    |
| 9    | Implement user-role assignment services   |
| 10   | Implement authorization service           |
| 11   | Implement permissions decorator and guard |
| 12   | Integrate authentication                  |
| 13   | Apply authorization to MPDSR endpoints    |
| 14   | Apply authorization to EmONC endpoints    |
| 15   | Complete security and integration testing |

## 13. Existing implementation to reuse

The following components already exist and must not be duplicated:

- users
- userOrganizationAssignments
- counties
- subCounties
- primaryCareNetworks
- facilities
- communityUnits

The RBAC implementation will integrate with these existing entities.

---

**Implementation principle:** Build the shared authorization foundation once, then use it consistently across MPDSR and EmONC.

### Role codes — predefined

These are stable business identifiers defined by us, not generated randomly.
Role name Role code
System Administrator SYSTEM_ADMIN
Community Health Provider CHP
Facility Reporter FACILITY_REPORTER
Facility MPDSR Chair FACILITY_CHAIR
PCN Coordinator PCN_COORDINATOR
Sub-county Coordinator SUBCOUNTY_COORDINATOR
County Surveillance Lead COUNTY_SURVEILLANCE_LEAD
EmONC Programme Lead PROGRAM_LEAD
County Mentor / RH COUNTY_MENTOR_RH
EmONC Mentor MENTOR
Mentee MENTEE

### Permission codes — predefined

Use descriptive dot-separated codes.

Examples:
users.create
users.update
users.deactivate

mpdsr.incident.create
mpdsr.incident.view
mpdsr.incident.review

mpdsr.recommendation.assign
mpdsr.action.update
mpdsr.action.approve

emonc.module.create
emonc.module.publish
emonc.cohort.create
emonc.cohort.manage
emonc.assessment.create
emonc.feedback.review

### Module codes — predefined

export enum SystemModule {
PLATFORM = 'PLATFORM',
MPDSR = 'MPDSR',
EMONC = 'EMONC',
}

### My recommendation

Field Generation
Role ID System-generated UUID
Role code Predefined
Permission ID System-generated UUID
Permission code Predefined
Role-permission ID System-generated UUID
User-role assignment ID System-generated UUID
Module Predefined enum

### Here is what each RBAC table does in the RMNCAH platform:

Table

Purpose

users

Stores user accounts. A person has one account for accessing the platform.

roles

Stores the predefined roles users can have, such as FACILITY_REPORTER, PCN_COORDINATOR, and MENTOR.

permissions

Stores the specific actions users can perform, such as mpdsr.incident.create or emonc.cohort.manage.

rolePermissions

Connects roles to permissions. Defines what each role is allowed to do.

userRoleAssignments

Connects users to roles. Records which role a user has, in which module, and at what organizational scope.

userOrganizationAssignments

Defines the organizations a user is assigned to, such as a county, sub-county, PCN, facility, or community.

How they work together
For example, suppose a user is a Facility Reporter at Facility A.

users

Stores the person's account

userRoleAssignments

Assigns FACILITY_REPORTER in MPDSR

roles

Defines the FACILITY_REPORTER role

rolePermissions

Connects the role to allowed actions

permissions

Defines actions such as mpdsr.incident.create

userOrganizationAssignments

Defines which facility the user can work within

### The key distinction:

Role = What is the user's responsibility?

Permission = What action can the user perform?

User-role assignment = Which role does the user have, in which module and scope?

Organization assignment = Where can the user perform that role?

This separation allows one person to have multiple roles across MPDSR and EmONC without creating multiple user accounts.
