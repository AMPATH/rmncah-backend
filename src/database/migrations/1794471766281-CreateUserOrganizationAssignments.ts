import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserOrganizationAssignments1794471766281 implements MigrationInterface {
  name = 'CreateUserOrganizationAssignments1794471766281';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`userOrganizationAssignments\` (
        \`id\` varchar(36) NOT NULL,
        \`userId\` varchar(36) NOT NULL,
        \`level\` enum('COUNTY', 'SUB_COUNTY', 'PCN', 'FACILITY', 'COMMUNITY') NOT NULL,

        \`countyId\` varchar(36) NULL,
        \`subCountyId\` varchar(36) NULL,
        \`pcnId\` varchar(36) NULL,
        \`facilityId\` varchar(36) NULL,
        \`communityUnitId\` varchar(36) NULL,

        \`activeCountyId\` char(36)
          AS (CASE WHEN \`endDate\` IS NULL THEN \`countyId\` ELSE NULL END) VIRTUAL,
        \`activeSubCountyId\` char(36)
          AS (CASE WHEN \`endDate\` IS NULL THEN \`subCountyId\` ELSE NULL END) VIRTUAL,
        \`activePcnId\` char(36)
          AS (CASE WHEN \`endDate\` IS NULL THEN \`pcnId\` ELSE NULL END) VIRTUAL,
        \`activeFacilityId\` char(36)
          AS (CASE WHEN \`endDate\` IS NULL THEN \`facilityId\` ELSE NULL END) VIRTUAL,
        \`activeCommunityUnitId\` char(36)
          AS (CASE WHEN \`endDate\` IS NULL THEN \`communityUnitId\` ELSE NULL END) VIRTUAL,

        \`startDate\` datetime NOT NULL,
        \`endDate\` datetime NULL,
        \`assignedBy\` varchar(36) NULL,

        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
          ON UPDATE CURRENT_TIMESTAMP(6),

        INDEX \`IDX_5b217ec647f0671f999c882d49\` (\`communityUnitId\`),
        INDEX \`IDX_0037739d176b4a9707ce6dac0e\` (\`facilityId\`),
        INDEX \`IDX_a38c4f4f6ddee5392f1b21d317\` (\`pcnId\`),
        INDEX \`IDX_e07ec236d71444ab9fe8719d09\` (\`subCountyId\`),
        INDEX \`IDX_b945b6b7d766d82239ccd57c5f\` (\`countyId\`),

        UNIQUE INDEX \`IDX_19f0fa1197c6fcb42c2a01ad9c\`
          (\`userId\`, \`activeCommunityUnitId\`),
        UNIQUE INDEX \`IDX_107f3ae10874ed7afc1049e878\`
          (\`userId\`, \`activeFacilityId\`),
        UNIQUE INDEX \`IDX_570988fd3f98bc3785168e5ffc\`
          (\`userId\`, \`activePcnId\`),
        UNIQUE INDEX \`IDX_2d0beb0400c657382e39da9524\`
          (\`userId\`, \`activeSubCountyId\`),
        UNIQUE INDEX \`IDX_5b7ff45fae2ce4b55311196f31\`
          (\`userId\`, \`activeCountyId\`),

        INDEX \`IDX_b31f5d911173953bcb2ff47f33\` (\`userId\`, \`level\`),

        PRIMARY KEY (\`id\`),

        CONSTRAINT \`CHK_userOrganizationAssignments_exactlyOneOrganization\`
        CHECK (
          (
            \`level\` = 'COUNTY'
            AND \`countyId\` IS NOT NULL
            AND \`subCountyId\` IS NULL
            AND \`pcnId\` IS NULL
            AND \`facilityId\` IS NULL
            AND \`communityUnitId\` IS NULL
          )
          OR
          (
            \`level\` = 'SUB_COUNTY'
            AND \`countyId\` IS NULL
            AND \`subCountyId\` IS NOT NULL
            AND \`pcnId\` IS NULL
            AND \`facilityId\` IS NULL
            AND \`communityUnitId\` IS NULL
          )
          OR
          (
            \`level\` = 'PCN'
            AND \`countyId\` IS NULL
            AND \`subCountyId\` IS NULL
            AND \`pcnId\` IS NOT NULL
            AND \`facilityId\` IS NULL
            AND \`communityUnitId\` IS NULL
          )
          OR
          (
            \`level\` = 'FACILITY'
            AND \`countyId\` IS NULL
            AND \`subCountyId\` IS NULL
            AND \`pcnId\` IS NULL
            AND \`facilityId\` IS NOT NULL
            AND \`communityUnitId\` IS NULL
          )
          OR
          (
            \`level\` = 'COMMUNITY'
            AND \`countyId\` IS NULL
            AND \`subCountyId\` IS NULL
            AND \`pcnId\` IS NULL
            AND \`facilityId\` IS NULL
            AND \`communityUnitId\` IS NOT NULL
          )
        ),

        CONSTRAINT \`FK_1659784f26f9c0f5bd217c1f788\`
          FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`)
          ON DELETE RESTRICT ON UPDATE NO ACTION,

        CONSTRAINT \`FK_b945b6b7d766d82239ccd57c5f6\`
          FOREIGN KEY (\`countyId\`) REFERENCES \`counties\`(\`id\`)
          ON DELETE RESTRICT ON UPDATE NO ACTION,

        CONSTRAINT \`FK_e07ec236d71444ab9fe8719d093\`
          FOREIGN KEY (\`subCountyId\`) REFERENCES \`subCounties\`(\`id\`)
          ON DELETE RESTRICT ON UPDATE NO ACTION,

        CONSTRAINT \`FK_a38c4f4f6ddee5392f1b21d3174\`
          FOREIGN KEY (\`pcnId\`) REFERENCES \`primaryCareNetworks\`(\`id\`)
          ON DELETE RESTRICT ON UPDATE NO ACTION,

        CONSTRAINT \`FK_0037739d176b4a9707ce6dac0e0\`
          FOREIGN KEY (\`facilityId\`) REFERENCES \`facilities\`(\`id\`)
          ON DELETE RESTRICT ON UPDATE NO ACTION,

        CONSTRAINT \`FK_5b217ec647f0671f999c882d492\`
          FOREIGN KEY (\`communityUnitId\`) REFERENCES \`communityUnits\`(\`id\`)
          ON DELETE RESTRICT ON UPDATE NO ACTION,

        CONSTRAINT \`FK_5a055eb08b65efdd2ba0bcc8627\`
          FOREIGN KEY (\`assignedBy\`) REFERENCES \`users\`(\`id\`)
          ON DELETE SET NULL ON UPDATE NO ACTION

      ) ENGINE=InnoDB
      DEFAULT CHARSET=utf8mb4
      COLLATE=utf8mb4_0900_ai_ci
    `);

    const generatedColumns = [
      [
        'activeCountyId',
        'CASE WHEN `endDate` IS NULL THEN `countyId` ELSE NULL END',
      ],
      [
        'activeSubCountyId',
        'CASE WHEN `endDate` IS NULL THEN `subCountyId` ELSE NULL END',
      ],
      ['activePcnId', 'CASE WHEN `endDate` IS NULL THEN `pcnId` ELSE NULL END'],
      [
        'activeFacilityId',
        'CASE WHEN `endDate` IS NULL THEN `facilityId` ELSE NULL END',
      ],
      [
        'activeCommunityUnitId',
        'CASE WHEN `endDate` IS NULL THEN `communityUnitId` ELSE NULL END',
      ],
    ];

    for (const [name, expression] of generatedColumns) {
      await queryRunner.query(
        `INSERT INTO \`typeorm_metadata\`
          (\`database\`, \`schema\`, \`table\`, \`type\`, \`name\`, \`value\`)
         VALUES (DEFAULT, ?, ?, ?, ?, ?)`,
        [
          'rmncah_db',
          'userOrganizationAssignments',
          'GENERATED_COLUMN',
          name,
          expression,
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM \`typeorm_metadata\`
       WHERE \`type\` = ?
       AND \`schema\` = ?
       AND \`table\` = ?`,
      ['GENERATED_COLUMN', 'rmncah_db', 'userOrganizationAssignments'],
    );

    await queryRunner.query(`DROP TABLE \`userOrganizationAssignments\``);
  }
}
