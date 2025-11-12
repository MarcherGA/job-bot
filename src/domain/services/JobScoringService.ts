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
    private descriptionConfig: FilterConfig,
    private maxAgeDays?: number
  ) {}

  /**
   * Check if a keyword matches in text using word boundaries
   * This prevents 'unity' from matching 'community'
   */
  private matchesKeyword(text: string, keyword: string): boolean {
    const lowerText = text.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();

    // For multi-word phrases, just use includes
    if (keyword.includes(' ')) {
      return lowerText.includes(lowerKeyword);
    }

    // Escape special regex characters
    const escaped = lowerKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // For keywords with special characters (like 'c#'), use word boundary at start
    // but allow non-word characters at the end
    if (/[^a-z0-9]/.test(lowerKeyword)) {
      const regex = new RegExp(`\\b${escaped}(?![a-z0-9])`, 'i');
      return regex.test(lowerText);
    }

    // For normal alphanumeric keywords, use full word boundary
    // This allows 'unity' to match but prevents matching in 'community'
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(lowerText);
  }

  /**
   * Score a job based on keyword matches in title only
   * Each keyword can only be counted once
   */
  scoreTitle(job: Job): number {
    const title = job.title ?? '';
    let score = 0;

    for (const keyword of this.titleConfig.keywords) {
      if (this.matchesKeyword(title, keyword)) {
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
    const text = job.text ?? '';
    let score = 0;

    for (const keyword of this.descriptionConfig.keywords) {
      if (this.matchesKeyword(text, keyword)) {
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
   * Check if a job is recent enough based on maxAgeDays
   * Jobs without postedAt are considered recent (backward compatibility)
   */
  private isRecent(job: Job): boolean {
    // If no maxAgeDays configured, all jobs pass
    if (this.maxAgeDays === undefined) {
      return true;
    }

    // If job has no postedAt date, include it (backward compatibility)
    if (!job.postedAt) {
      return true;
    }

    // Calculate age in days
    const now = new Date();
    const ageInMs = now.getTime() - job.postedAt.getTime();
    const ageInDays = ageInMs / (1000 * 60 * 60 * 24);

    return ageInDays <= this.maxAgeDays;
  }

  /**
   * Filter an array of jobs to only those meeting minimum score and recency requirements
   */
  filterJobs(jobs: Job[]): Job[] {
    return jobs.filter(
      (job) => this.meetsMinimumScore(job) && this.isRecent(job)
    );
  }
}
