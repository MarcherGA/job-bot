import { IJobScraper } from '../../domain/services/IJobScraper';
import { Job } from '../../domain/entities/Job';
import axios from 'axios';
import * as cheerio from 'cheerio';

export interface HtmlScraperConfig {
  name: string;
  url: string;
  listSelector: string;
  titleSelector: string;
  urlSelector: string;
  companySelector?: string;
}

const USER_AGENT = 'ItayJobBot/1.0 (+https://example.com)';

/**
 * HTML-based job scraper implementation
 */
export class HtmlJobScraper implements IJobScraper {
  constructor(private config: HtmlScraperConfig) {}

  async scrape(): Promise<Job[]> {
    try {
      const response = await axios.get<string>(this.config.url, {
        headers: { 'User-Agent': USER_AGENT },
        timeout: 15000,
      });

      const $ = cheerio.load(response.data);
      const jobs: Job[] = [];

      $(this.config.listSelector).each((_, element) => {
        const container = $(element);

        const title = container.find(this.config.titleSelector).text().trim();
        let url = container.find(this.config.urlSelector).attr('href') || '';

        // Convert relative URLs to absolute
        if (url && !url.startsWith('http')) {
          url = new URL(url, this.config.url).toString();
        }

        const company = this.config.companySelector
          ? container.find(this.config.companySelector).text().trim()
          : undefined;

        const rawText = container
          .text()
          .replace(/\s+/g, ' ')
          .trim();

        const id = url || `${this.config.name}::${title}`.slice(0, 200);

        const job = new Job({
          id,
          title,
          url,
          site: this.config.name,
          company,
          text: rawText,
        });

        jobs.push(job);
      });

      return jobs;
    } catch (error) {
      // Log error silently and return empty array
      // TODO: Use proper logger once implemented
      console.error(`HtmlJobScraper error [${this.config.name}]:`, (error as Error).message);
      return [];
    }
  }

  getName(): string {
    return this.config.name;
  }
}
