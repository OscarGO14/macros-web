import { FirebaseError } from 'firebase/app';

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryIf?: (error: Error) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 segundo
  maxDelay: 10000, // 10 segundos
  backoffFactor: 2,
  retryIf: (error: Error) => {
    // Retry en errores de red o temporales
    if (error instanceof FirebaseError) {
      const retryableCodes = [
        'unavailable',
        'deadline-exceeded',
        'internal',
        'resource-exhausted',
        'cancelled'
      ];
      return retryableCodes.includes(error.code);
    }

    // Retry en errores de red generales
    return error.message.toLowerCase().includes('network') ||
           error.message.toLowerCase().includes('offline') ||
           error.message.toLowerCase().includes('timeout');
  }
};

/**
 * Service for implementing retry logic with exponential backoff
 * Useful for network operations that may fail temporarily
 */
export class RetryService {
  /**
   * Execute a function with retry logic
   */
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const config = { ...DEFAULT_OPTIONS, ...options };
    let lastError: Error;
    let delay = config.initialDelay;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Si es el último intento o el error no es reintentable, lanzar error
        if (attempt === config.maxRetries || !config.retryIf(lastError)) {
          throw lastError;
        }

        // Esperar antes del siguiente intento
        console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, lastError.message);
        await this.delay(delay);

        // Incrementar delay para próximo intento (exponential backoff)
        delay = Math.min(delay * config.backoffFactor, config.maxDelay);
      }
    }

    throw lastError!;
  }

  /**
   * Promise-based delay
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if device is online (simple check)
   */
  static isOnline(): boolean {
    // En React Native, puedes usar @react-native-community/netinfo
    // Por ahora, implementación básica
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true; // Asumir online si no podemos verificar
  }

  /**
   * Execute operation only when online, queue when offline
   */
  static async executeWhenOnline<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    if (!this.isOnline()) {
      throw new Error('Device is offline. Operation cannot be performed.');
    }

    return this.executeWithRetry(operation, options);
  }
}

/**
 * Queue for operations that failed due to network issues
 * Can be used to retry operations when connection is restored
 */
export class OperationQueue {
  private static queue: Array<{
    id: string;
    operation: () => Promise<any>;
    options: RetryOptions;
    timestamp: number;
  }> = [];

  /**
   * Add operation to queue
   */
  static enqueue(
    id: string,
    operation: () => Promise<any>,
    options: RetryOptions = {}
  ): void {
    // Evitar duplicados
    this.dequeue(id);

    this.queue.push({
      id,
      operation,
      options,
      timestamp: Date.now()
    });

    console.log(`Operation ${id} queued for retry`);
  }

  /**
   * Remove operation from queue
   */
  static dequeue(id: string): boolean {
    const index = this.queue.findIndex(item => item.id === id);
    if (index !== -1) {
      this.queue.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Process all queued operations
   */
  static async processQueue(): Promise<void> {
    if (!RetryService.isOnline()) {
      console.log('Device is offline, skipping queue processing');
      return;
    }

    const queuedItems = [...this.queue];
    this.queue = [];

    console.log(`Processing ${queuedItems.length} queued operations`);

    for (const item of queuedItems) {
      try {
        await RetryService.executeWithRetry(item.operation, item.options);
        console.log(`Successfully processed queued operation: ${item.id}`);
      } catch (error) {
        console.error(`Failed to process queued operation ${item.id}:`, error);

        // Re-queue if it's still a retryable error and not too old
        const isOld = Date.now() - item.timestamp > 24 * 60 * 60 * 1000; // 24 horas
        const isRetryable = (item.options.retryIf || DEFAULT_OPTIONS.retryIf)(error as Error);

        if (!isOld && isRetryable) {
          this.queue.push(item);
        }
      }
    }
  }

  /**
   * Get queue status
   */
  static getQueueInfo(): { count: number; items: string[] } {
    return {
      count: this.queue.length,
      items: this.queue.map(item => item.id)
    };
  }

  /**
   * Clear all queued operations
   */
  static clearQueue(): void {
    this.queue = [];
    console.log('Operation queue cleared');
  }
}