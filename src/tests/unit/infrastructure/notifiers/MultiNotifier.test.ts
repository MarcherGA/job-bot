import { describe, it, expect, jest } from '@jest/globals';
import { MultiNotifier } from '../../../../infrastructure/notifiers/MultiNotifier';
import { INotifier } from '../../../../domain/services/INotifier';
import { Job } from '../../../../domain/entities/Job';

describe('MultiNotifier', () => {
  function createMockNotifier(name: string): INotifier {
    return {
      notify: jest.fn<(job: Job) => Promise<void>>().mockResolvedValue(undefined),
      getName: () => name,
    };
  }

  describe('notify', () => {
    it('should notify all configured notifiers', async () => {
      // Arrange
      const mockTelegram = createMockNotifier('Telegram');
      const mockDiscord = createMockNotifier('Discord');
      const mockEmail = createMockNotifier('Email');

      const notifiers = [mockTelegram, mockDiscord, mockEmail];
      const multiNotifier = new MultiNotifier(notifiers);

      const job = new Job({
        id: 'job-1',
        title: 'Test Job',
        url: 'https://example.com/job/1',
        site: 'TestSite',
      });

      // Act
      await multiNotifier.notify(job);

      // Assert
      expect(mockTelegram.notify).toHaveBeenCalledWith(job);
      expect(mockDiscord.notify).toHaveBeenCalledWith(job);
      expect(mockEmail.notify).toHaveBeenCalledWith(job);
    });

    it('should work with single notifier', async () => {
      // Arrange
      const mockNotifier = createMockNotifier('Telegram');
      const multiNotifier = new MultiNotifier([mockNotifier]);

      const job = new Job({
        id: 'job-2',
        title: 'Test Job',
        url: 'https://example.com/job/2',
        site: 'TestSite',
      });

      // Act
      await multiNotifier.notify(job);

      // Assert
      expect(mockNotifier.notify).toHaveBeenCalledWith(job);
      expect(mockNotifier.notify).toHaveBeenCalledTimes(1);
    });

    it('should continue if one notifier fails', async () => {
      // Arrange
      const mockTelegram = createMockNotifier('Telegram');
      const mockDiscord: INotifier = {
        notify: jest.fn<(job: Job) => Promise<void>>().mockRejectedValue(new Error('Discord API error')),
        getName: () => 'Discord',
      };
      const mockEmail = createMockNotifier('Email');

      const notifiers = [mockTelegram, mockDiscord, mockEmail];
      const multiNotifier = new MultiNotifier(notifiers);

      const job = new Job({
        id: 'job-3',
        title: 'Test Job',
        url: 'https://example.com/job/3',
        site: 'TestSite',
      });

      // Act & Assert - should not throw
      await expect(multiNotifier.notify(job)).resolves.not.toThrow();

      // All notifiers should have been attempted
      expect(mockTelegram.notify).toHaveBeenCalled();
      expect(mockDiscord.notify).toHaveBeenCalled();
      expect(mockEmail.notify).toHaveBeenCalled();
    });

    it('should work with empty notifiers array', async () => {
      // Arrange
      const multiNotifier = new MultiNotifier([]);

      const job = new Job({
        id: 'job-4',
        title: 'Test Job',
        url: 'https://example.com/job/4',
        site: 'TestSite',
      });

      // Act & Assert - should not throw
      await expect(multiNotifier.notify(job)).resolves.not.toThrow();
    });

    it('should notify all notifiers in parallel', async () => {
      // Arrange
      const delays: number[] = [];
      const createSlowNotifier = (name: string, delay: number): INotifier => ({
        notify: jest.fn<(job: Job) => Promise<void>>().mockImplementation(async () => {
          const start = Date.now();
          await new Promise((resolve) => setTimeout(resolve, delay));
          delays.push(Date.now() - start);
        }),
        getName: () => name,
      });

      const notifier1 = createSlowNotifier('Notifier1', 50);
      const notifier2 = createSlowNotifier('Notifier2', 50);
      const notifier3 = createSlowNotifier('Notifier3', 50);

      const multiNotifier = new MultiNotifier([notifier1, notifier2, notifier3]);

      const job = new Job({
        id: 'job-5',
        title: 'Test Job',
        url: 'https://example.com/job/5',
        site: 'TestSite',
      });

      // Act
      const start = Date.now();
      await multiNotifier.notify(job);
      const totalTime = Date.now() - start;

      // Assert - should take ~50ms if parallel, ~150ms if sequential
      expect(totalTime).toBeLessThan(100); // Allow some buffer
    });
  });

  describe('getName', () => {
    it('should return "MultiNotifier"', () => {
      // Arrange
      const multiNotifier = new MultiNotifier([]);

      // Act
      const name = multiNotifier.getName();

      // Assert
      expect(name).toBe('MultiNotifier');
    });
  });
});
