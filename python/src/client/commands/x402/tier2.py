"""
Tier 2 X402 Payment Command

Premium Plus features with advanced analytics and exclusive insights.
"""

import time
import asyncio
import inspect
from src.shared.utils.logger import logger
from src.shared.utils.wallet_manager import WalletManager
from src.client.commands.x402 import (
    X402_ENDPOINTS, 
    validate_balance_for_x402, 
    create_x402_client, 
    display_premium_content, 
    handle_payment_completion, 
    handle_x402_error
)
from cdp import CdpClient
from src.shared.config import get_cdp_config
from src.client.core.custom_x402_client import CustomX402Client


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
        
        # Initialize CDP client and account (same as working test)
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
            
            # Create signer wrapper and X402 client (same as working test)
            signer = CDPSigner(account)
            x402_client = CustomX402Client(signer)
            
            # Make request to protected endpoint
            logger.ui(f"💸 Making X402 payment to {config.tier_name}...")
            result = await x402_client.make_payment_request(
                url=f"http://localhost:5001{config.endpoint}",
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