#!/usr/bin/env python3
"""
X402 CDP Integration - Python CLI Client

Interactive command-line interface for testing X402 payments
"""

import sys
import os
from pathlib import Path

# Add the src directory to the Python path
current_dir = Path(__file__).parent
src_dir = current_dir.parent
sys.path.insert(0, str(src_dir))

from shared.utils.logger import logger
from shared.utils.wallet_manager import WalletManager
from client.core.cli import X402CLI

def main():
    """Main entry point for the CLI"""
    try:
        logger.info("🚀 X402 CDP Integration - Python CLI")
        logger.info("=" * 50)
        
        # Initialize wallet manager
        logger.info("🔄 Initializing wallet session...")
        wallet_manager = WalletManager()
        account = asyncio.run(wallet_manager.get_or_create_wallet())
        
        logger.success(f"✅ EVM account ready: {account['address']}")
        
        # Start CLI
        cli = X402CLI(wallet_manager)
        cli.cmdloop()
        
    except KeyboardInterrupt:
        logger.info("\n👋 Goodbye!")
    except Exception as e:
        logger.error("CLI failed", e)
        sys.exit(1)

if __name__ == "__main__":
    import asyncio
    main() 