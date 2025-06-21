"""
Tier 2 X402 Payment Command

Premium features with advanced analytics and real-time data.
"""

import time
import asyncio
import json
from cdp import CdpClient
from src.shared.utils.logger import logger
from src.shared.utils.wallet_manager import WalletManager
from src.shared.config import get_cdp_config, get_server_url, config as shared_config
from src.client.commands.x402 import (
    X402_ENDPOINTS, 
    validate_balance_for_x402, 
    display_premium_content, 
    handle_payment_completion, 
    handle_x402_error
)
from src.client.core.custom_x402_client import CustomX402Client, CDPSigner


async def tier2_command(wallet_manager: WalletManager):
    """
    Execute tier2 X402 payment command
    
    Args:
        wallet_manager: Wallet manager instance
    """
    start_time = time.time()
    config = X402_ENDPOINTS["tier2"]
    
    try:
        # Validate balance first
        balance = await validate_balance_for_x402(wallet_manager)
        if balance is None:
            return
        
        # Get wallet address
        wallet_address = wallet_manager.get_address()
        logger.ui(f"📱 Using wallet: {wallet_address}")
        
        # Get server URL from config
        server_url = get_server_url()
        
        # Initialize CDP client and account (same as test file)
        cdp_config = get_cdp_config()
        async with CdpClient(
            api_key_id=cdp_config.api_key_id,
            api_key_secret=cdp_config.api_key_secret,
            wallet_secret=cdp_config.wallet_secret
        ) as cdp:
            account = await cdp.evm.get_account(wallet_address)
            
            logger.ui("✅ CDP signer initialized")
            logger.ui(f"🔍 CDP Signer Status:")
            logger.ui(f"   • Address: {getattr(account, 'address', None)}")
            logger.ui(f"   • Account Type: CDP Account")
            logger.ui(f"   • Interface: sign_typed_data (EIP-712)")
            
            # Create signer wrapper and X402 client
            signer = CDPSigner(account)
            x402_client = CustomX402Client(account, cdp, shared_config)
            
            # Make request to premium endpoint
            logger.ui(f"💸 Making X402 payment to {config.tier_name}...")
            result = await x402_client.make_payment_request(
                url=f"{server_url}{config.endpoint}",
                amount="100000"  # 0.1 USDC in wei
            )
            
            if result["success"]:
                # Display premium content
                display_premium_content(result["data"], config)
                
                # Handle payment completion
                duration = f"{time.time() - start_time:.2f}"
                await handle_payment_completion(result["data"], account, duration, wallet_manager)
            else:
                logger.ui(f"❌ Payment failed: {result.get('error', 'Unknown error')}")
                if 'details' in result:
                    logger.ui(f"📋 Details: {result['details']}")
            
    except Exception as error:
        handle_x402_error(error, config) 