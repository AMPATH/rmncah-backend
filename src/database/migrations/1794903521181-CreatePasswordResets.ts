import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePasswordResets1794903521181
  implements MigrationInterface
{
  name = 'CreatePasswordResets1794903521181';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the password-reset token table.
    await queryRunner.query(`
      CREATE TABLE \`password_resets\` (
        \`id\` varchar(36) NOT NULL,
        \`userId\` varchar(36) NOT NULL,
        \`tokenHash\` char(64) NOT NULL,
        \`expiresAt\` datetime NOT NULL,
        \`usedAt\` datetime NULL,
        \`revokedAt\` datetime NULL,
        \`createdAt\` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        PRIMARY KEY (\`id\`),

        UNIQUE INDEX \`UQ_password_resets_tokenHash\` (\`tokenHash\`),
        INDEX \`IDX_password_resets_userId\` (\`userId\`),
        INDEX \`IDX_password_resets_expiresAt\` (\`expiresAt\`),

        CONSTRAINT \`FK_password_resets_userId\`
          FOREIGN KEY (\`userId\`)
          REFERENCES \`users\`(\`id\`)
          ON DELETE CASCADE
          ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Roll back only the password_resets table.
    await queryRunner.query('DROP TABLE \`password_resets\`');
  }
}
