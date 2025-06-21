#!/usr/bin/env python3
"""
Setup script for X402 CDP Integration
Creates client and server wallets, funds the client, and updates server config
"""

import asyncio
import json
from pathlib import Path
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables from root .env file
root_env_path = Path(__file__).parent.parent / '.env'
if root_env_path.exists():
    load_dotenv(root_env_path)

from src.shared.utils.wallet_manager import WalletManager
from src.shared.utils.logger import X402Logger
from src.shared.config import get_cdp_config
from cdp import CdpClient

logger = X402Logger(__name__)

async def create_client_wallet(wallet_manager: WalletManager, filename: str):
    logger.info("Creating client wallet...")
    account = await wallet_manager.get_or_create_wallet()
    logger.success(f"Client wallet created/loaded", {"address": account['address']})

    wallet_info = await wallet_manager.get_wallet_info()
    if wallet_info:
        wallet_data = {
            "id": wallet_info["id"],
            "defaultAddress": wallet_info["defaultAddress"],
            "addresses": wallet_info["addresses"],
            "accounts": [{
                "address": account["address"],
                "name": account["name"]
            }]
        }
        filepath = Path.cwd() / filename
        with open(filepath, 'w') as f:
            json.dump(wallet_data, f, indent=2)
        logger.debug("Wallet data saved", {"filename": filename, "addressCount": len(wallet_info["addresses"])})

    balance = await wallet_manager.get_usdc_balance()
    logger.info(f"Client wallet balance: {balance} USDC")
    return {"address": account["address"], "balance": balance}

async def create_server_wallet(config, filename: str):
    logger.info("Creating server wallet...")
    async with CdpClient(
        api_key_id=config.api_key_id,
        api_key_secret=config.api_key_secret,
        wallet_secret=config.wallet_secret
    ) as cdp:
        unique_name = f"CDP-Server-Account-{int(datetime.now().timestamp())}"
        account = await cdp.evm.create_account(name=unique_name)
        logger.success("Server account created", {"address": account.address})
        wallet_data = {
            "id": account.address,
            "defaultAddress": account.address,
            "addresses": [account.address],
            "accounts": [{
                "address": account.address,
                "name": unique_name
            }]
        }
        filepath = Path.cwd() / filename
        with open(filepath, 'w') as f:
            json.dump(wallet_data, f, indent=2)
        logger.debug("Server wallet data saved", {"filename": filename})
        logger.info("Server wallet ready", {"balance": "0 USDC", "role": "payment receiver"})
        return {"address": account.address, "balance": 0}

async def fund_client_wallet(wallet_manager: WalletManager, amount: float = 5.0):
    logger.info(f"Funding client wallet with {amount} USDC...")
    success = await wallet_manager.fund_wallet(amount)
    if success:
        logger.success("Client wallet funding successful")
        # Wait for balance to update
        await wait_for_balance_update(wallet_manager, amount)
    else:
        logger.error("Client wallet funding failed")
    return success

async def wait_for_balance_update(wallet_manager: WalletManager, expected_amount: float, max_retries: int = 5, delay: int = 2):
    """Wait for the balance to update after funding"""
    logger.info("Waiting for balance to update...")
    
    for attempt in range(max_retries):
        await asyncio.sleep(delay)
        balance = await wallet_manager.get_usdc_balance()
        logger.info(f"Balance check attempt {attempt + 1}: {balance} USDC")
        
        if balance >= expected_amount:
            logger.success(f"Balance updated successfully: {balance} USDC")
            return balance
    
    logger.warning(f"Balance may not have updated fully after {max_retries} attempts")
    final_balance = await wallet_manager.get_usdc_balance()
    logger.info(f"Final balance: {final_balance} USDC")
    return final_balance

async def main():
    logger.info("X402 Python Setup - Initializing wallets and configuration")
    try:
        config = get_cdp_config()
        wallet_manager = WalletManager()
        # Step 1: Create client wallet
        logger.info("📱 Step 1: Creating Client Wallet")
        client_wallet = await create_client_wallet(wallet_manager, "wallet-data.json")
        # Step 2: Create server wallet
        logger.info("\n🖥️  Step 2: Creating Server Wallet")
        server_wallet = await create_server_wallet(config, "server-wallet-data.json")
        # Step 3: Fund client wallet
        logger.info("\n💰 Step 3: Funding Client Wallet")
        await fund_client_wallet(wallet_manager, 5)
        # Step 4: Setup summary
        logger.info("X402-CDP Integration Setup Complete!")
        logger.info("═══════════════════════════════════════════════════════════")
        logger.info("🎉 Your wallets are ready for X402 payments!")
        logger.info("═══════════════════════════════════════════════════════════")
        logger.info(f"📱 Client Wallet: {client_wallet['address']}")
        logger.info(f"🖥️  Server Wallet: {server_wallet['address']}")
        logger.info("💰 Client Balance: Check with 'python3 client.py' → 'balance'")
        logger.info("")
        logger.success("Ready to test X402 payments!")
        logger.info("")
        logger.info("Next steps:")
        logger.info("1. Start the server: python3 server.py")
        logger.info("2. Start the client: python3 client.py")
        logger.info("3. Test balance: type 'balance'")
        logger.info("4. Test payment: type 'fund' to get USDC")
        logger.info("")
    except Exception as e:
        logger.error(f"Setup failed: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main()) 