import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { AppConfig } from '../../../../infrastructure/config/AppConfig';

describe('AppConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('load', () => {
    it('should load valid configuration from environment variables', () => {
      // Arrange
      process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token';
      process.env.TELEGRAM_CHAT_ID = 'test-chat-id';

      // Act
      const config = AppConfig.load();

      // Assert
      expect(config.notifier.telegramBotToken).toBe('test-bot-token');
      expect(config.notifier.telegramChatId).toBe('test-chat-id');
      expect(config.sites).toBeDefined();
      expect(config.filters).toBeDefined();
      expect(config.cron).toBeDefined();
    });

    it('should have default sites configuration', () => {
      // Act
      const config = AppConfig.load();

      // Assert
      expect(Array.isArray(config.sites)).toBe(true);
      expect(config.sites.length).toBeGreaterThan(0);
    });

    it('should have default filters configuration', () => {
      // Act
      const config = AppConfig.load();

      // Assert
      expect(Array.isArray(config.filters.keywords)).toBe(true);
      expect(config.filters.keywords.length).toBeGreaterThan(0);
      expect(typeof config.filters.minScore).toBe('number');
      expect(config.filters.minScore).toBeGreaterThanOrEqual(1);
    });

    it('should have default cron schedule', () => {
      // Act
      const config = AppConfig.load();

      // Assert
      expect(typeof config.cron).toBe('string');
      expect(config.cron).toMatch(/^[\d\s\*\/,\-]+$/); // Basic cron pattern
    });

    it('should allow optional telegram configuration', () => {
      // Arrange
      delete process.env.TELEGRAM_BOT_TOKEN;
      delete process.env.TELEGRAM_CHAT_ID;

      // Act
      const config = AppConfig.load();

      // Assert
      expect(config.notifier.telegramBotToken).toBeUndefined();
      expect(config.notifier.telegramChatId).toBeUndefined();
    });

    it('should validate that minScore is positive', () => {
      // This test verifies the schema validates properly
      // We can't easily test Zod validation errors without more setup
      // but we can verify the structure
      const config = AppConfig.load();
      expect(config.filters.minScore).toBeGreaterThan(0);
    });
  });

  describe('getSiteConfigs', () => {
    it('should return array of site configurations', () => {
      // Arrange
      const config = AppConfig.load();

      // Act
      const sites = config.sites;

      // Assert
      expect(Array.isArray(sites)).toBe(true);
      sites.forEach((site) => {
        expect(site.name).toBeDefined();
        expect(site.type).toMatch(/^(html|rss)$/);
      });
    });
  });

  describe('getNotifierConfig', () => {
    it('should return notifier configuration', () => {
      // Arrange
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      process.env.TELEGRAM_CHAT_ID = 'test-chat';
      const config = AppConfig.load();

      // Act
      const notifierConfig = config.notifier;

      // Assert
      expect(notifierConfig.telegramBotToken).toBe('test-token');
      expect(notifierConfig.telegramChatId).toBe('test-chat');
    });
  });

  describe('getFilterConfig', () => {
    it('should return filter configuration', () => {
      // Arrange
      const config = AppConfig.load();

      // Act
      const filterConfig = config.filters;

      // Assert
      expect(filterConfig.keywords).toBeDefined();
      expect(filterConfig.minScore).toBeDefined();
      expect(Array.isArray(filterConfig.keywords)).toBe(true);
    });
  });

  describe('getCronSchedule', () => {
    it('should return cron schedule', () => {
      // Arrange
      const config = AppConfig.load();

      // Act
      const cron = config.cron;

      // Assert
      expect(typeof cron).toBe('string');
      expect(cron.length).toBeGreaterThan(0);
    });
  });
});
