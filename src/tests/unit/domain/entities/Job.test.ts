import { describe, it, expect } from '@jest/globals';
import { Job } from '../../../../domain/entities/Job';

describe('Job Entity', () => {
  describe('constructor', () => {
    it('should create a valid job entity with required fields', () => {
      // Arrange
      const jobData = {
        id: 'test-job-1',
        title: 'Senior TypeScript Developer',
        url: 'https://example.com/job/1',
        site: 'TestSite',
      };

      // Act
      const job = new Job(jobData);

      // Assert
      expect(job.id).toBe('test-job-1');
      expect(job.title).toBe('Senior TypeScript Developer');
      expect(job.url).toBe('https://example.com/job/1');
      expect(job.site).toBe('TestSite');
    });

    it('should create a job with optional fields', () => {
      // Arrange
      const jobData = {
        id: 'test-job-2',
        title: 'Unity Game Developer',
        url: 'https://example.com/job/2',
        site: 'GameJobs',
        company: 'Awesome Games Inc',
        text: 'Looking for an experienced Unity developer with C# expertise',
        postedAt: new Date('2025-01-01'),
      };

      // Act
      const job = new Job(jobData);

      // Assert
      expect(job.id).toBe('test-job-2');
      expect(job.title).toBe('Unity Game Developer');
      expect(job.url).toBe('https://example.com/job/2');
      expect(job.site).toBe('GameJobs');
      expect(job.company).toBe('Awesome Games Inc');
      expect(job.text).toBe('Looking for an experienced Unity developer with C# expertise');
      expect(job.postedAt).toEqual(new Date('2025-01-01'));
    });

    it('should handle undefined optional fields', () => {
      // Arrange
      const jobData = {
        id: 'test-job-3',
        title: 'WebGL Developer',
        url: 'https://example.com/job/3',
        site: 'RemoteJobs',
      };

      // Act
      const job = new Job(jobData);

      // Assert
      expect(job.company).toBeUndefined();
      expect(job.text).toBeUndefined();
      expect(job.postedAt).toBeUndefined();
    });
  });
});
