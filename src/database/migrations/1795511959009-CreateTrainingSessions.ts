
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTrainingSessions1795511959009
  implements MigrationInterface
{
  name = 'CreateTrainingSessions1795511959009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`cohort_module_assignments\` (
        \`id\` varchar(36) NOT NULL,
        \`cohortId\` varchar(36) NOT NULL,
        \`trainingModuleId\` varchar(36) NOT NULL,
        \`assignedBy\` varchar(36) NOT NULL,
        \`assignedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`UQ_cohort_module_assignment\` (\`cohortId\`, \`trainingModuleId\`),
        INDEX \`IDX_cohort_module_assignment_cohort\` (\`cohortId\`),
        INDEX \`IDX_cohort_module_assignment_module\` (\`trainingModuleId\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_assignment_cohort\`
          FOREIGN KEY (\`cohortId\`) REFERENCES \`cohorts\`(\`id\`)
          ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT \`FK_assignment_module\`
          FOREIGN KEY (\`trainingModuleId\`) REFERENCES \`training_modules\`(\`id\`)
          ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT \`FK_assignment_user\`
          FOREIGN KEY (\`assignedBy\`) REFERENCES \`users\`(\`id\`)
          ON DELETE RESTRICT ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`training_sessions\` (
        \`id\` varchar(36) NOT NULL,
        \`assignmentId\` varchar(36) NOT NULL,
        \`trainingType\` enum ('THEORY', 'PRACTICAL', 'COMBINED') NOT NULL,
        \`title\` varchar(200) NOT NULL,
        \`description\` text NULL,
        \`startDate\` date NOT NULL,
        \`startTime\` time NOT NULL,
        \`endDate\` date NOT NULL,
        \`endTime\` time NOT NULL,
        \`venue\` varchar(255) NULL,
        \`notes\` text NULL,
        \`status\` enum ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED')
          NOT NULL DEFAULT 'PLANNED',
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
          ON UPDATE CURRENT_TIMESTAMP(6),
        INDEX \`IDX_training_session_start\` (\`startDate\`, \`startTime\`),
        INDEX \`IDX_training_session_assignment\` (\`assignmentId\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_training_session_assignment\`
          FOREIGN KEY (\`assignmentId\`) REFERENCES \`cohort_module_assignments\`(\`id\`)
          ON DELETE CASCADE ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`training_sessions\``);
    await queryRunner.query(`DROP TABLE \`cohort_module_assignments\``);
  }
}
