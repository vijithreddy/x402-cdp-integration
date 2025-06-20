# Python Implementation

This directory contains the Python implementation of the X402-CDP integration.

## 🚀 Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Setup wallet
python setup.py

# Start server
python run_server.py

# Start client
python -m src.client.core.cli
```

## 📁 Structure

```
python/
├── src/
│   ├── client/
│   │   ├── commands/          # CLI commands
│   │   │   ├── x402/         # X402 payment commands
│   │   │   └── free.py       # Free tier command
│   │   ├── core/             # Core CLI functionality
│   │   └── utils/            # Utility functions
│   ├── server/
│   │   ├── routes/           # FastAPI routes
│   │   ├── middleware/       # FastAPI middleware
│   │   └── utils/            # Server utilities
│   └── shared/               # Shared utilities
├── requirements.txt
├── run_server.py
└── README.md
```

## 🔧 How to Add Your Own Command

### 1. Create a New Command File
Create `src/client/commands/my_command.py`:

```python
"""
My Custom Command Module

A custom command for the X402 CLI client.
"""

import asyncio
from typing import List
from src.shared.utils.logger import logger
from src.shared.config import config as shared_config


async def my_command(args: List[str]) -> None:
    """
    My custom command implementation
    
    Args:
        args: Command arguments
    """
    try:
        # Log command execution
        logger.flow('my_command', {
            'action': 'Executing custom command',
            'args': args,
            'timestamp': '2025-06-20T03:24:45.110Z'
        })

        logger.ui('\n🎉 My custom command executed!')
        logger.ui(f'Arguments: {args}')
        
        # Add your custom logic here
        # You can access:
        # - shared_config for configuration
        # - logger for structured logging
        # - args for command arguments
        
        # Example: Make HTTP request
        import aiohttp
        server_config = shared_config.get_server_config("python")
        base_url = f"http://{server_config['host']}:{server_config['port']}"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{base_url}/health", timeout=aiohttp.ClientTimeout(total=10)) as response:
                if response.status == 200:
                    data = await response.json()
                    logger.ui(f"✅ Server health: {data.get('status', 'unknown')}")
                else:
                    logger.ui(f"❌ Server error: {response.status}")

        # Log successful execution
        logger.flow('my_command_success', {
            'action': 'Custom command completed',
            'status': 'success',
            'timestamp': '2025-06-20T03:24:45.110Z'
        })
                
    except Exception as e:
        logger.error('Failed to execute custom command', e)
        logger.ui('💡 Make sure the server is running: npm run py:server')


# Command registration
COMMANDS = {
    'my-command': {
        'function': my_command,
        'description': 'My custom command description',
        'usage': 'my-command [arguments]'
    }
}
```

### 2. Register the Command
Add your command to `src/client/core/cli.py`:

```python
def do_my_command(self, arg):
    """My custom command"""
    try:
        from src.client.commands.my_command import my_command
        import asyncio
        
        console.print("🎯 My Custom Command", style="cyan")
        asyncio.run(my_command(arg.split() if arg else []))
        
    except Exception as e:
        logger.error("Failed to execute my command", e)
        console.print(f"❌ My command failed: {e}", style="red")
```

### 3. Test Your Command
```bash
python -m src.client.core.cli
cdp-wallet> my-command test args
🎉 My custom command executed!
Arguments: ['test', 'args']
✅ Server health: healthy
```

## 💳 How to Add Your Own X402 Route

### 1. Create a Route Module
Create `src/server/routes/my_premium.py`:

```python
"""
My Premium Route Module

Provides custom premium content that requires X402 payment to access.
"""

from fastapi import APIRouter
from typing import Dict, Any
from src.shared.utils.logger import logger

router = APIRouter()

def generate_my_premium_content() -> Dict[str, Any]:
    """Generate custom premium content"""
    return {
        "customFeature": {
            "data": "Your premium data here",
            "timestamp": "2025-06-20T03:24:45.110Z",
            "value": 42.5
        },
        "exclusiveContent": {
            "message": "This required payment to access!",
            "contentId": f"my-premium-{int(1000 * 3.14159)}",
            "features": [
                "🎯 Custom feature 1",
                "⚡ Custom feature 2", 
                "🚀 Custom feature 3"
            ]
        }
    }

@router.get("/my-premium")
async def my_premium():
    """My premium endpoint that requires X402 payment"""
    try:
        premium_data = generate_my_premium_content()
        
        return {
            "paymentVerified": True,
            "message": "🎉 MY PREMIUM CONTENT - Payment Verified!",
            "data": {
                "payment": {
                    "amount": "0.05 USDC",  # Your custom price
                    "type": "MY_CUSTOM_PAYMENT"
                },
                "content": premium_data,
                "developer": {
                    "note": "This content required 0.05 USDC payment",
                    "cost": "0.05 USDC per request"
                }
            }
        }
    except Exception as e:
        logger.error("Error in my-premium endpoint", e)
        return {"error": "Internal server error"}
```

### 2. Register Your Route
Add to `src/server/app.py`:

```python
# Import your route
from .routes import my_premium

# Add X402 middleware for your route
app.middleware("http")(require_payment(
    path="/my-premium",
    price=TokenAmount(amount="50000", asset=usdc_asset),  # 0.05 USDC
    pay_to_address=wallet_config.get_receiving_address(),
    network_id="base-sepolia"
))

# Include your route
app.include_router(my_premium.router, tags=["my-premium"])
```

### 3. Create a Client Command (Optional)
Create `src/client/commands/x402/my_tier.py`:

```python
"""
My Tier Command Module

Tests custom premium content with X402 payment.
"""

import asyncio
from typing import List
from src.shared.utils.logger import logger
from src.shared.utils.wallet_manager import WalletManager
from src.client.commands.x402 import create_x402_client, validate_balance_for_x402, display_premium_content, handle_x402_error
from src.shared.config import get_server_url


async def my_tier_command(wallet_manager: WalletManager) -> None:
    """
    Test my custom premium content (0.05 USDC)
    
    Args:
        wallet_manager: Wallet manager instance
    """
    try:
        logger.ui('\n🎯 My Custom Premium Test')
        logger.ui('Testing my premium endpoint')
        logger.ui('=======================')
        
        # Validate balance
        balance = await validate_balance_for_x402(wallet_manager)
        if balance is None:
            return
        
        # Create X402 client
        wallet_address = wallet_manager.get_address()
        x402_client, account = await create_x402_client(wallet_manager, wallet_address)
        
        # Make request
        server_url = get_server_url()
        response = await x402_client.get(f"{server_url}/my-premium")
        
        if response.status_code == 200:
            response_data = response.json()
            display_premium_content(response_data, {
                'tier_name': 'My Custom Premium',
                'description': 'Custom premium content with X402 payment'
            })
        else:
            logger.error(f'Server error: {response.status_code}')
            
    except Exception as e:
        handle_x402_error(e, {
            'tier_name': 'My Custom Premium',
            'description': 'Custom premium content'
        })
```

### 4. Register the X402 Command
Add to `src/client/commands/x402/__init__.py`:

```python
# Add to X402_ENDPOINTS
X402_ENDPOINTS: Dict[str, X402EndpointConfig] = {
    # ... existing endpoints ...
    "my-tier": X402EndpointConfig(
        endpoint="/my-premium",
        expected_cost="~0.05 USDC",
        tier="my-tier",
        tier_name="My Custom Premium",
        description="Custom premium content with X402 payment"
    )
}
```

### 5. Test Your Custom Route
```bash
# Start server
python run_server.py

# In another terminal, test payments
python -m src.client.core.cli
cdp-wallet> my-tier

My Custom Premium Test
Testing my premium endpoint
=======================
[PAYMENT_REQUIRED] Client: requesting content | Amount: 0.05 USDC
[PAYMENT_VERIFIED] 0.05 USDC 0xA35d...E308 → server
🎉 MY PREMIUM CONTENT - Payment Verified!
```

## 📋 Available Commands

- `balance` - Check USDC balance
- `fund [amount]` - Fund wallet with USDC
- `info` - Show wallet information
- `free` - Access free content
- `tier1` - Premium content (0.01 USDC)
- `tier2` - Premium+ content (0.1 USDC)
- `tier3` - Enterprise content (1.0 USDC)
- `help` - Show help

## 🔧 Development

```bash
# Install development dependencies
pip install -r requirements.txt

# Run tests
python -m pytest

# Type check (if using mypy)
mypy src/

# Format code
black src/
``` 