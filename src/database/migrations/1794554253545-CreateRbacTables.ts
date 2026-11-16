import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRbacTables1794554253545 implements MigrationInterface {
  name = 'CreateRbacTables1794554253545';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create permissions catalogue.
    await queryRunner.query(`
      CREATE TABLE \`permissions\` (
        \`id\` varchar(36) NOT NULL,
        \`code\` varchar(100) NOT NULL,
        \`name\` varchar(150) NOT NULL,
        \`description\` varchar(500) NULL,
        \`module\` enum ('PLATFORM', 'MPDSR', 'EMONC') NOT NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
          ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_8dad765629e83229da6feda1c1\` (\`code\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // Create roles catalogue.
    await queryRunner.query(`
      CREATE TABLE \`roles\` (
        \`id\` varchar(36) NOT NULL,
        \`code\` varchar(50) NOT NULL,
        \`name\` varchar(150) NOT NULL,
        \`description\` varchar(500) NULL,
        \`module\` enum ('PLATFORM', 'MPDSR', 'EMONC') NOT NULL,
        \`isActive\` tinyint NOT NULL DEFAULT 1,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
          ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_f6d54f95c31b73fb1bdd8e91d0\` (\`code\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // Connect roles to their permitted actions.
    await queryRunner.query(`
      CREATE TABLE \`rolePermissions\` (
        \`id\` varchar(36) NOT NULL,
        \`roleId\` varchar(36) NOT NULL,
        \`permissionId\` varchar(36) NOT NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_9e7ab7e8aec914fa1886f6fa63\`
          (\`roleId\`, \`permissionId\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // Store role assignments made to users.
    await queryRunner.query(`
      CREATE TABLE \`userRoleAssignments\` (
        \`id\` varchar(36) NOT NULL,
        \`userId\` varchar(36) NOT NULL,
        \`roleId\` varchar(36) NOT NULL,
        \`organizationAssignmentId\` varchar(36) NULL,
        \`assignedBy\` varchar(36) NULL,
        \`assignedAt\` datetime NOT NULL,
        \`expiresAt\` datetime NULL,
        \`revokedAt\` datetime NULL,
        \`revokedBy\` varchar(36) NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
          ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // Remove the old user-level field.
    // Organization scope and RBAC assignments now determine access.
    await queryRunner.query(`
      ALTER TABLE \`users\` DROP COLUMN \`level\`
    `);

    // Add role-permission relationships.
    await queryRunner.query(`
      ALTER TABLE \`rolePermissions\`
      ADD CONSTRAINT \`FK_b20f4ad2fcaa0d311f925162675\`
      FOREIGN KEY (\`roleId\`) REFERENCES \`roles\`(\`id\`)
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`rolePermissions\`
      ADD CONSTRAINT \`FK_5cb213a16a7b5204c8aff881518\`
      FOREIGN KEY (\`permissionId\`) REFERENCES \`permissions\`(\`id\`)
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Add user-role assignment relationships.
    await queryRunner.query(`
      ALTER TABLE \`userRoleAssignments\`
      ADD CONSTRAINT \`FK_e62324e31f93d3e488400849c3f\`
      FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`)
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`userRoleAssignments\`
      ADD CONSTRAINT \`FK_dbef9b5fcf6897408d74184db49\`
      FOREIGN KEY (\`roleId\`) REFERENCES \`roles\`(\`id\`)
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`userRoleAssignments\`
      ADD CONSTRAINT \`FK_7284b827872a77c03ffb0284e13\`
      FOREIGN KEY (\`organizationAssignmentId\`)
      REFERENCES \`userOrganizationAssignments\`(\`id\`)
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`userRoleAssignments\`
      ADD CONSTRAINT \`FK_67201c03a1fec77fe2aa1885dc0\`
      FOREIGN KEY (\`assignedBy\`) REFERENCES \`users\`(\`id\`)
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`userRoleAssignments\`
      ADD CONSTRAINT \`FK_7dbee122d3d637aa2db416abbbd\`
      FOREIGN KEY (\`revokedBy\`) REFERENCES \`users\`(\`id\`)
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove user-role assignment relationships first.
    await queryRunner.query(`
      ALTER TABLE \`userRoleAssignments\`
      DROP FOREIGN KEY \`FK_7dbee122d3d637aa2db416abbbd\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`userRoleAssignments\`
      DROP FOREIGN KEY \`FK_67201c03a1fec77fe2aa1885dc0\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`userRoleAssignments\`
      DROP FOREIGN KEY \`FK_7284b827872a77c03ffb0284e13\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`userRoleAssignments\`
      DROP FOREIGN KEY \`FK_dbef9b5fcf6897408d74184db49\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`userRoleAssignments\`
      DROP FOREIGN KEY \`FK_e62324e31f93d3e488400849c3f\`
    `);

    // Remove role-permission relationships.
    await queryRunner.query(`
      ALTER TABLE \`rolePermissions\`
      DROP FOREIGN KEY \`FK_5cb213a16a7b5204c8aff881518\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`rolePermissions\`
      DROP FOREIGN KEY \`FK_b20f4ad2fcaa0d311f925162675\`
    `);

    // Restore the old users.level column.
    // Note: this cannot restore the original values that were dropped.
    await queryRunner.query(`
      ALTER TABLE \`users\`
      ADD \`level\` enum (
        'COMMUNITY',
        'FACILITY',
        'PCN',
        'SUB_COUNTY',
        'COUNTY'
      ) NOT NULL
    `);

    // Drop tables in dependency order.
    await queryRunner.query(`DROP TABLE \`userRoleAssignments\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_9e7ab7e8aec914fa1886f6fa63\` ON \`rolePermissions\``,
    );
    await queryRunner.query(`DROP TABLE \`rolePermissions\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_f6d54f95c31b73fb1bdd8e91d0\` ON \`roles\``,
    );
    await queryRunner.query(`DROP TABLE \`roles\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_8dad765629e83229da6feda1c1\` ON \`permissions\``,
    );
    await queryRunner.query(`DROP TABLE \`permissions\``);
  }
}
