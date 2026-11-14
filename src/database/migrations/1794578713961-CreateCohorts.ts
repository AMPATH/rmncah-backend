
import {
  MigrationInterface,
  QueryRunner,
  TableForeignKey,
} from 'typeorm';

export class CreateCohorts1794578713961 implements MigrationInterface {
  name = 'CreateCohorts1794578713961';

  /**
   * Adds a foreign key only when it does not already exist.
   * This makes the migration safer to retry after partial DDL execution.
   */
  private async ensureForeignKey(
    queryRunner: QueryRunner,
    tableName: string,
    constraintName: string,
    columnName: string,
    referencedTableName: string,
    referencedColumnName: string,
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);

    if (!table) {
      throw new Error(`Table ${tableName} does not exist.`);
    }

    const exists = table.foreignKeys.some(
      (fk) => fk.name === constraintName,
    );

    if (exists) {
      return;
    }

    await queryRunner.createForeignKey(
      tableName,
      new TableForeignKey({
        name: constraintName,
        columnNames: [columnName],
        referencedTableName,
        referencedColumnNames: [referencedColumnName],
        onDelete: 'RESTRICT',
        onUpdate: 'NO ACTION',
      }),
    );
  }

  private async dropForeignKeyIfExists(
    queryRunner: QueryRunner,
    tableName: string,
    constraintName: string,
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);

    if (!table) {
      return;
    }

    const foreignKey = table.foreignKeys.find(
      (fk) => fk.name === constraintName,
    );

    if (foreignKey) {
      await queryRunner.dropForeignKey(tableName, foreignKey);
    }
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    // --------------------------------------------------
    // 1. Create cohorts
    // --------------------------------------------------

    if (!(await queryRunner.hasTable('cohorts'))) {
      await queryRunner.query(`
        CREATE TABLE \`cohorts\` (
          \`id\` varchar(36)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NOT NULL,

          \`name\` varchar(150) NOT NULL,

          \`description\` text NULL,

          \`facilityId\` varchar(36)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NOT NULL,

          \`mentorId\` varchar(36)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_0900_ai_ci
            NOT NULL,

          \`startDate\` date NULL,

          \`endDate\` date NULL,

          \`status\` enum(
            'DRAFT',
            'ACTIVE',
            'PAUSED',
            'COMPLETED',
            'CANCELLED'
          ) NOT NULL DEFAULT 'DRAFT',

          \`createdAt\` datetime(6)
            NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

          \`updatedAt\` datetime(6)
            NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
            ON UPDATE CURRENT_TIMESTAMP(6),

          INDEX \`IDX_cohorts_facility_status\`
            (\`facilityId\`, \`status\`),

          INDEX \`IDX_cohorts_mentor_status\`
            (\`mentorId\`, \`status\`),

          PRIMARY KEY (\`id\`)
        )
        ENGINE=InnoDB
        DEFAULT CHARSET=utf8mb4
        COLLATE=utf8mb4_unicode_ci
      `);
    }

    // --------------------------------------------------
    // 2. Create cohortMentees
    // --------------------------------------------------

    if (!(await queryRunner.hasTable('cohortMentees'))) {
      await queryRunner.query(`
        CREATE TABLE \`cohortMentees\` (
          \`id\` varchar(36)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NOT NULL,

          \`cohortId\` varchar(36)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NOT NULL,

          \`menteeId\` varchar(36)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_0900_ai_ci
            NOT NULL,

          \`status\` enum(
            'ACTIVE',
            'COMPLETED',
            'PAUSED',
            'TRANSFERRED',
            'REMOVED'
          ) NOT NULL DEFAULT 'ACTIVE',

          \`assignedAt\` datetime
            NOT NULL DEFAULT CURRENT_TIMESTAMP,

          \`pausedAt\` datetime NULL,

          \`resumedAt\` datetime NULL,

          \`completedAt\` datetime NULL,

          \`transferredAt\` datetime NULL,

          \`removedAt\` datetime NULL,

          \`createdAt\` datetime(6)
            NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

          \`updatedAt\` datetime(6)
            NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
            ON UPDATE CURRENT_TIMESTAMP(6),

          INDEX \`IDX_cohortMentees_mentee_status\`
            (\`menteeId\`, \`status\`),

          INDEX \`IDX_cohortMentees_cohort_status\`
            (\`cohortId\`, \`status\`),

          PRIMARY KEY (\`id\`)
        )
        ENGINE=InnoDB
        DEFAULT CHARSET=utf8mb4
        COLLATE=utf8mb4_unicode_ci
      `);
    }

    // --------------------------------------------------
    // 3. Create cohortTransferRequests
    // --------------------------------------------------

    if (!(await queryRunner.hasTable('cohortTransferRequests'))) {
      await queryRunner.query(`
        CREATE TABLE \`cohortTransferRequests\` (
          \`id\` varchar(36)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NOT NULL,

          \`menteeId\` varchar(36)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_0900_ai_ci
            NOT NULL,

          \`currentCohortId\` varchar(36)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NOT NULL,

          \`requestedCohortId\` varchar(36)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NULL,

          \`approvedCohortId\` varchar(36)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NULL,

          \`reason\` enum(
            'MENTOR CHALLENGE',
            'RELOCATION',
            'PERSONAL CIRCUMSTANCES',
            'HEALTH',
            'OTHER'
          ) NOT NULL,

          \`description\` text NOT NULL,

          \`status\` enum(
            'PENDING',
            'APPROVED',
            'REJECTED'
          ) NOT NULL DEFAULT 'PENDING',

          \`reviewedById\` varchar(36)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_0900_ai_ci
            NULL,

          \`reviewedAt\` datetime NULL,

          \`reviewComments\` text NULL,

          \`createdAt\` datetime(6)
            NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

          \`updatedAt\` datetime(6)
            NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
            ON UPDATE CURRENT_TIMESTAMP(6),

          INDEX \`IDX_cohortTransferRequests_mentee_status\`
            (\`menteeId\`, \`status\`),

          INDEX \`IDX_cohortTransferRequests_status_createdAt\`
            (\`status\`, \`createdAt\`),

          PRIMARY KEY (\`id\`)
        )
        ENGINE=InnoDB
        DEFAULT CHARSET=utf8mb4
        COLLATE=utf8mb4_unicode_ci
      `);
    }

    // --------------------------------------------------
    // 4. Update users table
    // --------------------------------------------------

    // No users currently have level = OTHER.
    await queryRunner.query(`
      ALTER TABLE \`users\`
      MODIFY COLUMN \`level\`
      enum(
        'COUNTY',
        'SUB_COUNTY',
        'FACILITY',
        'COMMUNITY'
      ) NOT NULL
    `);

    // The column exists, but all six users have NULL.
    if (await queryRunner.hasColumn('users', 'invitationAcceptedAt')) {
      await queryRunner.query(`
        ALTER TABLE \`users\`
        DROP COLUMN \`invitationAcceptedAt\`
      `);
    }

    // --------------------------------------------------
    // 5. Restore mentor invitation foreign key
    // --------------------------------------------------

    await this.ensureForeignKey(
      queryRunner,
      'mentor_invitations',
      'FK_167a7572f7d708eaa500124792a',
      'userId',
      'users',
      'id',
    );

    // --------------------------------------------------
    // 6. Add cohort foreign keys
    // --------------------------------------------------

    await this.ensureForeignKey(
      queryRunner,
      'cohorts',
      'FK_cohorts_facility',
      'facilityId',
      'facilities',
      'id',
    );

    await this.ensureForeignKey(
      queryRunner,
      'cohorts',
      'FK_cohorts_mentor',
      'mentorId',
      'users',
      'id',
    );

    // --------------------------------------------------
    // 7. Add cohortMentees foreign keys
    // --------------------------------------------------

    await this.ensureForeignKey(
      queryRunner,
      'cohortMentees',
      'FK_cohortMentees_cohort',
      'cohortId',
      'cohorts',
      'id',
    );

    await this.ensureForeignKey(
      queryRunner,
      'cohortMentees',
      'FK_cohortMentees_mentee',
      'menteeId',
      'users',
      'id',
    );

    // --------------------------------------------------
    // 8. Add cohortTransferRequests foreign keys
    // --------------------------------------------------

    await this.ensureForeignKey(
      queryRunner,
      'cohortTransferRequests',
      'FK_cohortTransferRequests_mentee',
      'menteeId',
      'users',
      'id',
    );

    await this.ensureForeignKey(
      queryRunner,
      'cohortTransferRequests',
      'FK_cohortTransferRequests_currentCohort',
      'currentCohortId',
      'cohorts',
      'id',
    );

    await this.ensureForeignKey(
      queryRunner,
      'cohortTransferRequests',
      'FK_cohortTransferRequests_requestedCohort',
      'requestedCohortId',
      'cohorts',
      'id',
    );

    await this.ensureForeignKey(
      queryRunner,
      'cohortTransferRequests',
      'FK_cohortTransferRequests_approvedCohort',
      'approvedCohortId',
      'cohorts',
      'id',
    );

    await this.ensureForeignKey(
      queryRunner,
      'cohortTransferRequests',
      'FK_cohortTransferRequests_reviewer',
      'reviewedById',
      'users',
      'id',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove only the foreign key this migration added
    // to the pre-existing mentor_invitations table.

    await this.dropForeignKeyIfExists(
      queryRunner,
      'mentor_invitations',
      'FK_167a7572f7d708eaa500124792a',
    );

    // Remove only the three tables created by this migration.
    await queryRunner.dropTable('cohortTransferRequests', true);
    await queryRunner.dropTable('cohortMentees', true);
    await queryRunner.dropTable('cohorts', true);

    // Restore the previous users.level enum.
    await queryRunner.query(`
      ALTER TABLE \`users\`
      MODIFY COLUMN \`level\`
      enum(
        'COUNTY',
        'SUB_COUNTY',
        'FACILITY',
        'COMMUNITY',
        'OTHER'
      ) NOT NULL
    `);

    // Restore the column structurally.
    // Its previous values cannot be recovered after it was dropped.
    if (!(await queryRunner.hasColumn('users', 'invitationAcceptedAt'))) {
      await queryRunner.query(`
        ALTER TABLE \`users\`
        ADD COLUMN \`invitationAcceptedAt\` datetime NULL
      `);
    }

    // Restore the original mentor invitation relationship.
    await this.ensureForeignKey(
      queryRunner,
      'mentor_invitations',
      'FK_mentor_invitations_user',
      'userId',
      'users',
      'id',
    );
  }
}
