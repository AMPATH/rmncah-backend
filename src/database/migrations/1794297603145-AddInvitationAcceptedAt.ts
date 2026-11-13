
import {
  MigrationInterface,
  QueryRunner,
  TableIndex,
} from 'typeorm';

export class AddInvitationAcceptedAt1794297603145
  implements MigrationInterface {

  name = 'AddInvitationAcceptedAt1794297603145';

  public async up(queryRunner: QueryRunner): Promise<void> {

    // Check whether invitationAcceptedAt already exists
    const hasColumn = await queryRunner.hasColumn(
      'users',
      'invitationAcceptedAt',
    );

    if (!hasColumn) {
      await queryRunner.query(
        'ALTER TABLE `users` ADD `invitationAcceptedAt` datetime NULL',
      );
    }

    // Check whether the phone number unique index already exists
    const table = await queryRunner.getTable('users');

    const indexName = 'IDX_1e3d0240b49c40521aaeb95329';

    const hasIndex = table?.indices.some(
      (index) => index.name === indexName,
    ) ?? false;

    if (!hasIndex) {
      await queryRunner.createIndex(
        'users',
        new TableIndex({
          name: indexName,
          columnNames: ['phoneNumber'],
          isUnique: true,
        }),
      );
    }

    // Update status enum
    await queryRunner.query(`
      ALTER TABLE \`users\`
      CHANGE \`status\` \`status\`
      enum ('ACTIVE', 'INACTIVE', 'PENDING', 'DEACTIVATED')
      NOT NULL DEFAULT 'PENDING'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('users');

    const indexName = 'IDX_1e3d0240b49c40521aaeb95329';

    const hasIndex = table?.indices.some(
      (index) => index.name === indexName,
    ) ?? false;

    if (hasIndex) {
      await queryRunner.dropIndex('users', indexName);
    }

    if (await queryRunner.hasColumn('users', 'invitationAcceptedAt')) {
      await queryRunner.dropColumn('users', 'invitationAcceptedAt');
    }

    await queryRunner.query(`
      ALTER TABLE \`users\`
      CHANGE \`status\` \`status\`
      enum ('ACTIVE', 'INACTIVE', 'PENDING', 'DEACTIVATED')
      NOT NULL DEFAULT 'ACTIVE'
    `);
  }
}
