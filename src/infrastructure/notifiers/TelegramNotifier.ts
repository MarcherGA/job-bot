import { INotifier } from '../../domain/services/INotifier';
import { Job } from '../../domain/entities/Job';
import axios from 'axios';

export interface TelegramConfig {
  botToken: string;
  chatId: string;
}

/**
 * Telegram notification implementation
 */
export class TelegramNotifier implements INotifier {
  constructor(private config: TelegramConfig) {}

  async notify(job: Job): Promise<void> {
    const text = [
      `*${job.title}*`,
      job.company ? `${job.company}` : '',
      job.url,
      `_site: ${job.site}_`,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await axios.post(
        `https://api.telegram.org/bot${this.config.botToken}/sendMessage`,
        {
          chat_id: this.config.chatId,
          text,
          parse_mode: 'Markdown',
        },
        { timeout: 10000 }
      );
    } catch (error) {
      // Log error silently and continue
      // TODO: Use proper logger once implemented
      console.error(
        'Telegram notify error:',
        (error as any).response?.data || (error as Error).message
      );
    }
  }

  getName(): string {
    return 'Telegram';
  }
}
