import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBlockedToUsers1790173000000 implements MigrationInterface {
  name = 'AddBlockedToUsers1790173000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "blocked" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "blocked"`);
  }
}
