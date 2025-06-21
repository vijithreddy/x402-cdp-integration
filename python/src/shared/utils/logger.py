"""
Logging utilities for X402 CDP Integration
"""
import logging
import json
import os
import sys
from datetime import datetime
from typing import Any, Dict, Optional

class X402Logger:
    """Custom logger for X402 CDP Integration with verbose/quiet flagging"""
    
    def __init__(self, name: str = "x402-cdp"):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.DEBUG)
        
        # Prevent duplicate handlers
        self.logger.propagate = False
        
        # Initialize verbose mode from environment or command line
        self.is_verbose = self._parse_verbose_flags()
        
        # Add simple handler for clean console output
        if not self.logger.handlers:
            handler = logging.StreamHandler()
            handler.setFormatter(logging.Formatter("%(message)s"))
            self.logger.addHandler(handler)
    
    def _parse_verbose_flags(self) -> bool:
        """Parse verbose flags from environment and command line"""
        # Check environment variable
        if os.getenv('DEBUG') == 'true':
            return True
        
        # Check command line arguments
        if '--verbose' in sys.argv or '-v' in sys.argv:
            return True
        
        return False
    
    def update_config(self, config: Dict[str, Any]):
        """Update logger configuration"""
        if 'verbose' in config:
            self.is_verbose = config['verbose']
    
    def info(self, message: str, data: Optional[Dict[str, Any]] = None):
        """Log info message"""
        if data:
            self.logger.info(f"ℹ️  {datetime.utcnow().isoformat()}Z [INFO] {message}")
            self.logger.info(json.dumps(data, default=str, indent=2))
        else:
            self.logger.info(f"ℹ️  {datetime.utcnow().isoformat()}Z [INFO] {message}")
    
    def error(self, message: str, error: Optional[Exception] = None):
        """Log error message"""
        if error:
            self.logger.error(f"❌ {datetime.utcnow().isoformat()}Z [ERROR] {message}: {str(error)}")
        else:
            self.logger.error(f"❌ {datetime.utcnow().isoformat()}Z [ERROR] {message}")
    
    def debug(self, message: str, data: Optional[Dict[str, Any]] = None):
        """Log debug message - only in verbose mode"""
        if not self.is_verbose:
            return
        
        if data:
            self.logger.debug(f"🔍 {datetime.utcnow().isoformat()}Z [DEBUG] {message}")
            self.logger.debug(json.dumps(data, default=str, indent=2))
        else:
            self.logger.debug(f"🔍 {datetime.utcnow().isoformat()}Z [DEBUG] {message}")
    
    def success(self, message: str, data: Optional[Dict[str, Any]] = None):
        """Log success message"""
        if data:
            self.logger.info(f"✅ {datetime.utcnow().isoformat()}Z [SUCCESS] {message}")
            self.logger.info(json.dumps(data, default=str, indent=2))
        else:
            self.logger.info(f"✅ {datetime.utcnow().isoformat()}Z [SUCCESS] {message}")
    
    def warning(self, message: str):
        """Log warning message"""
        self.logger.warning(f"⚠️  {datetime.utcnow().isoformat()}Z [WARNING] {message}")
    
    def ui(self, message: str):
        """Log user interface message"""
        self.logger.info(message)
    
    def flow(self, action: str, data: Optional[Dict[str, Any]] = None):
        """Log flow/process messages at INFO level"""
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        # Always log flow events at INFO level
        self.logger.info(f"🔄 {timestamp} [FLOW] {action}")
        if data:
            self.logger.info(json.dumps(data, default=str, indent=2))

# Global logger instance
logger = X402Logger()

def parse_log_flags(args: list = None) -> Dict[str, Any]:
    """Parse command line arguments for logging configuration"""
    if args is None:
        args = sys.argv
    
    return {
        'verbose': '--verbose' in args or '-v' in args,
        'quiet': '--quiet' in args or '-q' in args,
        'json': '--json' in args,
        'level': 'debug' if '--debug' in args else 'info'
    } 