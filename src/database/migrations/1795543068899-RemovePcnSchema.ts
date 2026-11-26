import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemovePcnSchema1795543068899
  implements MigrationInterface
{
  name = 'RemovePcnSchema1795543068899';

  private async exists(
    queryRunner: QueryRunner,
    sql: string,
    parameters: unknown[],
  ): Promise<boolean> {
    const result = await queryRunner.query(sql, parameters);
    return Number(result[0]?.total ?? 0) > 0;
  }

  private async hasColumn(
    queryRunner: QueryRunner,
    table: string,
    column: string,
  ): Promise<boolean> {
    return this.exists(
      queryRunner,
      `SELECT COUNT(*) AS total
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
      [table, column],
    );
  }

  private async hasIndex(
    queryRunner: QueryRunner,
    table: string,
    index: string,
  ): Promise<boolean> {
    return this.exists(
      queryRunner,
      `SELECT COUNT(*) AS total
       FROM INFORMATION_SCHEMA.STATISTICS
       WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND INDEX_NAME = ?`,
      [table, index],
    );
  }

  private async hasConstraint(
    queryRunner: QueryRunner,
    table: string,
    constraint: string,
    type: string,
  ): Promise<boolean> {
    return this.exists(
      queryRunner,
      `SELECT COUNT(*) AS total
       FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
       WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND CONSTRAINT_NAME = ?
       AND CONSTRAINT_TYPE = ?`,
      [table, constraint, type],
    );
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = 'userOrganizationAssignments';

    // 1. Remove the old check constraint before changing its columns.
    if (
      await this.hasConstraint(
        queryRunner,
        table,
        'CHK_userOrganizationAssignments_exactlyOneOrganization',
        'CHECK',
      )
    ) {
      await queryRunner.query(`
        ALTER TABLE \`userOrganizationAssignments\`
        DROP CHECK \`CHK_userOrganizationAssignments_exactlyOneOrganization\`
      `);
    }

    // 2. Remove the PCN foreign key if it still exists.
    if (
      await this.hasConstraint(
        queryRunner,
        table,
        'FK_a38c4f4f6ddee5392f1b21d3174',
        'FOREIGN KEY',
      )
    ) {
      await queryRunner.query(`
        ALTER TABLE \`userOrganizationAssignments\`
        DROP FOREIGN KEY \`FK_a38c4f4f6ddee5392f1b21d3174\`
      `);
    }

    // 3. Remove PCN indexes if they still exist.
    for (const index of [
      'IDX_570988fd3f98bc3785168e5ffc',
      'IDX_a38c4f4f6ddee5392f1b21d317',
    ]) {
      if (await this.hasIndex(queryRunner, table, index)) {
        await queryRunner.query(
          `DROP INDEX \`${index}\` ON \`userOrganizationAssignments\``,
        );
      }
    }

    // 4. Remove the generated PCN column if it still exists.
    if (await this.hasColumn(queryRunner, table, 'activePcnId')) {
      await queryRunner.query(`
        ALTER TABLE \`userOrganizationAssignments\`
        DROP COLUMN \`activePcnId\`
      `);
    }

    // 5. Remove its TypeORM metadata.
    if (await queryRunner.hasTable('typeorm_metadata')) {
      await queryRunner.query(`
        DELETE FROM \`typeorm_metadata\`
        WHERE \`type\` = 'GENERATED_COLUMN'
        AND \`name\` = 'activePcnId'
        AND \`table\` = 'userOrganizationAssignments'
      `);
    }

    // 6. Remove the PCN assignment column.
    if (await this.hasColumn(queryRunner, table, 'pcnId')) {
      await queryRunner.query(`
        ALTER TABLE \`userOrganizationAssignments\`
        DROP COLUMN \`pcnId\`
      `);
    }

    // 7. Remove PCN from the organization level enum.
    await queryRunner.query(`
      ALTER TABLE \`userOrganizationAssignments\`
      MODIFY COLUMN \`level\`
      ENUM('COUNTY', 'SUB_COUNTY', 'FACILITY', 'COMMUNITY') NOT NULL
    `);

    // 8. Recreate the check constraint without PCN.
    if (
      !(await this.hasConstraint(
        queryRunner,
        table,
        'CHK_userOrganizationAssignments_exactlyOneOrganization',
        'CHECK',
      ))
    ) {
      await queryRunner.query(`
        ALTER TABLE \`userOrganizationAssignments\`
        ADD CONSTRAINT \`CHK_userOrganizationAssignments_exactlyOneOrganization\`
        CHECK (
          (
            level = 'COUNTY'
            AND countyId IS NOT NULL
            AND subCountyId IS NULL
            AND facilityId IS NULL
            AND communityUnitId IS NULL
          )
          OR
          (
            level = 'SUB_COUNTY'
            AND countyId IS NULL
            AND subCountyId IS NOT NULL
            AND facilityId IS NULL
            AND communityUnitId IS NULL
          )
          OR
          (
            level = 'FACILITY'
            AND countyId IS NULL
            AND subCountyId IS NULL
            AND facilityId IS NOT NULL
            AND communityUnitId IS NULL
          )
          OR
          (
            level = 'COMMUNITY'
            AND countyId IS NULL
            AND subCountyId IS NULL
            AND facilityId IS NULL
            AND communityUnitId IS NOT NULL
          )
        )
      `);
    }

    // 9. Preserve the user-management entity changes.
    if (!(await this.hasColumn(queryRunner, 'users', 'deletedBy'))) {
      await queryRunner.query(`
        ALTER TABLE \`users\`
        ADD \`deletedBy\` char(36) NULL
      `);
    }

    if (
      !(await this.hasColumn(
        queryRunner,
        'users',
        'statusBeforeDeletion',
      ))
    ) {
      await queryRunner.query(`
        ALTER TABLE \`users\`
        ADD \`statusBeforeDeletion\`
        enum ('ACTIVE', 'INACTIVE', 'PENDING', 'DEACTIVATED') NULL
      `);
    }

    // 10. Remove generated-column metadata for facility PCN memberships.
    if (await queryRunner.hasTable('typeorm_metadata')) {
      await queryRunner.query(`
        DELETE FROM \`typeorm_metadata\`
        WHERE \`table\` = 'facilityPcnMemberships'
      `);
    }

    // 11. Drop the membership table before its referenced PCN table.
    if (await queryRunner.hasTable('facilityPcnMemberships')) {
      await queryRunner.query(`
        DROP TABLE \`facilityPcnMemberships\`
      `);
    }

    // 12. Remove the PCN table.
    if (await queryRunner.hasTable('primaryCareNetworks')) {
      await queryRunner.query(`
        DROP TABLE \`primaryCareNetworks\`
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    throw new Error(
      'This migration is intentionally irreversible. ' +
      'Restore the PCN schema manually only after reviewing the database.',
    );
  }
}
