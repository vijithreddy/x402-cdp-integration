"""
Shared configuration for X402 CDP Integration
"""
import os
from typing import Optional
from dotenv import load_dotenv
from pydantic import BaseModel

# Load environment variables from .env file
load_dotenv()

class CDPConfig(BaseModel):
    """CDP configuration model"""
    api_key_id: str
    api_key_secret: str
    wallet_secret: str

class WalletConfig(BaseModel):
    """Wallet configuration model"""
    name: str = "CDP-Python-Account"
    network: str = "base-sepolia"

def get_cdp_config() -> CDPConfig:
    """Get CDP configuration from environment variables"""
    api_key_id = os.getenv("CDP_API_KEY_ID")
    api_key_secret = os.getenv("CDP_API_KEY_SECRET")
    wallet_secret = os.getenv("CDP_WALLET_SECRET")
    
    if not all([api_key_id, api_key_secret, wallet_secret]):
        raise ValueError(
            "Missing required environment variables. Please set:\n"
            "CDP_API_KEY_ID, CDP_API_KEY_SECRET, CDP_WALLET_SECRET"
        )
    
    return CDPConfig(
        api_key_id=api_key_id,
        api_key_secret=api_key_secret,
        wallet_secret=wallet_secret
    )

def get_wallet_config() -> WalletConfig:
    """Get wallet configuration"""
    return WalletConfig() 