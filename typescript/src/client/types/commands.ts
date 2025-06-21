/**
 * CLI Command Types and Interfaces
 * 
 * Defines the structure for CLI commands, responses, and session management.
 * Provides type safety and clear contracts for the command system.
 */

import type { WalletManager } from '../../shared/utils/walletManager';

/**
 * Base interface for all CLI commands
 */
export interface CLICommand {
  name: string;
  aliases: string[];
  description: string;
  usage?: string;
  execute(args: string[], context: CommandContext): Promise<void>;
}

/**
 * Command execution context
 */
export interface CommandContext {
  walletManager: WalletManager;
  isSessionActive: boolean;
  exit: () => void;
}

/**
 * Command result for consistent responses
 */
export interface CommandResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

/**
 * CLI session configuration
 */
export interface CLISession {
  walletManager: WalletManager | null;
  isActive: boolean;
  startTime: Date;
}

/**
 * Available command names for type safety
 */
export type CommandName = 
  | 'help' | 'h'
  | 'balance' | 'bal'
  | 'fund'
  | 'info' | 'status'
  | 'refresh' | 'reload'
  | 'test' | 'x402'
  | 'free'
  | 'clear' | 'cls'
  | 'exit' | 'quit' | 'q';

/**
 * Command categories for help organization
 */
export enum CommandCategory {
  WALLET = 'Wallet Operations',
  TESTING = 'X402 Testing',
  SYSTEM = 'System Commands',
  HELP = 'Help & Information'
} 