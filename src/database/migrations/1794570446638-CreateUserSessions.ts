import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserSessions1794570446638 implements MigrationInterface {
    name = 'CreateUserSessions1794570446638'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`userSessions\` (\`id\` varchar(36) NOT NULL, \`userId\` varchar(36) NOT NULL, \`ipAddress\` varchar(45) NULL, \`userAgent\` varchar(500) NULL, \`expiresAt\` datetime NOT NULL, \`lastUsedAt\` datetime NULL, \`revokedAt\` datetime NULL, \`createdAt\` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX \`IDX_userSessions_expiresAt\` (\`expiresAt\`), INDEX \`IDX_userSessions_userId\` (\`userId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`userSessionRefreshTokens\` (\`id\` varchar(36) NOT NULL, \`sessionId\` varchar(36) NOT NULL, \`tokenHash\` char(64) NOT NULL, \`expiresAt\` datetime NOT NULL, \`usedAt\` datetime NULL, \`createdAt\` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX \`IDX_sessionRefreshTokens_expiresAt\` (\`expiresAt\`), UNIQUE INDEX \`UQ_sessionRefreshTokens_tokenHash\` (\`tokenHash\`), INDEX \`IDX_sessionRefreshTokens_sessionId\` (\`sessionId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`userSessions\` ADD CONSTRAINT \`FK_2a1b098f8703d846b54854eba9f\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`userSessionRefreshTokens\` ADD CONSTRAINT \`FK_983ca081d5041146eb95f6b53a5\` FOREIGN KEY (\`sessionId\`) REFERENCES \`userSessions\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`userSessionRefreshTokens\` DROP FOREIGN KEY \`FK_983ca081d5041146eb95f6b53a5\``);
        await queryRunner.query(`ALTER TABLE \`userSessions\` DROP FOREIGN KEY \`FK_2a1b098f8703d846b54854eba9f\``);
        await queryRunner.query(`DROP INDEX \`IDX_sessionRefreshTokens_sessionId\` ON \`userSessionRefreshTokens\``);
        await queryRunner.query(`DROP INDEX \`UQ_sessionRefreshTokens_tokenHash\` ON \`userSessionRefreshTokens\``);
        await queryRunner.query(`DROP INDEX \`IDX_sessionRefreshTokens_expiresAt\` ON \`userSessionRefreshTokens\``);
        await queryRunner.query(`DROP TABLE \`userSessionRefreshTokens\``);
        await queryRunner.query(`DROP INDEX \`IDX_userSessions_userId\` ON \`userSessions\``);
        await queryRunner.query(`DROP INDEX \`IDX_userSessions_expiresAt\` ON \`userSessions\``);
        await queryRunner.query(`DROP TABLE \`userSessions\``);
    }

}
