"""
Core CLI functionality for X402 CDP Integration
"""

import cmd
import asyncio
import json
from pathlib import Path
from typing import Dict, Any
from rich.console import Console
from rich.prompt import Prompt
from rich.table import Table
from src.shared.utils.logger import logger
from src.shared.utils.wallet_manager import WalletManager
from .commands import CommandRegistry
from .cdp_signer import get_cdp_local_account_sync
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..', 'src'))

console = Console()

class X402CLI(cmd.Cmd):
    """Interactive CLI for X402 CDP Integration"""
    
    intro = """
🚀 CDP Wallet Interactive CLI
============================
📖 Available Commands:
  balance, bal     - Check USDC balance
  fund [amount]    - Fund wallet with USDC
  info, status     - Show wallet information
  refresh, reload  - Force refresh from blockchain
  tier1, basic     - X402 Basic Premium (~0.01 USDC)
  tier2, premium   - X402 Premium Plus (~0.1 USDC)
  tier3, enterprise- X402 Enterprise (~1.0 USDC)
  free             - Access free content
  clear, cls       - Clear the screen
  help, h          - Show detailed help
  exit, quit, q    - Exit the CLI
Type "help" for more details
"""
    prompt = "cdp-wallet> "
    
    def __init__(self, wallet_manager: WalletManager):
        super().__init__()
        self.wallet_manager = wallet_manager
        self.command_registry = CommandRegistry(wallet_manager)
        self.server_url = "http://localhost:5001"
        self.cdp_signer = None
        
        # Set up command aliases
        self.command_aliases = {
            'bal': 'balance',
            'status': 'info',
            'reload': 'refresh',
            'cls': 'clear',
            'h': 'help',
            'q': 'exit',
            'quit': 'exit',
            'basic': 'tier1',
            'premium': 'tier2',
            'enterprise': 'tier3'
        }
    
    def _init_cdp_signer(self):
        """Initialize CDP signer for X402 integration"""
        try:
            if self.cdp_signer is None:
                # Get wallet info to create signer
                wallet_info = asyncio.run(self.wallet_manager.get_wallet_info())
                if not wallet_info or not wallet_info.get('accounts'):
                    console.print("❌ No wallet account found", style="red")
                    return False
                
                account_info = wallet_info['accounts'][0]
                account_name = account_info['name']
                
                # Use the official EvmLocalAccount wrapper
                self.cdp_signer = get_cdp_local_account_sync(account_name)
                console.print("✅ CDP signer initialized", style="green")
            
            return True
        except Exception as e:
            logger.error("Failed to initialize CDP signer", e)
            return False
    
    def default(self, line: str):
        """Handle unknown commands"""
        console.print(f"❌ Unknown command: {line}", style="red")
        console.print("Type 'help' for available commands", style="yellow")
    
    def do_balance(self, arg):
        """Check USDC balance"""
        try:
            # Run async operation
            balance = asyncio.run(self.wallet_manager.get_usdc_balance())
            console.print(f"💰 Current USDC balance: {balance} USDC", style="green")
        except Exception as e:
            logger.error("Failed to get balance", e)
    
    def do_fund(self, arg):
        """Fund wallet with USDC"""
        try:
            amount = 5.0  # Default amount
            if arg.strip():
                try:
                    amount = float(arg.strip())
                except ValueError:
                    console.print("❌ Invalid amount. Using default 5.0 USDC", style="red")
            
            console.print(f"🔄 Funding wallet with {amount} USDC...", style="yellow")
            
            # Run async operation
            success = asyncio.run(self.wallet_manager.fund_wallet(amount))
            
            if success:
                balance = asyncio.run(self.wallet_manager.get_usdc_balance())
                console.print(f"✅ Funding operation completed!", style="green")
                console.print(f"💰 New balance: {balance} USDC", style="green")
            else:
                console.print("❌ Funding operation failed", style="red")
                
        except Exception as e:
            logger.error("Failed to fund wallet", e)
    
    def do_tier1(self, arg):
        """X402 Basic Premium (~0.01 USDC)"""
        try:
            from src.client.commands.x402.tier1 import tier1_command
            import asyncio
            
            console.print("🎯 X402 Basic Premium", style="cyan")
            asyncio.run(tier1_command(self.wallet_manager))
            
        except Exception as e:
            logger.error("Failed to execute tier1 command", e)
            console.print(f"❌ Tier1 command failed: {e}", style="red")
    
    def do_tier2(self, arg):
        """X402 Premium Plus (~0.1 USDC)"""
        try:
            from src.client.commands.x402.tier2 import tier2_command
            import asyncio
            
            console.print("🎯 X402 Premium Plus", style="cyan")
            asyncio.run(tier2_command(self.wallet_manager))
            
        except Exception as e:
            logger.error("Failed to execute tier2 command", e)
            console.print(f"❌ Tier2 command failed: {e}", style="red")
    
    def do_tier3(self, arg):
        """X402 Enterprise (~1.0 USDC)"""
        try:
            from src.client.commands.x402.tier3 import tier3_command
            import asyncio
            
            console.print("🎯 X402 Enterprise", style="cyan")
            asyncio.run(tier3_command(self.wallet_manager))
            
        except Exception as e:
            logger.error("Failed to execute tier3 command", e)
            console.print(f"❌ Tier3 command failed: {e}", style="red")
    
    def do_free(self, arg):
        """Access free content"""
        try:
            import requests
            
            console.print("🎯 Accessing Free Content", style="cyan")
            
            response = requests.get("http://localhost:5001/free", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                console.print("✅ Free content accessed!", style="green")
                console.print(f"📄 {data.get('message', 'Free content')}", style="cyan")
            else:
                console.print(f"❌ Failed to access free content: {response.status_code}", style="red")
                
        except Exception as e:
            logger.error("Failed to access free content", e)
            console.print(f"❌ Free content access failed: {e}", style="red")
    
    def do_info(self, arg):
        """Show wallet information"""
        try:
            address = self.wallet_manager.get_address()
            
            # Run async operations
            balance = asyncio.run(self.wallet_manager.get_usdc_balance())
            wallet_info = asyncio.run(self.wallet_manager.get_wallet_info())
            
            table = Table(title="Wallet Information")
            table.add_column("Property", style="cyan")
            table.add_column("Value", style="green")
            
            table.add_row("Address", address)
            table.add_row("Balance", f"{balance} USDC")
            table.add_row("Network", "Base Sepolia")
            table.add_row("Status", "Active")
            table.add_row("Type", "CDP Accounts V2")
            
            if wallet_info and wallet_info.get('accounts'):
                account_name = wallet_info['accounts'][0]['name']
                table.add_row("Account Name", account_name)
            
            console.print(table)
            
        except Exception as e:
            logger.error("Failed to get wallet info", e)
    
    def do_refresh(self, arg):
        """Force refresh from blockchain"""
        try:
            console.print("🔄 Refreshing wallet data from blockchain...", style="yellow")
            
            # Run async operations to refresh
            balance = asyncio.run(self.wallet_manager.get_usdc_balance())
            wallet_info = asyncio.run(self.wallet_manager.get_wallet_info())
            
            console.print(f"✅ Refresh completed!", style="green")
            console.print(f"💰 Current balance: {balance} USDC", style="green")
            
            if wallet_info and wallet_info.get('accounts'):
                account_name = wallet_info['accounts'][0]['name']
                console.print(f"📝 Account: {account_name}", style="green")
                
        except Exception as e:
            logger.error("Failed to refresh wallet", e)
    
    def do_clear(self, arg):
        """Clear the screen"""
        console.clear()
        console.print(self.intro, style="cyan")
    
    def do_help(self, arg):
        """Show detailed help"""
        help_text = """
📖 **Available Commands**

**Wallet Management:**
  balance, bal     - Check USDC balance
  fund [amount]    - Fund wallet with USDC (default: 5.0)
  info, status     - Show wallet information
  refresh, reload  - Force refresh from blockchain

**X402 Premium Content:**
  tier1, basic     - X402 Basic Premium (~0.01 USDC)
                    Basic premium features with AI analysis and market data
  tier2, premium   - X402 Premium Plus (~0.1 USDC)
                    Advanced AI models, predictive analytics, and exclusive reports
  tier3, enterprise- X402 Enterprise (~1.0 USDC)
                    Enterprise analytics, institutional data, and custom insights
  free             - Access free content (no payment required)

**Utility:**
  clear, cls       - Clear the screen
  help, h          - Show this help message
  exit, quit, q    - Exit the CLI

**Examples:**
  balance          - Check current USDC balance
  fund             - Fund with 5.0 USDC
  fund 10          - Fund with 10.0 USDC
  tier1            - Access Basic Premium content
  tier2            - Access Premium Plus content
  tier3            - Access Enterprise content
  free             - Access free content
  info             - Show wallet details
  refresh          - Refresh data from blockchain

**X402 Payment Flow:**
  • Commands automatically check your balance
  • Payments are processed via X402 protocol
  • Dynamic pricing is discovered during requests
  • Balance is refreshed after successful payments
"""
        console.print(help_text, style="cyan")
    
    def do_exit(self, arg):
        """Exit the CLI"""
        console.print("👋 Saving session state and exiting...", style="yellow")
        logger.info("Session saved. Goodbye!")
        return True
    
    def emptyline(self):
        """Do nothing on empty line"""
        pass
    
    def preloop(self):
        """Called before the command loop starts"""
        logger.success("✅ Session initialized successfully!")
    
    def postloop(self):
        """Called after the command loop ends"""
        logger.info("Session cleanup completed")

    def onecmd(self, line: str):
        """Override to support command aliases"""
        if not line.strip():
            return self.emptyline()
        cmd, *args = line.strip().split(maxsplit=1)
        canonical = self.command_aliases.get(cmd, cmd)
        new_line = canonical
        if args:
            new_line += ' ' + args[0]
        return super().onecmd(new_line)

def main():
    from src.shared.utils.wallet_manager import WalletManager
    import asyncio
    
    # Initialize wallet manager and get/create wallet
    wallet_manager = WalletManager()
    
    # Initialize wallet account
    try:
        asyncio.run(wallet_manager.get_or_create_wallet())
        console.print("✅ Wallet initialized successfully!", style="green")
    except Exception as e:
        console.print(f"❌ Failed to initialize wallet: {e}", style="red")
        return
    
    cli = X402CLI(wallet_manager)
    cli.cmdloop()

if __name__ == "__main__" or __name__ == "src.client.core.cli":
    main() 