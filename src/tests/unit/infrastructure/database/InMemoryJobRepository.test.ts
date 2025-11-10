import { describe, it, expect, beforeEach } from '@jest/globals';
import { InMemoryJobRepository } from '../../../../infrastructure/database/InMemoryJobRepository';
import { Job } from '../../../../domain/entities/Job';

describe('InMemoryJobRepository', () => {
  let repository: InMemoryJobRepository;

  beforeEach(() => {
    repository = new InMemoryJobRepository();
  });

  describe('exists', () => {
    it('should return false for non-existent job', async () => {
      // Act
      const result = await repository.exists('non-existent-id');

      // Assert
      expect(result).toBe(false);
    });

    it('should return true for existing job', async () => {
      // Arrange
      const job = new Job({
        id: 'existing-job',
        title: 'Test Job',
        url: 'https://example.com/job',
        site: 'TestSite',
      });
      await repository.save(job);

      // Act
      const result = await repository.exists('existing-job');

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('save', () => {
    it('should save a job successfully', async () => {
      // Arrange
      const job = new Job({
        id: 'test-job-1',
        title: 'Senior Developer',
        url: 'https://example.com/job/1',
        site: 'TestSite',
      });

      // Act
      await repository.save(job);

      // Assert
      const exists = await repository.exists('test-job-1');
      expect(exists).toBe(true);
    });

    it('should save a job with all fields', async () => {
      // Arrange
      const job = new Job({
        id: 'test-job-2',
        title: 'Unity Developer',
        url: 'https://example.com/job/2',
        site: 'GameJobs',
        company: 'Awesome Games',
        text: 'Great opportunity for Unity developers',
        postedAt: new Date('2025-01-01'),
      });

      // Act
      await repository.save(job);

      // Assert
      const retrieved = await repository.findById('test-job-2');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe('test-job-2');
      expect(retrieved?.company).toBe('Awesome Games');
    });
  });

  describe('findById', () => {
    it('should return null for non-existent job', async () => {
      // Act
      const result = await repository.findById('non-existent');

      // Assert
      expect(result).toBeNull();
    });

    it('should return the job if it exists', async () => {
      // Arrange
      const job = new Job({
        id: 'test-job-3',
        title: 'WebGL Developer',
        url: 'https://example.com/job/3',
        site: 'RemoteJobs',
        company: 'Tech Corp',
      });
      await repository.save(job);

      // Act
      const result = await repository.findById('test-job-3');

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe('test-job-3');
      expect(result?.title).toBe('WebGL Developer');
      expect(result?.company).toBe('Tech Corp');
    });
  });
});
