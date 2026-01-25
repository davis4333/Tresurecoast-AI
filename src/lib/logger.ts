import pino from 'pino';

const isDev = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// Don't log in test environment by default
const logLevel = isTest 
  ? 'silent' 
  : (process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'));

export const logger = pino({
  level: logLevel,
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
          singleLine: false,
        },
      }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  base: {
    env: process.env.NODE_ENV,
  },
});

/**
 * Create a child logger with a specific context
 * 
 * Usage:
 * ```ts
 * const log = createLogger('api:webhook');
 * log.info({ orgId: 123 }, 'Processing webhook');
 * ```
 */
export function createLogger(context: string) {
  return logger.child({ context });
}

/**
 * Log levels:
 * - fatal: Application crash
 * - error: Error occurred but app continues
 * - warn: Warning message
 * - info: General info (default in production)
 * - debug: Debug info (default in development)
 * - trace: Very detailed tracing
 */

// Export for convenience
export default logger;
