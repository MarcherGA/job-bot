import { Job } from '../entities/Job';

export interface FilterConfig {
  keywords: string[];
  minScore: number;
}

/**
 * Service for scoring and filtering jobs based on keyword matching
 */
export class JobScoringService {
  constructor(
    private titleConfig: FilterConfig,
    private descriptionConfig: FilterConfig
  ) {}

  /**
   * Score a job based on keyword matches in title only
   * Each keyword can only be counted once
   */
  scoreTitle(job: Job): number {
    const title = (job.title ?? '').toLowerCase();
    let score = 0;

    for (const keyword of this.titleConfig.keywords) {
      if (title.includes(keyword.toLowerCase())) {
        score++;
      }
    }

    return score;
  }

  /**
   * Score a job based on keyword matches in description/text only
   * Each keyword can only be counted once
   */
  scoreDescription(job: Job): number {
    const text = (job.text ?? '').toLowerCase();
    let score = 0;

    for (const keyword of this.descriptionConfig.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        score++;
      }
    }

    return score;
  }

  /**
   * Score a job based on keyword matches (combined title + description)
   * Each keyword can only be counted once per job
   * This method combines both title and description keywords for backward compatibility
   */
  scoreJob(job: Job): number {
    return this.scoreTitle(job) + this.scoreDescription(job);
  }

  /**
   * Check if a job meets the minimum score thresholds
   * Job must meet BOTH title AND description minimum scores
   */
  meetsMinimumScore(job: Job): boolean {
    const titleScore = this.scoreTitle(job);
    const descriptionScore = this.scoreDescription(job);

    return (
      titleScore >= this.titleConfig.minScore &&
      descriptionScore >= this.descriptionConfig.minScore
    );
  }

  /**
   * Filter an array of jobs to only those meeting minimum score
   */
  filterJobs(jobs: Job[]): Job[] {
    return jobs.filter((job) => this.meetsMinimumScore(job));
  }
}
