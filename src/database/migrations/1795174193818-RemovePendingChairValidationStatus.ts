import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemovePendingChairValidationStatus1795174193818 implements MigrationInterface {
  name = 'RemovePendingChairValidationStatus1795174193818';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove PENDING_CHAIR_VALIDATION from the cases status enum.
    await queryRunner.query(`
      ALTER TABLE \`cases\`
      MODIFY COLUMN \`status\` enum(
        'NOTIFIED',
        'UNDER_REVIEW',
        'REVIEW_COMPLETED',
        'RESPONSE_IN_PROGRESS',
        'REOPENED',
        'CLOSED',
        'VOIDED'
      ) NOT NULL DEFAULT 'NOTIFIED'
    `);

    // Update the case status history enum columns.
    await queryRunner.query(`
      ALTER TABLE \`caseStatusHistory\`
      MODIFY COLUMN \`fromStatus\` enum(
        'NOTIFIED',
        'UNDER_REVIEW',
        'REVIEW_COMPLETED',
        'RESPONSE_IN_PROGRESS',
        'REOPENED',
        'CLOSED',
        'VOIDED'
      ) NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`caseStatusHistory\`
      MODIFY COLUMN \`toStatus\` enum(
        'NOTIFIED',
        'UNDER_REVIEW',
        'REVIEW_COMPLETED',
        'RESPONSE_IN_PROGRESS',
        'REOPENED',
        'CLOSED',
        'VOIDED'
      ) NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore the previous cases status enum.
    await queryRunner.query(`
      ALTER TABLE \`cases\`
      MODIFY COLUMN \`status\` enum(
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

    // Restore the previous case status history enums.
    await queryRunner.query(`
      ALTER TABLE \`caseStatusHistory\`
      MODIFY COLUMN \`fromStatus\` enum(
        'NOTIFIED',
        'UNDER_REVIEW',
        'PENDING_CHAIR_VALIDATION',
        'REVIEW_COMPLETED',
        'RESPONSE_IN_PROGRESS',
        'REOPENED',
        'CLOSED',
        'VOIDED'
      ) NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`caseStatusHistory\`
      MODIFY COLUMN \`toStatus\` enum(
        'NOTIFIED',
        'UNDER_REVIEW',
        'PENDING_CHAIR_VALIDATION',
        'REVIEW_COMPLETED',
        'RESPONSE_IN_PROGRESS',
        'REOPENED',
        'CLOSED',
        'VOIDED'
      ) NOT NULL
    `);
  }
}
