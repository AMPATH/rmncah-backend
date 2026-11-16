
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLocationsFacilitiesAndPCNs1794400839979
  implements MigrationInterface
{
  name = 'CreateLocationsFacilitiesAndPCNs1794400839979';

  private async hasForeignKey(
    queryRunner: QueryRunner,
    tableName: string,
    constraintName: string,
  ): Promise<boolean> {
    const result = await queryRunner.query(
      `SELECT COUNT(*) AS total
       FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
       WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND CONSTRAINT_NAME = ?
       AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
      [tableName, constraintName],
    );

    return Number(result[0].total) > 0;
  }

  private async addForeignKeyIfMissing(
    queryRunner: QueryRunner,
    tableName: string,
    constraintName: string,
    sql: string,
  ): Promise<void> {
    if (
      !(await this.hasForeignKey(
        queryRunner,
        tableName,
        constraintName,
      ))
    ) {
      await queryRunner.query(sql);
    }
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create PCNs only if missing.
    if (!(await queryRunner.hasTable('primaryCareNetworks'))) {
      await queryRunner.query(`
        CREATE TABLE \`primaryCareNetworks\` (
          \`id\` varchar(36) NOT NULL,
          \`subCountyId\` varchar(36) NOT NULL,
          \`name\` varchar(150) NOT NULL,
          \`code\` varchar(30) NULL,
          \`isActive\` tinyint NOT NULL DEFAULT 1,
          \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
            ON UPDATE CURRENT_TIMESTAMP(6),
          UNIQUE INDEX \`IDX_e9f69b3941499e88e915a5bc16\`
            (\`subCountyId\`, \`name\`),
          UNIQUE INDEX \`IDX_c11530f918ed4a80d4cfe9e53f\` (\`code\`),
          PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB
      `);
    }

    // 2. Create sub-counties only if missing.
    if (!(await queryRunner.hasTable('subCounties'))) {
      await queryRunner.query(`
        CREATE TABLE \`subCounties\` (
          \`id\` varchar(36) NOT NULL,
          \`name\` varchar(150) NOT NULL,
          \`code\` char(3) NOT NULL,
          \`countyId\` varchar(36) NOT NULL,
          \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
            ON UPDATE CURRENT_TIMESTAMP(6),
          \`deletedAt\` datetime(6) NULL,
          UNIQUE INDEX \`IDX_aec7a85a30c4e2d3a96f529297\`
            (\`countyId\`, \`name\`),
          UNIQUE INDEX \`IDX_7edc04226fa68a30bb8a0651a2\` (\`code\`),
          PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB
      `);
    }

    // 3. Create facilities only if missing.
    if (!(await queryRunner.hasTable('facilities'))) {
      await queryRunner.query(`
        CREATE TABLE \`facilities\` (
          \`id\` varchar(36) NOT NULL,
          \`subCountyId\` varchar(36) NOT NULL,
          \`name\` varchar(200) NOT NULL,
          \`mflCode\` varchar(50) NOT NULL,
          \`level\` enum(
            'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level 6'
          ) NOT NULL,
          \`type\` enum(
            'Dispensary', 'Medical Clinic', 'Health Centre',
            'Nursing Home', 'Sub-County Hospital',
            'County Referral Hospital', 'National Referral Hospital'
          ) NULL,
          \`ownership\` enum(
            'Public', 'Private', 'Faith Based', 'NGO', 'Other'
          ) NULL,
          \`isActive\` tinyint NOT NULL DEFAULT 1,
          \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
            ON UPDATE CURRENT_TIMESTAMP(6),
          INDEX \`IDX_466333dd6e97b4ff87b62467af\` (\`subCountyId\`),
          UNIQUE INDEX \`IDX_361cb42eb935d2ea617a1d4de1\` (\`mflCode\`),
          PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB
      `);
    }

    // 4. Create community units only if missing.
    if (!(await queryRunner.hasTable('communityUnits'))) {
      await queryRunner.query(`
        CREATE TABLE \`communityUnits\` (
          \`id\` varchar(36) NOT NULL,
          \`facilityId\` varchar(36) NOT NULL,
          \`name\` varchar(150) NOT NULL,
          \`code\` varchar(30) NULL,
          \`isActive\` tinyint NOT NULL DEFAULT 1,
          \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
            ON UPDATE CURRENT_TIMESTAMP(6),
          \`deletedAt\` datetime(6) NULL,
          UNIQUE INDEX \`IDX_3772da5c86445d37c433e239d9\`
            (\`facilityId\`, \`name\`),
          PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB
      `);
    }

    // 5. Add foreign keys only if missing.
    await this.addForeignKeyIfMissing(
      queryRunner,
      'subCounties',
      'FK_87d5b46e88c61a636246b39e4db',
      `ALTER TABLE \`subCounties\`
       ADD CONSTRAINT \`FK_87d5b46e88c61a636246b39e4db\`
       FOREIGN KEY (\`countyId\`) REFERENCES \`counties\`(\`id\`)
       ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );

    await this.addForeignKeyIfMissing(
      queryRunner,
      'facilities',
      'FK_466333dd6e97b4ff87b62467afe',
      `ALTER TABLE \`facilities\`
       ADD CONSTRAINT \`FK_466333dd6e97b4ff87b62467afe\`
       FOREIGN KEY (\`subCountyId\`) REFERENCES \`subCounties\`(\`id\`)
       ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );

    await this.addForeignKeyIfMissing(
      queryRunner,
      'communityUnits',
      'FK_1526b6ae4197e89ac5071e23834',
      `ALTER TABLE \`communityUnits\`
       ADD CONSTRAINT \`FK_1526b6ae4197e89ac5071e23834\`
       FOREIGN KEY (\`facilityId\`) REFERENCES \`facilities\`(\`id\`)
       ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );

    await this.addForeignKeyIfMissing(
      queryRunner,
      'primaryCareNetworks',
      'FK_57c2ffb94751caccccafd7f5c0d',
      `ALTER TABLE \`primaryCareNetworks\`
       ADD CONSTRAINT \`FK_57c2ffb94751caccccafd7f5c0d\`
       FOREIGN KEY (\`subCountyId\`) REFERENCES \`subCounties\`(\`id\`)
       ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );

    await this.addForeignKeyIfMissing(
      queryRunner,
      'facilityPcnMemberships',
      'FK_4b0c8de836c283006d387ced3f0',
      `ALTER TABLE \`facilityPcnMemberships\`
       ADD CONSTRAINT \`FK_4b0c8de836c283006d387ced3f0\`
       FOREIGN KEY (\`facilityId\`) REFERENCES \`facilities\`(\`id\`)
       ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );

    await this.addForeignKeyIfMissing(
      queryRunner,
      'facilityPcnMemberships',
      'FK_3e68e42b105251f6a2b398a9d8d',
      `ALTER TABLE \`facilityPcnMemberships\`
       ADD CONSTRAINT \`FK_3e68e42b105251f6a2b398a9d8d\`
       FOREIGN KEY (\`pcnId\`) REFERENCES \`primaryCareNetworks\`(\`id\`)
       ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );

    // 6. Register the existing generated column with TypeORM.
    const database = queryRunner.connection.options.database;

    if (database && (await queryRunner.hasTable('typeorm_metadata'))) {
      const metadata = await queryRunner.query(
        `SELECT COUNT(*) AS total
         FROM \`typeorm_metadata\`
         WHERE \`schema\` = ?
         AND \`table\` = ?
         AND \`type\` = ?
         AND \`name\` = ?`,
        [
          database,
          'facilityPcnMemberships',
          'GENERATED_COLUMN',
          'activeFacilityId',
        ],
      );

      if (Number(metadata[0].total) === 0) {
        await queryRunner.query(
          `INSERT INTO \`typeorm_metadata\`
           (\`database\`, \`schema\`, \`table\`, \`type\`, \`name\`, \`value\`)
           VALUES (DEFAULT, ?, ?, ?, ?, ?)`,
          [
            database,
            'facilityPcnMemberships',
            'GENERATED_COLUMN',
            'activeFacilityId',
            'CASE WHEN \`endedAt\` IS NULL THEN \`facilityId\` ELSE NULL END',
          ],
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // This is a reconciliation migration for a database with pre-existing
    // tables. A destructive rollback could remove imported data.
    throw new Error(
      'This migration must not be rolled back automatically. ' +
      'Review the database schema and data before performing any manual rollback.',
    );
  }
}
