#!/usr/bin/env node
import 'dotenv/config';
import cron from 'node-cron';
import { AppConfig } from './infrastructure/config/AppConfig';
import { DatabaseConnection } from './infrastructure/database/DatabaseConnection';
import { SqliteJobRepository } from './infrastructure/database/SqliteJobRepository';
import { ScraperFactory } from './infrastructure/scrapers/ScraperFactory';
import { TelegramNotifier } from './infrastructure/notifiers/TelegramNotifier';
import { MultiNotifier } from './infrastructure/notifiers/MultiNotifier';
import { JobScoringService } from './domain/services/JobScoringService';
import { ProcessJobsUseCase } from './application/use-cases/ProcessJobsUseCase';
import { INotifier } from './domain/services/INotifier';

/**
 * Main entry point - Dependency Injection and application bootstrap
 */
async function main() {
  console.log('Job Bot starting...');

  // 1. Load configuration
  const config = AppConfig.load();
  console.log(
    `Loaded config with ${config.sites.length} sites, ` +
    `${config.filters.title.keywords.length} title keywords, ` +
    `${config.filters.description.keywords.length} description keywords`
  );

  // 2. Initialize database
  const dbConnection = DatabaseConnection.initialize('./data/jobs.db');
  const db = dbConnection.getDatabase();
  console.log('Database initialized');

  // 3. Create repository
  const jobRepository = new SqliteJobRepository(db);

  // 4. Create scrapers from config
  const scrapers = config.sites.map((siteConfig) =>
    ScraperFactory.createScraper(siteConfig)
  );
  console.log(`Created ${scrapers.length} scrapers: ${scrapers.map((s) => s.getName()).join(', ')}`);

  // 5. Create notifier(s)
  const notifiers: INotifier[] = [];

  if (config.notifier.telegramBotToken && config.notifier.telegramChatId) {
    const telegramNotifier = new TelegramNotifier({
      botToken: config.notifier.telegramBotToken,
      chatId: config.notifier.telegramChatId,
    });
    notifiers.push(telegramNotifier);
    console.log('Telegram notifier configured');
  }

  const notifier = notifiers.length > 0 ? new MultiNotifier(notifiers) : createNoOpNotifier();

  // 6. Create scoring service
  const scoringService = new JobScoringService(
    config.filters.title,
    config.filters.description
  );

  // 7. Create use case
  const processJobsUseCase = new ProcessJobsUseCase(
    jobRepository,
    scrapers,
    notifier,
    scoringService
  );

  // 8. Schedule cron job
  console.log(`Scheduling cron job: ${config.cron}`);

  cron.schedule(config.cron, async () => {
    console.log(`\n[${new Date().toISOString()}] Running job scraper...`);
    try {
      await processJobsUseCase.execute();
      console.log('Job scraping completed');
    } catch (error) {
      console.error('Error during job processing:', (error as Error).message);
    }
  });

  // 9. Run immediately on startup
  console.log('\nRunning initial job scan...');
  try {
    await processJobsUseCase.execute();
    console.log('Initial scan completed\n');
  } catch (error) {
    console.error('Error during initial scan:', (error as Error).message);
  }

  console.log('Job Bot is running. Press Ctrl+C to stop.');
}

/**
 * Creates a no-op notifier when no notifiers are configured
 */
function createNoOpNotifier(): INotifier {
  return {
    notify: async () => {
      console.log('No notifiers configured - skipping notification');
    },
    getName: () => 'NoOp',
  };
}

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

// Run the application
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
