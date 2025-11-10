import { IJobRepository } from '../../domain/repositories/IJobRepository';
import { IJobScraper } from '../../domain/services/IJobScraper';
import { INotifier } from '../../domain/services/INotifier';
import { JobScoringService } from '../../domain/services/JobScoringService';

/**
 * Use case: Process jobs from all scrapers
 * Orchestrates: scrape → filter → check existence → save → notify
 * Stub - will fail behaviorally
 */
export class ProcessJobsUseCase {
  constructor(
    private repository: IJobRepository,
    private scrapers: IJobScraper[],
    private notifier: INotifier,
    private scoringService: JobScoringService
  ) {}

  async execute(): Promise<void> {
    // 1. Scrape jobs from all sources
    const allJobs = await this.scrapeAllJobs();

    // 2. Filter jobs based on scoring
    const filteredJobs = this.scoringService.filterJobs(allJobs);

    // 3. Process each filtered job
    for (const job of filteredJobs) {
      try {
        // Check if job already exists
        const exists = await this.repository.exists(job.id);
        if (exists) {
          continue; // Skip existing jobs
        }

        // Save new job
        await this.repository.save(job);

        // Notify about new job
        await this.notifier.notify(job);
      } catch (error) {
        // Log error but continue processing other jobs
        console.error(`Error processing job ${job.id}:`, (error as Error).message);
      }
    }
  }

  private async scrapeAllJobs() {
    const allJobs = [];

    for (const scraper of this.scrapers) {
      try {
        const jobs = await scraper.scrape();
        allJobs.push(...jobs);
      } catch (error) {
        // Log error but continue with other scrapers
        console.error(
          `Error in scraper ${scraper.getName()}:`,
          (error as Error).message
        );
      }
    }

    return allJobs;
  }
}
