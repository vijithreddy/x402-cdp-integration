/**
 * Command Registry and Router
 * 
 * Centralized registry for all CLI commands with routing and help generation.
 * Makes it easy to add new commands and maintain consistent behavior.
 */

import type { CLICommand, CommandContext } from '../types/commands';
import { clearScreen } from '../utils/display';

// Import all command modules
import { helpCommand } from '../commands/help';
import { balanceCommand } from '../commands/balance';
import { fundCommand } from '../commands/fund';
import { infoCommand } from '../commands/info';
import { x402Command } from '../commands/x402';
import { freeCommand } from '../commands/free';
// Import X402 tier commands
import { tier1Command } from '../commands/x402/tier1';
import { tier2Command } from '../commands/x402/tier2';
import { tier3Command } from '../commands/x402/tier3';

/**
 * Registry of all available commands
 */
const commandRegistry: CLICommand[] = [
  helpCommand,
  balanceCommand,
  fundCommand,
  infoCommand,
  x402Command,
  freeCommand,
  // X402 payment tier commands
  tier1Command,
  tier2Command,
  tier3Command
];

/**
 * Command router that handles command parsing and execution
 */
export class CommandRouter {
  private commands: Map<string, CLICommand> = new Map();

  constructor() {
    this.registerCommands();
  }

  /**
   * Register all commands and their aliases
   */
  private registerCommands(): void {
    for (const command of commandRegistry) {
      // Register primary command name
      this.commands.set(command.name, command);
      
      // Register all aliases
      for (const alias of command.aliases) {
        this.commands.set(alias, command);
      }
    }
  }

  /**
   * Execute a command with given arguments
   * 
   * @param input - Raw command input from user
   * @param context - Command execution context
   */
  async executeCommand(input: string, context: CommandContext): Promise<void> {
    const [commandName, ...args] = input.split(' ');

    try {
      // Handle special built-in commands
      if (this.handleBuiltinCommands(commandName, context)) {
        return;
      }

      // Find and execute registered command
      const command = this.commands.get(commandName.toLowerCase());
      if (command) {
        await command.execute(args, context);
      } else if (commandName !== '') {
        console.log(`❌ Unknown command: "${commandName}". Type "help" for available commands.`);
      }
    } catch (error) {
      console.error(`❌ Error executing command "${commandName}":`, error);
    }
  }

  /**
   * Handle special built-in commands that don't need complex modules
   * 
   * @param commandName - Command to check
   * @param context - Execution context
   * @returns True if command was handled
   */
  private handleBuiltinCommands(commandName: string, context: CommandContext): boolean {
    switch (commandName.toLowerCase()) {
      case 'clear':
      case 'cls':
        clearScreen();
        return true;

      case 'refresh':
      case 'reload':
        this.handleRefresh(context);
        return true;

      case 'exit':
      case 'quit':
      case 'q':
        context.exit();
        return true;

      default:
        return false;
    }
  }

  /**
   * Handle refresh command
   */
  private async handleRefresh(context: CommandContext): Promise<void> {
    const { walletManager } = context;

    try {
      console.log('\n🔄 Force refreshing wallet state from blockchain...');
      
      // Force fresh balance check by invalidating cache first
      walletManager.invalidateBalanceCache();
      const balance = await walletManager.getUSDCBalance();
      
      console.log(`✅ Wallet state refreshed! Current balance: ${balance} USDC`);
      console.log('');
    } catch (error) {
      console.error('❌ Failed to refresh wallet state:', error);
    }
  }

  /**
   * Get list of all registered commands for help display
   */
  getAvailableCommands(): CLICommand[] {
    return commandRegistry;
  }
} 