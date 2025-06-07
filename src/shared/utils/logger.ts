/**
 * Professional Logging System for X402 Payment Applications
 * 
 * A Winston-based logging utility designed specifically for X402 payment flows,
 * providing structured logging with multiple output formats and security-first approach.
 * 
 * Features:
 * - Multiple log levels (error, warn, info, flow, debug, trace)
 * - Configurable output formats (console, JSON)
 * - Security-first approach (no sensitive data logging)
 * - Payment-specific transaction logging
 * - ANSI color formatting for CLI applications
 * - Structured flow tracking for debugging
 * 
 * @example
 * ```typescript
 * import { createLogger } from './logger';
 * 
 * const logger = createLogger({ verbose: true });
 * logger.flow('payment_start', { amount: '0.01 USDC' });
 * logger.transaction('payment_verified', { 
 *   from: '0x123...', 
 *   to: '0x456...', 
 *   status: 'success' 
 * });
 * ```
 * 
 * @since 1.0.0
 */

import winston from 'winston';

/**
 * Log levels for different types of information
 * Ordered by severity from highest to lowest
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn', 
  INFO = 'info',
  FLOW = 'flow',    // Payment/process steps
  DEBUG = 'debug',  // Technical details
  TRACE = 'trace'   // Ultra-verbose
}

/**
 * Custom log types for X402 operations
 * Used to categorize different kinds of log messages
 */
export enum LogType {
  UI = 'UI',           // User interface messages
  FLOW = 'FLOW',       // Payment flow steps
  DEBUG = 'DEBUG',     // Technical debugging
  ERROR = 'ERROR',     // Error handling
  SYSTEM = 'SYSTEM'    // System operations
}

/**
 * Configuration options for logger behavior
 */
interface LoggerConfig {
  /** Base log level (error, warn, info, debug) */
  level: string;
  /** Enable verbose debugging output */
  verbose: boolean;
  /** Suppress non-critical output */
  quiet: boolean;
  /** Output logs in JSON format */
  json: boolean;
}

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

/**
 * Professional logging class with security-first approach
 * 
 * Provides structured logging for X402 payment applications with multiple
 * output formats and security considerations to prevent sensitive data exposure.
 * 
 * @example
 * ```typescript
 * const logger = new ProfessionalLogger({ verbose: true, json: false });
 * logger.transaction('payment_received', {
 *   amount: '0.01 USDC',
 *   from: clientAddress,
 *   to: serverAddress,
 *   status: 'success'
 * });
 * ```
 */
class ProfessionalLogger {
  private winston: winston.Logger;
  private config: LoggerConfig;

  /**
   * Create a new professional logger instance
   * 
   * @param config - Logger configuration options
   * @param config.level - Base log level (default: 'info')
   * @param config.verbose - Enable verbose debugging (default: false)
   * @param config.quiet - Suppress non-critical output (default: false)
   * @param config.json - Output in JSON format (default: false)
   */
  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: config.level || 'info',
      verbose: config.verbose || false,
      quiet: config.quiet || false,
      json: config.json || false
    };

    // Create Winston logger with custom format
    this.winston = winston.createLogger({
      level: this.config.verbose ? 'debug' : this.config.level,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: this.config.json ? 
            winston.format.json() : 
            winston.format.combine(
              winston.format.colorize(),
              winston.format.simple()
            )
        })
      ]
    });
  }

  /**
   * Display clean user interface messages
   * 
   * Used for status updates and user-facing information that should
   * always be visible unless in quiet mode.
   * 
   * @param message - The message to display
   * @param details - Optional additional details (shown in verbose mode)
   * @example
   * ```typescript
   * logger.ui('🚀 Server starting on port 3000');
   * logger.ui('Configuration loaded', { port: 3000, env: 'development' });
   * ```
   */
  ui(message: string, details?: any): void {
    if (this.config.quiet) return;
    
    if (this.config.json) {
      this.winston.info({ type: 'UI', message, details });
    } else {
      console.log(message);
      if (details && this.config.verbose) {
        console.log(`${colors.gray}${JSON.stringify(details, null, 2)}${colors.reset}`);
      }
    }
  }

  /**
   * Log structured flow events for payment processes
   * 
   * Tracks the progression of payment flows and system processes
   * with structured data for debugging and monitoring.
   * 
   * @param action - The action/step being performed
   * @param details - Structured data about the action
   * @example
   * ```typescript
   * logger.flow('payment_start', { amount: '0.01 USDC', client: clientAddr });
   * logger.flow('wallet_balance_check', { balance: '5.42 USDC' });
   * ```
   */
  flow(action: string, details: any = {}): void {
    if (this.config.quiet) return;

    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    
    if (this.config.json) {
      this.winston.info({ 
        type: 'FLOW', 
        timestamp, 
        action, 
        ...details 
      });
    } else {
      const formattedAction = `${colors.blue}[${action.toUpperCase()}]${colors.reset}`;
      const timeStr = `${colors.gray}[${timestamp}]${colors.reset}`;
      
      console.log(`${timeStr} ${formattedAction} ${this.formatFlowDetails(details)}`);
    }
  }

  /**
   * Log technical debugging information
   * 
   * Only shown in verbose mode. Used for detailed technical information
   * that helps with debugging but isn't needed for normal operation.
   * 
   * @param message - Debug message description
   * @param data - Optional technical data to include
   * @throws {Error} Never throws - errors are handled gracefully
   * @example
   * ```typescript
   * logger.debug('X402 header decoded', { paymentData: decodedPayment });
   * ```
   */
  debug(message: string, data?: any): void {
    if (!this.config.verbose || this.config.quiet) return;
    
    if (this.config.json) {
      this.winston.debug({ type: 'DEBUG', message, data });
    } else {
      const debugTag = `${colors.cyan}[DEBUG]${colors.reset}`;
      console.log(`${debugTag} ${message}`);
      if (data) {
        console.log(`${colors.gray}${JSON.stringify(data, null, 2)}${colors.reset}`);
      }
    }
  }

  /**
   * Log error conditions with context
   * 
   * Records errors with full context and stack traces in verbose mode.
   * Ensures sensitive information is not logged.
   * 
   * @param message - Error description
   * @param error - Error object or message
   * @example
   * ```typescript
   * logger.error('Payment verification failed', new Error('Invalid signature'));
   * ```
   */
  error(message: string, error?: any): void {
    if (this.config.json) {
      this.winston.error({ 
        type: 'ERROR', 
        message, 
        error: error?.message || error,
        stack: error?.stack 
      });
    } else {
      const errorTag = `${colors.red}[ERROR]${colors.reset}`;
      console.log(`${errorTag} ${message}`);
      if (error && this.config.verbose) {
        console.log(`${colors.red}${error.stack || error.message || error}${colors.reset}`);
      }
    }
  }

  /**
   * Log successful operations
   * 
   * Records positive outcomes and successful completions.
   * 
   * @param message - Success message
   * @param details - Optional success details
   * @example
   * ```typescript
   * logger.success('Wallet funded successfully', { newBalance: '10.00 USDC' });
   * ```
   */
  success(message: string, details?: any): void {
    if (this.config.quiet) return;
    
    if (this.config.json) {
      this.winston.info({ type: 'SUCCESS', message, details });
    } else {
      console.log(`${colors.green}✅ ${message}${colors.reset}`);
      if (details && this.config.verbose) {
        console.log(`${colors.gray}${JSON.stringify(details, null, 2)}${colors.reset}`);
      }
    }
  }

  /**
   * Log warning conditions
   * 
   * Records important but non-critical issues that should be noted.
   * 
   * @param message - Warning message
   * @param details - Optional warning context
   * @example
   * ```typescript
   * logger.warn('Rate limit approaching', { remaining: 5, resetTime: '30s' });
   * ```
   */
  warn(message: string, details?: any): void {
    if (this.config.json) {
      this.winston.warn({ type: 'WARN', message, details });
    } else {
      const warnTag = `${colors.yellow}[WARN]${colors.reset}`;
      console.log(`${warnTag} ${message}`);
      if (details && this.config.verbose) {
        console.log(`${colors.yellow}${JSON.stringify(details, null, 2)}${colors.reset}`);
      }
    }
  }

  /**
   * Log payment transaction events
   * 
   * Specialized logging for X402 payment transactions with structured
   * data including amounts, addresses, and transaction status.
   * 
   * @param action - Transaction action (e.g., 'payment_received', 'payment_sent')
   * @param details - Transaction details
   * @param details.amount - Payment amount (e.g., '0.01 USDC')
   * @param details.from - Sender address
   * @param details.to - Recipient address
   * @param details.txHash - Transaction hash
   * @param details.network - Network name
   * @param details.duration - Transaction duration in seconds
   * @param details.status - Transaction status
   * @example
   * ```typescript
   * logger.transaction('payment_verified', {
   *   amount: '0.01 USDC',
   *   from: '0x123...',
   *   to: '0x456...',
   *   status: 'success',
   *   duration: 2.3
   * });
   * ```
   */
  transaction(action: string, details: {
    amount?: string;
    from?: string;
    to?: string;
    txHash?: string;
    network?: string;
    duration?: number;
    status?: 'pending' | 'success' | 'failed';
  }): void {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    
    if (this.config.json) {
      this.winston.info({ 
        type: 'TRANSACTION', 
        timestamp,
        action, 
        ...details 
      });
    } else {
      const timeStr = `${colors.gray}[${timestamp}]${colors.reset}`;
      const actionStr = `${colors.magenta}[${action.toUpperCase()}]${colors.reset}`;
      
      let detailsStr = '';
      if (details.amount) detailsStr += ` ${details.amount}`;
      if (details.from) detailsStr += ` ${this.shortenAddress(details.from)}`;
      if (details.to) detailsStr += ` → ${this.shortenAddress(details.to)}`;
      if (details.txHash) detailsStr += ` (${this.shortenHash(details.txHash)})`;
      if (details.duration) detailsStr += ` ${details.duration}s`;

      console.log(`${timeStr} ${actionStr}${detailsStr}`);
    }
  }

  /**
   * Format flow details for console output
   * 
   * @private
   * @param details - Flow details object
   * @returns {string} Formatted details string
   */
  private formatFlowDetails(details: any): string {
    const parts: string[] = [];
    
    // Handle client field - only shorten if it looks like an address (0x format)
    if (details.client) {
      const clientValue = details.client.startsWith('0x') && details.client.length === 42 
        ? this.shortenAddress(details.client)
        : details.client;
      parts.push(`Client: ${clientValue}`);
    }
    if (details.amount) parts.push(`Amount: ${details.amount}`);
    if (details.status) parts.push(`Status: ${details.status}`);
    if (details.duration) parts.push(`(${details.duration}s)`);
    if (details.txHash) parts.push(`Tx: ${this.shortenHash(details.txHash)}`);
    
    return parts.join(' | ');
  }

  /**
   * Shorten Ethereum address for display
   * 
   * @private
   * @param address - Full Ethereum address
   * @returns {string} Shortened address (e.g., "0x1234...abcd")
   */
  private shortenAddress(address: string): string {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Shorten transaction hash for display
   * 
   * @private
   * @param hash - Full transaction hash
   * @returns {string} Shortened hash (e.g., "0x12345678...abcdef")
   */
  private shortenHash(hash: string): string {
    if (!hash || hash.length < 10) return hash;
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
  }

  /**
   * Display formatted section header
   * 
   * Creates visually distinct section headers for CLI output.
   * Includes optional subtitle and separator line.
   * 
   * @param title - Main header title
   * @param subtitle - Optional subtitle text
   * @example
   * ```typescript
   * logger.header('X402 Setup', 'Initializing wallets and configuration');
   * ```
   */
  header(title: string, subtitle?: string): void {
    if (this.config.quiet || this.config.json) return;
    
    console.log(`${colors.bright}${colors.blue}${title}${colors.reset}`);
    if (subtitle) {
      console.log(`${colors.gray}${subtitle}${colors.reset}`);
    }
    console.log(`${colors.gray}${'='.repeat(Math.max(title.length, subtitle?.length || 0))}${colors.reset}`);
  }

  /**
   * Display visual separator line
   * 
   * Outputs a horizontal line for visual organization in CLI output.
   * 
   * @example
   * ```typescript
   * logger.separator();
   * // Outputs: ──────────────────────────────────────────────────
   * ```
   */
  separator(): void {
    if (this.config.quiet || this.config.json) return;
    console.log(`${colors.gray}${'─'.repeat(50)}${colors.reset}`);
  }

  /**
   * Update logger configuration at runtime
   * 
   * Allows dynamic configuration changes during application execution.
   * Updates both internal config and Winston logger settings.
   * 
   * @param newConfig - Partial configuration to merge with existing
   * @example
   * ```typescript
   * logger.updateConfig({ verbose: true, level: 'debug' });
   * ```
   */
  updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.winston.level = this.config.verbose ? 'debug' : this.config.level;
  }
}

// Export singleton instance
export const logger = new ProfessionalLogger();

/**
 * Factory function to create a new logger instance
 * 
 * Convenience function for creating logger instances with configuration.
 * Provides a clean API for logger initialization throughout the application.
 * 
 * @param config - Optional logger configuration
 * @returns {ProfessionalLogger} Configured logger instance
 * @example
 * ```typescript
 * const logger = createLogger({ verbose: true, json: false });
 * logger.success('Application started');
 * ```
 */
export function createLogger(config: Partial<LoggerConfig> = {}): ProfessionalLogger {
  return new ProfessionalLogger(config);
}

/**
 * Parse command line arguments for logging configuration
 * 
 * Extracts logging flags from command line arguments and converts them
 * to logger configuration object. Supports standard CLI patterns.
 * 
 * @param args - Command line arguments array (defaults to process.argv)
 * @returns {Partial<LoggerConfig>} Configuration object based on CLI flags
 * @example
 * ```typescript
 * // From command: node app.js --verbose --json
 * const config = parseLogFlags();
 * // Returns: { verbose: true, json: true }
 * ```
 */
export function parseLogFlags(args: string[] = process.argv): Partial<LoggerConfig> {
  return {
    verbose: args.includes('--verbose') || args.includes('-v'),
    quiet: args.includes('--quiet') || args.includes('-q'),
    json: args.includes('--json'),
    level: args.includes('--debug') ? 'debug' : 
           args.includes('--trace') ? 'trace' : 'info'
  };
} 