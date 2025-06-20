#!/usr/bin/env python3
"""
Test balance structure
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

async def test_balance_structure():
    """Test balance structure"""
    
    print("🔍 Testing balance structure")
    print("=" * 40)
    
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
            
            # Get token balances
            balances_result = await account.list_token_balances(network="base-sepolia")
            print(f"\nBalance data type: {type(balances_result)}")
            print(f"Balance data: {balances_result}")
            
            # Access the balances list
            balances = balances_result.balances
            print(f"\nBalances list type: {type(balances)}")
            print(f"Balances list: {balances}")
            
            if balances:
                print(f"\nFirst balance item type: {type(balances[0])}")
                print(f"First balance item: {balances[0]}")
                
                # Access token info
                token = balances[0].token
                amount = balances[0].amount
                
                print(f"\nToken contract: {token.contract_address}")
                print(f"Token symbol: {token.symbol}")
                print(f"Token network: {token.network}")
                print(f"Amount: {amount.amount}")
                print(f"Decimals: {amount.decimals}")
                
                # Calculate actual USDC amount
                usdc_amount = amount.amount / (10 ** amount.decimals)
                print(f"USDC Balance: {usdc_amount} USDC")
                
                # Check if we have enough for payment (10000 wei = 0.01 USDC)
                required_amount = 0.01
                if usdc_amount >= required_amount:
                    print(f"✅ Sufficient USDC balance: {usdc_amount} >= {required_amount}")
                else:
                    print(f"❌ Insufficient USDC balance: {usdc_amount} < {required_amount}")
            else:
                print("❌ No balances found")
                
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_balance_structure()) 