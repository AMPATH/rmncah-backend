import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInvitations1794903520181
  implements MigrationInterface
{
  name = 'CreateInvitations1794903520181';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the invitations table.
    await queryRunner.query(`
      CREATE TABLE \`invitations\` (
        \`id\` varchar(36) NOT NULL,
        \`userId\` varchar(36) NOT NULL,
        \`invitedByUserId\` varchar(36) NULL,
        \`tokenHash\` char(64) NOT NULL,
        \`expiresAt\` datetime NOT NULL,
        \`acceptedAt\` datetime NULL,
        \`revokedAt\` datetime NULL,
        \`createdAt\` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        PRIMARY KEY (\`id\`),

        UNIQUE INDEX \`UQ_invitations_tokenHash\` (\`tokenHash\`),

        INDEX \`IDX_invitations_userId\` (\`userId\`),
        INDEX \`IDX_invitations_invitedByUserId\` (\`invitedByUserId\`),
        INDEX \`IDX_invitations_expiresAt\` (\`expiresAt\`),

        CONSTRAINT \`FK_invitations_userId\`
          FOREIGN KEY (\`userId\`)
          REFERENCES \`users\`(\`id\`)
          ON DELETE CASCADE
          ON UPDATE NO ACTION,

        CONSTRAINT \`FK_invitations_invitedByUserId\`
          FOREIGN KEY (\`invitedByUserId\`)
          REFERENCES \`users\`(\`id\`)
          ON DELETE SET NULL
          ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback only the invitations table.
    await queryRunner.query('DROP TABLE `invitations`');
  }
}
