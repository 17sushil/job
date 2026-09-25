import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRecruiterProfileFields1790174000000
  implements MigrationInterface
{
  name = 'AddRecruiterProfileFields1790174000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "companyName" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "contactNumber" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "avatar" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "contactNumber"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "companyName"`,
    );
  }
}
