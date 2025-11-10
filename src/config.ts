// src/config.ts
export type SiteType = "html" | "rss";

export interface BaseSiteConfig {
  name: string;
  type: SiteType;
}

export interface HtmlSiteConfig extends BaseSiteConfig {
  type: "html";
  url: string;
  listSelector: string;
  titleSelector: string;
  urlSelector: string;
  companySelector?: string;
  dateSelector?: string;
}

export interface RssSiteConfig extends BaseSiteConfig {
  type: "rss";
  rssUrl: string;
}

export type SiteConfig = HtmlSiteConfig | RssSiteConfig;

export interface FilterConfig {
  keywords: string[];
  minScore: number;
}

export interface NotifierConfig {
  telegramBotToken?: string;
  telegramChatId?: string;
  // later: discordWebhook?: string;
}

export interface AppConfig {
  sites: SiteConfig[];
  filters: FilterConfig;
  notifier: NotifierConfig;
  cron: string;
}

export const CONFIG: AppConfig = {
  sites: [
    // Example: Remote Game Jobs (HTML)
    {
      name: "RemoteGameJobs",
      type: "html",
      url: "https://remotegamejobs.com/",
      listSelector: ".card.job-card", // may need adjustment as site changes
      titleSelector: "h3.card-title",
      urlSelector: "a",
      companySelector: ".job-company",
      dateSelector: ".posted-at"
    },
    // Example: RSS-based board (placeholder)
    {
      name: "ExampleRSS",
      type: "rss",
      rssUrl: "https://example.com/jobs.rss"
    }
  ],
  filters: {
    keywords: [
      "unity",
      "unity3d",
      "three.js",
      "threejs",
      "react-three-fiber",
      "r3f",
      "babylon.js",
      "webgl",
      "web gpu",
      "3d web",
      "game dev",
      "game developer",
      "c#",
      "shader",
      "unreal" // maybe you want this too
    ],
    minScore: 1
  },
  notifier: {
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
    telegramChatId: process.env.TELEGRAM_CHAT_ID
  },
  // every 10 minutes
  cron: "*/10 * * * *"
};
