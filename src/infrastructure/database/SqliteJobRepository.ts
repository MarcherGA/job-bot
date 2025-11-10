import { IJobRepository } from '../../domain/repositories/IJobRepository';
import { Job, JobProps } from '../../domain/entities/Job';
import Database from 'better-sqlite3';

interface JobRow {
  id: string;
  site: string;
  title: string | null;
  url: string | null;
  company: string | null;
  text: string | null;
  posted_at: string | null;
}

/**
 * SQLite implementation of IJobRepository
 */
export class SqliteJobRepository implements IJobRepository {
  private stmtCheckExists: Database.Statement;
  private stmtInsert: Database.Statement;
  private stmtFindById: Database.Statement;

  constructor(private db: Database.Database) {
    this.stmtCheckExists = db.prepare('SELECT 1 FROM sent_jobs WHERE id = ?');
    this.stmtInsert = db.prepare(
      `INSERT OR REPLACE INTO sent_jobs (id, site, title, url, company, text, posted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    this.stmtFindById = db.prepare(
      'SELECT id, site, title, url, company, text, posted_at FROM sent_jobs WHERE id = ?'
    );
  }

  async exists(jobId: string): Promise<boolean> {
    const row = this.stmtCheckExists.get(jobId) as { 1: number } | undefined;
    return !!row;
  }

  async save(job: Job): Promise<void> {
    const postedAtStr = job.postedAt ? job.postedAt.toISOString() : null;

    this.stmtInsert.run(
      job.id,
      job.site,
      job.title,
      job.url,
      job.company ?? null,
      job.text ?? null,
      postedAtStr
    );
  }

  async findById(jobId: string): Promise<Job | null> {
    const row = this.stmtFindById.get(jobId) as JobRow | undefined;

    if (!row) {
      return null;
    }

    const jobProps: JobProps = {
      id: row.id,
      site: row.site,
      title: row.title ?? '',
      url: row.url ?? '',
      company: row.company ?? undefined,
      text: row.text ?? undefined,
      postedAt: row.posted_at ? new Date(row.posted_at) : undefined,
    };

    return new Job(jobProps);
  }
}

