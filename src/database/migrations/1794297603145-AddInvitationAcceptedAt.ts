import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInvitationAcceptedAt1794297603145 implements MigrationInterface {
    name = 'AddInvitationAcceptedAt1794297603145'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`invitationAcceptedAt\` datetime NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD UNIQUE INDEX \`IDX_1e3d0240b49c40521aaeb95329\` (\`phoneNumber\`)`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`status\` \`status\` enum ('ACTIVE', 'INACTIVE', 'PENDING', 'DEACTIVATED') NOT NULL DEFAULT 'PENDING'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`status\` \`status\` enum ('ACTIVE', 'INACTIVE', 'PENDING', 'DEACTIVATED') NOT NULL DEFAULT 'ACTIVE'`);
        await queryRunner.query(`ALTER TABLE \`users\` DROP INDEX \`IDX_1e3d0240b49c40521aaeb95329\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`invitationAcceptedAt\``);
    }

}
