import { IJobRepository } from '../../domain/repositories/IJobRepository';
import { Job } from '../../domain/entities/Job';

/**
 * In-memory implementation of IJobRepository for testing
 */
export class InMemoryJobRepository implements IJobRepository {
  private jobs: Map<string, Job>;

  constructor() {
    this.jobs = new Map();
  }

  async exists(jobId: string): Promise<boolean> {
    return this.jobs.has(jobId);
  }

  async save(job: Job): Promise<void> {
    this.jobs.set(job.id, job);
  }

  async findById(jobId: string): Promise<Job | null> {
    return this.jobs.get(jobId) ?? null;
  }
}
