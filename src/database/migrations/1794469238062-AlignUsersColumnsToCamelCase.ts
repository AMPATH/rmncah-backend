import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignUsersColumnsToCamelCase1794469238062 implements MigrationInterface {
  name = 'AlignUsersColumnsToCamelCase1794469238062';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`users\`
        CHANGE COLUMN \`password_hash\` \`passwordHash\` varchar(255) NULL,
        CHANGE COLUMN \`must_change_password\` \`mustChangePassword\` tinyint NOT NULL DEFAULT 1,
        CHANGE COLUMN \`cadre_id\` \`cadreId\` char(36) NULL,
        CHANGE COLUMN \`last_login_at\` \`lastLoginAt\` datetime NULL,
        CHANGE COLUMN \`created_by\` \`createdBy\` char(36) NULL,
        CHANGE COLUMN \`created_at\` \`createdAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CHANGE COLUMN \`updated_at\` \`updatedAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CHANGE COLUMN \`deleted_at\` \`deletedAt\` datetime NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`users\`
        CHANGE COLUMN \`passwordHash\` \`password_hash\` varchar(255) NULL,
        CHANGE COLUMN \`mustChangePassword\` \`must_change_password\` tinyint NOT NULL DEFAULT 1,
        CHANGE COLUMN \`cadreId\` \`cadre_id\` char(36) NULL,
        CHANGE COLUMN \`lastLoginAt\` \`last_login_at\` datetime NULL,
        CHANGE COLUMN \`createdBy\` \`created_by\` char(36) NULL,
        CHANGE COLUMN \`createdAt\` \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CHANGE COLUMN \`updatedAt\` \`updated_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CHANGE COLUMN \`deletedAt\` \`deleted_at\` datetime NULL
    `);
  }
}
