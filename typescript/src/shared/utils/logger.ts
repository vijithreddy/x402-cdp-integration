/**
 * Logger Utility
 * 
 * Provides consistent logging across the application with different log levels
 * and formatting options.
 */

import { config } from '../config';

const LogLevels = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  SUCCESS: 'success',
  DEBUG: 'debug',
  FLOW: 'flow',
  UI: 'ui'
} as const;

type LogLevel = typeof LogLevels[keyof typeof LogLevels];
type LogData = Record<string, any>;

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: LogData;
}

interface LoggerConfig {
  verbose?: boolean;
  quiet?: boolean;
  json?: boolean;
  level?: string;
}

// Hardcoded logging levels and colors
const LoggingLevels = {
  error: '❌',
  warn: '⚠️',
  info: 'ℹ️',
  success: '✅',
  debug: '🔍',
  flow: '🔄',
  ui: '💬'
};

const LoggingColors = {
  error: 'red',
  warn: 'yellow',
  info: 'blue',
  success: 'green',
  debug: 'gray',
  flow: 'cyan',
  ui: 'white'
};

/**
 * Logger Utility
 * 
 * Provides consistent logging across the application with different log levels
 * and formatting options.
 */
class Logger {
  private isVerbose: boolean = false;
  private config: LoggerConfig = {};

  constructor() {
    // Enable verbose logging if DEBUG environment variable is set
    this.isVerbose = process.env.DEBUG === 'true';
  }

  updateConfig(newConfig: Partial<LoggerConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.isVerbose = this.config.verbose || process.env.DEBUG === 'true';
  }

  private formatLog(level: LogLevel, message: string, data?: LogData): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };
  }

  private log(level: LogLevel, message: string, data?: LogData) {
    const entry = this.formatLog(level, message, data);
    const icon = LoggingLevels[level] || 'ℹ️';
    const color = LoggingColors[level] || 'blue';

    // Only show debug logs in verbose mode
    if (level === LogLevels.DEBUG && !this.isVerbose) {
      return;
    }

    // Format the log entry
    const formattedMessage = `${icon} ${entry.timestamp} [${level.toUpperCase()}] ${message}`;
    
    // Log to console with appropriate color
    switch (color) {
      case 'red':
        console.error(formattedMessage);
        break;
      case 'yellow':
        console.warn(formattedMessage);
        break;
      case 'green':
        console.log('\x1b[32m%s\x1b[0m', formattedMessage);
        break;
      case 'blue':
        console.log('\x1b[34m%s\x1b[0m', formattedMessage);
        break;
      case 'gray':
        console.log('\x1b[90m%s\x1b[0m', formattedMessage);
        break;
      case 'cyan':
        console.log('\x1b[36m%s\x1b[0m', formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }

    // Log additional data if present
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  error(message: string, data?: LogData) {
    this.log(LogLevels.ERROR, message, data);
  }

  warn(message: string, data?: LogData) {
    this.log(LogLevels.WARN, message, data);
  }

  info(message: string, data?: LogData) {
    this.log(LogLevels.INFO, message, data);
  }

  success(message: string, data?: LogData) {
    this.log(LogLevels.SUCCESS, message, data);
  }

  debug(message: string, data?: LogData) {
    this.log(LogLevels.DEBUG, message, data);
  }

  flow(message: string, data?: LogData) {
    this.log(LogLevels.FLOW, message, data);
  }

  ui(message: string) {
    console.log(message);
  }

  // Specialized logging methods for common operations
  payment(tier: string, amount: string, status: string, details?: LogData) {
    this.info(`Payment ${status} for ${tier} tier (${amount})`, details);
  }

  wallet(operation: string, address: string, details?: LogData) {
    this.info(`Wallet ${operation}: ${address}`, details);
  }

  request(method: string, path: string, status: number, details?: LogData) {
    this.debug(`${method} ${path} - ${status}`, details);
  }
}

// Export a singleton instance
export const logger = new Logger();

/**
 * Parse command line arguments for logging configuration
 */
export function parseLogFlags(args: string[] = process.argv): Partial<LoggerConfig> {
  return {
    verbose: args.includes('--verbose') || args.includes('-v'),
    quiet: args.includes('--quiet') || args.includes('-q'),
    json: args.includes('--json'),
    level: args.includes('--debug') ? 'debug' : 'info'
  };
} 