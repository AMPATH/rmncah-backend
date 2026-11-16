import type { EntityManager } from 'typeorm';

import dataSource from '../data-source.js';

import { SystemModule } from '../../shared/rbac/enum/system-module.enum.js';

import { Role } from '../../shared/rbac/roles/entities/role.entity.js';
import { Permission } from '../../shared/rbac/permissions/entities/permission.entity.js';
import { RolePermission } from '../../shared/rbac/role-permissions/entities/role-permission.entity.js';

/*
|--------------------------------------------------------------------------
| ROLE DEFINITIONS
|--------------------------------------------------------------------------
*/

const roles = [
  {
    code: 'SYSTEM_ADMIN',
    name: 'System Administrator',
    description:
      'Manages platform configuration, user accounts and system access. Does not automatically grant access to clinical records.',
    module: SystemModule.PLATFORM,
  },
  {
    code: 'CHP',
    name: 'Community Health Promoter',
    description:
      'Reports community incidents and accesses records within assigned community units.',
    module: SystemModule.MPDSR,
  },
  {
    code: 'FACILITY_REPORTER',
    name: 'Facility Reporter',
    description:
      'Reports facility incidents and follows up on submissions within the assigned facility.',
    module: SystemModule.MPDSR,
  },
  {
    code: 'FACILITY_CHAIR',
    name: 'Facility MPDSR Chair',
    description:
      'Coordinates facility reviews and approves or rejects completed recommendations.',
    module: SystemModule.MPDSR,
  },
  {
    code: 'FACILITY_IN_CHARGE',
    name: 'Facility In-Charge',
    description:
      'Coordinates facility-level MPDSR activities and recommendation implementation.',
    module: SystemModule.MPDSR,
  },
  {
    code: 'PCN_COORDINATOR',
    name: 'PCN Coordinator',
    description:
      'Manages overdue or unaccepted recommendations and handles reassignment within the assigned PCN.',
    module: SystemModule.MPDSR,
  },
  {
    code: 'SUBCOUNTY_COORDINATOR',
    name: 'Subcounty Coordinator',
    description:
      'Monitors MPDSR activities and recommendation implementation within the assigned subcounty.',
    module: SystemModule.MPDSR,
  },
  {
    code: 'COUNTY_SURVEILLANCE_LEAD',
    name: 'County Surveillance Lead',
    description:
      'Provides county-level MPDSR oversight, coordination and reporting.',
    module: SystemModule.MPDSR,
  },
  {
    code: 'PROGRAM_LEAD',
    name: 'EmONC Program Lead',
    description:
      'Manages EmONC training modules, learning content and program configuration.',
    module: SystemModule.EMONC,
  },
  {
    code: 'COUNTY_MENTOR_RH',
    name: 'County Mentor RH',
    description:
      'Coordinates mentors and mentees, manages training accounts and reviews cohort completion within the assigned county.',
    module: SystemModule.EMONC,
  },
  {
    code: 'MENTOR',
    name: 'Mentor',
    description:
      'Manages assigned cohorts, delivers training and records mentee assessments.',
    module: SystemModule.EMONC,
  },
  {
    code: 'MENTEE',
    name: 'Mentee',
    description:
      'Accesses learning materials, participates in training and completes assessments.',
    module: SystemModule.EMONC,
  },
];

/*
|--------------------------------------------------------------------------
| PERMISSION DEFINITIONS
|--------------------------------------------------------------------------
|
| Permissions describe actions.
| Organizational scope and record ownership are enforced separately.
|
*/

const permissions = [
  /*
   * PLATFORM
   */

  {
    code: 'platform.users.create',
    name: 'Create Users',
    description: 'Create platform user accounts.',
    module: SystemModule.PLATFORM,
  },
  {
    code: 'platform.users.read',
    name: 'View Users',
    description: 'View platform user accounts.',
    module: SystemModule.PLATFORM,
  },
  {
    code: 'platform.users.update',
    name: 'Update Users',
    description: 'Update platform user account information.',
    module: SystemModule.PLATFORM,
  },
  {
    code: 'platform.users.deactivate',
    name: 'Manage User Status',
    description: 'Activate or deactivate user accounts.',
    module: SystemModule.PLATFORM,
  },
  {
    code: 'platform.roles.create',
    name: 'Create Roles',
    description: 'Create platform role definitions.',
    module: SystemModule.PLATFORM,
  },
  {
    code: 'platform.roles.read',
    name: 'View Roles',
    description: 'View platform role definitions.',
    module: SystemModule.PLATFORM,
  },
  {
    code: 'platform.roles.update',
    name: 'Update Roles',
    description: 'Update platform role definitions.',
    module: SystemModule.PLATFORM,
  },
  {
    code: 'platform.roles.assign',
    name: 'Assign Roles',
    description: 'Assign roles to users.',
    module: SystemModule.PLATFORM,
  },
  {
    code: 'platform.permissions.read',
    name: 'View Permissions',
    description: 'View available system permissions.',
    module: SystemModule.PLATFORM,
  },
  {
    code: 'platform.permissions.manage',
    name: 'Manage Permissions',
    description:
      'Manage permission definitions and role-permission configuration.',
    module: SystemModule.PLATFORM,
  },
  {
    code: 'platform.organization_assignments.create',
    name: 'Create Organizational Assignments',
    description: 'Assign users to organizational units.',
    module: SystemModule.PLATFORM,
  },
  {
    code: 'platform.organization_assignments.read',
    name: 'View Organizational Assignments',
    description: 'View user organizational assignments.',
    module: SystemModule.PLATFORM,
  },
  {
    code: 'platform.organization_assignments.update',
    name: 'Update Organizational Assignments',
    description: 'Update user organizational assignments.',
    module: SystemModule.PLATFORM,
  },
  {
    code: 'platform.organization_assignments.revoke',
    name: 'Revoke Organizational Assignments',
    description: 'End or revoke user organizational assignments.',
    module: SystemModule.PLATFORM,
  },

  /*
   * MPDSR - CASES
   */

  {
    code: 'mpdsr.cases.create',
    name: 'Create Cases',
    description: 'Create maternal, perinatal or near-miss cases.',
    module: SystemModule.MPDSR,
  },
  {
    code: 'mpdsr.cases.read',
    name: 'View Cases',
    description: 'View cases permitted by the users organizational scope.',
    module: SystemModule.MPDSR,
  },
  {
    code: 'mpdsr.cases.update',
    name: 'Update Cases',
    description: 'Update permitted case information.',
    module: SystemModule.MPDSR,
  },
  {
    code: 'mpdsr.cases.archive',
    name: 'Archive Cases',
    description: 'Archive cases according to system rules.',
    module: SystemModule.MPDSR,
  },
  {
    code: 'mpdsr.cases.reopen',
    name: 'Reopen Cases',
    description: 'Reopen finalized cases through an authorized workflow.',
    module: SystemModule.MPDSR,
  },

  /*
   * MPDSR - CASE REVIEWS
   */

  {
    code: 'mpdsr.case_reviews.create',
    name: 'Create Case Reviews',
    description: 'Create a review for an MPDSR case.',
    module: SystemModule.MPDSR,
  },
  {
    code: 'mpdsr.case_reviews.read',
    name: 'View Case Reviews',
    description: 'View case review information.',
    module: SystemModule.MPDSR,
  },
  {
    code: 'mpdsr.case_reviews.update',
    name: 'Update Case Reviews',
    description: 'Update permitted case review information.',
    module: SystemModule.MPDSR,
  },
  {
    code: 'mpdsr.case_reviews.finalize',
    name: 'Finalize Case Reviews',
    description: 'Finalize a case review.',
    module: SystemModule.MPDSR,
  },
  {
    code: 'mpdsr.case_reviews.reopen',
    name: 'Reopen Case Reviews',
    description:
      'Reopen finalized case reviews through an authorized workflow.',
    module: SystemModule.MPDSR,
  },

  /*
   * MPDSR - RECOMMENDATIONS
   */

  {
    code: 'mpdsr.recommendations.create',
    name: 'Create Recommendations',
    description: 'Create recommendations arising from MPDSR cases.',
    module: SystemModule.MPDSR,
  },
  {
    code: 'mpdsr.recommendations.read',
    name: 'View Recommendations',
    description: 'View recommendations within the authorized scope.',
    module: SystemModule.MPDSR,
  },
  {
    code: 'mpdsr.recommendations.update',
    name: 'Update Recommendations',
    description: 'Update permitted recommendation details.',
    module: SystemModule.MPDSR,
  },
  {
    code: 'mpdsr.recommendations.assign',
    name: 'Assign Recommendations',
    description: 'Assign recommendations to responsible persons.',
    module: SystemModule.MPDSR,
  },
  {
    code: 'mpdsr.recommendations.reassign',
    name: 'Reassign Recommendations',
    description: 'Reassign recommendations with a recorded reason.',
    module: SystemModule.MPDSR,
  },
  {
    code: 'mpdsr.recommendations.accept',
    name: 'Accept Recommendations',
    description: 'Accept responsibility for assigned recommendations.',
    module: SystemModule.MPDSR,
  },
  {
    code: 'mpdsr.recommendations.mark_done',
    name: 'Mark Recommendations Done',
    description: 'Submit a recommendation as completed for approval.',
    module: SystemModule.MPDSR,
  },
  {
    code: 'mpdsr.recommendations.approve',
    name: 'Approve Recommendations',
    description: 'Approve completed recommendations.',
    module: SystemModule.MPDSR,
  },
  {
    code: 'mpdsr.recommendations.reject',
    name: 'Reject Recommendations',
    description: 'Reject completed recommendations with a reason.',
    module: SystemModule.MPDSR,
  },
  {
    code: 'mpdsr.recommendations.request_correction',
    name: 'Request Recommendation Correction',
    description: 'Return a submitted recommendation for correction.',
    module: SystemModule.MPDSR,
  },
  {
    code: 'mpdsr.recommendations.reopen',
    name: 'Reopen Recommendations',
    description:
      'Reopen closed recommendations through an authorized workflow.',
    module: SystemModule.MPDSR,
  },

  /*
   * MPDSR - REPORTS
   */

  {
    code: 'mpdsr.reports.read',
    name: 'View MPDSR Reports',
    description: 'View MPDSR reports within the authorized scope.',
    module: SystemModule.MPDSR,
  },
  {
    code: 'mpdsr.reports.export',
    name: 'Export MPDSR Reports',
    description: 'Export permitted MPDSR reports.',
    module: SystemModule.MPDSR,
  },

  /*
   * MPDSR - PCN CONFIGURATION
   */

  {
    code: 'mpdsr.pcns.create',
    name: 'Create PCNs',
    description: 'Create a Primary Care Network.',
    module: SystemModule.MPDSR,
  },
  {
    code: 'mpdsr.pcns.read',
    name: 'View PCNs',
    description: 'View PCN information.',
    module: SystemModule.MPDSR,
  },
  {
    code: 'mpdsr.pcns.update',
    name: 'Update PCNs',
    description: 'Update PCN information.',
    module: SystemModule.MPDSR,
  },
  {
    code: 'mpdsr.pcns.assign_facilities',
    name: 'Assign Facilities to PCNs',
    description: 'Assign or transfer facilities between PCNs.',
    module: SystemModule.MPDSR,
  },

  /*
   * MPDSR - ESCALATION CONFIGURATION
   */

  {
    code: 'mpdsr.escalation_matrix.read',
    name: 'View Escalation Matrix',
    description: 'View recommendation escalation rules.',
    module: SystemModule.MPDSR,
  },
  {
    code: 'mpdsr.escalation_matrix.manage',
    name: 'Manage Escalation Matrix',
    description: 'Configure recommendation escalation rules.',
    module: SystemModule.MPDSR,
  },

  /*
   * EMONC - MODULES
   */

  {
    code: 'emonc.modules.create',
    name: 'Create Modules',
    description: 'Create EmONC learning modules.',
    module: SystemModule.EMONC,
  },
  {
    code: 'emonc.modules.read',
    name: 'View Modules',
    description: 'View published or otherwise authorized learning modules.',
    module: SystemModule.EMONC,
  },
  {
    code: 'emonc.modules.update',
    name: 'Update Modules',
    description: 'Update EmONC learning module content.',
    module: SystemModule.EMONC,
  },
  {
    code: 'emonc.modules.publish',
    name: 'Publish Modules',
    description: 'Publish module versions for training.',
    module: SystemModule.EMONC,
  },

  /*
   * EMONC - COHORTS
   */

  {
    code: 'emonc.cohorts.create',
    name: 'Create Cohorts',
    description: 'Create mentor-led training cohorts.',
    module: SystemModule.EMONC,
  },
  {
    code: 'emonc.cohorts.read',
    name: 'View Cohorts',
    description: 'View authorized training cohorts.',
    module: SystemModule.EMONC,
  },
  {
    code: 'emonc.cohorts.update',
    name: 'Update Cohorts',
    description: 'Update permitted cohort information.',
    module: SystemModule.EMONC,
  },
  {
    code: 'emonc.cohorts.submit',
    name: 'Submit Cohorts',
    description: 'Submit completed cohorts for county review.',
    module: SystemModule.EMONC,
  },
  {
    code: 'emonc.cohorts.review',
    name: 'Review Cohorts',
    description: 'Review submitted cohort completion records.',
    module: SystemModule.EMONC,
  },
  {
    code: 'emonc.cohorts.approve',
    name: 'Approve Cohorts',
    description: 'Approve eligible cohort completion records.',
    module: SystemModule.EMONC,
  },
  {
    code: 'emonc.cohorts.return',
    name: 'Return Cohorts',
    description: 'Return cohort submissions for correction.',
    module: SystemModule.EMONC,
  },

  /*
   * EMONC - MENTEES
   */

  {
    code: 'emonc.mentees.create',
    name: 'Create Mentees',
    description: 'Create mentee accounts within the authorized county.',
    module: SystemModule.EMONC,
  },
  {
    code: 'emonc.mentees.read',
    name: 'View Mentees',
    description: 'View authorized mentee records.',
    module: SystemModule.EMONC,
  },
  {
    code: 'emonc.mentees.update',
    name: 'Update Mentees',
    description: 'Update mentee information.',
    module: SystemModule.EMONC,
  },
  {
    code: 'emonc.mentees.activate',
    name: 'Activate Mentees',
    description: 'Activate mentee accounts.',
    module: SystemModule.EMONC,
  },
  {
    code: 'emonc.mentees.deactivate',
    name: 'Deactivate Mentees',
    description: 'Deactivate mentee accounts.',
    module: SystemModule.EMONC,
  },
  {
    code: 'emonc.mentees.invite',
    name: 'Invite Mentees',
    description: 'Invite existing mentees to assigned cohorts.',
    module: SystemModule.EMONC,
  },
  {
    code: 'emonc.mentees.transfer',
    name: 'Transfer Mentees',
    description:
      'Authorize mentee transfers while preserving training history.',
    module: SystemModule.EMONC,
  },

  /*
   * EMONC - ASSESSMENTS
   */

  {
    code: 'emonc.assessments.create',
    name: 'Create Assessments',
    description: 'Record theory and practical assessments.',
    module: SystemModule.EMONC,
  },
  {
    code: 'emonc.assessments.read',
    name: 'View Assessments',
    description: 'View authorized assessment records.',
    module: SystemModule.EMONC,
  },
  {
    code: 'emonc.assessments.update',
    name: 'Update Assessments',
    description: 'Update assessments through an audited correction workflow.',
    module: SystemModule.EMONC,
  },
  {
    code: 'emonc.assessments.submit',
    name: 'Submit Assessments',
    description: 'Submit assessment responses or results.',
    module: SystemModule.EMONC,
  },
  {
    code: 'emonc.assessments.reassess',
    name: 'Reassess Mentees',
    description: 'Record a new assessment attempt.',
    module: SystemModule.EMONC,
  },

  /*
   * EMONC - TRAINING SESSIONS
   */

  {
    code: 'emonc.sessions.create',
    name: 'Create Training Sessions',
    description: 'Schedule theory and practical training sessions.',
    module: SystemModule.EMONC,
  },
  {
    code: 'emonc.sessions.read',
    name: 'View Training Sessions',
    description: 'View authorized training sessions.',
    module: SystemModule.EMONC,
  },
  {
    code: 'emonc.sessions.update',
    name: 'Update Training Sessions',
    description: 'Update training session details.',
    module: SystemModule.EMONC,
  },

  /*
   * EMONC - PROGRESS
   */

  {
    code: 'emonc.progress.read',
    name: 'View Training Progress',
    description: 'View training progress within the authorized scope.',
    module: SystemModule.EMONC,
  },

  /*
   * EMONC - FEEDBACK
   */

  {
    code: 'emonc.feedback.create',
    name: 'Submit Feedback',
    description: 'Submit training feedback or report challenges.',
    module: SystemModule.EMONC,
  },
  {
    code: 'emonc.feedback.read',
    name: 'View Feedback',
    description: 'View authorized training feedback.',
    module: SystemModule.EMONC,
  },
  {
    code: 'emonc.feedback.respond',
    name: 'Respond to Feedback',
    description: 'Respond to training feedback and reported challenges.',
    module: SystemModule.EMONC,
  },

  /*
   * EMONC - REPORTS
   */

  {
    code: 'emonc.reports.read',
    name: 'View EmONC Reports',
    description: 'View training and competency reports.',
    module: SystemModule.EMONC,
  },
  {
    code: 'emonc.reports.export',
    name: 'Export EmONC Reports',
    description: 'Export authorized training reports.',
    module: SystemModule.EMONC,
  },
];

/*
|--------------------------------------------------------------------------
| ROLE-PERMISSION MAPPINGS
|--------------------------------------------------------------------------
|
| These are capability assignments, not organizational data filters.
| Record-level scope must still be enforced by the relevant services.
|
*/

const rolePermissionMappings: Record<string, string[]> = {
  /*
   * PLATFORM
   */

  SYSTEM_ADMIN: [
    'platform.users.create',
    'platform.users.read',
    'platform.users.update',
    'platform.users.deactivate',
    'platform.roles.create',
    'platform.roles.read',
    'platform.roles.update',
    'platform.roles.assign',
    'platform.permissions.read',
    'platform.permissions.manage',
    'platform.organization_assignments.create',
    'platform.organization_assignments.read',
    'platform.organization_assignments.update',
    'platform.organization_assignments.revoke',
  ],

  /*
   * MPDSR
   */

  CHP: [
    'mpdsr.cases.create',
    'mpdsr.cases.read',
    'mpdsr.cases.update',
    'mpdsr.recommendations.create',
    'mpdsr.recommendations.read',
  ],

  FACILITY_REPORTER: [
    'mpdsr.cases.create',
    'mpdsr.cases.read',
    'mpdsr.cases.update',
    'mpdsr.case_reviews.read',
    'mpdsr.recommendations.create',
    'mpdsr.recommendations.read',
    'mpdsr.recommendations.update',
  ],

  FACILITY_CHAIR: [
    'mpdsr.cases.read',
    'mpdsr.case_reviews.create',
    'mpdsr.case_reviews.read',
    'mpdsr.case_reviews.update',
    'mpdsr.case_reviews.finalize',
    'mpdsr.recommendations.read',
    'mpdsr.recommendations.approve',
    'mpdsr.recommendations.reject',
    'mpdsr.recommendations.request_correction',
    'mpdsr.reports.read',
    'mpdsr.escalation_matrix.read',
  ],

  FACILITY_IN_CHARGE: [
    'mpdsr.cases.read',
    'mpdsr.cases.update',
    'mpdsr.case_reviews.read',
    'mpdsr.recommendations.create',
    'mpdsr.recommendations.read',
    'mpdsr.recommendations.update',
    'mpdsr.recommendations.assign',
    'mpdsr.recommendations.accept',
    'mpdsr.recommendations.mark_done',
    'mpdsr.reports.read',
    'mpdsr.escalation_matrix.read',
    'mpdsr.escalation_matrix.manage',
  ],

  PCN_COORDINATOR: [
    'mpdsr.cases.read',
    'mpdsr.recommendations.read',
    'mpdsr.recommendations.reassign',
    'mpdsr.recommendations.accept',
    'mpdsr.reports.read',
    'mpdsr.escalation_matrix.read',
  ],

  SUBCOUNTY_COORDINATOR: [
    'mpdsr.cases.read',
    'mpdsr.recommendations.read',
    'mpdsr.recommendations.approve',
    'mpdsr.recommendations.reject',
    'mpdsr.reports.read',
  ],

  COUNTY_SURVEILLANCE_LEAD: [
    'mpdsr.cases.read',
    'mpdsr.recommendations.read',
    'mpdsr.recommendations.approve',
    'mpdsr.recommendations.reject',
    'mpdsr.recommendations.reopen',
    'mpdsr.reports.read',
    'mpdsr.reports.export',
    'mpdsr.pcns.create',
    'mpdsr.pcns.read',
    'mpdsr.pcns.update',
    'mpdsr.pcns.assign_facilities',
    'mpdsr.escalation_matrix.read',
  ],

  /*
   * EMONC
   */

  PROGRAM_LEAD: [
    'emonc.modules.create',
    'emonc.modules.read',
    'emonc.modules.update',
    'emonc.modules.publish',
    'emonc.reports.read',
    'emonc.reports.export',
  ],

  COUNTY_MENTOR_RH: [
    'emonc.modules.read',
    'emonc.cohorts.read',
    'emonc.cohorts.review',
    'emonc.cohorts.approve',
    'emonc.cohorts.return',
    'emonc.mentees.create',
    'emonc.mentees.read',
    'emonc.mentees.update',
    'emonc.mentees.activate',
    'emonc.mentees.deactivate',
    'emonc.mentees.transfer',
    'emonc.assessments.read',
    'emonc.progress.read',
    'emonc.feedback.read',
    'emonc.feedback.respond',
    'emonc.reports.read',
    'emonc.reports.export',
  ],

  MENTOR: [
    'emonc.modules.read',
    'emonc.cohorts.create',
    'emonc.cohorts.read',
    'emonc.cohorts.update',
    'emonc.cohorts.submit',
    'emonc.mentees.read',
    'emonc.mentees.invite',
    'emonc.assessments.create',
    'emonc.assessments.read',
    'emonc.assessments.update',
    'emonc.assessments.reassess',
    'emonc.sessions.create',
    'emonc.sessions.read',
    'emonc.sessions.update',
    'emonc.progress.read',
    'emonc.feedback.create',
    'emonc.feedback.read',
    'emonc.reports.read',
  ],

  MENTEE: [
    'emonc.modules.read',
    'emonc.cohorts.read',
    'emonc.assessments.read',
    'emonc.assessments.submit',
    'emonc.sessions.read',
    'emonc.progress.read',
    'emonc.feedback.create',
  ],
};

/*
|--------------------------------------------------------------------------
| VALIDATE ROLE AND PERMISSION DEFINITIONS
|--------------------------------------------------------------------------
*/

function validateRolePermissionMappings(): void {
  const roleCodes = new Set<string>();
  const permissionCodes = new Set<string>();

  const permissionLookup = new Map(
    permissions.map((permission) => [permission.code, permission]),
  );

  const modulePrefixes: Record<SystemModule, string> = {
    [SystemModule.PLATFORM]: 'platform.',
    [SystemModule.MPDSR]: 'mpdsr.',
    [SystemModule.EMONC]: 'emonc.',
  };

  // Validate role definitions and mapping coverage.
  for (const role of roles) {
    if (!role.code.trim()) {
      throw new Error('Role code cannot be empty.');
    }

    if (roleCodes.has(role.code)) {
      throw new Error(`Duplicate role code: ${role.code}`);
    }

    roleCodes.add(role.code);

    if (!Object.hasOwn(rolePermissionMappings, role.code)) {
      throw new Error(`Missing permission mapping for role: ${role.code}`);
    }
  }

  // Validate permission definitions.
  for (const permission of permissions) {
    if (!permission.code.trim()) {
      throw new Error('Permission code cannot be empty.');
    }

    if (permissionCodes.has(permission.code)) {
      throw new Error(`Duplicate permission code: ${permission.code}`);
    }

    permissionCodes.add(permission.code);

    const expectedPrefix = modulePrefixes[permission.module];

    if (!permission.code.startsWith(expectedPrefix)) {
      throw new Error(
        `Permission "${permission.code}" does not match module "${permission.module}".`,
      );
    }
  }

  // Prevent mappings for undefined roles.
  for (const roleCode of Object.keys(rolePermissionMappings)) {
    if (!roleCodes.has(roleCode)) {
      throw new Error(`Unknown role in permission mappings: ${roleCode}`);
    }
  }

  // Validate every permission assigned to each role.
  for (const role of roles) {
    const assignedCodes = rolePermissionMappings[role.code];

    const assignedPermissionCodes = new Set<string>();

    for (const permissionCode of assignedCodes) {
      if (assignedPermissionCodes.has(permissionCode)) {
        throw new Error(
          `Duplicate permission "${permissionCode}" assigned to role "${role.code}".`,
        );
      }

      assignedPermissionCodes.add(permissionCode);

      const permission = permissionLookup.get(permissionCode);

      if (!permission) {
        throw new Error(
          `Unknown permission "${permissionCode}" assigned to role "${role.code}".`,
        );
      }

      if (permission.module !== role.module) {
        throw new Error(
          `Module mismatch: role "${role.code}" (${role.module}) cannot receive permission "${permissionCode}" (${permission.module}).`,
        );
      }
    }
  }
}

/*
|--------------------------------------------------------------------------
| SEED ROLES
|--------------------------------------------------------------------------
*/

async function seedRoles(manager: EntityManager): Promise<Map<string, Role>> {
  const repository = manager.getRepository(Role);
  const seededRoles = new Map<string, Role>();

  for (const roleData of roles) {
    let role = await repository.findOne({
      where: { code: roleData.code },
    });

    if (role) {
      // Update role details without overwriting isActive.
      Object.assign(role, roleData);
    } else {
      role = repository.create({
        ...roleData,
        isActive: true,
      });
    }

    const savedRole = await repository.save(role);

    seededRoles.set(savedRole.code, savedRole);

    console.log(`Seeded role: ${savedRole.code}`);
  }

  return seededRoles;
}

/*
|--------------------------------------------------------------------------
| SEED PERMISSIONS
|--------------------------------------------------------------------------
*/

async function seedPermissions(
  manager: EntityManager,
): Promise<Map<string, Permission>> {
  const repository = manager.getRepository(Permission);
  const seededPermissions = new Map<string, Permission>();

  for (const permissionData of permissions) {
    let permission = await repository.findOne({
      where: { code: permissionData.code },
    });

    if (permission) {
      Object.assign(permission, permissionData);
    } else {
      permission = repository.create(permissionData);
    }

    const savedPermission = await repository.save(permission);

    seededPermissions.set(savedPermission.code, savedPermission);

    console.log(`Seeded permission: ${savedPermission.code}`);
  }

  return seededPermissions;
}

/*
|--------------------------------------------------------------------------
| SYNCHRONIZE ROLE-PERMISSION ASSIGNMENTS
|--------------------------------------------------------------------------
|
| The seed is the source of truth for mappings belonging to seeded roles.
|
| Existing mappings not present in the seed are removed.
| Missing mappings are inserted.
|
| Custom roles, permissions and user-role assignments are not deleted.
|
*/

async function seedRolePermissions(
  manager: EntityManager,
  seededRoles: Map<string, Role>,
  seededPermissions: Map<string, Permission>,
): Promise<void> {
  const repository = manager.getRepository(RolePermission);

  for (const [roleCode, permissionCodes] of Object.entries(
    rolePermissionMappings,
  )) {
    const role = seededRoles.get(roleCode);

    if (!role) {
      throw new Error(`Role not found while seeding: ${roleCode}`);
    }

    // Resolve desired permission IDs.
    const desiredPermissionIds = new Set<string>();

    for (const permissionCode of permissionCodes) {
      const permission = seededPermissions.get(permissionCode);

      if (!permission) {
        throw new Error(
          `Permission "${permissionCode}" not found while assigning it to "${roleCode}".`,
        );
      }

      desiredPermissionIds.add(permission.id);
    }

    // Load current mappings for this role.
    const existingAssignments = await repository.find({
      where: { roleId: role.id },
    });

    // Find mappings that are no longer defined in the seed.
    const obsoleteAssignments = existingAssignments.filter(
      (assignment) => !desiredPermissionIds.has(assignment.permissionId),
    );

    if (obsoleteAssignments.length > 0) {
      await repository.remove(obsoleteAssignments);

      console.log(
        `Removed ${obsoleteAssignments.length} obsolete mapping(s) from ${roleCode}.`,
      );
    }

    // Keep only existing mappings that are still desired.
    const existingPermissionIds = new Set(
      existingAssignments
        .filter((assignment) =>
          desiredPermissionIds.has(assignment.permissionId),
        )
        .map((assignment) => assignment.permissionId),
    );

    // Insert missing mappings.
    for (const permissionId of desiredPermissionIds) {
      if (existingPermissionIds.has(permissionId)) {
        continue;
      }

      const assignment = repository.create({
        roleId: role.id,
        permissionId,
      });

      await repository.save(assignment);
    }

    console.log(`Synchronized permissions for role: ${roleCode}`);
  }
}

/*
|--------------------------------------------------------------------------
| MAIN SEED FUNCTION
|--------------------------------------------------------------------------
*/

async function seedRbac(): Promise<void> {
  try {
    // Validate definitions before connecting to the database.
    validateRolePermissionMappings();

    await dataSource.initialize();

    await dataSource.transaction(async (manager: EntityManager) => {
      console.log('Starting RBAC seeding...');

      const seededRoles = await seedRoles(manager);

      const seededPermissions = await seedPermissions(manager);

      await seedRolePermissions(manager, seededRoles, seededPermissions);

      console.log('RBAC seeding completed successfully.');
    });
  } catch (error: unknown) {
    console.error('RBAC seeding failed:', error);

    process.exitCode = 1;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

void seedRbac();
