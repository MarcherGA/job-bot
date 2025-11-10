import Database from 'better-sqlite3';

/**
 * Manages SQLite database connection and schema initialization
 */
export class DatabaseConnection {
  private constructor(private db: Database.Database) {}

  static initialize(dbPath: string): DatabaseConnection {
    const db = new Database(dbPath);

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

    return new DatabaseConnection(db);
  }

  getDatabase(): Database.Database {
    return this.db;
  }

  close(): void {
    this.db.close();
  }
}
