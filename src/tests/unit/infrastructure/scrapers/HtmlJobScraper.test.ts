import { describe, it, expect, beforeEach } from '@jest/globals';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { HtmlJobScraper } from '../../../../infrastructure/scrapers/HtmlJobScraper';

describe('HtmlJobScraper', () => {
  let mockAxios: MockAdapter;

  beforeEach(() => {
    mockAxios = new MockAdapter(axios);
  });

  afterEach(() => {
    mockAxios.restore();
  });

  describe('scrape', () => {
    it('should scrape jobs from HTML page', async () => {
      // Arrange
      const config = {
        name: 'TestSite',
        url: 'https://example.com/jobs',
        listSelector: '.job-card',
        titleSelector: '.job-title',
        urlSelector: 'a.job-link',
      };

      const mockHtml = `
        <html>
          <body>
            <div class="job-card">
              <a class="job-link" href="/job/1">
                <h3 class="job-title">Senior TypeScript Developer</h3>
              </a>
            </div>
            <div class="job-card">
              <a class="job-link" href="/job/2">
                <h3 class="job-title">Unity Game Developer</h3>
              </a>
            </div>
          </body>
        </html>
      `;

      mockAxios.onGet('https://example.com/jobs').reply(200, mockHtml);

      const scraper = new HtmlJobScraper(config);

      // Act
      const jobs = await scraper.scrape();

      // Assert
      expect(jobs).toHaveLength(2);
      expect(jobs[0].title).toBe('Senior TypeScript Developer');
      expect(jobs[0].url).toBe('https://example.com/job/1');
      expect(jobs[0].site).toBe('TestSite');
      expect(jobs[1].title).toBe('Unity Game Developer');
      expect(jobs[1].url).toBe('https://example.com/job/2');
    });

    it('should extract company information when selector provided', async () => {
      // Arrange
      const config = {
        name: 'GameJobs',
        url: 'https://gamejobs.com/listings',
        listSelector: '.job-listing',
        titleSelector: '.title',
        urlSelector: 'a',
        companySelector: '.company-name',
      };

      const mockHtml = `
        <html>
          <body>
            <div class="job-listing">
              <a href="https://gamejobs.com/job/123">
                <h2 class="title">Unity Developer</h2>
                <span class="company-name">Awesome Games Inc</span>
              </a>
            </div>
          </body>
        </html>
      `;

      mockAxios.onGet('https://gamejobs.com/listings').reply(200, mockHtml);

      const scraper = new HtmlJobScraper(config);

      // Act
      const jobs = await scraper.scrape();

      // Assert
      expect(jobs).toHaveLength(1);
      expect(jobs[0].company).toBe('Awesome Games Inc');
    });

    it('should convert relative URLs to absolute URLs', async () => {
      // Arrange
      const config = {
        name: 'RelativeURLSite',
        url: 'https://example.com/jobs',
        listSelector: '.job',
        titleSelector: '.title',
        urlSelector: 'a',
      };

      const mockHtml = `
        <html>
          <body>
            <div class="job">
              <a href="/careers/job/456">
                <h3 class="title">WebGL Engineer</h3>
              </a>
            </div>
          </body>
        </html>
      `;

      mockAxios.onGet('https://example.com/jobs').reply(200, mockHtml);

      const scraper = new HtmlJobScraper(config);

      // Act
      const jobs = await scraper.scrape();

      // Assert
      expect(jobs[0].url).toBe('https://example.com/careers/job/456');
    });

    it('should extract text content from job card', async () => {
      // Arrange
      const config = {
        name: 'TestSite',
        url: 'https://example.com/jobs',
        listSelector: '.job',
        titleSelector: '.title',
        urlSelector: 'a',
      };

      const mockHtml = `
        <html>
          <body>
            <div class="job">
              <a href="/job/1">
                <h3 class="title">3D Developer</h3>
                <p>Looking for Three.js expert with WebGL experience</p>
              </a>
            </div>
          </body>
        </html>
      `;

      mockAxios.onGet('https://example.com/jobs').reply(200, mockHtml);

      const scraper = new HtmlJobScraper(config);

      // Act
      const jobs = await scraper.scrape();

      // Assert
      expect(jobs[0].text).toContain('3D Developer');
      expect(jobs[0].text).toContain('Three.js');
      expect(jobs[0].text).toContain('WebGL');
    });

    it('should return empty array on HTTP error', async () => {
      // Arrange
      const config = {
        name: 'FailingSite',
        url: 'https://failing.com/jobs',
        listSelector: '.job',
        titleSelector: '.title',
        urlSelector: 'a',
      };

      mockAxios.onGet('https://failing.com/jobs').reply(500, 'Server Error');

      const scraper = new HtmlJobScraper(config);

      // Act
      const jobs = await scraper.scrape();

      // Assert
      expect(jobs).toHaveLength(0);
    });

    it('should return empty array on timeout', async () => {
      // Arrange
      const config = {
        name: 'TimeoutSite',
        url: 'https://timeout.com/jobs',
        listSelector: '.job',
        titleSelector: '.title',
        urlSelector: 'a',
      };

      mockAxios.onGet('https://timeout.com/jobs').timeout();

      const scraper = new HtmlJobScraper(config);

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
        name: 'TestSite',
        url: 'https://example.com/jobs',
        listSelector: '.job',
        titleSelector: '.title',
        urlSelector: 'a',
      };

      const scraper = new HtmlJobScraper(config);

      // Act
      const name = scraper.getName();

      // Assert
      expect(name).toBe('TestSite');
    });
  });
});
