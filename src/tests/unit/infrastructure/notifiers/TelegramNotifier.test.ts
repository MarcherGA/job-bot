import { describe, it, expect, beforeEach } from '@jest/globals';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { TelegramNotifier } from '../../../../infrastructure/notifiers/TelegramNotifier';
import { Job } from '../../../../domain/entities/Job';

describe('TelegramNotifier', () => {
  let mockAxios: MockAdapter;

  beforeEach(() => {
    mockAxios = new MockAdapter(axios);
  });

  afterEach(() => {
    mockAxios.restore();
  });

  describe('notify', () => {
    it('should send formatted message to Telegram', async () => {
      // Arrange
      const config = {
        botToken: 'test-bot-token',
        chatId: 'test-chat-id',
      };

      const job = new Job({
        id: 'job-1',
        title: 'Senior Unity Developer',
        url: 'https://example.com/job/1',
        site: 'TestSite',
        company: 'Awesome Games',
      });

      mockAxios
        .onPost('https://api.telegram.org/bottest-bot-token/sendMessage')
        .reply((config) => {
          const data = JSON.parse(config.data);
          expect(data.chat_id).toBe('test-chat-id');
          expect(data.text).toContain('Senior Unity Developer');
          expect(data.text).toContain('Awesome Games');
          expect(data.text).toContain('https://example.com/job/1');
          expect(data.text).toContain('TestSite');
          expect(data.parse_mode).toBe('Markdown');
          return [200, { ok: true }];
        });

      const notifier = new TelegramNotifier(config);

      // Act
      await notifier.notify(job);

      // Assert
      expect(mockAxios.history.post.length).toBe(1);
    });

    it('should format message without company if not provided', async () => {
      // Arrange
      const config = {
        botToken: 'test-bot-token',
        chatId: 'test-chat-id',
      };

      const job = new Job({
        id: 'job-2',
        title: 'WebGL Developer',
        url: 'https://example.com/job/2',
        site: 'RemoteJobs',
      });

      mockAxios
        .onPost('https://api.telegram.org/bottest-bot-token/sendMessage')
        .reply((config) => {
          const data = JSON.parse(config.data);
          expect(data.text).not.toContain('undefined');
          expect(data.text).toContain('WebGL Developer');
          expect(data.text).toContain('https://example.com/job/2');
          return [200, { ok: true }];
        });

      const notifier = new TelegramNotifier(config);

      // Act
      await notifier.notify(job);

      // Assert
      expect(mockAxios.history.post.length).toBe(1);
    });

    it('should handle Telegram API errors gracefully', async () => {
      // Arrange
      const config = {
        botToken: 'test-bot-token',
        chatId: 'test-chat-id',
      };

      const job = new Job({
        id: 'job-3',
        title: 'Test Job',
        url: 'https://example.com/job/3',
        site: 'TestSite',
      });

      mockAxios
        .onPost('https://api.telegram.org/bottest-bot-token/sendMessage')
        .reply(500, { error: 'Internal Server Error' });

      const notifier = new TelegramNotifier(config);

      // Act & Assert - should not throw
      await expect(notifier.notify(job)).resolves.not.toThrow();
    });

    it('should handle network timeouts', async () => {
      // Arrange
      const config = {
        botToken: 'test-bot-token',
        chatId: 'test-chat-id',
      };

      const job = new Job({
        id: 'job-4',
        title: 'Test Job',
        url: 'https://example.com/job/4',
        site: 'TestSite',
      });

      mockAxios
        .onPost('https://api.telegram.org/bottest-bot-token/sendMessage')
        .timeout();

      const notifier = new TelegramNotifier(config);

      // Act & Assert - should not throw
      await expect(notifier.notify(job)).resolves.not.toThrow();
    });

    it('should use bold formatting for title', async () => {
      // Arrange
      const config = {
        botToken: 'test-bot-token',
        chatId: 'test-chat-id',
      };

      const job = new Job({
        id: 'job-5',
        title: 'Unity Developer',
        url: 'https://example.com/job/5',
        site: 'TestSite',
      });

      mockAxios
        .onPost('https://api.telegram.org/bottest-bot-token/sendMessage')
        .reply((config) => {
          const data = JSON.parse(config.data);
          expect(data.text).toContain('*Unity Developer*');
          return [200, { ok: true }];
        });

      const notifier = new TelegramNotifier(config);

      // Act
      await notifier.notify(job);

      // Assert
      expect(mockAxios.history.post.length).toBe(1);
    });
  });

  describe('getName', () => {
    it('should return "Telegram"', () => {
      // Arrange
      const config = {
        botToken: 'test-bot-token',
        chatId: 'test-chat-id',
      };

      const notifier = new TelegramNotifier(config);

      // Act
      const name = notifier.getName();

      // Assert
      expect(name).toBe('Telegram');
    });
  });
});
