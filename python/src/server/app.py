"""
X402 Server Application

Main FastAPI application with modular architecture for X402 payment processing.
Uses the official X402 middleware for reliable payment verification.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from x402.fastapi.middleware import require_payment
from x402.types import EIP712Domain, TokenAmount, TokenAsset
import logging

# Import modular components
from .config import wallet_config
from .routes import content_router, health_router
from .utils import create_error_response
from ..shared.utils.logger import logger

# Set up logging
logging.basicConfig(level=logging.DEBUG)

# Create FastAPI app
app = FastAPI(
    title="X402 Payment Server",
    description="Server for X402 payment-protected content",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load wallet configuration on startup
@app.on_event("startup")
async def startup_event():
    """Initialize server on startup"""
    try:
        # Validate wallet configuration
        receiving_address = wallet_config.get_receiving_address()
        logger.info(f"✅ Server initialized with receiving address: {receiving_address}")
    except Exception as e:
        logger.error(f"❌ Failed to initialize server: {e}")
        raise

# Apply official X402 middleware to protected routes
app.middleware("http")(
    require_payment(
        path="/protected",
        price=TokenAmount(
            amount="10000",  # 0.01 USDC in wei
            asset=TokenAsset(
                address="0x036CbD53842c5426634e7929541eC2318f3dCF7e",  # USDC on Base Sepolia
                decimals=6,
                eip712=EIP712Domain(name="USDC", version="2"),
            ),
        ),
        pay_to_address=wallet_config.get_receiving_address(),
        network_id="base-sepolia"
    )
)

# Apply X402 middleware to premium route
app.middleware("http")(
    require_payment(
        path="/premium",
        price=TokenAmount(
            amount="100000",  # 0.1 USDC in wei
            asset=TokenAsset(
                address="0x036CbD53842c5426634e7929541eC2318f3dCF7e",  # USDC on Base Sepolia
                decimals=6,
                eip712=EIP712Domain(name="USDC", version="2"),
            ),
        ),
        pay_to_address=wallet_config.get_receiving_address(),
        network_id="base-sepolia"
    )
)

# Apply X402 middleware to enterprise route
app.middleware("http")(
    require_payment(
        path="/enterprise",
        price=TokenAmount(
            amount="1000000",  # 1.0 USDC in wei
            asset=TokenAsset(
                address="0x036CbD53842c5426634e7929541eC2318f3dCF7e",  # USDC on Base Sepolia
                decimals=6,
                eip712=EIP712Domain(name="USDC", version="2"),
            ),
        ),
        pay_to_address=wallet_config.get_receiving_address(),
        network_id="base-sepolia"
    )
)

# Include route modules
app.include_router(content_router, tags=["content"])
app.include_router(health_router, tags=["health"])

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle unhandled exceptions"""
    logger.error(f"❌ Unhandled exception: {exc}")
    return create_error_response(
        status_code=500,
        error_message="Internal server error",
        details={"type": type(exc).__name__}
    )

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with server information"""
    return {
        "service": "X402 Payment Server",
        "version": "1.0.0",
        "description": "Server for X402 payment-protected content",
        "endpoints": {
            "health": "/health",
            "status": "/status",
            "protected": "/protected",
            "premium": "/premium",
            "enterprise": "/enterprise",
            "free": "/free"
        }
    }

@app.get("/protected")
async def protected():
    """Protected endpoint that requires X402 payment"""
    return {
        "message": "🔓 PREMIUM ACCESS GRANTED - Payment Verified",
        "subtitle": "You have successfully accessed protected content via X402 payment",
        "data": {
            "payment": {
                "amount": "0.01 USDC",
                "timestamp": "2025-06-20T03:24:45.110Z",
                "transactionType": "X402_MICROPAYMENT"
            },
            "premiumFeatures": {
                "aiAnalysis": "Real-time AI-powered market analysis",
                "marketData": "Exclusive market insights and trends",
                "exclusiveContent": "Premium trading signals and predictions"
            },
            "access": {
                "contentId": "protected-1750389885110",
                "accessLevel": "PREMIUM",
                "validUntil": "2025-06-20T04:24:45.110Z",
                "apiCallsRemaining": 99
            },
            "insights": [
                "📊 Real-time market analysis updated every 30 seconds",
                "🤖 AI-powered predictions with 87%+ accuracy",
                "📈 Exclusive trading signals not available on free tier",
                "🔮 Predictive models based on 10M+ data points",
                "⚡ Sub-millisecond API response times"
            ],
            "developer": {
                "note": "This content required X402 micropayment to access",
                "implementation": "Official X402 middleware with automatic payment handling",
                "cost": "0.01 USDC per request",
                "billing": "Pay-per-use model - no subscriptions needed"
            }
        }
    } 