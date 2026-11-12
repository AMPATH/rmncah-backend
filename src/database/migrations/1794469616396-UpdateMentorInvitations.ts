
import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateMentorInvitations1794469616396
  implements MigrationInterface
{
  name = 'UpdateMentorInvitations1794469616396';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rename existing columns without losing data.
    await queryRunner.query(`
      ALTER TABLE mentor_invitations
      RENAME COLUMN user_id TO userId,
      RENAME COLUMN token_hash TO tokenHash,
      RENAME COLUMN otp_hash TO otpHash,
      RENAME COLUMN expires_at TO expiresAt,
      RENAME COLUMN otp_expires_at TO otpExpiresAt,
      RENAME COLUMN accepted_at TO acceptedAt,
      RENAME COLUMN verified_at TO verifiedAt,
      RENAME COLUMN completed_at TO completedAt,
      RENAME COLUMN created_at TO createdAt
    `);

    // Preserve fractional-second precision.
    await queryRunner.query(`
      ALTER TABLE mentor_invitations
      MODIFY createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    `);

    // Add indexes.
    await queryRunner.query(`
      CREATE INDEX IDX_1b5c0777c775c7c5b7aea6976a
      ON mentor_invitations (userId, status)
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IDX_79ed0161ec5abe370b8e0d4c67
      ON mentor_invitations (tokenHash)
    `);

    // Add the user foreign key.
    await queryRunner.query(`
      ALTER TABLE mentor_invitations
      ADD CONSTRAINT FK_mentor_invitations_user
      FOREIGN KEY (userId)
      REFERENCES users(id)
      ON DELETE RESTRICT
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE mentor_invitations
      DROP FOREIGN KEY FK_mentor_invitations_user
    `);

    await queryRunner.query(`
      DROP INDEX IDX_79ed0161ec5abe370b8e0d4c67
      ON mentor_invitations
    `);

    await queryRunner.query(`
      DROP INDEX IDX_1b5c0777c775c7c5b7aea6976a
      ON mentor_invitations
    `);

    await queryRunner.query(`
      ALTER TABLE mentor_invitations
      RENAME COLUMN userId TO user_id,
      RENAME COLUMN tokenHash TO token_hash,
      RENAME COLUMN otpHash TO otp_hash,
      RENAME COLUMN expiresAt TO expires_at,
      RENAME COLUMN otpExpiresAt TO otp_expires_at,
      RENAME COLUMN acceptedAt TO accepted_at,
      RENAME COLUMN verifiedAt TO verified_at,
      RENAME COLUMN completedAt TO completed_at,
      RENAME COLUMN createdAt TO created_at
    `);

    await queryRunner.query(`
      ALTER TABLE mentor_invitations
      MODIFY created_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    `);
  }
}
