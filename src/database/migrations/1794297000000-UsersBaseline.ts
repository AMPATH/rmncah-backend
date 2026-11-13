import { MigrationInterface, QueryRunner } from 'typeorm';

export class UsersBaseline1794297000000 implements MigrationInterface {
  name = 'UsersBaseline1794297000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`users\` (
        \`id\` varchar(36) NOT NULL,
        \`firstName\` varchar(255) NOT NULL,
        \`lastName\` varchar(255) NOT NULL,
        \`email\` varchar(255) NOT NULL,
        \`phoneNumber\` varchar(20) NULL,
        \`password_hash\` varchar(255) NULL,
        \`must_change_password\` tinyint NOT NULL DEFAULT 1,
        \`cadre_id\` char(36) NULL,
        \`level\` enum(
          'COMMUNITY',
          'FACILITY',
          'PCN',
          'SUB_COUNTY',
          'COUNTY'
        ) NOT NULL,
        \`status\` enum(
          'ACTIVE',
          'INACTIVE',
          'PENDING',
          'DEACTIVATED'
        ) NOT NULL DEFAULT 'PENDING',
        \`last_login_at\` datetime NULL,
        \`created_by\` char(36) NULL,
        \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
          ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` datetime NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`IDX_users_email\` (\`email\`)
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE \`users\`
    `);
  }
}
