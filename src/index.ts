// src/index.ts
import "dotenv/config";
import axios from "axios";
import cheerio from "cheerio";
import RSSParser from "rss-parser";
import cron from "node-cron";
import Database from "better-sqlite3";
import { CONFIG, SiteConfig, HtmlSiteConfig, RssSiteConfig } from "./config";

type Job = {
  id: string;
  title: string;
  url: string;
  company?: string;
  site: string;
  text?: string;
  postedAt?: Date;
};

const USER_AGENT = "ItayJobBot/1.0 (+https://example.com)";

// ---------- DB ----------

const db = new Database("./jobs.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS sent_jobs (
    id TEXT PRIMARY KEY,
    site TEXT NOT NULL,
    title TEXT,
    url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const stmtCheckSent = db.prepare("SELECT 1 FROM sent_jobs WHERE id = ?");
const stmtInsertSent = db.prepare(
  "INSERT OR IGNORE INTO sent_jobs (id, site, title, url) VALUES (?, ?, ?, ?)"
);

function isAlreadySent(jobId: string): boolean {
  const row = stmtCheckSent.get(jobId) as { 1: number } | undefined;
  return !!row;
}

function markSent(job: Job): void {
  stmtInsertSent.run(job.id, job.site, job.title, job.url);
}

// ---------- Scoring / filters ----------

function scoreJob(job: Job): number {
  const text = `${job.title ?? ""} ${job.text ?? ""}`.toLowerCase();
  let score = 0;
  for (const k of CONFIG.filters.keywords) {
    if (text.includes(k.toLowerCase())) score++;
  }
  return score;
}

// ---------- Fetchers ----------

async function fetchHtmlSite(site: HtmlSiteConfig): Promise<Job[]> {
  try {
    const res = await axios.get<string>(site.url, {
      headers: { "User-Agent": USER_AGENT },
      timeout: 15000
    });
    const $ = cheerio.load(res.data);
    const jobs: Job[] = [];

    $(site.listSelector).each((_, element) => {
      const container = $(element);

      const title = container.find(site.titleSelector).text().trim();
      let url = container.find(site.urlSelector).attr("href") || "";

      if (url && !url.startsWith("http")) {
        url = new URL(url, site.url).toString();
      }

      const company = site.companySelector
        ? container.find(site.companySelector).text().trim()
        : undefined;

      const rawText = container
        .text()
        .replace(/\s+/g, " ")
        .trim();

      const id = url || `${site.name}::${title}`.slice(0, 200);

      const job: Job = {
        id,
        title,
        url,
        company,
        site: site.name,
        text: rawText
      };

      jobs.push(job);
    });

    return jobs;
  } catch (err: unknown) {
    const error = err as Error;
    console.error(`fetchHtmlSite error [${site.name}]:`, error.message);
    return [];
  }
}

const rssParser = new RSSParser();

async function fetchRssSite(site: RssSiteConfig): Promise<Job[]> {
  try {
    const feed = await rssParser.parseURL(site.rssUrl);
    const jobs: Job[] = [];

    for (const item of feed.items) {
      const id = (item.guid || item.link || item.title || "").slice(0, 200);
      if (!id) continue;

      const title = item.title?.trim() ?? "(no title)";
      const url = item.link || "";
      const text =
        item.contentSnippet || item.content || item["content:encoded"] || "";
      const date = item.isoDate ? new Date(item.isoDate) : undefined;

      const job: Job = {
        id,
        title,
        url,
        site: site.name,
        text,
        postedAt: date
      };

      jobs.push(job);
    }

    return jobs;
  } catch (err: unknown) {
    const error = err as Error;
    console.error(`fetchRssSite error [${site.name}]:`, error.message);
    return [];
  }
}

async function fetchSite(site: SiteConfig): Promise<Job[]> {
  switch (site.type) {
    case "html":
      return fetchHtmlSite(site);
    case "rss":
      return fetchRssSite(site);
    default: {
      const _exhaustive: never = site;
      return [];
    }
  }
}

// ---------- Notifier (Telegram) ----------

async function notifyTelegram(job: Job): Promise<void> {
  const token = CONFIG.notifier.telegramBotToken;
  const chatId = CONFIG.notifier.telegramChatId;
  if (!token || !chatId) return;

  const text = [
    `*${job.title}*`,
    job.company ? `${job.company}` : "",
    job.url,
    `_site: ${job.site}_`
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await axios.post(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        chat_id: chatId,
        text,
        parse_mode: "Markdown"
      },
      { timeout: 10000 }
    );
  } catch (err: unknown) {
    const error = err as Error & { response?: any };
    console.error(
      "Telegram notify error:",
      error.response?.data || error.message
    );
  }
}

// (You can add Discord / email notifiers here and call them from processJobs)

// ---------- Main loop ----------

async function processOnce(): Promise<void> {
  console.log(`[${new Date().toISOString()}] Job run started.`);

  for (const site of CONFIG.sites) {
    console.log(`  Fetching site: ${site.name} (${site.type})`);
    const jobs = await fetchSite(site);
    console.log(`  -> Found ${jobs.length} jobs from ${site.name}`);

    for (const job of jobs) {
      const score = scoreJob(job);
      if (score < CONFIG.filters.minScore) continue;

      if (isAlreadySent(job.id)) continue;

      console.log(`  NEW MATCH [${site.name}] "${job.title}" (${score})`);
      await notifyTelegram(job);
      markSent(job);

      // be polite – short pause to avoid spamming APIs
      await sleep(800);
    }

    // pause between sites
    await sleep(1500);
  }

  console.log(`[${new Date().toISOString()}] Job run finished.`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------- Scheduler ----------

async function bootstrap(): Promise<void> {
  console.log("Starting job bot with config:", {
    sites: CONFIG.sites.map((s) => s.name),
    cron: CONFIG.cron,
    hasTelegram:
      !!CONFIG.notifier.telegramBotToken &&
      !!CONFIG.notifier.telegramChatId
  });

  // run immediately on startup
  await processOnce();

  // schedule
  cron.schedule(CONFIG.cron, () => {
    void processOnce();
  });
}

bootstrap().catch((err) => {
  console.error("Fatal error in bootstrap:", err);
  process.exit(1);
});
