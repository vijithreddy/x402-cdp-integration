"""
CDP Signer for X402 Integration

This module provides a function to get an EvmLocalAccount from the CDP SDK,
which is compatible with eth_account and X402 client libraries.
"""

import asyncio
from cdp import CdpClient
from cdp.evm_local_account import EvmLocalAccount
from src.shared.config import get_cdp_config
from src.shared.utils.logger import logger

async def get_cdp_local_account(account_name: str) -> EvmLocalAccount:
    """
    Get a CDP EvmLocalAccount for X402 integration
    Args:
        account_name: Name of the CDP account
    Returns:
        EvmLocalAccount instance compatible with eth_account
    """
    config = get_cdp_config()
    cdp_client = CdpClient(
        api_key_id=config.api_key_id,
        api_key_secret=config.api_key_secret,
        wallet_secret=config.wallet_secret
    )
    account = await cdp_client.evm.get_or_create_account(name=account_name)
    return EvmLocalAccount(account)

def get_cdp_local_account_sync(account_name: str) -> EvmLocalAccount:
    """
    Synchronous version for CLI usage
    """
    return asyncio.run(get_cdp_local_account(account_name)) 