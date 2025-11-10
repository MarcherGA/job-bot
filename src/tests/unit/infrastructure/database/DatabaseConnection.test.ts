import { describe, it, expect, afterEach } from '@jest/globals';
import { DatabaseConnection } from '../../../../infrastructure/database/DatabaseConnection';
import * as fs from 'fs';
import * as path from 'path';

describe('DatabaseConnection', () => {
  const testDbPath = path.join(__dirname, 'test-connection.db');

  afterEach(() => {
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('initialize', () => {
    it('should create database file and initialize schema', () => {
      // Act
      const connection = DatabaseConnection.initialize(testDbPath);

      // Assert
      expect(fs.existsSync(testDbPath)).toBe(true);
      expect(connection).toBeDefined();

      // Verify schema exists by querying table
      const db = connection.getDatabase();
      const tableInfo = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='sent_jobs'"
      ).get() as { name: string } | undefined;

      expect(tableInfo).toBeDefined();
      expect(tableInfo?.name).toBe('sent_jobs');

      connection.close();
    });

    it('should handle existing database gracefully', () => {
      // Arrange - create database first time
      const connection1 = DatabaseConnection.initialize(testDbPath);
      connection1.close();

      // Act - initialize again with existing file
      const connection2 = DatabaseConnection.initialize(testDbPath);

      // Assert - should work without errors
      expect(connection2).toBeDefined();
      const db = connection2.getDatabase();
      expect(db).toBeDefined();

      connection2.close();
    });

    it('should create all required columns', () => {
      // Act
      const connection = DatabaseConnection.initialize(testDbPath);
      const db = connection.getDatabase();

      // Assert - check column structure
      const columns = db.prepare(
        'PRAGMA table_info(sent_jobs)'
      ).all() as Array<{ name: string; type: string }>;

      const columnNames = columns.map((col) => col.name);

      expect(columnNames).toContain('id');
      expect(columnNames).toContain('site');
      expect(columnNames).toContain('title');
      expect(columnNames).toContain('url');
      expect(columnNames).toContain('company');
      expect(columnNames).toContain('text');
      expect(columnNames).toContain('posted_at');
      expect(columnNames).toContain('created_at');

      connection.close();
    });
  });

  describe('getDatabase', () => {
    it('should return the database instance', () => {
      // Arrange
      const connection = DatabaseConnection.initialize(testDbPath);

      // Act
      const db = connection.getDatabase();

      // Assert
      expect(db).toBeDefined();
      expect(typeof db.prepare).toBe('function');

      connection.close();
    });
  });

  describe('close', () => {
    it('should close the database connection', () => {
      // Arrange
      const connection = DatabaseConnection.initialize(testDbPath);

      // Act
      connection.close();

      // Assert - attempting to use db after close should fail
      const db = connection.getDatabase();
      expect(() => db.prepare('SELECT 1')).toThrow();
    });
  });
});
