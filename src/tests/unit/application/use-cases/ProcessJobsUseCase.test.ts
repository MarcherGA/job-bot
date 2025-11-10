import { describe, it, expect, beforeEach } from '@jest/globals';
import { ProcessJobsUseCase } from '../../../../application/use-cases/ProcessJobsUseCase';
import { Job } from '../../../../domain/entities/Job';
import { IJobRepository } from '../../../../domain/repositories/IJobRepository';
import { IJobScraper } from '../../../../domain/services/IJobScraper';
import { INotifier } from '../../../../domain/services/INotifier';
import { JobScoringService } from '../../../../domain/services/JobScoringService';

describe('ProcessJobsUseCase', () => {
  let mockRepository: IJobRepository;
  let mockScrapers: IJobScraper[];
  let mockNotifier: INotifier;
  let scoringService: JobScoringService;
  let useCase: ProcessJobsUseCase;

  beforeEach(() => {
    // Mock repository
    mockRepository = {
      exists: async (id: string) => false,
      save: async (job: Job) => {},
      findById: async (id: string) => null,
    };

    // Mock scrapers
    const mockScraper1: IJobScraper = {
      scrape: async () => [
        new Job({
          id: 'job-1',
          title: 'Unity Developer',
          url: 'https://example.com/job1',
          site: 'Site1',
        }),
      ],
      getName: () => 'Scraper1',
    };

    const mockScraper2: IJobScraper = {
      scrape: async () => [
        new Job({
          id: 'job-2',
          title: 'Frontend Developer',
          url: 'https://example.com/job2',
          site: 'Site2',
        }),
      ],
      getName: () => 'Scraper2',
    };

    mockScrapers = [mockScraper1, mockScraper2];

    // Mock notifier
    mockNotifier = {
      notify: async (job: Job) => {},
      getName: () => 'MockNotifier',
    };

    // Real scoring service with test keywords
    scoringService = new JobScoringService(['unity', 'webgl'], 1);

    useCase = new ProcessJobsUseCase(
      mockRepository,
      mockScrapers,
      mockNotifier,
      scoringService
    );
  });

  describe('execute', () => {
    it('should scrape, filter, save, and notify new jobs', async () => {
      // Arrange
      const savedJobs: Job[] = [];
      const notifiedJobs: Job[] = [];

      mockRepository.save = async (job: Job) => {
        savedJobs.push(job);
      };

      mockNotifier.notify = async (job: Job) => {
        notifiedJobs.push(job);
      };

      // Act
      await useCase.execute();

      // Assert
      expect(savedJobs.length).toBe(1); // Only Unity job passes filter
      expect(savedJobs[0].id).toBe('job-1');
      expect(notifiedJobs.length).toBe(1);
      expect(notifiedJobs[0].id).toBe('job-1');
    });

    it('should skip jobs that already exist in repository', async () => {
      // Arrange
      mockRepository.exists = async (id: string) => id === 'job-1';

      const savedJobs: Job[] = [];
      const notifiedJobs: Job[] = [];

      mockRepository.save = async (job: Job) => {
        savedJobs.push(job);
      };

      mockNotifier.notify = async (job: Job) => {
        notifiedJobs.push(job);
      };

      // Act
      await useCase.execute();

      // Assert
      expect(savedJobs.length).toBe(0); // job-1 already exists, job-2 filtered out
      expect(notifiedJobs.length).toBe(0);
    });

    it('should handle multiple scrapers', async () => {
      // Arrange
      const mockScraper3: IJobScraper = {
        scrape: async () => [
          new Job({
            id: 'job-3',
            title: 'WebGL Specialist',
            url: 'https://example.com/job3',
            site: 'Site3',
          }),
        ],
        getName: () => 'Scraper3',
      };

      mockScrapers.push(mockScraper3);

      useCase = new ProcessJobsUseCase(
        mockRepository,
        mockScrapers,
        mockNotifier,
        scoringService
      );

      const savedJobs: Job[] = [];
      mockRepository.save = async (job: Job) => {
        savedJobs.push(job);
      };

      // Act
      await useCase.execute();

      // Assert
      expect(savedJobs.length).toBe(2); // job-1 (Unity) and job-3 (WebGL)
      expect(savedJobs.map((j) => j.id)).toEqual(['job-1', 'job-3']);
    });

    it('should continue processing if one scraper fails', async () => {
      // Arrange
      const failingScraper: IJobScraper = {
        scrape: async () => {
          throw new Error('Scraper failure');
        },
        getName: () => 'FailingScraper',
      };

      mockScrapers.unshift(failingScraper);

      const savedJobs: Job[] = [];
      mockRepository.save = async (job: Job) => {
        savedJobs.push(job);
      };

      // Act
      await useCase.execute();

      // Assert
      expect(savedJobs.length).toBe(1); // Still got job-1 from working scraper
    });

    it('should continue processing if notifier fails', async () => {
      // Arrange
      mockNotifier.notify = async (job: Job) => {
        throw new Error('Notifier failure');
      };

      const savedJobs: Job[] = [];
      mockRepository.save = async (job: Job) => {
        savedJobs.push(job);
      };

      // Act
      await useCase.execute();

      // Assert
      expect(savedJobs.length).toBe(1); // Job still saved despite notifier failure
    });

    it('should filter out low-scoring jobs', async () => {
      // Arrange
      const savedJobs: Job[] = [];
      mockRepository.save = async (job: Job) => {
        savedJobs.push(job);
      };

      // Act
      await useCase.execute();

      // Assert
      expect(savedJobs.length).toBe(1);
      expect(savedJobs[0].title).toContain('Unity'); // Only Unity job matches keywords
    });

    it('should handle empty scraper results', async () => {
      // Arrange
      mockScrapers = [
        {
          scrape: async () => [],
          getName: () => 'EmptyScraper',
        },
      ];

      useCase = new ProcessJobsUseCase(
        mockRepository,
        mockScrapers,
        mockNotifier,
        scoringService
      );

      const savedJobs: Job[] = [];
      mockRepository.save = async (job: Job) => {
        savedJobs.push(job);
      };

      // Act
      await useCase.execute();

      // Assert
      expect(savedJobs.length).toBe(0);
    });
  });
});
