#!/usr/bin/env python3
"""
Test X402 payment using official X402 Python library
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
from x402.clients.requests import x402_requests

async def test_official_x402():
    """Test X402 payment using official library"""
    
    print("🔄 Testing X402 payment with official library to: http://localhost:5001/protected")
    
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
            print(f"🔍 Account Address: {getattr(account, 'address', None)}")
            
            # Create X402 client using official library
            print("\n💸 Creating X402 client with official library...")
            
            # Use the official x402_requests function
            x402_client = x402_requests(account)
            
            print("✅ X402 client created with official library")
            print("\n💸 Making X402 request...")
            
            # Make request to protected endpoint
            response = await x402_client.get("http://localhost:5001/protected")
            
            print("✅ Request successful!")
            print(f"📄 Response status: {response.status_code}")
            print(f"📄 Response data: {json.dumps(response.json(), indent=2)}")
            
            # Check for X402 headers in response
            x402_headers = {k: v for k, v in response.headers.items() 
                          if 'x402' in k.lower() or 'payment' in k.lower()}
            
            if x402_headers:
                print("\n🔍 X402 Headers found:")
                for header, value in x402_headers.items():
                    print(f"   {header}: {value}")
                    
                    # Decode x-payment-response if present
                    if header.lower() == 'x-payment-response':
                        import base64
                        try:
                            decoded = base64.b64decode(value).decode()
                            payment_response = json.loads(decoded)
                            print(f"   Decoded: {json.dumps(payment_response, indent=2)}")
                        except Exception as e:
                            print(f"   Failed to decode: {e}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_official_x402()) 