import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSystemBootstrap1794903522181
  implements MigrationInterface
{
  name = 'CreateSystemBootstrap1794903522181';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`system_bootstrap\` (
        \`bootstrapKey\` varchar(50) NOT NULL,
        \`initialAdminUserId\` varchar(36) NOT NULL,
        \`status\` varchar(30) NOT NULL DEFAULT 'PENDING_INVITATION',
        \`createdAt\` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP
          ON UPDATE CURRENT_TIMESTAMP,

        PRIMARY KEY (\`bootstrapKey\`),

        UNIQUE INDEX \`UQ_system_bootstrap_initialAdminUserId\`
          (\`initialAdminUserId\`),

        CONSTRAINT \`FK_system_bootstrap_initialAdminUserId\`
          FOREIGN KEY (\`initialAdminUserId\`)
          REFERENCES \`users\`(\`id\`)
          ON DELETE RESTRICT
          ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE \`system_bootstrap\`');
  }
}
