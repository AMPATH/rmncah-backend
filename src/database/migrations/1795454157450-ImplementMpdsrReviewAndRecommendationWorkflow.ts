import { MigrationInterface, QueryRunner } from "typeorm";

export class ImplementMpdsrReviewAndRecommendationWorkflow1795454157450 implements MigrationInterface {
    name = 'ImplementMpdsrReviewAndRecommendationWorkflow1795454157450'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`systemBootstrap\` CHANGE \`createdAt\` \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`systemBootstrap\` CHANGE \`updatedAt\` \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`CREATE INDEX \`IDX_MATERNAL_FINAL_CAUSE\` ON \`maternalCaseDetails\` (\`finalCauseId\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_PERINATAL_FINAL_CAUSE\` ON \`perinatalCaseDetails\` (\`finalCauseId\`)`);
        await queryRunner.query(`ALTER TABLE \`maternalCaseDetails\` ADD CONSTRAINT \`FK_8ac2932547efd3d6151e580aeab\` FOREIGN KEY (\`finalCauseId\`) REFERENCES \`icd11Causes\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`perinatalCaseDetails\` ADD CONSTRAINT \`FK_969ed916c2d1b91ccaa2c59586b\` FOREIGN KEY (\`finalCauseId\`) REFERENCES \`icd11Causes\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`caseRecommendations\` ADD CONSTRAINT \`FK_84d2f5f87c20faa7305d8bf2944\` FOREIGN KEY (\`caseId\`) REFERENCES \`cases\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`caseRecommendations\` ADD CONSTRAINT \`FK_e90f73c4719cfe20327fb438b2a\` FOREIGN KEY (\`caseContributingFactorId\`) REFERENCES \`caseContributingFactors\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`caseRecommendationAssignments\` ADD CONSTRAINT \`FK_6a3dbea338c7827f04bbd1a4902\` FOREIGN KEY (\`recommendationId\`) REFERENCES \`caseRecommendations\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`caseRecommendationAssignments\` ADD CONSTRAINT \`FK_cc251aa12c32e6e79a0e17a9e3e\` FOREIGN KEY (\`countyId\`) REFERENCES \`counties\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`caseRecommendationAssignments\` ADD CONSTRAINT \`FK_1d4b649cd5b859405b7cc80dfab\` FOREIGN KEY (\`subCountyId\`) REFERENCES \`subCounties\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`caseRecommendationAssignments\` ADD CONSTRAINT \`FK_d24a9805d53bc07c414badeb2b8\` FOREIGN KEY (\`facilityId\`) REFERENCES \`facilities\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`caseRecommendationAssignments\` ADD CONSTRAINT \`FK_d5fd3e1c1f2db3d95511eaf6601\` FOREIGN KEY (\`communityUnitId\`) REFERENCES \`communityUnits\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`caseRecommendationAssignments\` ADD CONSTRAINT \`FK_af06dfc358dd4a916ebc0c23598\` FOREIGN KEY (\`responsibleUserId\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`caseRecommendationAssignments\` ADD CONSTRAINT \`FK_63c9ac149c12dc35909d97d8765\` FOREIGN KEY (\`assignedBy\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`caseRecommendationAssignments\` ADD CONSTRAINT \`FK_5e45d8b1982df92156874a2564d\` FOREIGN KEY (\`previousAssignmentId\`) REFERENCES \`caseRecommendationAssignments\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`caseReviewChanges\` ADD CONSTRAINT \`FK_ea4d5a52e80eae17efe0d2ccacd\` FOREIGN KEY (\`caseReviewId\`) REFERENCES \`caseReviews\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`caseReviewChanges\` ADD CONSTRAINT \`FK_78f45cea190c9625e8307c7fe0c\` FOREIGN KEY (\`changedBy\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`caseReviewChanges\` DROP FOREIGN KEY \`FK_78f45cea190c9625e8307c7fe0c\``);
        await queryRunner.query(`ALTER TABLE \`caseReviewChanges\` DROP FOREIGN KEY \`FK_ea4d5a52e80eae17efe0d2ccacd\``);
        await queryRunner.query(`ALTER TABLE \`caseRecommendationAssignments\` DROP FOREIGN KEY \`FK_5e45d8b1982df92156874a2564d\``);
        await queryRunner.query(`ALTER TABLE \`caseRecommendationAssignments\` DROP FOREIGN KEY \`FK_63c9ac149c12dc35909d97d8765\``);
        await queryRunner.query(`ALTER TABLE \`caseRecommendationAssignments\` DROP FOREIGN KEY \`FK_af06dfc358dd4a916ebc0c23598\``);
        await queryRunner.query(`ALTER TABLE \`caseRecommendationAssignments\` DROP FOREIGN KEY \`FK_d5fd3e1c1f2db3d95511eaf6601\``);
        await queryRunner.query(`ALTER TABLE \`caseRecommendationAssignments\` DROP FOREIGN KEY \`FK_d24a9805d53bc07c414badeb2b8\``);
        await queryRunner.query(`ALTER TABLE \`caseRecommendationAssignments\` DROP FOREIGN KEY \`FK_1d4b649cd5b859405b7cc80dfab\``);
        await queryRunner.query(`ALTER TABLE \`caseRecommendationAssignments\` DROP FOREIGN KEY \`FK_cc251aa12c32e6e79a0e17a9e3e\``);
        await queryRunner.query(`ALTER TABLE \`caseRecommendationAssignments\` DROP FOREIGN KEY \`FK_6a3dbea338c7827f04bbd1a4902\``);
        await queryRunner.query(`ALTER TABLE \`caseRecommendations\` DROP FOREIGN KEY \`FK_e90f73c4719cfe20327fb438b2a\``);
        await queryRunner.query(`ALTER TABLE \`caseRecommendations\` DROP FOREIGN KEY \`FK_84d2f5f87c20faa7305d8bf2944\``);
        await queryRunner.query(`ALTER TABLE \`perinatalCaseDetails\` DROP FOREIGN KEY \`FK_969ed916c2d1b91ccaa2c59586b\``);
        await queryRunner.query(`ALTER TABLE \`maternalCaseDetails\` DROP FOREIGN KEY \`FK_8ac2932547efd3d6151e580aeab\``);
        await queryRunner.query(`DROP INDEX \`IDX_PERINATAL_FINAL_CAUSE\` ON \`perinatalCaseDetails\``);
        await queryRunner.query(`DROP INDEX \`IDX_MATERNAL_FINAL_CAUSE\` ON \`maternalCaseDetails\``);
        await queryRunner.query(`ALTER TABLE \`systemBootstrap\` CHANGE \`updatedAt\` \`updatedAt\` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE \`systemBootstrap\` CHANGE \`createdAt\` \`createdAt\` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP`);
    }

}
