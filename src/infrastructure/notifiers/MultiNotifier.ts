import { INotifier } from '../../domain/services/INotifier';
import { Job } from '../../domain/entities/Job';

/**
 * Composite notifier that broadcasts to multiple notification channels
 */
export class MultiNotifier implements INotifier {
  constructor(private notifiers: INotifier[]) {}

  async notify(job: Job): Promise<void> {
    // Notify all channels in parallel
    await Promise.allSettled(
      this.notifiers.map(async (notifier) => {
        try {
          await notifier.notify(job);
        } catch (error) {
          // Log error but continue with other notifiers
          console.error(
            `Error in ${notifier.getName()} notifier:`,
            (error as Error).message
          );
        }
      })
    );
  }

  getName(): string {
    return 'MultiNotifier';
  }
}
