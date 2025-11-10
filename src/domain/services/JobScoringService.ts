import { Job } from '../entities/Job';

/**
 * Service for scoring and filtering jobs based on keyword matching
 */
export class JobScoringService {
  constructor(
    private keywords: string[],
    private minScore: number = 1
  ) {}

  /**
   * Score a job based on keyword matches
   * Each keyword can only be counted once per job
   */
  scoreJob(job: Job): number {
    const text = `${job.title ?? ''} ${job.text ?? ''}`.toLowerCase();
    let score = 0;

    for (const keyword of this.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        score++;
      }
    }

    return score;
  }

  /**
   * Check if a job meets the minimum score threshold
   */
  meetsMinimumScore(job: Job): boolean {
    return this.scoreJob(job) >= this.minScore;
  }

  /**
   * Filter an array of jobs to only those meeting minimum score
   */
  filterJobs(jobs: Job[]): Job[] {
    return jobs.filter((job) => this.meetsMinimumScore(job));
  }
}
