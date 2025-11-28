/**
 * Retry utility with exponential backoff
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryIf?: (error: unknown) => boolean;
  onRetry?: (error: unknown, attempt: number, nextDelayMs: number) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, "retryIf" | "onRetry">> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 *
 * @example
 * // Basic usage
 * const result = await retry(() => fetchData());
 *
 * @example
 * // With options
 * const result = await retry(
 *   () => callApi(),
 *   {
 *     maxAttempts: 5,
 *     initialDelayMs: 500,
 *     onRetry: (err, attempt) => console.log(`Retry ${attempt}:`, err)
 *   }
 * );
 *
 * @example
 * // Only retry specific errors
 * const result = await retry(
 *   () => transcribe(audio),
 *   {
 *     retryIf: (err) => err instanceof RateLimitError
 *   }
 * );
 */
export async function retry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;
  let delayMs = opts.initialDelayMs;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (opts.retryIf && !opts.retryIf(error)) {
        throw error;
      }

      // Don't retry if this was the last attempt
      if (attempt === opts.maxAttempts) {
        break;
      }

      // Calculate next delay with jitter (±10%)
      const jitter = delayMs * 0.1 * (Math.random() * 2 - 1);
      const actualDelay = Math.min(delayMs + jitter, opts.maxDelayMs);

      // Notify about retry
      if (opts.onRetry) {
        opts.onRetry(error, attempt, actualDelay);
      }

      // Wait before next attempt
      await sleep(actualDelay);

      // Increase delay for next iteration
      delayMs = Math.min(delayMs * opts.backoffMultiplier, opts.maxDelayMs);
    }
  }

  throw lastError;
}

/**
 * Check if error is retryable (network errors, rate limits, server errors)
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Network errors
    if (
      message.includes("network") ||
      message.includes("timeout") ||
      message.includes("econnreset") ||
      message.includes("econnrefused") ||
      message.includes("socket")
    ) {
      return true;
    }

    // Rate limits
    if (message.includes("rate limit") || message.includes("429")) {
      return true;
    }

    // Server errors (5xx)
    if (message.includes("500") || message.includes("502") || message.includes("503")) {
      return true;
    }
  }

  // Check for response status if it's a fetch-like error
  const err = error as { status?: number; statusCode?: number };
  if (err.status && err.status >= 500) return true;
  if (err.status === 429) return true;
  if (err.statusCode && err.statusCode >= 500) return true;
  if (err.statusCode === 429) return true;

  return false;
}

/**
 * Pre-configured retry for API calls
 */
export function retryApi<T>(fn: () => Promise<T>): Promise<T> {
  return retry(fn, {
    maxAttempts: 3,
    initialDelayMs: 1000,
    retryIf: isRetryableError,
  });
}

/**
 * Pre-configured retry for critical operations (more attempts, longer delays)
 */
export function retryCritical<T>(fn: () => Promise<T>): Promise<T> {
  return retry(fn, {
    maxAttempts: 5,
    initialDelayMs: 2000,
    maxDelayMs: 60000,
    retryIf: isRetryableError,
  });
}
