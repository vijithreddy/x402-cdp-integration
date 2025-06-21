/**
 * Comprehensive Error Handling System
 * 
 * Defines specific error types for different failure modes in the X402 system.
 * Provides structured error handling with proper error codes and messages.
 */

/**
 * Base error class for X402 system
 */
export class X402BaseError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly timestamp: string;

  constructor(code: string, message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * AI Service specific errors
 */
export class AIServiceError extends X402BaseError {
  constructor(message: string, details?: any) {
    super('AI_SERVICE_ERROR', message, 503, details);
  }
}

export class AIServiceTimeoutError extends X402BaseError {
  constructor(timeout: number = 30000) {
    super('AI_SERVICE_TIMEOUT', `AI service request timed out after ${timeout}ms`, 504, { timeout });
  }
}

export class AIServiceUnavailableError extends X402BaseError {
  constructor() {
    super('AI_SERVICE_UNAVAILABLE', 'AI service is currently unavailable', 503);
  }
}

export class AIMarketDataError extends X402BaseError {
  constructor(message: string, details?: any) {
    super('AI_MARKET_DATA_ERROR', message, 503, details);
  }
}

/**
 * Payment specific errors
 */
export class PaymentError extends X402BaseError {
  constructor(message: string, details?: any) {
    super('PAYMENT_ERROR', message, 402, details);
  }
}

export class PaymentTimeoutError extends X402BaseError {
  constructor(timeout: number = 60000) {
    super('PAYMENT_TIMEOUT', `Payment request timed out after ${timeout}ms`, 408, { timeout });
  }
}

export class PaymentValidationError extends X402BaseError {
  constructor(message: string, details?: any) {
    super('PAYMENT_VALIDATION_ERROR', message, 400, details);
  }
}

export class InsufficientBalanceError extends X402BaseError {
  constructor(required: string, available: string) {
    super('INSUFFICIENT_BALANCE', `Insufficient balance. Required: ${required}, Available: ${available}`, 402, { required, available });
  }
}

/**
 * Configuration errors
 */
export class ConfigurationError extends X402BaseError {
  constructor(message: string, details?: any) {
    super('CONFIGURATION_ERROR', message, 500, details);
  }
}

export class MissingEnvironmentError extends X402BaseError {
  constructor(missingVars: string[]) {
    super('MISSING_ENVIRONMENT', `Missing required environment variables: ${missingVars.join(', ')}`, 500, { missingVars });
  }
}

/**
 * Network and connection errors
 */
export class NetworkError extends X402BaseError {
  constructor(message: string, details?: any) {
    super('NETWORK_ERROR', message, 503, details);
  }
}

export class ConnectionRefusedError extends X402BaseError {
  constructor(service: string, host: string, port: number) {
    super('CONNECTION_REFUSED', `Connection refused to ${service} at ${host}:${port}`, 503, { service, host, port });
  }
}

/**
 * Wallet and CDP errors
 */
export class WalletError extends X402BaseError {
  constructor(message: string, details?: any) {
    super('WALLET_ERROR', message, 500, details);
  }
}

export class CDPError extends X402BaseError {
  constructor(message: string, details?: any) {
    super('CDP_ERROR', message, 500, details);
  }
}

/**
 * Content and response errors
 */
export class ContentError extends X402BaseError {
  constructor(message: string, details?: any) {
    super('CONTENT_ERROR', message, 500, details);
  }
}

export class ResponseParseError extends X402BaseError {
  constructor(message: string, details?: any) {
    super('RESPONSE_PARSE_ERROR', message, 500, details);
  }
}

/**
 * Error factory for creating specific error types
 */
export class ErrorFactory {
  /**
   * Create AI service error based on the specific failure
   */
  static createAIServiceError(error: any): AIServiceError {
    if (error.code === 'ECONNREFUSED') {
      return new ConnectionRefusedError('AI Service', 'localhost', 8001);
    }
    if (error.code === 'ETIMEDOUT') {
      return new AIServiceTimeoutError();
    }
    if (error.response?.status === 503) {
      return new AIServiceUnavailableError();
    }
    return new AIServiceError(error.message || 'Unknown AI service error', error);
  }

  /**
   * Create payment error based on the specific failure
   */
  static createPaymentError(error: any): PaymentError {
    if (error.code === 'ETIMEDOUT') {
      return new PaymentTimeoutError();
    }
    if (error.response?.status === 402) {
      return new PaymentValidationError('Payment required but validation failed', error.response?.data);
    }
    return new PaymentError(error.message || 'Unknown payment error', error);
  }

  /**
   * Create network error based on the specific failure
   */
  static createNetworkError(error: any): NetworkError {
    if (error.code === 'ECONNREFUSED') {
      return new ConnectionRefusedError('Server', 'localhost', 5002);
    }
    if (error.code === 'ENOTFOUND') {
      return new NetworkError('Service not found', { code: error.code, hostname: error.hostname });
    }
    return new NetworkError(error.message || 'Unknown network error', error);
  }
}

/**
 * Error handler utility functions
 */
export class ErrorHandler {
  /**
   * Log error with appropriate level and context
   */
  static logError(error: X402BaseError, context?: any): void {
    const logData = {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      timestamp: error.timestamp,
      details: error.details,
      context
    };

    if (error.statusCode >= 500) {
      console.error('❌ System Error:', logData);
    } else if (error.statusCode >= 400) {
      console.warn('⚠️ Client Error:', logData);
    } else {
      console.info('ℹ️ Info:', logData);
    }
  }

  /**
   * Format error for user display
   */
  static formatForUser(error: X402BaseError): string {
    const userMessages: Record<string, string> = {
      'AI_SERVICE_UNAVAILABLE': '🤖 AI service is temporarily unavailable. Using fallback content.',
      'AI_SERVICE_TIMEOUT': '⏰ AI service is taking longer than expected. Please try again.',
      'INSUFFICIENT_BALANCE': '💰 Insufficient balance. Please fund your wallet.',
      'PAYMENT_TIMEOUT': '⏰ Payment is taking longer than expected. Please try again.',
      'CONNECTION_REFUSED': '🌐 Unable to connect to server. Please check if the server is running.',
      'MISSING_ENVIRONMENT': '⚙️ Configuration error. Please check your environment setup.'
    };

    return userMessages[error.code] || `❌ ${error.message}`;
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(error: X402BaseError): boolean {
    const retryableCodes = [
      'AI_SERVICE_TIMEOUT',
      'PAYMENT_TIMEOUT',
      'NETWORK_ERROR',
      'CONNECTION_REFUSED'
    ];
    return retryableCodes.includes(error.code);
  }
} 