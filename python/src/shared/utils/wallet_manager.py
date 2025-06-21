"""
Wallet manager for CDP wallet operations
"""
import json
import os
import asyncio
from typing import Optional, Dict, Any
from cdp import CdpClient
from ..config import get_cdp_config, get_wallet_config, config as shared_config
from .logger import logger

class WalletManager:
    """Manages CDP wallet operations"""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not hasattr(self, 'initialized'):
            self.config = get_cdp_config()
            self.wallet_config = get_wallet_config()
            self.account: Optional[Dict[str, Any]] = None
            self.wallet_data_file = "wallet-data.json"
            self.initialized = True
    
    async def _get_client(self):
        """Get CDP client"""
        return CdpClient(
            api_key_id=self.config.api_key_id,
            api_key_secret=self.config.api_key_secret,
            wallet_secret=self.config.wallet_secret
        )
    
    async def get_or_create_wallet(self) -> Dict[str, Any]:
        """Get existing wallet or create a new one"""
        logger.flow("wallet_get_or_create_start")
        
        try:
            # Try to load existing wallet data
            if os.path.exists(self.wallet_data_file):
                with open(self.wallet_data_file, 'r') as f:
                    wallet_data = json.load(f)
                
                # Get the first account from saved data
                if wallet_data.get('accounts'):
                    account_name = wallet_data['accounts'][0]['name']
                    logger.info(f"Loading existing account: {account_name}")
                    
                    async with await self._get_client() as cdp:
                        # Get account by name
                        account = await cdp.evm.get_or_create_account(name=account_name)
                        self.account = {
                            'address': account.address,
                            'name': account.name
                        }
                        logger.success(f"Loaded existing account: {account.address}")
                        return self.account
            
            # Create new account if none exists
            logger.info("Creating new account")
            
            async with await self._get_client() as cdp:
                account = await cdp.evm.get_or_create_account(name=self.wallet_config.name)
                
                self.account = {
                    'address': account.address,
                    'name': account.name
                }
                
                # Save wallet data
                await self._save_wallet_data()
                logger.success(f"Created new account: {account.address}")
                
                return self.account
            
        except Exception as e:
            logger.error("Failed to get or create wallet", e)
            raise
    
    async def get_wallet_info(self) -> Optional[Dict[str, Any]]:
        """Get wallet information"""
        if not self.account:
            return None
        
        try:
            async with await self._get_client() as cdp:
                account = await cdp.evm.get_or_create_account(name=self.account['name'])
                
                return {
                    "id": account.address,
                    "defaultAddress": account.address,
                    "addresses": [account.address],
                    "accounts": [{
                        "address": account.address,
                        "name": account.name
                    }]
                }
            
        except Exception as e:
            logger.error("Failed to get wallet info", e)
            return None
    
    async def get_usdc_balance(self) -> float:
        """Get USDC balance"""
        if not self.account:
            raise ValueError("No wallet account available")
        
        try:
            logger.flow("balance_check", {"action": "Checking USDC balance"})
            
            async with await self._get_client() as cdp:
                account = await cdp.evm.get_or_create_account(name=self.account['name'])
                
                # Get network from config
                x402_config = shared_config.get_x402_config()
                network = x402_config.get("network", "base-sepolia")
                
                # Get token balances
                balance_result = await account.list_token_balances(network=network)
                
                # Find USDC balance
                for balance in balance_result.balances:
                    if balance.token.symbol == "USDC":
                        usdc_balance = float(balance.amount.amount) / (10 ** balance.amount.decimals)
                        logger.flow("balance_check_complete", {"balance": f"{usdc_balance} USDC"})
                        return usdc_balance
                
                # Return 0 if no USDC found
                logger.flow("balance_check_complete", {"balance": "0 USDC"})
                return 0.0
            
        except Exception as e:
            logger.error("Failed to get USDC balance", e)
            return 0.0
    
    async def fund_wallet(self, amount: float = 5.0) -> bool:
        """Fund wallet with USDC from faucet"""
        if not self.account:
            raise ValueError("No wallet account available")
        
        try:
            logger.flow("wallet_funding_start", {"target": f"{amount} USDC"})
            
            async with await self._get_client() as cdp:
                account = await cdp.evm.get_or_create_account(name=self.account['name'])
                
                # Use faucet to fund wallet
                faucet_hash = await cdp.evm.request_faucet(
                    address=account.address,
                    network="base-sepolia",
                    token="usdc"
                )
                
                if faucet_hash:
                    logger.success(f"Wallet funded with {amount} USDC")
                    logger.flow("wallet_funding_complete", {"amount": f"{amount} USDC"})
                    return True
                else:
                    logger.error("Failed to fund wallet")
                    return False
                
        except Exception as e:
            logger.error("Funding error", e)
            return False
    
    def get_address(self) -> str:
        """Get wallet address"""
        if not self.account:
            raise ValueError("No wallet account available")
        return self.account['address']
    
    async def _save_wallet_data(self):
        """Save wallet data to file"""
        if not self.account:
            return
        
        try:
            wallet_info = await self.get_wallet_info()
            if wallet_info:
                with open(self.wallet_data_file, 'w') as f:
                    json.dump(wallet_info, f, indent=2)
                logger.debug("Wallet data saved", {"filename": self.wallet_data_file})
        except Exception as e:
            logger.error("Failed to save wallet data", e) 