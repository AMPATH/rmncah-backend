import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCaseReviewsAndCaseContributingFactors1795198775559 implements MigrationInterface {
    name = 'AddCaseReviewsAndCaseContributingFactors1795198775559'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`caseContributingFactors\` (\`id\` varchar(36) NOT NULL, \`caseId\` varchar(36) NOT NULL, \`contributingFactorId\` varchar(36) NOT NULL, \`reporterSelected\` tinyint NOT NULL DEFAULT 0, \`reviewerSelected\` tinyint NOT NULL DEFAULT 0, \`reviewedBy\` varchar(36) NULL, \`reviewedAt\` datetime NULL, \`reviewerNotes\` text NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_caseContributingFactors_contributingFactorId\` (\`contributingFactorId\`), UNIQUE INDEX \`UQ_caseContributingFactors_case_factor\` (\`caseId\`, \`contributingFactorId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`caseReviews\` (\`id\` varchar(36) NOT NULL, \`caseId\` varchar(36) NOT NULL, \`reviewedBy\` varchar(36) NOT NULL, \`reviewDate\` date NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_caseReviews_reviewedBy\` (\`reviewedBy\`), UNIQUE INDEX \`REL_9866510e0ca0fce1f02e534658\` (\`caseId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`caseContributingFactors\` ADD CONSTRAINT \`FK_ba83f9be82846562b4a9099b78e\` FOREIGN KEY (\`caseId\`) REFERENCES \`cases\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`caseContributingFactors\` ADD CONSTRAINT \`FK_2d873a07f3585fe3874510566c7\` FOREIGN KEY (\`contributingFactorId\`) REFERENCES \`contributingFactors\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`caseContributingFactors\` ADD CONSTRAINT \`FK_8f34ae0c85ae3afa8e07eb99366\` FOREIGN KEY (\`reviewedBy\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`caseReviews\` ADD CONSTRAINT \`FK_9866510e0ca0fce1f02e5346585\` FOREIGN KEY (\`caseId\`) REFERENCES \`cases\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`caseReviews\` ADD CONSTRAINT \`FK_a511b84af409e8bc03fc2df9e40\` FOREIGN KEY (\`reviewedBy\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`caseReviews\` DROP FOREIGN KEY \`FK_a511b84af409e8bc03fc2df9e40\``);
        await queryRunner.query(`ALTER TABLE \`caseReviews\` DROP FOREIGN KEY \`FK_9866510e0ca0fce1f02e5346585\``);
        await queryRunner.query(`ALTER TABLE \`caseContributingFactors\` DROP FOREIGN KEY \`FK_8f34ae0c85ae3afa8e07eb99366\``);
        await queryRunner.query(`ALTER TABLE \`caseContributingFactors\` DROP FOREIGN KEY \`FK_2d873a07f3585fe3874510566c7\``);
        await queryRunner.query(`ALTER TABLE \`caseContributingFactors\` DROP FOREIGN KEY \`FK_ba83f9be82846562b4a9099b78e\``);
        await queryRunner.query(`DROP INDEX \`REL_9866510e0ca0fce1f02e534658\` ON \`caseReviews\``);
        await queryRunner.query(`DROP INDEX \`IDX_caseReviews_reviewedBy\` ON \`caseReviews\``);
        await queryRunner.query(`DROP TABLE \`caseReviews\``);
        await queryRunner.query(`DROP INDEX \`UQ_caseContributingFactors_case_factor\` ON \`caseContributingFactors\``);
        await queryRunner.query(`DROP INDEX \`IDX_caseContributingFactors_contributingFactorId\` ON \`caseContributingFactors\``);
        await queryRunner.query(`DROP TABLE \`caseContributingFactors\``);
    }

}
