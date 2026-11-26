
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePasswordResets1795520124256
  implements MigrationInterface
{
  name = 'CreatePasswordResets1795520124256';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`passwordResets\` (
        \`id\` varchar(36) NOT NULL,
        \`userId\` varchar(36) NOT NULL,
        \`tokenHash\` char(64) NOT NULL,
        \`expiresAt\` datetime NOT NULL,
        \`usedAt\` datetime NULL,
        \`revokedAt\` datetime NULL,
        \`createdAt\` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`UQ_passwordResets_tokenHash\` (\`tokenHash\`),
        INDEX \`IDX_passwordResets_userId\` (\`userId\`),
        INDEX \`IDX_passwordResets_expiresAt\` (\`expiresAt\`),
        CONSTRAINT \`FK_password_resets_userId\`
          FOREIGN KEY (\`userId\`)
          REFERENCES \`users\` (\`id\`)
          ON DELETE CASCADE
          ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE \`passwordResets\`
    `);
  }
}
