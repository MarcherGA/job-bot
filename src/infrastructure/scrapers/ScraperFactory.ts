import { IJobScraper } from '../../domain/services/IJobScraper';
import { HtmlJobScraper, HtmlScraperConfig } from './HtmlJobScraper';
import { RssJobScraper, RssScraperConfig } from './RssJobScraper';

type HtmlSiteConfig = HtmlScraperConfig & { type: 'html' };
type RssSiteConfig = RssScraperConfig & { type: 'rss' };
export type SiteConfig = HtmlSiteConfig | RssSiteConfig;

/**
 * Factory for creating job scrapers based on configuration
 */
export class ScraperFactory {
  static createScraper(config: SiteConfig): IJobScraper {
    switch (config.type) {
      case 'html':
        return new HtmlJobScraper(config);
      case 'rss':
        return new RssJobScraper(config);
      default: {
        const exhaustive: never = config;
        throw new Error(`Unknown scraper type: ${(exhaustive as any).type}`);
      }
    }
  }
}
