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
"""

import asyncio
from typing import List
from src.shared.utils.logger import logger
from src.shared.config import config as shared_config


async def my_command(args: List[str]) -> None:
    """My custom command implementation"""
    try:
        logger.flow('my_command', {'action': 'Executing custom command'})
        logger.ui('\n🎉 My custom command executed!')
        
        # Add your custom logic here
        # Access shared_config, logger, args
        
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
Add to `src/client/core/cli.py`:

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

## 💳 How to Add Your Own X402 Route

### 1. Create a Route Module
Create `src/server/routes/my_premium.py`:

```python
"""
My Premium Route Module
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
                    "amount": "0.05 USDC",
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
        raise HTTPException(status_code=500, detail="Internal server error")
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

## 🧪 Testing

### Test Your Route
```bash
# Start server
python run_server.py

# Test with curl
curl http://localhost:5001/my-premium
```

### Test with Client
```bash
# Start client
python -m src.client.core.cli

# Add your command to test the route
cdp-wallet> my-command
```

## 🔧 Key Features

- **FastAPI Integration**: Modern async web framework
- **X402 Middleware**: Automatic payment handling
- **Structured Logging**: Professional logging with flow tracking
- **Configuration Management**: Centralized config from root config.yaml
- **Error Handling**: Comprehensive error types and fallback mechanisms
- **AI Service Integration**: Real-time market data and AI analysis
- **Health Checks**: Detailed health monitoring

## 📊 Health Monitoring

```bash
# Basic health check
curl http://localhost:5001/health

# Detailed health check
curl http://localhost:5001/health/detailed
```

## 🔍 Troubleshooting

### Common Issues
1. **Import errors**: Ensure all dependencies are installed
2. **Port conflicts**: Check if port 5001 is available
3. **Config issues**: Verify config.yaml exists and is valid
4. **AI service**: Ensure AI server is running on port 8001

### Debug Mode
```bash
# Set debug logging
export LOG_LEVEL=DEBUG
python run_server.py
``` 