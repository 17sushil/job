import { MigrationInterface, QueryRunner } from 'typeorm';

export class EmailOrMobileAuth1790171000000 implements MigrationInterface {
  name = 'EmailOrMobileAuth1790171000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // An account now needs EITHER an email OR a mobile, never both required.
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "mobile" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "name" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "name"`);
    await queryRunner.query(
      `UPDATE "users" SET "mobile" = '0000000000' WHERE "mobile" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "email" = 'unknown-' || "userId" || '@example.com' WHERE "email" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "mobile" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL`,
    );
  }
}
