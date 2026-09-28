import type { RequestHandler } from 'express';
import { AppError } from '../../common/errors/AppError.js';
import { JobRepository } from './job.repository.js';

const jobRepo = new JobRepository();

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const stringField = (record: Record<string, unknown>, key: string) => {
  const value = record[key];
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null;
};

export const listJobs: RequestHandler = async (_req, res, next) => {
  try {
    const jobs = await jobRepo.findOpen();
    res.json({ success: true, data: { jobs } });
  } catch (error) {
    next(error);
  }
};

export const ingestJobs: RequestHandler = async (req, res, next) => {
  try {
    const body = req.body as unknown;
    const items = Array.isArray(body) ? body : [body];
    const records = items.map(asRecord).filter((item) => item !== null);

    if (records.length === 0) {
      throw new AppError(400, 'Request body must be a JSON object or an array of JSON objects');
    }

    const saved = [];
    for (const record of records) {
      const job = await jobRepo.create({
        title: stringField(record, 'title') ?? 'Untitled role',
        company: stringField(record, 'company') ?? stringField(record, 'companyName') ?? 'Unknown company',
        location: stringField(record, 'location'),
        description: stringField(record, 'description'),
        status: stringField(record, 'status') ?? 'open',
        source: 'python',
        metadata: record,
      });
      saved.push(job.id);
    }

    res.status(201).json({ success: true, data: { saved: saved.length, ids: saved } });
  } catch (error) {
    next(error);
  }
};

export const deleteJob: RequestHandler = async (req, res, next) => {
  try {
    const job = await jobRepo.findById(req.params.id as string);
    if (!job || job.isDeleted) {
      throw new AppError(404, 'Job not found');
    }
    await jobRepo.softDelete(job.id);
    res.json({ success: true, data: { message: 'Job removed' } });
  } catch (error) {
    next(error);
  }
};
