import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandSubCountyCodeLength1794402948239 implements MigrationInterface {
  name = 'ExpandSubCountyCodeLength1794402948239';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`subCounties\`
      MODIFY COLUMN \`code\` VARCHAR(10) NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`subCounties\`
      MODIFY COLUMN \`code\` CHAR(3) NOT NULL
    `);
  }
}
