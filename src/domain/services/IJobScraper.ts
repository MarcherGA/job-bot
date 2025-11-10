import { Job } from '../entities/Job';

/**
 * Interface for job scraping implementations.
 * Scrapers are responsible for fetching job listings from various sources.
 */
export interface IJobScraper {
  /**
   * Scrape jobs from the configured source
   * @returns Array of Job entities found
   */
  scrape(): Promise<Job[]>;

  /**
   * Get the name of this scraper (for logging/identification)
   */
  getName(): string;
}
