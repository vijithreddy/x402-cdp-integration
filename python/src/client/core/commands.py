"""
Command registry for CLI commands
"""

from typing import Dict, Any, Callable
from src.shared.utils.wallet_manager import WalletManager
from src.shared.utils.logger import logger

class CommandRegistry:
    """Registry for CLI commands"""
    
    def __init__(self, wallet_manager: WalletManager):
        self.wallet_manager = wallet_manager
        self.commands: Dict[str, Any] = {}
    
    def register_command(self, name: str, command_func):
        """Register a new command"""
        self.commands[name] = command_func
    
    def get_command(self, name: str):
        """Get a command by name"""
        return self.commands.get(name)
    
    def list_commands(self):
        """List all registered commands"""
        return list(self.commands.keys()) 