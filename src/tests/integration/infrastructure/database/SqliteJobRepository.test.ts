import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { SqliteJobRepository } from '../../../../infrastructure/database/SqliteJobRepository';
import { Job } from '../../../../domain/entities/Job';
import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

describe('SqliteJobRepository (Integration)', () => {
  let repository: SqliteJobRepository;
  let db: Database.Database;
  const testDbPath = path.join(__dirname, 'test-jobs.db');

  beforeEach(() => {
    // Clean up any existing test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    // Create a new database connection
    db = new Database(testDbPath);

    // Initialize schema
    db.exec(`
      CREATE TABLE IF NOT EXISTS sent_jobs (
        id TEXT PRIMARY KEY,
        site TEXT NOT NULL,
        title TEXT,
        url TEXT,
        company TEXT,
        text TEXT,
        posted_at TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    repository = new SqliteJobRepository(db);
  });

  afterEach(() => {
    // Close database and clean up
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
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
    it('should persist a job to SQLite', async () => {
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

    it('should persist a job with all fields', async () => {
      // Arrange
      const postedDate = new Date('2025-01-01T10:00:00Z');
      const job = new Job({
        id: 'test-job-2',
        title: 'Unity Developer',
        url: 'https://example.com/job/2',
        site: 'GameJobs',
        company: 'Awesome Games',
        text: 'Great opportunity for Unity developers',
        postedAt: postedDate,
      });

      // Act
      await repository.save(job);

      // Assert
      const retrieved = await repository.findById('test-job-2');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe('test-job-2');
      expect(retrieved?.title).toBe('Unity Developer');
      expect(retrieved?.company).toBe('Awesome Games');
      expect(retrieved?.text).toBe('Great opportunity for Unity developers');
      expect(retrieved?.postedAt).toEqual(postedDate);
    });

    it('should handle duplicate saves (idempotent)', async () => {
      // Arrange
      const job = new Job({
        id: 'duplicate-job',
        title: 'Test Job',
        url: 'https://example.com/job',
        site: 'TestSite',
      });

      // Act - save twice
      await repository.save(job);
      await repository.save(job);

      // Assert - should only have one record
      const retrieved = await repository.findById('duplicate-job');
      expect(retrieved).not.toBeNull();

      // Verify only one record in DB
      const count = db.prepare('SELECT COUNT(*) as count FROM sent_jobs WHERE id = ?').get('duplicate-job') as { count: number };
      expect(count.count).toBe(1);
    });
  });

  describe('findById', () => {
    it('should return null for non-existent job', async () => {
      // Act
      const result = await repository.findById('non-existent');

      // Assert
      expect(result).toBeNull();
    });

    it('should retrieve a saved job', async () => {
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
      expect(result?.site).toBe('RemoteJobs');
    });
  });
});
