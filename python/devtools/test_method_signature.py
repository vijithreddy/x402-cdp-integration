#!/usr/bin/env python3
"""
Test CDP method signature
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from dotenv import load_dotenv
load_dotenv()

import asyncio
import inspect
from cdp import CdpClient
from src.shared.config import get_cdp_config

async def test_method_signature():
    """Test the actual method signature"""
    
    print("🔍 Testing CDP method signature")
    print("=" * 40)
    
    try:
        config = get_cdp_config()
        async with CdpClient(
            api_key_id=config.api_key_id,
            api_key_secret=config.api_key_secret,
            wallet_secret=config.wallet_secret
        ) as cdp:
            # Get account
            account = await cdp.evm.get_account('0x02998Da7aD2C929A22E66F9A4a4cFF90c8994B51')
            
            print(f"✅ Account loaded: {account.address}")
            print()
            
            # Check method signature
            print("📋 Method signature:")
            sig = inspect.signature(account.sign_typed_data)
            print(f"   {sig}")
            print()
            
            # Check method doc
            print("📖 Method doc:")
            doc = account.sign_typed_data.__doc__
            if doc:
                print(f"   {doc}")
            else:
                print("   No docstring")
            print()
            
            # Test both parameter styles
            print("🧪 Testing parameter styles...")
            
            domain = {"name": "Test", "version": "1", "chainId": 84532, "verifyingContract": "0x0000000000000000000000000000000000000000"}
            types = {"EIP712Domain": [{"name": "name", "type": "string"}]}
            message = {"name": "test"}
            
            # Try old style (what worked in our test)
            print("1. Trying old style (domain, types, primary_type, message)...")
            try:
                result1 = await account.sign_typed_data(
                    domain=domain,
                    types=types,
                    primary_type="Test",
                    message=message
                )
                print("   ✅ Old style works!")
                print(f"   Result type: {type(result1)}")
            except Exception as e:
                print(f"   ❌ Old style failed: {e}")
            
            # Try new style (what CDP SDK shows)
            print("2. Trying new style (domain_data, message_types, message_data)...")
            try:
                result2 = await account.sign_typed_data(
                    domain_data=domain,
                    message_types=types,
                    message_data=message
                )
                print("   ✅ New style works!")
                print(f"   Result type: {type(result2)}")
            except Exception as e:
                print(f"   ❌ New style failed: {e}")
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_method_signature()) 