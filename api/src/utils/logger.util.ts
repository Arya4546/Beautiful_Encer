/**
 * Logger Utility
 * 
 * Environment-aware logging that only outputs in development mode
 * In production, reduces I/O overhead and improves performance
 * 
 * Usage:
 *   import logger from '../utils/logger.util.js';
 *   logger.log('[Service] Message');
 *   logger.error('[Service] Error:', error);
 *   logger.warn('[Service] Warning');
 */

const isDevelopment = process.env.NODE_ENV === 'development';

class Logger {
  /**
   * Log informational messages (only in development)
   */
  log(...args: any[]) {
    if (isDevelopment) {
      console.log(...args);
    }
  }

  /**
   * Log error messages (always logged, even in production)
   */
  error(...args: any[]) {
    console.error(...args);
  }

  /**
   * Log warning messages (only in development)
   */
  warn(...args: any[]) {
    if (isDevelopment) {
      console.warn(...args);
    }
  }

  /**
   * Log debug messages (only in development)
   */
  debug(...args: any[]) {
    if (isDevelopment) {
      console.debug(...args);
    }
  }

  /**
   * Log informational messages (alias for log)
   */
  info(...args: any[]) {
    if (isDevelopment) {
      console.info(...args);
    }
  }

  /**
   * Force log a message regardless of environment
   * Use sparingly for critical production logs
   */
  force(...args: any[]) {
    console.log(...args);
  }
}

export default new Logger();
