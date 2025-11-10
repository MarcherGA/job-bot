import { describe, it, expect } from '@jest/globals';
import { JobScoringService } from '../../../../domain/services/JobScoringService';
import { Job } from '../../../../domain/entities/Job';

describe('JobScoringService', () => {
  describe('scoreJob', () => {
    it('should return 0 for job with no matching keywords', () => {
      // Arrange
      const job = new Job({
        id: 'job-1',
        title: 'Backend Developer',
        url: 'https://example.com/job/1',
        site: 'TestSite',
        text: 'Looking for Python and Django expertise',
      });

      const keywords = ['unity', 'webgl', 'three.js'];
      const service = new JobScoringService(keywords);

      // Act
      const score = service.scoreJob(job);

      // Assert
      expect(score).toBe(0);
    });

    it('should count matching keywords in title', () => {
      // Arrange
      const job = new Job({
        id: 'job-2',
        title: 'Unity Developer with WebGL experience',
        url: 'https://example.com/job/2',
        site: 'TestSite',
      });

      const keywords = ['unity', 'webgl', 'three.js'];
      const service = new JobScoringService(keywords);

      // Act
      const score = service.scoreJob(job);

      // Assert
      expect(score).toBe(2); // unity + webgl
    });

    it('should count matching keywords in text', () => {
      // Arrange
      const job = new Job({
        id: 'job-3',
        title: 'Game Developer',
        url: 'https://example.com/job/3',
        site: 'TestSite',
        text: 'We need expertise in Unity3D, C#, and shader programming',
      });

      const keywords = ['unity', 'unity3d', 'c#', 'shader'];
      const service = new JobScoringService(keywords);

      // Act
      const score = service.scoreJob(job);

      // Assert
      expect(score).toBe(4); // unity, unity3d, c#, shader
    });

    it('should be case-insensitive', () => {
      // Arrange
      const job = new Job({
        id: 'job-4',
        title: 'UNITY DEVELOPER',
        url: 'https://example.com/job/4',
        site: 'TestSite',
        text: 'Experience with THREE.JS and WebGL',
      });

      const keywords = ['unity', 'three.js', 'webgl'];
      const service = new JobScoringService(keywords);

      // Act
      const score = service.scoreJob(job);

      // Assert
      expect(score).toBe(3);
    });

    it('should count each keyword at most once per job', () => {
      // Arrange
      const job = new Job({
        id: 'job-5',
        title: 'Unity Unity Unity Developer',
        url: 'https://example.com/job/5',
        site: 'TestSite',
        text: 'Unity experience required. Unity is great. We love Unity.',
      });

      const keywords = ['unity'];
      const service = new JobScoringService(keywords);

      // Act
      const score = service.scoreJob(job);

      // Assert
      expect(score).toBe(1); // Only count 'unity' once
    });

    it('should handle job with no text', () => {
      // Arrange
      const job = new Job({
        id: 'job-6',
        title: 'Developer',
        url: 'https://example.com/job/6',
        site: 'TestSite',
      });

      const keywords = ['unity', 'webgl'];
      const service = new JobScoringService(keywords);

      // Act
      const score = service.scoreJob(job);

      // Assert
      expect(score).toBe(0);
    });
  });

  describe('meetsMinimumScore', () => {
    it('should return true when score meets threshold', () => {
      // Arrange
      const job = new Job({
        id: 'job-7',
        title: 'Unity and WebGL Developer',
        url: 'https://example.com/job/7',
        site: 'TestSite',
      });

      const keywords = ['unity', 'webgl'];
      const service = new JobScoringService(keywords, 2);

      // Act
      const result = service.meetsMinimumScore(job);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when score below threshold', () => {
      // Arrange
      const job = new Job({
        id: 'job-8',
        title: 'Unity Developer',
        url: 'https://example.com/job/8',
        site: 'TestSite',
      });

      const keywords = ['unity', 'webgl', 'three.js'];
      const service = new JobScoringService(keywords, 3);

      // Act
      const result = service.meetsMinimumScore(job);

      // Assert
      expect(result).toBe(false); // Only has 1 match, needs 3
    });

    it('should use default minimum score of 1', () => {
      // Arrange
      const job = new Job({
        id: 'job-9',
        title: 'Unity Developer',
        url: 'https://example.com/job/9',
        site: 'TestSite',
      });

      const keywords = ['unity'];
      const service = new JobScoringService(keywords); // No minScore specified

      // Act
      const result = service.meetsMinimumScore(job);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('filterJobs', () => {
    it('should filter jobs based on minimum score', () => {
      // Arrange
      const jobs = [
        new Job({
          id: 'job-1',
          title: 'Unity and WebGL Developer',
          url: 'https://example.com/job/1',
          site: 'TestSite',
        }),
        new Job({
          id: 'job-2',
          title: 'Backend Developer',
          url: 'https://example.com/job/2',
          site: 'TestSite',
        }),
        new Job({
          id: 'job-3',
          title: 'Unity Developer',
          url: 'https://example.com/job/3',
          site: 'TestSite',
        }),
      ];

      const keywords = ['unity', 'webgl'];
      const service = new JobScoringService(keywords, 1);

      // Act
      const filtered = service.filterJobs(jobs);

      // Assert
      expect(filtered).toHaveLength(2); // job-1 and job-3
      expect(filtered[0].id).toBe('job-1');
      expect(filtered[1].id).toBe('job-3');
    });

    it('should return empty array when no jobs meet criteria', () => {
      // Arrange
      const jobs = [
        new Job({
          id: 'job-1',
          title: 'Python Developer',
          url: 'https://example.com/job/1',
          site: 'TestSite',
        }),
      ];

      const keywords = ['unity', 'webgl'];
      const service = new JobScoringService(keywords, 1);

      // Act
      const filtered = service.filterJobs(jobs);

      // Assert
      expect(filtered).toHaveLength(0);
    });
  });
});
