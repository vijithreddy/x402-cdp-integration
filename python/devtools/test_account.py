#!/usr/bin/env python3
"""
Test script to check EvmServerAccount methods
"""

import asyncio
import sys
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent / "src"))

from src.shared.config import get_cdp_config
from cdp import CdpClient

async def test_account_methods():
    """Test what methods are available on EvmServerAccount"""
    config = get_cdp_config()
    
    async with CdpClient(
        api_key_id=config.api_key_id,
        api_key_secret=config.api_key_secret,
        wallet_secret=config.wallet_secret
    ) as cdp:
        account = await cdp.evm.get_or_create_account(name="TestAccount")
        
        print("Available methods on EvmServerAccount:")
        methods = [m for m in dir(account) if not m.startswith('_')]
        for method in sorted(methods):
            print(f"  - {method}")
        
        print(f"\nAccount address: {account.address}")
        print(f"Account name: {account.name}")

if __name__ == "__main__":
    asyncio.run(test_account_methods()) 