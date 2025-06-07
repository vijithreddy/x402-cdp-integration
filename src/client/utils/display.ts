/**
 * Display Utilities for CLI Output
 * 
 * Provides consistent formatting and display functions for the CLI.
 * Centralizes all output logic for better maintainability.
 */

/**
 * Display the CLI welcome banner
 */
export function showWelcomeBanner(): void {
  console.log('🚀 CDP Wallet Interactive CLI');
  console.log('============================');
}

/**
 * Display available commands in a organized table
 */
export function showCommandSummary(): void {
  console.log('📖 Available Commands:');
  console.log('  balance, bal     - Check USDC balance');
  console.log('  fund [amount]    - Fund wallet with USDC');
  console.log('  test, x402       - Test X402 payment (alias to tier1)');
  console.log('  free             - Test free endpoint (no payment)');
  console.log('  tier1, basic     - Test X402 Basic Premium (~0.01 USDC)');
  console.log('  tier2, premium   - Test X402 Premium Plus (~0.1 USDC)');
  console.log('  tier3, enterprise- Test X402 Enterprise (~1.0 USDC)');
  console.log('  info, status     - Show wallet information');
  console.log('  refresh, reload  - Force refresh from blockchain');
  console.log('  clear, cls       - Clear the screen');
  console.log('  help, h          - Show detailed help');
  console.log('  exit, quit, q    - Exit the CLI');
  console.log('Type "help" for more details\n');
}

/**
 * Display detailed help information
 */
export function showDetailedHelp(): void {
  console.log('\n📖 Available Commands:');
  console.log('===================');
  console.log('  balance, bal     - Check USDC balance (cached when possible)');
  console.log('  fund [amount]    - Fund wallet with USDC (default: 5 USDC)');
  console.log('  test, x402       - Test X402 protected endpoint (alias to tier1)');
  console.log('  free             - Test free endpoint for comparison (no payment)');
  console.log('  tier1, basic     - Test X402 Basic Premium tier (~0.01 USDC)');
  console.log('  tier2, premium   - Test X402 Premium Plus tier (~0.1 USDC)');
  console.log('  tier3, enterprise- Test X402 Enterprise tier (~1.0 USDC)');
  console.log('  info, status     - Show wallet information');
  console.log('  refresh, reload  - Force refresh cache from blockchain');
  console.log('  clear, cls       - Clear the screen');
  console.log('  help, h          - Show this help message');
  console.log('  exit, quit, q    - Exit the CLI');
  console.log('');
}

/**
 * Display balance information with status indicators
 */
export function displayBalance(balance: number): void {
  console.log(`\n📊 Balance Summary:`);
  console.log(`   USDC on Base Sepolia: ${balance} USDC`);
  
  if (balance >= 5) {
    console.log('   ✅ Sufficient funds for testing');
  } else {
    console.log('   ⚠️ Consider funding wallet for testing');
    console.log('   💡 Type "fund" to add more USDC');
  }
  console.log('');
}

/**
 * Display wallet information in organized format
 */
export function displayWalletInfo(walletInfo: any, balance: number, isActive: boolean): void {
  console.log('\n📊 Wallet Information:');
  console.log('=====================');
  console.log(`   ID: ${walletInfo.id}`);
  console.log(`   Default Address: ${walletInfo.defaultAddress}`);
  console.log(`   Total Addresses: ${walletInfo.addresses.length}`);
  console.log(`   Current Balance: ${balance} USDC`);
  console.log(`   Session Status: ${isActive ? '🟢 Active' : '🔴 Inactive'}`);
  console.log('');
}

/**
 * Display funding operation result
 */
export function displayFundingResult(success: boolean, amount: number): void {
  if (success) {
    console.log('✅ Funding operation completed!');
  } else {
    console.log('❌ Funding operation failed.');
  }
  console.log('');
}

/**
 * Display error message with context
 */
export function displayError(message: string, error?: any): void {
  console.error(`❌ ${message}`, error ? ':' : '');
  if (error) {
    console.error(error);
  }
}

/**
 * Display success message
 */
export function displaySuccess(message: string): void {
  console.log(`✅ ${message}`);
}

/**
 * Display warning message
 */
export function displayWarning(message: string): void {
  console.log(`⚠️ ${message}`);
}

/**
 * Display info message
 */
export function displayInfo(message: string): void {
  console.log(`ℹ️ ${message}`);
}

/**
 * Clear the console screen
 */
export function clearScreen(): void {
  console.clear();
} 