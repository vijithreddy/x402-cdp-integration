import winston from 'winston';

// Log levels for different types of information
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn', 
  INFO = 'info',
  FLOW = 'flow',    // Payment/process steps
  DEBUG = 'debug',  // Technical details
  TRACE = 'trace'   // Ultra-verbose
}

// Custom log types for X402 operations
export enum LogType {
  UI = 'UI',           // User interface messages
  FLOW = 'FLOW',       // Payment flow steps
  DEBUG = 'DEBUG',     // Technical debugging
  ERROR = 'ERROR',     // Error handling
  SYSTEM = 'SYSTEM'    // System operations
}

interface LoggerConfig {
  level: string;
  verbose: boolean;
  quiet: boolean;
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

class ProfessionalLogger {
  private winston: winston.Logger;
  private config: LoggerConfig;

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

  // User Interface - Clean, professional status updates
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

  // Flow - Payment/process steps (structured)
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

  // Debug - Technical details (verbose only)
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

  // Error - Failures with context
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

  // Success - Positive outcomes
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

  // Warning - Important but non-critical
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

  // Transaction - Payment-specific logging
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

  // Helper methods
  private formatFlowDetails(details: any): string {
    const parts: string[] = [];
    
    if (details.client) parts.push(`Client: ${this.shortenAddress(details.client)}`);
    if (details.amount) parts.push(`Amount: ${details.amount}`);
    if (details.status) parts.push(`Status: ${details.status}`);
    if (details.duration) parts.push(`(${details.duration}s)`);
    if (details.txHash) parts.push(`Tx: ${this.shortenHash(details.txHash)}`);
    
    return parts.join(' | ');
  }

  private shortenAddress(address: string): string {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  private shortenHash(hash: string): string {
    if (!hash || hash.length < 10) return hash;
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
  }

  // Header formatting for sections
  header(title: string, subtitle?: string): void {
    if (this.config.quiet || this.config.json) return;
    
    console.log(`${colors.bright}${colors.blue}${title}${colors.reset}`);
    if (subtitle) {
      console.log(`${colors.gray}${subtitle}${colors.reset}`);
    }
    console.log(`${colors.gray}${'='.repeat(Math.max(title.length, subtitle?.length || 0))}${colors.reset}`);
  }

  // Separator for visual organization
  separator(): void {
    if (this.config.quiet || this.config.json) return;
    console.log(`${colors.gray}${'─'.repeat(50)}${colors.reset}`);
  }

  // Update configuration
  updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.winston.level = this.config.verbose ? 'debug' : this.config.level;
  }
}

// Export singleton instance
export const logger = new ProfessionalLogger();

// Export factory for custom configurations
export function createLogger(config: Partial<LoggerConfig> = {}): ProfessionalLogger {
  return new ProfessionalLogger(config);
}

// Helper to parse CLI flags
export function parseLogFlags(args: string[] = process.argv): Partial<LoggerConfig> {
  return {
    verbose: args.includes('--verbose') || args.includes('-v'),
    quiet: args.includes('--quiet') || args.includes('-q'),
    json: args.includes('--json'),
    level: args.includes('--debug') ? 'debug' : 
           args.includes('--trace') ? 'trace' : 'info'
  };
} 