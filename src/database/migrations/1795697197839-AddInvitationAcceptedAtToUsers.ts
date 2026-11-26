
import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
} from 'typeorm';

export class AddInvitationAcceptedAtToUsers1795697197839
  implements MigrationInterface
{
  name = 'AddInvitationAcceptedAtToUsers1795697197839';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('users');

    if (!tableExists) {
      throw new Error('Users table does not exist.');
    }

    const columnExists = await queryRunner.hasColumn(
      'users',
      'invitationAcceptedAt',
    );

    if (!columnExists) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'invitationAcceptedAt',
          type: 'datetime',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const columnExists = await queryRunner.hasColumn(
      'users',
      'invitationAcceptedAt',
    );

    if (columnExists) {
      await queryRunner.dropColumn(
        'users',
        'invitationAcceptedAt',
      );
    }
  }
}
