import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateJobsAndApplications1790172000000
  implements MigrationInterface
{
  name = 'CreateJobsAndApplications1790172000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."jobs_status_enum" AS ENUM('OPEN', 'PAUSED', 'CANCELLED', 'CLOSED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."jobs_type_enum" AS ENUM('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'REMOTE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "jobs" (
        "jobId" uuid NOT NULL DEFAULT gen_random_uuid(),
        "recruiterId" uuid NOT NULL,
        "title" character varying NOT NULL,
        "company" character varying NOT NULL,
        "description" text NOT NULL,
        "location" character varying NOT NULL,
        "type" "public"."jobs_type_enum" NOT NULL DEFAULT 'FULL_TIME',
        "salaryRange" character varying,
        "status" "public"."jobs_status_enum" NOT NULL DEFAULT 'OPEN',
        "pausedAt" TIMESTAMP WITH TIME ZONE,
        "cancelledAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_jobs" PRIMARY KEY ("jobId")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_jobs_recruiterId" ON "jobs" ("recruiterId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_jobs_status" ON "jobs" ("status")`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."applications_status_enum" AS ENUM('NEW', 'SHORTLISTED', 'INTERVIEW', 'HIRED', 'REJECTED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "applications" (
        "applicationId" uuid NOT NULL DEFAULT gen_random_uuid(),
        "jobId" uuid NOT NULL,
        "candidateId" uuid NOT NULL,
        "status" "public"."applications_status_enum" NOT NULL DEFAULT 'NEW',
        "interviewAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_applications" PRIMARY KEY ("applicationId"),
        CONSTRAINT "UQ_applications_job_candidate" UNIQUE ("jobId", "candidateId")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_applications_jobId" ON "applications" ("jobId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_applications_candidateId" ON "applications" ("candidateId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_applications_candidateId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_applications_jobId"`);
    await queryRunner.query(`DROP TABLE "applications"`);
    await queryRunner.query(`DROP TYPE "public"."applications_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_jobs_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_jobs_recruiterId"`);
    await queryRunner.query(`DROP TABLE "jobs"`);
    await queryRunner.query(`DROP TYPE "public"."jobs_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."jobs_status_enum"`);
  }
}
