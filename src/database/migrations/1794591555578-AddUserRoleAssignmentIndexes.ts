import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserRoleAssignmentIndexes1794591555578 implements MigrationInterface {
    name = 'AddUserRoleAssignmentIndexes1794591555578'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX \`IDX_7dee70894f7a96dc38833fb653\` ON \`userRoleAssignments\` (\`userId\`, \`roleId\`, \`organizationAssignmentId\`, \`revokedAt\`, \`expiresAt\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_91869ee5d21bb2bce45e383dcf\` ON \`userRoleAssignments\` (\`userId\`, \`assignedAt\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_91869ee5d21bb2bce45e383dcf\` ON \`userRoleAssignments\``);
        await queryRunner.query(`DROP INDEX \`IDX_7dee70894f7a96dc38833fb653\` ON \`userRoleAssignments\``);
    }

}
