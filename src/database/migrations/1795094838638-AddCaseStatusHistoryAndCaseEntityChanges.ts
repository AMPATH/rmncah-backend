import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCaseStatusHistoryAndCaseEntityChanges1795094838638
  implements MigrationInterface
{
  name = 'AddCaseStatusHistoryAndCaseEntityChanges1795094838638';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add the current workflow status to cases.
    await queryRunner.query(`
      ALTER TABLE \`cases\`
      ADD COLUMN \`status\` enum(
        'NOTIFIED',
        'UNDER_REVIEW',
        'PENDING_CHAIR_VALIDATION',
        'REVIEW_COMPLETED',
        'RESPONSE_IN_PROGRESS',
        'REOPENED',
        'CLOSED',
        'VOIDED'
      ) NOT NULL DEFAULT 'NOTIFIED'
    `);

    await queryRunner.query(`
      CREATE INDEX \`IDX_CASE_STATUS\`
      ON \`cases\` (\`status\`)
    `);

    // Record case status transitions.
    await queryRunner.query(`
      CREATE TABLE \`caseStatusHistory\` (
        \`id\` varchar(36) NOT NULL,
        \`caseId\` varchar(36) NOT NULL,
        \`fromStatus\` enum(
          'NOTIFIED',
          'UNDER_REVIEW',
          'PENDING_CHAIR_VALIDATION',
          'REVIEW_COMPLETED',
          'RESPONSE_IN_PROGRESS',
          'REOPENED',
          'CLOSED',
          'VOIDED'
        ) NULL,
        \`toStatus\` enum(
          'NOTIFIED',
          'UNDER_REVIEW',
          'PENDING_CHAIR_VALIDATION',
          'REVIEW_COMPLETED',
          'RESPONSE_IN_PROGRESS',
          'REOPENED',
          'CLOSED',
          'VOIDED'
        ) NOT NULL,
        \`changedBy\` varchar(36) NOT NULL,
        \`reason\` text NULL,
        \`remarks\` text NULL,
        \`changedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        INDEX \`IDX_CASE_STATUS_HISTORY_CASE\` (\`caseId\`),
        INDEX \`IDX_CASE_STATUS_HISTORY_CHANGED_AT\` (\`changedAt\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_CASE_STATUS_HISTORY_CASE\`
          FOREIGN KEY (\`caseId\`)
          REFERENCES \`cases\` (\`id\`)
          ON DELETE RESTRICT
          ON UPDATE NO ACTION
      ) ENGINE=InnoDB
        DEFAULT CHARSET=utf8mb4
        COLLATE=utf8mb4_0900_ai_ci
    `);

    // Remove columns deliberately removed from the current entities.
    await queryRunner.query(`
      ALTER TABLE \`maternalCaseDetails\`
        DROP COLUMN \`parity\`,
        DROP COLUMN \`pregnancyOutcome\`,
        DROP COLUMN \`deliveryMode\`,
        DROP COLUMN \`causeOfDeathId\`,
        DROP COLUMN \`clinicalSummary\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`perinatalCaseDetails\`
        DROP COLUMN \`gestationalAgeAtBirth\`,
        DROP COLUMN \`modeOfDelivery\`,
        DROP COLUMN \`causeOfDeathId\`,
        DROP COLUMN \`clinicalSummary\`,
        DROP COLUMN \`birthWeightGrams\`,
        DROP COLUMN \`placeOfBirth\`
    `);

    // Historical placeholder-cause records were explicitly removed.
    // These columns can therefore be mandatory from creation.
    await queryRunner.query(`
      ALTER TABLE \`maternalCaseDetails\`
      ADD COLUMN \`provisionalCauseId\` varchar(36) NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`perinatalCaseDetails\`
      ADD COLUMN \`provisionalCauseId\` varchar(36) NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX \`IDX_MATERNAL_PROVISIONAL_CAUSE\`
      ON \`maternalCaseDetails\` (\`provisionalCauseId\`)
    `);

    await queryRunner.query(`
      CREATE INDEX \`IDX_PERINATAL_PROVISIONAL_CAUSE\`
      ON \`perinatalCaseDetails\` (\`provisionalCauseId\`)
    `);

    await queryRunner.query(`
      ALTER TABLE \`maternalCaseDetails\`
      ADD CONSTRAINT \`FK_MATERNAL_PROVISIONAL_CAUSE\`
      FOREIGN KEY (\`provisionalCauseId\`)
      REFERENCES \`icd11Causes\` (\`id\`)
      ON DELETE RESTRICT
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`perinatalCaseDetails\`
      ADD CONSTRAINT \`FK_PERINATAL_PROVISIONAL_CAUSE\`
      FOREIGN KEY (\`provisionalCauseId\`)
      REFERENCES \`icd11Causes\` (\`id\`)
      ON DELETE RESTRICT
      ON UPDATE NO ACTION
    `);

    // Near-miss date filtering.
    await queryRunner.query(`
      CREATE INDEX \`IDX_NEAR_MISS_DATE_OF_COMPLICATION\`
      ON \`nearMissDetails\` (\`dateOfComplication\`)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`perinatalCaseDetails\`
      DROP FOREIGN KEY \`FK_PERINATAL_PROVISIONAL_CAUSE\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`maternalCaseDetails\`
      DROP FOREIGN KEY \`FK_MATERNAL_PROVISIONAL_CAUSE\`
    `);

    await queryRunner.query(`
      DROP INDEX \`IDX_NEAR_MISS_DATE_OF_COMPLICATION\`
      ON \`nearMissDetails\`
    `);

    await queryRunner.query(`
      DROP INDEX \`IDX_PERINATAL_PROVISIONAL_CAUSE\`
      ON \`perinatalCaseDetails\`
    `);

    await queryRunner.query(`
      DROP INDEX \`IDX_MATERNAL_PROVISIONAL_CAUSE\`
      ON \`maternalCaseDetails\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`perinatalCaseDetails\`
      DROP COLUMN \`provisionalCauseId\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`maternalCaseDetails\`
      DROP COLUMN \`provisionalCauseId\`
    `);

    await queryRunner.query(`
      DROP TABLE \`caseStatusHistory\`
    `);

    await queryRunner.query(`
      DROP INDEX \`IDX_CASE_STATUS\` ON \`cases\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`cases\` DROP COLUMN \`status\`
    `);

    // Restore the removed columns as empty, nullable columns.
    // Their former data cannot be recovered after the up migration.
    await queryRunner.query(`
      ALTER TABLE \`maternalCaseDetails\`
        ADD COLUMN \`parity\` int NULL,
        ADD COLUMN \`pregnancyOutcome\` enum(
          'LIVE_BIRTH',
          'STILLBIRTH',
          'MISCARRIAGE',
          'ABORTION',
          'OTHER',
          'UNKNOWN'
        ) NULL,
        ADD COLUMN \`deliveryMode\` enum(
          'SPONTANEOUS_VAGINAL',
          'ASSISTED_VAGINAL',
          'CAESAREAN_SECTION',
          'OTHER',
          'UNKNOWN'
        ) NULL,
        ADD COLUMN \`causeOfDeathId\` varchar(36) NULL,
        ADD COLUMN \`clinicalSummary\` text NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`perinatalCaseDetails\`
        ADD COLUMN \`gestationalAgeAtBirth\` int NULL,
        ADD COLUMN \`modeOfDelivery\` enum(
          'SPONTANEOUS_VAGINAL',
          'ASSISTED_VAGINAL',
          'CAESAREAN_SECTION',
          'OTHER',
          'UNKNOWN'
        ) NULL,
        ADD COLUMN \`causeOfDeathId\` varchar(36) NULL,
        ADD COLUMN \`clinicalSummary\` text NULL,
        ADD COLUMN \`birthWeightGrams\` int NULL,
        ADD COLUMN \`placeOfBirth\` enum(
          'HEALTH_FACILITY',
          'HOME',
          'EN_ROUTE_TO_FACILITY',
          'OTHER',
          'UNKNOWN'
        ) NULL
    `);
  }
}
