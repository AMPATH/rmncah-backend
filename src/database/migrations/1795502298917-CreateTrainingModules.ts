
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTrainingModules1795502298917
  implements MigrationInterface
{
  name = 'CreateTrainingModules1795502298917';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create training_modules
    await queryRunner.query(`
      CREATE TABLE \`training_modules\` (
        \`id\` varchar(36) NOT NULL,
        \`title\` varchar(200) NOT NULL,
        \`description\` text NOT NULL,
        \`learningObjectives\` text NULL,
        \`estimatedDurationMinutes\` int NULL,
        \`status\` enum ('draft', 'published') NOT NULL DEFAULT 'draft',
        \`publishedAt\` datetime NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        INDEX \`idx_training_modules_status\` (\`status\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // 2. Create module_sections
    await queryRunner.query(`
      CREATE TABLE \`module_sections\` (
        \`id\` varchar(36) NOT NULL,
        \`title\` varchar(200) NOT NULL,
        \`description\` text NULL,
        \`displayOrder\` int NOT NULL,
        \`isActive\` tinyint NOT NULL DEFAULT 1,
        \`trainingModuleId\` varchar(36) NOT NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        INDEX \`IDX_a7f71d3df3314936008bafaf32\` (\`trainingModuleId\`, \`displayOrder\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // 3. Create learning_materials
    await queryRunner.query(`
      CREATE TABLE \`learning_materials\` (
        \`id\` varchar(36) NOT NULL,
        \`title\` varchar(200) NOT NULL,
        \`description\` text NULL,
        \`type\` enum ('EBOOK', 'SLIDES', 'VIDEO') NOT NULL,
        \`fileUrl\` varchar(500) NULL,
        \`fileName\` varchar(255) NULL,
        \`mimeType\` varchar(100) NULL,
        \`fileSize\` bigint NULL,
        \`externalUrl\` varchar(1000) NULL,
        \`displayOrder\` int NOT NULL DEFAULT '1',
        \`isActive\` tinyint NOT NULL DEFAULT 1,
        \`moduleSectionId\` varchar(36) NOT NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        INDEX \`IDX_385042f10f67422a316c852ef5\` (\`moduleSectionId\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // 4. Add foreign keys
    await queryRunner.query(`
      ALTER TABLE \`module_sections\`
      ADD CONSTRAINT \`FK_c32e1a8c11814f8c5adabe15aa7\`
      FOREIGN KEY (\`trainingModuleId\`)
      REFERENCES \`training_modules\`(\`id\`)
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`learning_materials\`
      ADD CONSTRAINT \`FK_385042f10f67422a316c852ef5c\`
      FOREIGN KEY (\`moduleSectionId\`)
      REFERENCES \`module_sections\`(\`id\`)
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop child tables before parent tables
    await queryRunner.query(`
      ALTER TABLE \`learning_materials\`
      DROP FOREIGN KEY \`FK_385042f10f67422a316c852ef5c\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`module_sections\`
      DROP FOREIGN KEY \`FK_c32e1a8c11814f8c5adabe15aa7\`
    `);

    await queryRunner.query(`DROP TABLE \`learning_materials\``);
    await queryRunner.query(`DROP TABLE \`module_sections\``);
    await queryRunner.query(`DROP TABLE \`training_modules\``);
  }
}
