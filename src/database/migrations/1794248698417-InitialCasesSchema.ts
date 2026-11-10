import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialCasesSchema1794248698417 implements MigrationInterface {
    name = 'InitialCasesSchema1794248698417'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`maternalCaseDetails\` (
                \`id\` varchar(36) NOT NULL,
                \`caseId\` varchar(36) NOT NULL,
                \`dateOfDeath\` date NOT NULL,
                \`deathPeriod\` enum ('ANTENATAL', 'INTRAPARTUM', 'POSTPARTUM') NOT NULL,
                \`parity\` int NOT NULL,
                \`gestationAtDeath\` int NULL,
                \`daysPostpartum\` int NULL,
                \`pregnancyOutcome\` enum (
                    'LIVE_BIRTH',
                    'STILLBIRTH',
                    'MISCARRIAGE',
                    'ABORTION',
                    'OTHER',
                    'UNKNOWN'
                ) NOT NULL,
                \`deliveryMode\` enum (
                    'SPONTANEOUS_VAGINAL',
                    'ASSISTED_VAGINAL',
                    'CAESAREAN_SECTION',
                    'OTHER',
                    'UNKNOWN'
                ) NOT NULL,
                \`causeOfDeathId\` varchar(36) NOT NULL,
                \`clinicalSummary\` text NOT NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                UNIQUE INDEX \`IDX_ee90a0340f381ff7317dfecf33\` (\`caseId\`),
                UNIQUE INDEX \`REL_ee90a0340f381ff7317dfecf33\` (\`caseId\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`perinatalCaseDetails\` (
                \`id\` varchar(36) NOT NULL,
                \`caseId\` varchar(36) NOT NULL,
                \`dateOfDeath\` date NOT NULL,
                \`gestationalAgeAtBirth\` int NULL,
                \`modeOfDelivery\` enum (
                    'SPONTANEOUS_VAGINAL',
                    'ASSISTED_VAGINAL',
                    'CAESAREAN_SECTION',
                    'OTHER',
                    'UNKNOWN'
                ) NOT NULL,
                \`causeOfDeathId\` varchar(36) NOT NULL,
                \`clinicalSummary\` text NOT NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                UNIQUE INDEX \`IDX_03ddde4b744448d556212a7d66\` (\`caseId\`),
                UNIQUE INDEX \`REL_03ddde4b744448d556212a7d66\` (\`caseId\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`nearMissDetails\` (
                \`id\` varchar(36) NOT NULL,
                \`caseId\` varchar(36) NOT NULL,
                \`dateOfComplication\` date NOT NULL,
                \`dateOfAdmission\` date NOT NULL,
                \`dateOfDischarge\` date NULL,
                \`periodOfComplication\` enum ('ANTENATAL', 'INTRAPARTUM', 'POSTPARTUM') NOT NULL,
                \`parity\` int NOT NULL,
                \`gestationalAgeAtComplication\` int NULL,
                \`clinicalSummary\` text NOT NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                UNIQUE INDEX \`IDX_9fea5975ef9b192336cb528c00\` (\`caseId\`),
                UNIQUE INDEX \`REL_9fea5975ef9b192336cb528c00\` (\`caseId\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`cases\` (
                \`id\` varchar(36) NOT NULL,
                \`caseNumber\` varchar(50) NOT NULL,
                \`caseType\` enum ('MATERNAL', 'PERINATAL', 'NEAR_MISS') NOT NULL,
                \`reportingSetting\` enum ('FACILITY', 'COMMUNITY') NOT NULL,
                \`facilityId\` varchar(36) NULL,
                \`communityUnitId\` varchar(36) NULL,
                \`reportedBy\` varchar(36) NOT NULL,
                \`dateOfBirth\` date NOT NULL,
                \`gender\` enum ('MALE', 'FEMALE', 'UNKNOWN') NOT NULL,
                \`notificationDate\` date NOT NULL,
                \`comments\` text NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                INDEX \`IDX_CASE_CREATED_AT\` (\`createdAt\`),
                INDEX \`IDX_CASE_REPORTER\` (\`reportedBy\`),
                INDEX \`IDX_CASE_COMMUNITY_UNIT\` (\`communityUnitId\`),
                INDEX \`IDX_CASE_FACILITY\` (\`facilityId\`),
                UNIQUE INDEX \`IDX_2064054503f00114ee9375a8cf\` (\`caseNumber\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            ALTER TABLE \`maternalCaseDetails\`
            ADD CONSTRAINT \`FK_ee90a0340f381ff7317dfecf334\` FOREIGN KEY (\`caseId\`) REFERENCES \`cases\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`perinatalCaseDetails\`
            ADD CONSTRAINT \`FK_03ddde4b744448d556212a7d663\` FOREIGN KEY (\`caseId\`) REFERENCES \`cases\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`nearMissDetails\`
            ADD CONSTRAINT \`FK_9fea5975ef9b192336cb528c00d\` FOREIGN KEY (\`caseId\`) REFERENCES \`cases\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`nearMissDetails\` DROP FOREIGN KEY \`FK_9fea5975ef9b192336cb528c00d\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`perinatalCaseDetails\` DROP FOREIGN KEY \`FK_03ddde4b744448d556212a7d663\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`maternalCaseDetails\` DROP FOREIGN KEY \`FK_ee90a0340f381ff7317dfecf334\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_2064054503f00114ee9375a8cf\` ON \`cases\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_CASE_FACILITY\` ON \`cases\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_CASE_COMMUNITY_UNIT\` ON \`cases\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_CASE_REPORTER\` ON \`cases\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_CASE_CREATED_AT\` ON \`cases\`
        `);
        await queryRunner.query(`
            DROP TABLE \`cases\`
        `);
        await queryRunner.query(`
            DROP INDEX \`REL_9fea5975ef9b192336cb528c00\` ON \`nearMissDetails\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_9fea5975ef9b192336cb528c00\` ON \`nearMissDetails\`
        `);
        await queryRunner.query(`
            DROP TABLE \`nearMissDetails\`
        `);
        await queryRunner.query(`
            DROP INDEX \`REL_03ddde4b744448d556212a7d66\` ON \`perinatalCaseDetails\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_03ddde4b744448d556212a7d66\` ON \`perinatalCaseDetails\`
        `);
        await queryRunner.query(`
            DROP TABLE \`perinatalCaseDetails\`
        `);
        await queryRunner.query(`
            DROP INDEX \`REL_ee90a0340f381ff7317dfecf33\` ON \`maternalCaseDetails\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_ee90a0340f381ff7317dfecf33\` ON \`maternalCaseDetails\`
        `);
        await queryRunner.query(`
            DROP TABLE \`maternalCaseDetails\`
        `);
    }

}
