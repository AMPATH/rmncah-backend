import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLocationsFacilitiesAndPCNs1794400839979 implements MigrationInterface {
    name = 'CreateLocationsFacilitiesAndPCNs1794400839979'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`counties\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(150) NOT NULL, \`code\` char(3) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, UNIQUE INDEX \`IDX_4a2d050d01f66e23433efe30a7\` (\`name\`), UNIQUE INDEX \`IDX_5ea349f0e0f5b794c6b68ca65c\` (\`code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`facilityPcnMemberships\` (\`id\` varchar(36) NOT NULL, \`facilityId\` varchar(36) NOT NULL, \`pcnId\` varchar(36) NOT NULL, \`activeFacilityId\` char(36) AS (CASE WHEN \`endedAt\` IS NULL THEN \`facilityId\` ELSE NULL END) VIRTUAL NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`endedAt\` datetime NULL, UNIQUE INDEX \`IDX_2b9b09280c5e61780854e4f9f3\` (\`activeFacilityId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`INSERT INTO \`rmncah_db\`.\`typeorm_metadata\`(\`database\`, \`schema\`, \`table\`, \`type\`, \`name\`, \`value\`) VALUES (DEFAULT, ?, ?, ?, ?, ?)`, ["rmncah_db","facilityPcnMemberships","GENERATED_COLUMN","activeFacilityId","CASE WHEN `endedAt` IS NULL THEN `facilityId` ELSE NULL END"]);
        await queryRunner.query(`CREATE TABLE \`primaryCareNetworks\` (\`id\` varchar(36) NOT NULL, \`subCountyId\` varchar(36) NOT NULL, \`name\` varchar(150) NOT NULL, \`code\` varchar(30) NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_e9f69b3941499e88e915a5bc16\` (\`subCountyId\`, \`name\`), UNIQUE INDEX \`IDX_c11530f918ed4a80d4cfe9e53f\` (\`code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`subCounties\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(150) NOT NULL, \`code\` char(3) NOT NULL, \`countyId\` varchar(36) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, UNIQUE INDEX \`IDX_aec7a85a30c4e2d3a96f529297\` (\`countyId\`, \`name\`), UNIQUE INDEX \`IDX_7edc04226fa68a30bb8a0651a2\` (\`code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`communityUnits\` (\`id\` varchar(36) NOT NULL, \`facilityId\` varchar(36) NOT NULL, \`name\` varchar(150) NOT NULL, \`code\` varchar(30) NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, UNIQUE INDEX \`IDX_3772da5c86445d37c433e239d9\` (\`facilityId\`, \`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`facilities\` (\`id\` varchar(36) NOT NULL, \`subCountyId\` varchar(36) NOT NULL, \`name\` varchar(200) NOT NULL, \`mflCode\` varchar(50) NOT NULL, \`level\` enum ('Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level 6') NOT NULL, \`type\` enum ('Dispensary', 'Medical Clinic', 'Health Centre', 'Nursing Home', 'Sub-County Hospital', 'County Referral Hospital', 'National Referral Hospital') NULL, \`ownership\` enum ('Public', 'Private', 'Faith Based', 'NGO', 'Other') NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_466333dd6e97b4ff87b62467af\` (\`subCountyId\`), UNIQUE INDEX \`IDX_361cb42eb935d2ea617a1d4de1\` (\`mflCode\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`facilityPcnMemberships\` ADD CONSTRAINT \`FK_4b0c8de836c283006d387ced3f0\` FOREIGN KEY (\`facilityId\`) REFERENCES \`facilities\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`facilityPcnMemberships\` ADD CONSTRAINT \`FK_3e68e42b105251f6a2b398a9d8d\` FOREIGN KEY (\`pcnId\`) REFERENCES \`primaryCareNetworks\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`primaryCareNetworks\` ADD CONSTRAINT \`FK_57c2ffb94751caccccafd7f5c0d\` FOREIGN KEY (\`subCountyId\`) REFERENCES \`subCounties\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`subCounties\` ADD CONSTRAINT \`FK_87d5b46e88c61a636246b39e4db\` FOREIGN KEY (\`countyId\`) REFERENCES \`counties\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`communityUnits\` ADD CONSTRAINT \`FK_1526b6ae4197e89ac5071e23834\` FOREIGN KEY (\`facilityId\`) REFERENCES \`facilities\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`facilities\` ADD CONSTRAINT \`FK_466333dd6e97b4ff87b62467afe\` FOREIGN KEY (\`subCountyId\`) REFERENCES \`subCounties\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`facilities\` DROP FOREIGN KEY \`FK_466333dd6e97b4ff87b62467afe\``);
        await queryRunner.query(`ALTER TABLE \`communityUnits\` DROP FOREIGN KEY \`FK_1526b6ae4197e89ac5071e23834\``);
        await queryRunner.query(`ALTER TABLE \`subCounties\` DROP FOREIGN KEY \`FK_87d5b46e88c61a636246b39e4db\``);
        await queryRunner.query(`ALTER TABLE \`primaryCareNetworks\` DROP FOREIGN KEY \`FK_57c2ffb94751caccccafd7f5c0d\``);
        await queryRunner.query(`ALTER TABLE \`facilityPcnMemberships\` DROP FOREIGN KEY \`FK_3e68e42b105251f6a2b398a9d8d\``);
        await queryRunner.query(`ALTER TABLE \`facilityPcnMemberships\` DROP FOREIGN KEY \`FK_4b0c8de836c283006d387ced3f0\``);
        await queryRunner.query(`DROP INDEX \`IDX_361cb42eb935d2ea617a1d4de1\` ON \`facilities\``);
        await queryRunner.query(`DROP INDEX \`IDX_466333dd6e97b4ff87b62467af\` ON \`facilities\``);
        await queryRunner.query(`DROP TABLE \`facilities\``);
        await queryRunner.query(`DROP INDEX \`IDX_3772da5c86445d37c433e239d9\` ON \`communityUnits\``);
        await queryRunner.query(`DROP TABLE \`communityUnits\``);
        await queryRunner.query(`DROP INDEX \`IDX_7edc04226fa68a30bb8a0651a2\` ON \`subCounties\``);
        await queryRunner.query(`DROP INDEX \`IDX_aec7a85a30c4e2d3a96f529297\` ON \`subCounties\``);
        await queryRunner.query(`DROP TABLE \`subCounties\``);
        await queryRunner.query(`DROP INDEX \`IDX_c11530f918ed4a80d4cfe9e53f\` ON \`primaryCareNetworks\``);
        await queryRunner.query(`DROP INDEX \`IDX_e9f69b3941499e88e915a5bc16\` ON \`primaryCareNetworks\``);
        await queryRunner.query(`DROP TABLE \`primaryCareNetworks\``);
        await queryRunner.query(`DELETE FROM \`rmncah_db\`.\`typeorm_metadata\` WHERE \`type\` = ? AND \`name\` = ? AND \`schema\` = ? AND \`table\` = ?`, ["GENERATED_COLUMN","activeFacilityId","rmncah_db","facilityPcnMemberships"]);
        await queryRunner.query(`DROP INDEX \`IDX_2b9b09280c5e61780854e4f9f3\` ON \`facilityPcnMemberships\``);
        await queryRunner.query(`DROP TABLE \`facilityPcnMemberships\``);
        await queryRunner.query(`DROP INDEX \`IDX_5ea349f0e0f5b794c6b68ca65c\` ON \`counties\``);
        await queryRunner.query(`DROP INDEX \`IDX_4a2d050d01f66e23433efe30a7\` ON \`counties\``);
        await queryRunner.query(`DROP TABLE \`counties\``);
    }

}
