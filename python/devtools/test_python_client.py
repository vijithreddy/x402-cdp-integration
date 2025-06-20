#!/usr/bin/env python3
"""
Test Python Client with Fixed Server
"""

import asyncio
import json
import base64
import requests
from src.client.core.custom_x402_client import CustomX402Client
from src.shared.config import get_cdp_config

async def test_python_client():
    print("🔍 Testing Python Client with Fixed Server")
    print("=" * 60)
    
    try:
        # Load configuration
        config = get_cdp_config()
        print("✅ Configuration loaded")
        
        # Create X402 client
        client = CustomX402Client(
            base_url="http://localhost:5001",
            cdp_api_key_id=config.api_key_id,
            cdp_api_key_secret=config.api_key_secret,
            cdp_wallet_secret=config.wallet_secret
        )
        print("✅ X402 client created")
        
        # Test protected endpoint
        print("\n🔄 Testing /protected endpoint...")
        response = await client.get_protected()
        
        print("\n🎉 SUCCESS! Request completed successfully!")
        print(f"📄 Status: {response.status_code}")
        print(f"📄 Response: {response.json()}")
        
    except Exception as e:
        print(f"\n❌ Request failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_python_client()) 