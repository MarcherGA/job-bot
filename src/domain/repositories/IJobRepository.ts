import { Job } from '../entities/Job';

/**
 * Repository interface for Job persistence operations.
 * Implementations should be provided in the infrastructure layer.
 */
export interface IJobRepository {
  /**
   * Check if a job with the given ID already exists
   */
  exists(jobId: string): Promise<boolean>;

  /**
   * Save a job to the repository
   */
  save(job: Job): Promise<void>;

  /**
   * Find a job by its ID
   */
  findById(jobId: string): Promise<Job | null>;
}
