import { z } from 'zod';
import { SiteConfig } from '../scrapers/ScraperFactory';

const NotifierConfigSchema = z.object({
  telegramBotToken: z.string().optional(),
  telegramChatId: z.string().optional(),
});

const FilterConfigSchema = z.object({
  keywords: z.array(z.string()),
  minScore: z.number().positive(),
});

const AppConfigSchema = z.object({
  sites: z.array(z.any()), // We'll type this properly
  filters: FilterConfigSchema,
  notifier: NotifierConfigSchema,
  cron: z.string(),
});

export type AppConfigType = z.infer<typeof AppConfigSchema>;

/**
 * Application configuration with validation
 * Stub - will fail behaviorally
 */
export class AppConfig {
  private constructor(private config: AppConfigType) {}

  static load(): AppConfigType {
    const config: AppConfigType = {
      sites: [
        // Remote Game Jobs (HTML scraper)
        {
          name: 'RemoteGameJobs',
          type: 'html',
          url: 'https://remotegamejobs.com/',
          listSelector: '.card.job-card',
          titleSelector: 'h3.card-title',
          urlSelector: 'a',
          companySelector: '.job-company',
          dateSelector: '.posted-at',
        },
        // Example RSS-based board
        {
          name: 'ExampleRSS',
          type: 'rss',
          rssUrl: 'https://example.com/jobs.rss',
        },
      ],
      filters: {
        keywords: [
          'unity',
          'unity3d',
          'three.js',
          'threejs',
          'react-three-fiber',
          'r3f',
          'babylon.js',
          'webgl',
          'web gpu',
          '3d web',
          'game dev',
          'game developer',
          'c#',
          'shader',
          'unreal',
        ],
        minScore: 1,
      },
      notifier: {
        telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
        telegramChatId: process.env.TELEGRAM_CHAT_ID,
      },
      cron: '*/10 * * * *',
    };

    // Validate with Zod schema
    return AppConfigSchema.parse(config);
  }

  get sites(): SiteConfig[] {
    return this.config.sites;
  }

  get notifier() {
    return this.config.notifier;
  }

  get filters() {
    return this.config.filters;
  }

  get cron() {
    return this.config.cron;
  }
}
