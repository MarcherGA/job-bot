import { IJobScraper } from '../../domain/services/IJobScraper';
import { Job } from '../../domain/entities/Job';
import RSSParser from 'rss-parser';

export interface RssScraperConfig {
  name: string;
  rssUrl: string;
}

/**
 * RSS-based job scraper implementation
 */
export class RssJobScraper implements IJobScraper {
  private parser: RSSParser;

  constructor(private config: RssScraperConfig, parser?: RSSParser) {
    this.parser = parser || new RSSParser();
  }

  async scrape(): Promise<Job[]> {
    try {
      const feed = await this.parser.parseURL(this.config.rssUrl);
      const jobs: Job[] = [];

      for (const item of feed.items) {
        const id = (item.guid || item.link || item.title || '').slice(0, 200);
        if (!id) continue;

        const title = item.title?.trim() ?? '(no title)';
        const url = item.link || '';
        const text =
          item.contentSnippet || item.content || (item as any)['content:encoded'] || '';
        const date = item.isoDate ? new Date(item.isoDate) : undefined;

        const job = new Job({
          id,
          title,
          url,
          site: this.config.name,
          text,
          postedAt: date,
        });

        jobs.push(job);
      }

      return jobs;
    } catch (error) {
      // Log error silently and return empty array
      // TODO: Use proper logger once implemented
      console.error(`RssJobScraper error [${this.config.name}]:`, (error as Error).message);
      return [];
    }
  }

  getName(): string {
    return this.config.name;
  }
}

