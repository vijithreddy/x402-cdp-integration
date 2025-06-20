"""
Configuration Management Module

Handles loading and managing configuration from the root config.yaml file.
"""

import os
import yaml
from typing import Dict, Any, Optional
from pathlib import Path
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


class Config:
    """Configuration manager for the X402 CDP integration"""
    
    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize configuration manager
        
        Args:
            config_path: Path to config.yaml file. If None, looks for config.yaml in project root
        """
        if config_path is None:
            # Look for config.yaml in project root (2 levels up from this file)
            current_dir = Path(__file__).parent
            config_path = current_dir.parent.parent.parent / "config.yaml"
        
        self.config_path = Path(config_path)
        self._config = self._load_config()
    
    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from YAML file"""
        if not self.config_path.exists():
            raise FileNotFoundError(f"Config file not found: {self.config_path}")
        
        with open(self.config_path, 'r') as f:
            return yaml.safe_load(f)
    
    def get_server_config(self, server_type: str = "python") -> Dict[str, Any]:
        """Get server configuration for specified type"""
        return self._config.get("servers", {}).get(server_type, {})
    
    def get_client_config(self, client_type: str = "python") -> Dict[str, Any]:
        """Get client configuration for specified type"""
        return self._config.get("clients", {}).get(client_type, {})
    
    def get_x402_config(self) -> Dict[str, Any]:
        """Get X402 configuration"""
        return self._config.get("x402", {})
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value by key (supports dot notation)"""
        keys = key.split('.')
        value = self._config
        
        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return default
        
        return value


# Global config instance
config = Config()


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


def get_server_url(server_type: str = "python") -> str:
    """Get server URL from configuration"""
    server_config = config.get_server_config(server_type)
    host = server_config.get("host", "localhost")
    port = server_config.get("port", 5001)
    return f"http://{host}:{port}" 