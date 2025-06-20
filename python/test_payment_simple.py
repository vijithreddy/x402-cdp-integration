#!/usr/bin/env python3
"""
Simple X402 payment test using CDP account
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
from src.client.core.custom_x402_client import CustomX402Client
from src.shared.config import get_cdp_config
import inspect

class CDPSigner:
    """Wrapper for CDP account to provide consistent interface"""
    
    def __init__(self, account):
        self.account = account
        self.address = getattr(account, "address", None)

    async def sign_typed_data(self, domain, types, primary_type, message):
        """Sign typed data using CDP account"""
        if inspect.iscoroutinefunction(self.account.sign_typed_data):
            return await self.account.sign_typed_data(
                domain=domain,
                types=types,
                primary_type=primary_type,
                message=message
            )
        else:
            # fallback for sync CDP account
            return self.account.sign_typed_data(
                domain=domain,
                types=types,
                primary_type=primary_type,
                message=message
            )

async def test_payment():
    """Test X402 payment to protected endpoint using CDP account"""
    print("🔄 Testing X402 payment to: http://localhost:5001/protected")
    
    try:
        # Load wallet configuration
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

    try:
        # Initialize CDP client and account
        config = get_cdp_config()
        async with CdpClient(
            api_key_id=config.api_key_id,
            api_key_secret=config.api_key_secret,
            wallet_secret=config.wallet_secret
        ) as cdp:
            account = await cdp.evm.get_account(wallet_address)
            print("✅ CDP signer initialized")
            print(f"🔍 CDP Signer Status:")
            print(f"   • Address: {getattr(account, 'address', None)}")
            print(f"   • Account Type: CDP Account")
            print(f"   • Interface: sign_typed_data (EIP-712)")
            
            # Create signer wrapper and X402 client
            signer = CDPSigner(account)
            x402_client = CustomX402Client(signer)
            
            print("\n💸 Sending X402 payment with custom client...")
            result = await x402_client.make_payment_request(
                url="http://localhost:5001/protected",
                amount="10000"
            )
            
    except Exception as e:
        print(f"❌ Failed to initialize CDP signer or send payment: {e}")
        import traceback
        traceback.print_exc()
        return

    # Handle result
    if result["success"]:
        print("✅ Payment successful!")
        print(f"📄 Response: {json.dumps(result['data'], indent=2)}")
    else:
        print(f"❌ Payment failed: {result['status_code']}")
        print(f"🔍 Error: {result.get('error', 'Unknown error')}")
        if 'details' in result:
            print(f"📋 Details: {json.dumps(result['details'], indent=2)}")

if __name__ == "__main__":
    asyncio.run(test_payment()) 