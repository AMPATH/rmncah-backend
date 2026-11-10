import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeletedAtToCases1794298770552 implements MigrationInterface {
    name = 'AddDeletedAtToCases1794298770552'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`cases\` ADD \`deletedAt\` datetime(6) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`cases\` DROP COLUMN \`deletedAt\``);
    }

}
