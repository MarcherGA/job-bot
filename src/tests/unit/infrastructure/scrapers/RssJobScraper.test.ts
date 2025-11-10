import { describe, it, expect } from '@jest/globals';
import { RssJobScraper } from '../../../../infrastructure/scrapers/RssJobScraper';
import RSSParser from 'rss-parser';

describe('RssJobScraper', () => {
  function createMockParser(mockFeed: any): RSSParser {
    return {
      parseURL: async () => mockFeed,
    } as any;
  }

  function createErrorParser(error: Error): RSSParser {
    return {
      parseURL: async () => {
        throw error;
      },
    } as any;
  }

  describe('scrape', () => {
    it('should scrape jobs from RSS feed', async () => {
      // Arrange
      const config = {
        name: 'RSSJobBoard',
        rssUrl: 'https://example.com/jobs.rss',
      };

      const mockFeed = {
        items: [
          {
            title: 'Senior TypeScript Developer',
            link: 'https://example.com/job/1',
            guid: 'https://example.com/job/1',
            contentSnippet: 'Great opportunity for TypeScript developers',
            isoDate: '2025-01-01T10:00:00Z',
          },
          {
            title: 'Unity Game Developer',
            link: 'https://example.com/job/2',
            guid: 'job-2',
            contentSnippet: 'Looking for Unity experts with C# experience',
          },
        ],
      };

      const mockParser = createMockParser(mockFeed);
      const scraper = new RssJobScraper(config, mockParser);

      // Act
      const jobs = await scraper.scrape();

      // Assert
      expect(jobs).toHaveLength(2);
      expect(jobs[0].title).toBe('Senior TypeScript Developer');
      expect(jobs[0].url).toBe('https://example.com/job/1');
      expect(jobs[0].site).toBe('RSSJobBoard');
      expect(jobs[0].text).toContain('TypeScript developers');
      expect(jobs[1].title).toBe('Unity Game Developer');
    });

    it('should handle feed with content:encoded field', async () => {
      // Arrange
      const config = {
        name: 'ContentEncodedFeed',
        rssUrl: 'https://example.com/feed.rss',
      };

      const mockFeed = {
        items: [
          {
            title: 'WebGL Developer',
            link: 'https://example.com/job/3',
            guid: 'job-3',
            'content:encoded': '<p>Looking for Three.js and WebGL expertise</p>',
          },
        ],
      };

      const mockParser = createMockParser(mockFeed);
      const scraper = new RssJobScraper(config, mockParser);

      // Act
      const jobs = await scraper.scrape();

      // Assert
      expect(jobs).toHaveLength(1);
      expect(jobs[0].text).toContain('Three.js');
      expect(jobs[0].text).toContain('WebGL');
    });

    it('should parse ISO date from isoDate', async () => {
      // Arrange
      const config = {
        name: 'DateFeed',
        rssUrl: 'https://example.com/dated-feed.rss',
      };

      const mockFeed = {
        items: [
          {
            title: 'Game Developer',
            link: 'https://example.com/job/4',
            guid: 'job-4',
            isoDate: '2025-01-15T14:30:00Z',
          },
        ],
      };

      const mockParser = createMockParser(mockFeed);
      const scraper = new RssJobScraper(config, mockParser);

      // Act
      const jobs = await scraper.scrape();

      // Assert
      expect(jobs[0].postedAt).toBeDefined();
      expect(jobs[0].postedAt).toBeInstanceOf(Date);
    });

    it('should handle feed items without guid', async () => {
      // Arrange
      const config = {
        name: 'NoGuidFeed',
        rssUrl: 'https://example.com/no-guid.rss',
      };

      const mockFeed = {
        items: [
          {
            title: 'Frontend Developer',
            link: 'https://example.com/job/5',
            contentSnippet: 'Great frontend opportunity',
          },
        ],
      };

      const mockParser = createMockParser(mockFeed);
      const scraper = new RssJobScraper(config, mockParser);

      // Act
      const jobs = await scraper.scrape();

      // Assert
      expect(jobs).toHaveLength(1);
      expect(jobs[0].id).toContain('https://example.com/job/5');
    });

    it('should skip items without id, link, or title', async () => {
      // Arrange
      const config = {
        name: 'InvalidItemsFeed',
        rssUrl: 'https://example.com/invalid.rss',
      };

      const mockFeed = {
        items: [
          {
            // Item with no guid, link, or title
            contentSnippet: 'This should be skipped',
          },
          {
            title: 'Valid Job',
            link: 'https://example.com/job/6',
            guid: 'job-6',
          },
        ],
      };

      const mockParser = createMockParser(mockFeed);
      const scraper = new RssJobScraper(config, mockParser);

      // Act
      const jobs = await scraper.scrape();

      // Assert
      expect(jobs).toHaveLength(1);
      expect(jobs[0].title).toBe('Valid Job');
    });

    it('should return empty array on parser error', async () => {
      // Arrange
      const config = {
        name: 'FailingRSS',
        rssUrl: 'https://failing.com/feed.rss',
      };

      const mockParser = createErrorParser(new Error('Network error'));
      const scraper = new RssJobScraper(config, mockParser);

      // Act
      const jobs = await scraper.scrape();

      // Assert
      expect(jobs).toHaveLength(0);
    });

    it('should return empty array on invalid XML', async () => {
      // Arrange
      const config = {
        name: 'InvalidXMLFeed',
        rssUrl: 'https://example.com/invalid.rss',
      };

      const mockParser = createErrorParser(new Error('Feed not recognized'));
      const scraper = new RssJobScraper(config, mockParser);

      // Act
      const jobs = await scraper.scrape();

      // Assert
      expect(jobs).toHaveLength(0);
    });
  });

  describe('getName', () => {
    it('should return the configured site name', () => {
      // Arrange
      const config = {
        name: 'TestRSSFeed',
        rssUrl: 'https://example.com/feed.rss',
      };

      const scraper = new RssJobScraper(config);

      // Act
      const name = scraper.getName();

      // Assert
      expect(name).toBe('TestRSSFeed');
    });
  });
});
