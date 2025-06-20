"""
Wallet Configuration Module

Handles loading and validation of server wallet configuration from JSON files.
"""

import json
import os
from pathlib import Path
from typing import Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class WalletConfig:
    """Wallet configuration data structure"""
    id: str
    default_address: str
    addresses: list[str]
    accounts: list[Dict[str, str]]


class WalletConfigLoader:
    """Loads and validates wallet configuration from JSON files"""
    
    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize the wallet config loader
        
        Args:
            config_path: Path to wallet config file (defaults to server-wallet-data.json)
        """
        if config_path is None:
            # Default to server-wallet-data.json in the project root
            project_root = Path(__file__).parent.parent.parent.parent
            config_path = project_root / "server-wallet-data.json"
        
        self.config_path = Path(config_path)
    
    def load(self) -> WalletConfig:
        """
        Load wallet configuration from JSON file
        
        Returns:
            WalletConfig object with validated wallet data
            
        Raises:
            FileNotFoundError: If config file doesn't exist
            ValueError: If config file is invalid or missing required fields
        """
        if not self.config_path.exists():
            raise FileNotFoundError(f"Wallet config file not found: {self.config_path}")
        
        try:
            with open(self.config_path, 'r') as f:
                data = json.load(f)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in wallet config file: {e}")
        
        # Validate required fields
        required_fields = ['id', 'defaultAddress', 'addresses', 'accounts']
        for field in required_fields:
            if field not in data:
                raise ValueError(f"Missing required field '{field}' in wallet config")
        
        # Validate default address exists in addresses list
        default_address = data['defaultAddress']
        if default_address not in data['addresses']:
            raise ValueError(f"Default address '{default_address}' not found in addresses list")
        
        return WalletConfig(
            id=data['id'],
            default_address=data['defaultAddress'],
            addresses=data['addresses'],
            accounts=data['accounts']
        )
    
    def get_receiving_address(self) -> str:
        """
        Get the receiving wallet address for X402 payments
        
        Returns:
            The default wallet address to receive payments
            
        Raises:
            FileNotFoundError: If config file doesn't exist
            ValueError: If config file is invalid
        """
        config = self.load()
        return config.default_address


# Global instance for easy access
wallet_config = WalletConfigLoader() 