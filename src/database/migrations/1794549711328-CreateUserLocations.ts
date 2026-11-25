
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserLocations1794549711328
  implements MigrationInterface
{
  name = 'CreateUserLocations1794549711328';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`userLocations\` (
        \`id\` varchar(36) NOT NULL,
        \`userId\` varchar(36)
          CHARACTER SET utf8mb4
          COLLATE utf8mb4_0900_ai_ci NOT NULL,
        \`facilityId\` varchar(36)
          CHARACTER SET utf8mb4
          COLLATE utf8mb4_0900_ai_ci NOT NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
          ON UPDATE CURRENT_TIMESTAMP(6),

        UNIQUE INDEX \`IDX_userLocations_user_facility\`
          (\`userId\`, \`facilityId\`),

        PRIMARY KEY (\`id\`),

        CONSTRAINT \`FK_userLocations_user\`
          FOREIGN KEY (\`userId\`)
          REFERENCES \`users\` (\`id\`)
          ON DELETE RESTRICT
          ON UPDATE NO ACTION,

        CONSTRAINT \`FK_userLocations_facility\`
          FOREIGN KEY (\`facilityId\`)
          REFERENCES \`facilities\` (\`id\`)
          ON DELETE RESTRICT
          ON UPDATE NO ACTION
      ) ENGINE=InnoDB
        DEFAULT CHARSET=utf8mb4
        COLLATE=utf8mb4_0900_ai_ci;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS \`userLocations\`
    `);
  }
}
