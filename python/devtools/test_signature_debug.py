#!/usr/bin/env python3
"""
Debug CDP signature format
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

# Load environment variables first
from dotenv import load_dotenv
load_dotenv()

import asyncio
import json
from cdp import CdpClient
from src.shared.config import get_cdp_config

async def debug_signature():
    """Debug CDP signature format"""
    
    print("🔍 DEBUG: CDP Signature Format")
    print("=" * 50)
    
    # Load wallet data
    try:
        with open('wallet-data.json', 'r') as f:
            wallet_data = json.load(f)
        
        wallet_address = wallet_data.get('defaultAddress')
        if not wallet_address:
            print("❌ No wallet address found in wallet-data.json")
            return
        
        print(f"📱 Using wallet: {wallet_address}")
        
    except Exception as e:
        print(f"❌ Failed to load wallet: {e}")
        return
    
    # Initialize CDP client
    try:
        config = get_cdp_config()
        async with CdpClient(
            api_key_id=config.api_key_id,
            api_key_secret=config.api_key_secret,
            wallet_secret=config.wallet_secret
        ) as cdp:
            account = await cdp.evm.get_account(wallet_address)
            print("✅ CDP account loaded")
            
            # Test signature
            domain = {
                "name": "X402 Payment",
                "version": "1",
                "chainId": 84532,
                "verifyingContract": "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
            }
            
            types = {
                "EIP712Domain": [
                    {"name": "name", "type": "string"},
                    {"name": "version", "type": "string"},
                    {"name": "chainId", "type": "uint256"},
                    {"name": "verifyingContract", "type": "address"}
                ],
                "Payment": [
                    {"name": "amount", "type": "uint256"},
                    {"name": "recipient", "type": "address"},
                    {"name": "resource", "type": "string"},
                    {"name": "deadline", "type": "uint256"}
                ]
            }
            
            message = {
                "amount": "10000",
                "recipient": "0x542C09793380BD873734d63Dc9f18aab6920C21B",
                "resource": "http://localhost:5001/protected",
                "deadline": "1750313204"
            }
            
            print("\n🔍 Signing test data...")
            print(f"Domain: {json.dumps(domain, indent=2)}")
            print(f"Types: {json.dumps(types, indent=2)}")
            print(f"Message: {json.dumps(message, indent=2)}")
            
            # Sign the data
            signature_obj = await account.sign_typed_data(
                domain=domain, 
                types=types, 
                primary_type="Payment", 
                message=message
            )
            
            print(f"\n🎯 Raw signature object: {signature_obj}")
            print(f"Type: {type(signature_obj)}")
            
            # Try different ways to extract signature
            if isinstance(signature_obj, dict):
                print(f"\n📋 Signature object keys: {list(signature_obj.keys())}")
                for key, value in signature_obj.items():
                    print(f"  {key}: {value} (type: {type(value)})")
                    
                # Try different signature fields
                signature = signature_obj.get('signature') or signature_obj.get('signatureHex') or signature_obj.get('r') + signature_obj.get('s') + signature_obj.get('v')
                print(f"\n🔑 Extracted signature: {signature}")
            else:
                print(f"\n🔑 Direct signature: {signature_obj}")
                signature = signature_obj
            
            print(f"Signature length: {len(str(signature))}")
            print(f"Signature starts with 0x: {str(signature).startswith('0x')}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_signature()) 