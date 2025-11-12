<div align="center">
  <img src="./logo.jpg" alt="VacanSeek Logo" width="200" height="200"/>

  # VacanSeek

  **Your personal vacancy scout — always watching for new opportunities.**

  An automated job scraper that monitors job boards, filters positions based on keywords, and sends notifications via Telegram.
</div>

## Features

- **Multiple Scrapers**: Supports both HTML and RSS-based job boards
- **Keyword Filtering**: Filters jobs based on configurable keywords with scoring
- **Telegram Notifications**: Sends formatted job alerts to Telegram
- **Duplicate Detection**: Tracks seen jobs to avoid duplicate notifications
- **Scheduled Execution**: Runs on a configurable cron schedule
- **Resilient**: Continues processing even if individual scrapers or notifiers fail
- **Clean Architecture**: Layered design with domain, application, and infrastructure layers
- **Well-Tested**: 80+ unit and integration tests with 100% pass rate

## Architecture

```
src/
├── domain/              # Core business logic
│   ├── entities/        # Job entity
│   ├── repositories/    # Repository interfaces
│   └── services/        # Domain services (scoring, scraper, notifier interfaces)
├── application/         # Use cases
│   └── use-cases/       # ProcessJobsUseCase (orchestrates the flow)
├── infrastructure/      # External concerns
│   ├── config/          # Configuration management
│   ├── database/        # SQLite persistence
│   ├── notifiers/       # Telegram, MultiNotifier
│   └── scrapers/        # HTML and RSS scrapers
└── main.ts              # Entry point with DI container
```

## Setup

### Prerequisites

- Node.js 20.x or higher
- npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure Telegram (optional):
   - Create a Telegram bot via [@BotFather](https://t.me/botfather)
   - Get your chat ID from [@userinfobot](https://t.me/userinfobot)
   - Set environment variables:
```bash
export TELEGRAM_BOT_TOKEN="your-bot-token"
export TELEGRAM_CHAT_ID="your-chat-id"
```

3. Build the project:
```bash
npm run build
```

## Usage

### Running the Bot

Start the bot (runs immediately, then on schedule):
```bash
npm start
```

The bot will:
1. Load configuration from `src/infrastructure/config/AppConfig.ts`
2. Initialize SQLite database in `./data/jobs.db`
3. Run an immediate scan
4. Schedule recurring scans (default: every 10 minutes)

### Running Tests

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm test:watch
```

Generate coverage report:
```bash
npm test:coverage
```

## Configuration

Edit `src/infrastructure/config/AppConfig.ts` to customize:

- **Sites**: Add/remove job boards to scrape
- **Keywords**: Configure filtering keywords (unity, webgl, three.js, etc.)
- **Min Score**: Minimum keyword matches required
- **Cron Schedule**: Adjust scraping frequency

### Adding New Job Sites

#### HTML Scraper
```typescript
{
  name: 'SiteName',
  type: 'html',
  url: 'https://example.com/jobs',
  listSelector: '.job-card',
  titleSelector: 'h3.title',
  urlSelector: 'a',
  companySelector: '.company',  // optional
  dateSelector: '.date'          // optional
}
```

#### RSS Scraper
```typescript
{
  name: 'SiteName',
  type: 'rss',
  rssUrl: 'https://example.com/jobs.rss'
}
```

## Development

### Project Structure

- **Domain Layer**: Pure business logic, no dependencies
- **Application Layer**: Use cases that orchestrate domain logic
- **Infrastructure Layer**: Concrete implementations (DB, HTTP, etc.)

### Testing

Tests follow the TDD Red-Green-Refactor cycle:
- Unit tests: Mock external dependencies
- Integration tests: Use real SQLite database

### Adding Features

1. Write failing tests (RED)
2. Implement minimal code to pass (GREEN)
3. Refactor for quality (REFACTOR)
4. Ensure all tests still pass

## Troubleshooting

### Database Issues
- Database is created automatically in `./data/`
- Delete `./data/jobs.db` to reset the database

### Scraper Failures
- Check console for error messages
- Verify site selectors are still valid
- Sites may change their HTML structure

### Telegram Issues
- Verify bot token and chat ID are correct
- Test bot with `/start` command in Telegram
- Check bot has permission to send messages

## Tech Stack

- **TypeScript**: Type-safe JavaScript
- **Node.js**: Runtime environment
- **Better-SQLite3**: Fast, synchronous SQLite
- **Axios**: HTTP client for scraping
- **Cheerio**: HTML parsing
- **RSS Parser**: RSS/Atom feed parsing
- **node-cron**: Scheduled execution
- **Zod**: Schema validation
- **Jest**: Testing framework

## License

MIT

## Contributing

1. Follow the existing architecture patterns
2. Write tests for all new features
3. Maintain 100% test pass rate
4. Use TypeScript strict mode
5. Handle errors gracefully
