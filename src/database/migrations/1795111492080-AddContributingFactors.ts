import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContributingFactors1795111492080
  implements MigrationInterface
{
  name = 'AddContributingFactors1795111492080';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rename existing tables. These operations preserve their records.
    await queryRunner.query(`
      RENAME TABLE
        mentor_invitations TO mentorInvitations,
        password_resets TO passwordResets,
        system_bootstrap TO systemBootstrap
    `);

    // Align existing indexes with the current entity metadata.
    await queryRunner.query(`
      ALTER TABLE mentorInvitations
        RENAME INDEX IDX_1b5c0777c775c7c5b7aea6976a
          TO IDX_f153d69fb710081e6fe3a6e22c,
        RENAME INDEX IDX_79ed0161ec5abe370b8e0d4c67
          TO IDX_cf4ae7e920b49172b8b56523d1
    `);

    await queryRunner.query(`
      ALTER TABLE passwordResets
        RENAME INDEX IDX_password_resets_userId
          TO IDX_passwordResets_userId,
        RENAME INDEX IDX_password_resets_expiresAt
          TO IDX_passwordResets_expiresAt,
        RENAME INDEX UQ_password_resets_tokenHash
          TO UQ_passwordResets_tokenHash
    `);

    await queryRunner.query(`
      ALTER TABLE systemBootstrap
        RENAME INDEX UQ_system_bootstrap_initialAdminUserId
          TO IDX_59a5fc363e973bfe3340f50974
    `);

    // Remove the duplicate mentor invitation FK and recreate one
    // using the current camelCase table name.
    await queryRunner.query(`
      ALTER TABLE mentorInvitations
        DROP FOREIGN KEY FK_9971dc6f41d8d101314cb663bf2,
        DROP FOREIGN KEY FK_mentor_invitations_user
    `);

    await queryRunner.query(`
      ALTER TABLE mentorInvitations
        ADD CONSTRAINT FK_5835c5ab79cfa0273677844d5fa
        FOREIGN KEY (userId) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    // Restore invitation foreign keys.
    await queryRunner.query(`
      ALTER TABLE invitations
        ADD CONSTRAINT FK_c16fdad3aea7ec7b047aedb9afe
        FOREIGN KEY (userId) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE NO ACTION,
        ADD CONSTRAINT FK_b7423cfb362a842b7ea0a3763b9
        FOREIGN KEY (invitedByUserId) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // Restore case-to-organization foreign keys.
    await queryRunner.query(`
      ALTER TABLE cases
        ADD CONSTRAINT FK_2aa60fb17be44bfd5f091530f1b
        FOREIGN KEY (facilityId) REFERENCES facilities(id)
        ON DELETE RESTRICT ON UPDATE NO ACTION,
        ADD CONSTRAINT FK_2f213ddb6a3ee9c7cf50b3ec05b
        FOREIGN KEY (communityUnitId) REFERENCES communityUnits(id)
        ON DELETE RESTRICT ON UPDATE NO ACTION,
        ADD CONSTRAINT FK_993c6af850bda32fb0bdbaeef60
        FOREIGN KEY (responsibleFacilityId) REFERENCES facilities(id)
        ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    // Restore provisional-cause foreign keys.
    await queryRunner.query(`
      ALTER TABLE maternalCaseDetails
        ADD CONSTRAINT FK_c5b60812e55e5c4b79f030e3869
        FOREIGN KEY (provisionalCauseId) REFERENCES icd11Causes(id)
        ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE perinatalCaseDetails
        ADD CONSTRAINT FK_6096ebbd567bcbbba30ece1273f
        FOREIGN KEY (provisionalCauseId) REFERENCES icd11Causes(id)
        ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    // Restore case status history relationship.
    await queryRunner.query(`
      ALTER TABLE caseStatusHistory
        ADD CONSTRAINT FK_58e8c10e02810ccf1b75891aa94
        FOREIGN KEY (caseId) REFERENCES cases(id)
        ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    // Restore ICD-11 uniqueness and relationship constraints.
    await queryRunner.query(`
      CREATE UNIQUE INDEX UQ_icd11Causes_code
      ON icd11Causes (code)
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX UQ_icd11CauseTypes_cause_caseType
      ON icd11CauseTypes (causeId, caseType)
    `);

    await queryRunner.query(`
      ALTER TABLE icd11CauseTypes
        ADD CONSTRAINT FK_d98719e5272118fd240d48c9f1f
        FOREIGN KEY (causeId) REFERENCES icd11Causes(id)
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Create the contributing factors reference table.
    await queryRunner.query(`
      CREATE TABLE contributingFactors (
        id varchar(36) NOT NULL,
        code varchar(30) NOT NULL,
        delayLevel enum('FIRST', 'SECOND', 'THIRD') NOT NULL,
        name varchar(150) NOT NULL,
        isActive tinyint NOT NULL DEFAULT 1,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
          ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX UQ_contributingFactors_code (code),
        INDEX IDX_contributingFactors_delayLevel_isActive
          (delayLevel, isActive),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
        DEFAULT CHARSET=utf8mb4
        COLLATE=utf8mb4_0900_ai_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE icd11CauseTypes
        DROP FOREIGN KEY FK_d98719e5272118fd240d48c9f1f
    `);

    await queryRunner.query(`
      ALTER TABLE caseStatusHistory
        DROP FOREIGN KEY FK_58e8c10e02810ccf1b75891aa94
    `);

    await queryRunner.query(`
      ALTER TABLE perinatalCaseDetails
        DROP FOREIGN KEY FK_6096ebbd567bcbbba30ece1273f
    `);

    await queryRunner.query(`
      ALTER TABLE maternalCaseDetails
        DROP FOREIGN KEY FK_c5b60812e55e5c4b79f030e3869
    `);

    await queryRunner.query(`
      ALTER TABLE cases
        DROP FOREIGN KEY FK_993c6af850bda32fb0bdbaeef60,
        DROP FOREIGN KEY FK_2f213ddb6a3ee9c7cf50b3ec05b,
        DROP FOREIGN KEY FK_2aa60fb17be44bfd5f091530f1b
    `);

    await queryRunner.query(`
      ALTER TABLE invitations
        DROP FOREIGN KEY FK_b7423cfb362a842b7ea0a3763b9,
        DROP FOREIGN KEY FK_c16fdad3aea7ec7b047aedb9afe
    `);

    await queryRunner.query(`
      DROP INDEX UQ_icd11CauseTypes_cause_caseType ON icd11CauseTypes
    `);

    await queryRunner.query(`
      DROP INDEX UQ_icd11Causes_code ON icd11Causes
    `);

    await queryRunner.query(`
      DROP TABLE contributingFactors
    `);

  }
}
