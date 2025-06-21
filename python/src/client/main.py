#!/usr/bin/env python3
"""
X402 CDP Integration - Python CLI Client

Interactive command-line interface for testing X402 payments
"""

import sys
import os
import logging
from pathlib import Path

# Add the src directory to the Python path
current_dir = Path(__file__).parent
src_dir = current_dir.parent
sys.path.insert(0, str(src_dir))

from shared.utils.logger import logger
from shared.utils.wallet_manager import WalletManager
from shared.config import config
from client.core.cli import X402CLI

def setup_client_logging():
    """Setup logging for the client based on config"""
    client_config = config.get_client_config("python")
    log_level_name = client_config.get("log_level", "INFO")
    verbose = client_config.get("verbose", False)
    
    # Convert string log level to logging constant
    log_level_map = {
        "DEBUG": logging.DEBUG,
        "INFO": logging.INFO,
        "WARNING": logging.WARNING,
        "ERROR": logging.ERROR
    }
    log_level = log_level_map.get(log_level_name.upper(), logging.INFO)
    
    # If verbose is True, use DEBUG level
    if verbose:
        log_level = logging.DEBUG
    
    logging.basicConfig(level=log_level)
    logger.info(f"🔧 Client logging configured at level: {log_level_name}")

def main():
    """Main entry point for the CLI"""
    try:
        # Setup logging from config
        setup_client_logging()
        
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