import { Job } from '../entities/Job';

/**
 * Interface for job notification implementations.
 * Notifiers send alerts about matching jobs to various channels.
 */
export interface INotifier {
  /**
   * Send a notification about a job
   * @param job The job to notify about
   */
  notify(job: Job): Promise<void>;

  /**
   * Get the name of this notifier (for logging/identification)
   */
  getName(): string;
}
