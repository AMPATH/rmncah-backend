import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class AddIcd11CausesAndUpdateMpdsrCasesEntities1795004080241
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. ICD-11 causes
    await queryRunner.createTable(
      new Table({
        name: 'icd11Causes',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            isNullable: false,
          },
          {
            name: 'code',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
            onUpdate: 'CURRENT_TIMESTAMP(6)',
          },
        ],
        indices: [
          new TableIndex({
            name: 'UQ_icd11_causes_code',
            columnNames: ['code'],
            isUnique: true,
          }),
        ],
      }),
    );

    // 2. ICD-11 cause types
    await queryRunner.createTable(
      new Table({
        name: 'icd11CauseTypes',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            isNullable: false,
          },
          {
            name: 'causeId',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'caseType',
            type: 'enum',
            enum: ['MATERNAL', 'PERINATAL'],
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
          },
        ],
        indices: [
          new TableIndex({
            name: 'UQ_icd11_cause_types_cause_case_type',
            columnNames: ['causeId', 'caseType'],
            isUnique: true,
          }),
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'icd11CauseTypes',
      new TableForeignKey({
        name: 'FK_ICD11_CAUSE_TYPES_CAUSE',
        columnNames: ['causeId'],
        referencedTableName: 'icd11Causes',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // 3. Responsible facility on cases
    await queryRunner.addColumn(
      'cases',
      new TableColumn({
        name: 'responsibleFacilityId',
        type: 'varchar',
        length: '36',
        isNullable: true,
      }),
    );

    // Backfill community-reported cases using their community unit's facility.
    await queryRunner.query(`
      UPDATE \`cases\` c
      INNER JOIN \`communityUnits\` cu
        ON cu.id = c.communityUnitId
      SET c.responsibleFacilityId = cu.facilityId
      WHERE c.reportingSetting = 'COMMUNITY'
        AND c.responsibleFacilityId IS NULL
    `);

    await queryRunner.createIndex(
      'cases',
      new TableIndex({
        name: 'IDX_CASE_RESPONSIBLE_FACILITY',
        columnNames: ['responsibleFacilityId'],
      }),
    );

    await queryRunner.createForeignKey(
      'cases',
      new TableForeignKey({
        name: 'FK_CASE_RESPONSIBLE_FACILITY',
        columnNames: ['responsibleFacilityId'],
        referencedTableName: 'facilities',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    // 4. Maternal case detail changes
    // These two columns already exist in the current database.
    // Preserve legacy values while allowing new entity-based inserts.
    await queryRunner.query(`
      ALTER TABLE \`maternalCaseDetails\`
        MODIFY COLUMN \`parity\` int NULL,
        MODIFY COLUMN \`pregnancyOutcome\`
          ENUM('LIVE_BIRTH', 'STILLBIRTH', 'MISCARRIAGE', 'ABORTION', 'OTHER', 'UNKNOWN') NULL,
        MODIFY COLUMN \`deliveryMode\`
          ENUM('SPONTANEOUS_VAGINAL', 'ASSISTED_VAGINAL', 'CAESAREAN_SECTION', 'OTHER', 'UNKNOWN') NULL,
        MODIFY COLUMN \`causeOfDeathId\` varchar(36) NULL,
        MODIFY COLUMN \`clinicalSummary\` text NULL
    `);

    // 5. Perinatal case detail changes
    // Add the new enum columns as nullable first so existing rows remain valid.
    await queryRunner.addColumns('perinatalCaseDetails', [
      new TableColumn({
        name: 'birthOutcome',
        type: 'enum',
        enum: ['STILLBIRTH', 'LIVE_BIRTH', 'UNKNOWN'],
        isNullable: true,
      }),
      new TableColumn({
        name: 'gestationalAgeDays',
        type: 'int',
        isNullable: true,
      }),
      new TableColumn({
        name: 'birthWeightGrams',
        type: 'int',
        isNullable: true,
      }),
      new TableColumn({
        name: 'placeOfBirth',
        type: 'enum',
        enum: [
          'HEALTH_FACILITY',
          'HOME',
          'EN_ROUTE_TO_FACILITY',
          'OTHER',
          'UNKNOWN',
        ],
        isNullable: true,
      }),
    ]);

    // Existing gestationalAgeAtBirth values are recorded in completed weeks.
    // Convert them to days in the new column.
    await queryRunner.query(`
      UPDATE \`perinatalCaseDetails\`
      SET \`gestationalAgeDays\` = \`gestationalAgeAtBirth\` * 7
      WHERE \`gestationalAgeAtBirth\` IS NOT NULL
        AND \`gestationalAgeDays\` IS NULL
    `);

    // These values cannot safely be inferred from the legacy columns.
    await queryRunner.query(`
      UPDATE \`perinatalCaseDetails\`
      SET \`birthOutcome\` = 'UNKNOWN'
      WHERE \`birthOutcome\` IS NULL
    `);

    await queryRunner.query(`
      UPDATE \`perinatalCaseDetails\`
      SET \`placeOfBirth\` = 'UNKNOWN'
      WHERE \`placeOfBirth\` IS NULL
    `);

    // Preserve legacy perinatal values, but allow new entity-based
    // inserts without requiring fields that are no longer in the entity.
    await queryRunner.query(`
      ALTER TABLE \`perinatalCaseDetails\`
        MODIFY COLUMN \`modeOfDelivery\`
          ENUM('SPONTANEOUS_VAGINAL', 'ASSISTED_VAGINAL', 'CAESAREAN_SECTION', 'OTHER', 'UNKNOWN') NULL,
        MODIFY COLUMN \`causeOfDeathId\` varchar(36) NULL,
        MODIFY COLUMN \`clinicalSummary\` text NULL
    `);

    // Enforce the non-null constraints required by the entity.
    await queryRunner.query(`
      ALTER TABLE \`perinatalCaseDetails\`
      MODIFY COLUMN \`birthOutcome\`
      ENUM('STILLBIRTH', 'LIVE_BIRTH', 'UNKNOWN') NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`perinatalCaseDetails\`
      MODIFY COLUMN \`placeOfBirth\`
      ENUM(
        'HEALTH_FACILITY',
        'HOME',
        'EN_ROUTE_TO_FACILITY',
        'OTHER',
        'UNKNOWN'
      ) NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse perinatal changes.
    await queryRunner.dropColumn('perinatalCaseDetails', 'placeOfBirth');
    await queryRunner.dropColumn('perinatalCaseDetails', 'birthWeightGrams');
    await queryRunner.dropColumn('perinatalCaseDetails', 'gestationalAgeDays');
    await queryRunner.dropColumn('perinatalCaseDetails', 'birthOutcome');

    // gestationAtDeath and daysPostpartum predate this migration.
    // Leave both columns intact when reverting.

    // Reverse responsible facility changes.
    await queryRunner.dropForeignKey(
      'cases',
      'FK_CASE_RESPONSIBLE_FACILITY',
    );

    await queryRunner.dropIndex(
      'cases',
      'IDX_CASE_RESPONSIBLE_FACILITY',
    );

    await queryRunner.dropColumn('cases', 'responsibleFacilityId');

    // Reverse ICD-11 changes.
    await queryRunner.dropForeignKey(
      'icd11CauseTypes',
      'FK_ICD11_CAUSE_TYPES_CAUSE',
    );

    await queryRunner.dropTable('icd11CauseTypes');
    await queryRunner.dropTable('icd11Causes');
  }
}
