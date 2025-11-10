import { describe, it, expect } from '@jest/globals';
import { JobScoringService } from '../../../../domain/services/JobScoringService';
import { Job } from '../../../../domain/entities/Job';

describe('JobScoringService', () => {
  describe('constructor', () => {
    it('should accept separate title and description configurations', () => {
      // Arrange
      const titleConfig = { keywords: ['unity', 'webgl'], minScore: 1 };
      const descriptionConfig = { keywords: ['c#', 'shader'], minScore: 2 };

      // Act
      const service = new JobScoringService(titleConfig, descriptionConfig);

      // Assert
      expect(service).toBeDefined();
    });
  });

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
      const service = new JobScoringService(
        { keywords, minScore: 0 },
        { keywords, minScore: 0 }
      );

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
      const service = new JobScoringService(
        { keywords, minScore: 0 },
        { keywords, minScore: 0 }
      );

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
      const service = new JobScoringService(
        { keywords, minScore: 0 },
        { keywords, minScore: 0 }
      );

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
      const service = new JobScoringService(
        { keywords, minScore: 0 },
        { keywords, minScore: 0 }
      );

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
      const service = new JobScoringService(
        { keywords, minScore: 0 },
        { keywords, minScore: 0 }
      );

      // Act
      const score = service.scoreJob(job);

      // Assert
      expect(score).toBe(2); // Count 'unity' once in title (1) + once in description (1)
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
      const service = new JobScoringService(
        { keywords, minScore: 0 },
        { keywords, minScore: 0 }
      );

      // Act
      const score = service.scoreJob(job);

      // Assert
      expect(score).toBe(0);
    });
  });

  describe('scoreTitle', () => {
    it('should return 0 for job title with no matching keywords', () => {
      // Arrange
      const job = new Job({
        id: 'job-1',
        title: 'Backend Developer',
        url: 'https://example.com/job/1',
        site: 'TestSite',
        text: 'Unity and WebGL experience required',
      });

      const keywords = ['unity', 'webgl'];
      const service = new JobScoringService(
        { keywords, minScore: 0 },
        { keywords, minScore: 0 }
      );

      // Act
      const score = service.scoreTitle(job);

      // Assert
      expect(score).toBe(0); // Title doesn't match, even though text does
    });

    it('should count matching keywords only in title', () => {
      // Arrange
      const job = new Job({
        id: 'job-2',
        title: 'Unity Developer with WebGL experience',
        url: 'https://example.com/job/2',
        site: 'TestSite',
        text: 'Python and Django required',
      });

      const keywords = ['unity', 'webgl', 'python'];
      const service = new JobScoringService(
        { keywords, minScore: 0 },
        { keywords, minScore: 0 }
      );

      // Act
      const score = service.scoreTitle(job);

      // Assert
      expect(score).toBe(2); // Only unity + webgl from title, python in text is ignored
    });

    it('should be case-insensitive', () => {
      // Arrange
      const job = new Job({
        id: 'job-3',
        title: 'UNITY DEVELOPER',
        url: 'https://example.com/job/3',
        site: 'TestSite',
      });

      const keywords = ['unity'];
      const service = new JobScoringService(
        { keywords, minScore: 0 },
        { keywords, minScore: 0 }
      );

      // Act
      const score = service.scoreTitle(job);

      // Assert
      expect(score).toBe(1);
    });
  });

  describe('scoreDescription', () => {
    it('should return 0 for job description with no matching keywords', () => {
      // Arrange
      const job = new Job({
        id: 'job-1',
        title: 'Unity Developer',
        url: 'https://example.com/job/1',
        site: 'TestSite',
        text: 'Backend with Python and Django',
      });

      const keywords = ['unity', 'webgl'];
      const service = new JobScoringService(
        { keywords, minScore: 0 },
        { keywords, minScore: 0 }
      );

      // Act
      const score = service.scoreDescription(job);

      // Assert
      expect(score).toBe(0); // Text doesn't match, even though title does
    });

    it('should count matching keywords only in description', () => {
      // Arrange
      const job = new Job({
        id: 'job-2',
        title: 'Backend Developer',
        url: 'https://example.com/job/2',
        site: 'TestSite',
        text: 'Unity and WebGL experience required. Python not needed.',
      });

      const keywords = ['unity', 'webgl', 'backend'];
      const service = new JobScoringService(
        { keywords, minScore: 0 },
        { keywords, minScore: 0 }
      );

      // Act
      const score = service.scoreDescription(job);

      // Assert
      expect(score).toBe(2); // Only unity + webgl from text, backend in title is ignored
    });

    it('should be case-insensitive', () => {
      // Arrange
      const job = new Job({
        id: 'job-3',
        title: 'Developer',
        url: 'https://example.com/job/3',
        site: 'TestSite',
        text: 'UNITY AND WEBGL REQUIRED',
      });

      const keywords = ['unity', 'webgl'];
      const service = new JobScoringService(
        { keywords, minScore: 0 },
        { keywords, minScore: 0 }
      );

      // Act
      const score = service.scoreDescription(job);

      // Assert
      expect(score).toBe(2);
    });

    it('should return 0 for job with no text', () => {
      // Arrange
      const job = new Job({
        id: 'job-4',
        title: 'Unity Developer',
        url: 'https://example.com/job/4',
        site: 'TestSite',
      });

      const keywords = ['unity', 'webgl'];
      const service = new JobScoringService(
        { keywords, minScore: 0 },
        { keywords, minScore: 0 }
      );

      // Act
      const score = service.scoreDescription(job);

      // Assert
      expect(score).toBe(0); // No text, so no description score
    });
  });

  describe('meetsMinimumScore', () => {
    it('should return true when BOTH title and description meet their thresholds', () => {
      // Arrange
      const job = new Job({
        id: 'job-1',
        title: 'Unity and WebGL Developer',
        url: 'https://example.com/job/1',
        site: 'TestSite',
        text: 'Experience with C# and shader programming required',
      });

      const titleKeywords = ['unity', 'webgl'];
      const descriptionKeywords = ['c#', 'shader'];
      const service = new JobScoringService(
        { keywords: titleKeywords, minScore: 2 },
        { keywords: descriptionKeywords, minScore: 2 }
      );

      // Act
      const result = service.meetsMinimumScore(job);

      // Assert
      expect(result).toBe(true); // Title: 2, Description: 2, both meet threshold
    });

    it('should return false when title meets threshold but description does not', () => {
      // Arrange
      const job = new Job({
        id: 'job-2',
        title: 'Unity and WebGL Developer',
        url: 'https://example.com/job/2',
        site: 'TestSite',
        text: 'Experience with Python required',
      });

      const titleKeywords = ['unity', 'webgl'];
      const descriptionKeywords = ['c#', 'shader'];
      const service = new JobScoringService(
        { keywords: titleKeywords, minScore: 2 },
        { keywords: descriptionKeywords, minScore: 2 }
      );

      // Act
      const result = service.meetsMinimumScore(job);

      // Assert
      expect(result).toBe(false); // Title: 2 (pass), Description: 0 (fail) - needs BOTH
    });

    it('should return false when description meets threshold but title does not', () => {
      // Arrange
      const job = new Job({
        id: 'job-3',
        title: 'Backend Developer',
        url: 'https://example.com/job/3',
        site: 'TestSite',
        text: 'Unity and WebGL experience required',
      });

      const titleKeywords = ['unity', 'webgl'];
      const descriptionKeywords = ['unity', 'webgl'];
      const service = new JobScoringService(
        { keywords: titleKeywords, minScore: 2 },
        { keywords: descriptionKeywords, minScore: 2 }
      );

      // Act
      const result = service.meetsMinimumScore(job);

      // Assert
      expect(result).toBe(false); // Title: 0 (fail), Description: 2 (pass) - needs BOTH
    });

    it('should return true when score meets threshold', () => {
      // Arrange
      const job = new Job({
        id: 'job-7',
        title: 'Unity and WebGL Developer',
        url: 'https://example.com/job/7',
        site: 'TestSite',
      });

      const keywords = ['unity', 'webgl'];
      const service = new JobScoringService(
        { keywords, minScore: 2 },
        { keywords, minScore: 0 }
      );

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
      const service = new JobScoringService(
        { keywords, minScore: 3 },
        { keywords, minScore: 3 }
      );

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
      const service = new JobScoringService(
        { keywords, minScore: 0 },
        { keywords, minScore: 0 }
      ); // No minScore specified

      // Act
      const result = service.meetsMinimumScore(job);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('filterJobs', () => {
    it('should filter jobs based on minimum score (AND logic)', () => {
      // Arrange
      const jobs = [
        new Job({
          id: 'job-1',
          title: 'Unity and WebGL Developer',
          url: 'https://example.com/job/1',
          site: 'TestSite',
          text: 'C# and shader programming experience',
        }),
        new Job({
          id: 'job-2',
          title: 'Backend Developer',
          url: 'https://example.com/job/2',
          site: 'TestSite',
          text: 'Python and Django required',
        }),
        new Job({
          id: 'job-3',
          title: 'Unity Developer',
          url: 'https://example.com/job/3',
          site: 'TestSite',
          text: 'WebGL experience required',
        }),
      ];

      const titleKeywords = ['unity', 'webgl'];
      const descriptionKeywords = ['c#', 'shader', 'webgl'];
      const service = new JobScoringService(
        { keywords: titleKeywords, minScore: 1 },
        { keywords: descriptionKeywords, minScore: 1 }
      );

      // Act
      const filtered = service.filterJobs(jobs);

      // Assert
      expect(filtered).toHaveLength(2); // job-1 and job-3
      expect(filtered[0].id).toBe('job-1'); // Title: 2, Description: 2
      expect(filtered[1].id).toBe('job-3'); // Title: 1, Description: 1
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
      const service = new JobScoringService(
        { keywords, minScore: 1 },
        { keywords, minScore: 1 }
      );

      // Act
      const filtered = service.filterJobs(jobs);

      // Assert
      expect(filtered).toHaveLength(0);
    });
  });
});
