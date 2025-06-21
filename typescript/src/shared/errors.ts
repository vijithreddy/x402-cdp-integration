/**
 * X402 Error Types and Utilities
 * 
 * Centralized error handling for the X402-CDP integration.
 * Makes error handling consistent across the application.
 */

/**
 * Base error class for X402-related errors
 */
export class X402Error extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 402,
    public details?: any
  ) {
    super(message);
    this.name = 'X402Error';
  }
}

/**
 * Payment-specific errors
 */
export class PaymentError extends X402Error {
  constructor(message: string, details?: any) {
    super(message, 'PAYMENT_ERROR', 402, details);
    this.name = 'PaymentError';
  }
}

/**
 * Wallet-specific errors
 */
export class WalletError extends X402Error {
  constructor(message: string, details?: any) {
    super(message, 'WALLET_ERROR', 500, details);
    this.name = 'WalletError';
  }
}

/**
 * Network-specific errors
 */
export class NetworkError extends X402Error {
  constructor(message: string, details?: any) {
    super(message, 'NETWORK_ERROR', 503, details);
    this.name = 'NetworkError';
  }
}

/**
 * Common error messages
 */
export const ErrorMessages = {
  PAYMENT: {
    INSUFFICIENT_BALANCE: 'Insufficient USDC balance for payment',
    PAYMENT_FAILED: 'Payment processing failed',
    INVALID_PAYMENT: 'Invalid payment data received',
    PAYMENT_TIMEOUT: 'Payment request timed out'
  } as const,
  WALLET: {
    NOT_FOUND: 'Wallet not found',
    INVALID_ADDRESS: 'Invalid wallet address',
    LOAD_FAILED: 'Failed to load wallet data',
    SAVE_FAILED: 'Failed to save wallet data'
  } as const,
  NETWORK: {
    CONNECTION_FAILED: 'Failed to connect to network',
    REQUEST_TIMEOUT: 'Network request timed out',
    INVALID_RESPONSE: 'Invalid response from network'
  } as const
} as const;

type ErrorType = keyof typeof ErrorMessages;
type ErrorCode<T extends ErrorType> = keyof typeof ErrorMessages[T];

/**
 * Helper function to create error objects
 */
export function createError<T extends ErrorType>(
  type: T,
  code: ErrorCode<T>,
  details?: any
): X402Error {
  const message = ErrorMessages[type][code] as string;
  
  switch (type) {
    case 'PAYMENT':
      return new PaymentError(message, details);
    case 'WALLET':
      return new WalletError(message, details);
    case 'NETWORK':
      return new NetworkError(message, details);
    default:
      return new X402Error('An unknown error occurred', 'UNKNOWN_ERROR', 500, details);
  }
} 