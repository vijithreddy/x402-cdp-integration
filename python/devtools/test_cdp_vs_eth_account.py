#!/usr/bin/env python3
"""
Test CDP vs eth_account sign_typed_data return values
"""

import asyncio
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from client.core.cdp_signer import create_cdp_signer
from eth_account import Account
import json

async def test_signing_compatibility():
    """Test CDP vs eth_account signing compatibility"""
    
    print("🧪 Testing CDP vs eth_account signing compatibility")
    print("=" * 60)
    
    try:
        # Create CDP signer
        print("1. Creating CDP signer...")
        cdp_signer = await create_cdp_signer("test-client")
        print(f"   ✅ CDP signer created: {cdp_signer.address}")
        
        # Test data
        domain_data = {
            "name": "Test Domain",
            "version": "1",
            "chainId": 84532,
            "verifyingContract": "0x0000000000000000000000000000000000000000"
        }
        
        message_types = {
            "EIP712Domain": [
                {"name": "name", "type": "string"},
                {"name": "version", "type": "string"},
                {"name": "chainId", "type": "uint256"},
                {"name": "verifyingContract", "type": "address"}
            ],
            "TestMessage": [
                {"name": "message", "type": "string"}
            ]
        }
        
        message_data = {
            "message": "Hello X402!"
        }
        
        print("\n2. Testing CDP sign_typed_data...")
        try:
            cdp_result = cdp_signer.sign_typed_data(
                domain_data=domain_data,
                message_types=message_types,
                message_data=message_data
            )
            print(f"   ✅ CDP result type: {type(cdp_result)}")
            print(f"   ✅ CDP result: {cdp_result}")
            print(f"   ✅ CDP result length: {len(cdp_result)}")
            
            # Test JSON serialization
            try:
                json.dumps({"signature": cdp_result})
                print("   ✅ CDP result is JSON serializable")
            except Exception as e:
                print(f"   ❌ CDP result is NOT JSON serializable: {e}")
                
        except Exception as e:
            print(f"   ❌ CDP signing failed: {e}")
        
        print("\n3. Testing eth_account sign_typed_data...")
        try:
            # Create a dummy account for comparison
            eth_account = Account.create()
            
            eth_result = eth_account.sign_typed_data(
                domain_data=domain_data,
                message_types=message_types,
                message_data=message_data
            )
            print(f"   ✅ eth_account result type: {type(eth_result)}")
            print(f"   ✅ eth_account result: {eth_result}")
            print(f"   ✅ eth_account signature: {eth_result.signature.hex()}")
            
            # Test JSON serialization
            try:
                json.dumps({"signature": eth_result.signature.hex()})
                print("   ✅ eth_account result is JSON serializable")
            except Exception as e:
                print(f"   ❌ eth_account result is NOT JSON serializable: {e}")
                
        except Exception as e:
            print(f"   ❌ eth_account signing failed: {e}")
        
        print("\n4. Comparison:")
        print("   • CDP returns: string (hex signature)")
        print("   • eth_account returns: SignedMessage object")
        print("   • X402 expects: eth_account.SignedMessage object")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_signing_compatibility()) 