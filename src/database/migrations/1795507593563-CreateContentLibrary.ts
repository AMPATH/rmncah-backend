
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateContentLibrary1795507593563
  implements MigrationInterface
{
  name = 'CreateContentLibrary1795507593563';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`content_library\` (
        \`id\` varchar(36) NOT NULL,
        \`title\` varchar(200) NOT NULL,
        \`description\` text NULL,
        \`type\` enum('EBOOK', 'SLIDES', 'VIDEO') NOT NULL,
        \`fileUrl\` varchar(500) NULL,
        \`fileName\` varchar(255) NULL,
        \`mimeType\` varchar(100) NULL,
        \`fileSize\` bigint NULL,
        \`externalUrl\` varchar(1000) NULL,
        \`isActive\` tinyint NOT NULL DEFAULT 1,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
          ON UPDATE CURRENT_TIMESTAMP(6),
        INDEX \`IDX_05c2921242966a6bd00140807f\` (\`isActive\`),
        INDEX \`IDX_8faa503874ad8ea54450006ef5\` (\`type\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE \`content_library\`
    `);
  }
}
