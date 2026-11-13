
import {
  MigrationInterface,
  QueryRunner,
  TableForeignKey,
} from 'typeorm';

export class CreateMentorInvitations1794462592390
  implements MigrationInterface
{
  name = 'CreateMentorInvitations1794462592390';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('mentor_invitations');

    if (!table) {
      throw new Error(
        'mentor_invitations table does not exist. Check the database schema.',
      );
    }

    const foreignKeyExists = table.foreignKeys.some(
      (fk) => fk.name === 'FK_9971dc6f41d8d101314cb663bf2',
    );

    if (!foreignKeyExists) {
      await queryRunner.createForeignKey(
        'mentor_invitations',
        new TableForeignKey({
          name: 'FK_9971dc6f41d8d101314cb663bf2',
          columnNames: ['user_id'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          onDelete: 'RESTRICT',
          onUpdate: 'NO ACTION',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('mentor_invitations');

    if (!table) return;

    const foreignKey = table.foreignKeys.find(
      (fk) => fk.name === 'FK_9971dc6f41d8d101314cb663bf2',
    );

    if (foreignKey) {
      await queryRunner.dropForeignKey(
        'mentor_invitations',
        foreignKey,
      );
    }
  }
}
