#!/usr/bin/env python3
"""
Test script to demonstrate CDP Signer functionality
"""

import sys
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent / "src"))

from shared.utils.wallet_manager import WalletManager
from client.core.cdp_signer import create_cdp_signer
import asyncio

async def test_cdp_signer():
    """Test the CDP signer implementation"""
    print("🧪 Testing CDP Signer Implementation")
    print("=" * 50)
    
    try:
        # Initialize wallet manager and ensure wallet is loaded
        wallet_manager = WalletManager()
        await wallet_manager.get_or_create_wallet()  # Ensure wallet is loaded
        wallet_info = await wallet_manager.get_wallet_info()
        
        if not wallet_info or not wallet_info.get('accounts'):
            print("❌ No wallet account found. Run setup.py first.")
            return
        
        account_info = wallet_info['accounts'][0]
        account_name = account_info['name']
        address = account_info['address']
        
        print(f"📱 Wallet Account: {account_name}")
        print(f"📍 Address: {address}")
        print()
        
        # Create CDP signer
        print("🔄 Creating CDP Signer...")
        cdp_signer = create_cdp_signer(account_name, address)
        
        print("✅ CDP Signer created successfully!")
        print(f"📍 Signer Address: {cdp_signer.address}")
        print(f"📝 Account Name: {cdp_signer.account_name}")
        print()
        
        # Test BaseAccount interface
        print("🔍 Testing BaseAccount Interface:")
        print(f"   • address property: {cdp_signer.address}")
        print(f"   • sign_message method: {hasattr(cdp_signer, 'sign_message')}")
        print(f"   • sign_transaction method: {hasattr(cdp_signer, 'sign_transaction')}")
        print(f"   • unsafe_sign_hash method: {hasattr(cdp_signer, 'unsafe_sign_hash')}")
        print()
        
        # Test signing methods (these will fail but show the interface)
        print("⚠️  Testing Signing Methods (Expected to fail):")
        
        try:
            # This will raise NotImplementedError
            cdp_signer.sign_message(None)
        except NotImplementedError as e:
            print(f"   ✅ sign_message: {str(e)}")
        
        try:
            # This will raise NotImplementedError
            cdp_signer.sign_transaction({})
        except NotImplementedError as e:
            print(f"   ✅ sign_transaction: {str(e)}")
        
        try:
            # This will raise NotImplementedError
            cdp_signer.unsafe_sign_hash(b'\x00' * 32)
        except NotImplementedError as e:
            print(f"   ✅ unsafe_sign_hash: {str(e)}")
        
        print()
        print("🎯 CDP Signer Status Summary:")
        print("   ✅ BaseAccount interface implemented")
        print("   ✅ Address property works")
        print("   ❌ Signing methods not implemented (CDP limitation)")
        print("   ❌ X402 client requires working signing methods")
        print()
        print("💡 This demonstrates the approach for X402 integration:")
        print("   1. CDP signer implements the required interface")
        print("   2. Signing methods need CDP-specific implementation")
        print("   3. Shows the path forward for full integration")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_cdp_signer()) 