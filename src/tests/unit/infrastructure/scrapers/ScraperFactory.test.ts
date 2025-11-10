import { describe, it, expect } from '@jest/globals';
import { ScraperFactory } from '../../../../infrastructure/scrapers/ScraperFactory';
import { HtmlJobScraper } from '../../../../infrastructure/scrapers/HtmlJobScraper';
import { RssJobScraper } from '../../../../infrastructure/scrapers/RssJobScraper';

describe('ScraperFactory', () => {
  describe('createScraper', () => {
    it('should create HtmlJobScraper for html type', () => {
      // Arrange
      const config = {
        type: 'html' as const,
        name: 'TestHtmlSite',
        url: 'https://example.com/jobs',
        listSelector: '.job-card',
        titleSelector: '.title',
        urlSelector: 'a',
      };

      // Act
      const scraper = ScraperFactory.createScraper(config);

      // Assert
      expect(scraper).toBeInstanceOf(HtmlJobScraper);
      expect(scraper.getName()).toBe('TestHtmlSite');
    });

    it('should create HtmlJobScraper with optional selectors', () => {
      // Arrange
      const config = {
        type: 'html' as const,
        name: 'AdvancedHtmlSite',
        url: 'https://example.com/jobs',
        listSelector: '.job',
        titleSelector: '.title',
        urlSelector: 'a',
        companySelector: '.company',
      };

      // Act
      const scraper = ScraperFactory.createScraper(config);

      // Assert
      expect(scraper).toBeInstanceOf(HtmlJobScraper);
    });

    it('should create RssJobScraper for rss type', () => {
      // Arrange
      const config = {
        type: 'rss' as const,
        name: 'TestRssSite',
        rssUrl: 'https://example.com/feed.rss',
      };

      // Act
      const scraper = ScraperFactory.createScraper(config);

      // Assert
      expect(scraper).toBeInstanceOf(RssJobScraper);
      expect(scraper.getName()).toBe('TestRssSite');
    });

    it('should throw error for unknown scraper type', () => {
      // Arrange
      const config = {
        type: 'unknown',
        name: 'UnknownSite',
      } as any;

      // Act & Assert
      expect(() => ScraperFactory.createScraper(config)).toThrow('Unknown scraper type: unknown');
    });
  });
});
