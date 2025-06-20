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
from src.shared.config import config as shared_config

# Set up logging based on config
server_config = shared_config.get_server_config("python")
log_level_name = server_config.get("log_level", "INFO").upper()
log_level_map = {
    "DEBUG": logging.DEBUG,
    "INFO": logging.INFO,
    "WARNING": logging.WARNING,
    "ERROR": logging.ERROR
}

# Set log level for X402 library (without basicConfig to avoid duplicates)
logging.getLogger('x402').setLevel(log_level_map.get(log_level_name, logging.INFO))
logging.getLogger('x402.fastapi').setLevel(log_level_map.get(log_level_name, logging.INFO))

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

# Add simple request logging middleware FIRST
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"🎯 REQUEST RECEIVED: {request.method} {request.url}")
    logger.debug(f"   Headers: {dict(request.headers)}")
    
    response = await call_next(request)
    
    logger.info(f"✅ RESPONSE SENT: {response.status_code}")
    return response

# Apply official X402 middleware to protected routes for all tiers
from x402.types import EIP712Domain, TokenAmount, TokenAsset

usdc_asset = TokenAsset(
    address="0x036CbD53842c5426634e7929541eC2318f3dCF7e",  # USDC on Base Sepolia
    decimals=6,
    eip712=EIP712Domain(name="USDC", version="2"),
)

app.middleware("http")(require_payment(
    path="/protected",
    price=TokenAmount(amount="10000", asset=usdc_asset),  # 0.01 USDC
    pay_to_address=wallet_config.get_receiving_address(),
    network_id="base-sepolia"
))
app.middleware("http")(require_payment(
    path="/premium",
    price=TokenAmount(amount="100000", asset=usdc_asset),  # 0.1 USDC
    pay_to_address=wallet_config.get_receiving_address(),
    network_id="base-sepolia"
))
app.middleware("http")(require_payment(
    path="/enterprise",
    price=TokenAmount(amount="1000000", asset=usdc_asset),  # 1.0 USDC
    pay_to_address=wallet_config.get_receiving_address(),
    network_id="base-sepolia"
))

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
            "free": "/free",
            "protected": "/protected",
            "premium": "/premium",
            "enterprise": "/enterprise"
        }
    }

@app.get("/free")
async def free():
    """Free tier endpoint - no payment required"""
    return {
        "contentTier": "FREE",
        "message": "📖 Free Content - No Payment Required",
        "subtitle": "This content is available without any payment",
        "data": {
            "basicInfo": {
                "service": "X402 Demo API",
                "version": "1.0.0",
                "timestamp": "2025-06-20T03:24:45.110Z",
                "accessLevel": "PUBLIC"
            },
            "freeFeatures": [
                "📊 Basic market data (15-minute delay)",
                "📈 Simple price charts",
                "📱 Standard API rate limits",
                "🔍 Limited search functionality",
                "⏰ Business hours support only"
            ],
            "limitations": {
                "updateFrequency": "15 minutes",
                "dataAccuracy": "Standard",
                "apiCallsPerHour": 10,
                "supportLevel": "Community forum only",
                "advancedFeatures": "Not available"
            },
            "upgradeInfo": {
                "note": "Want real-time data and AI insights?",
                "upgrade": "Try the /protected endpoint (requires payment)",
                "benefits": "Unlock premium features, real-time data, and AI analysis"
            }
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

@app.get("/premium")
async def premium():
    """Premium endpoint that requires X402 payment"""
    return {
        "message": "🔓 PREMIUM PLUS ACCESS GRANTED - Payment Verified",
        "subtitle": "You have successfully accessed premium plus content via X402 payment",
        "data": {
            "payment": {
                "amount": "0.1 USDC",
                "timestamp": "2025-06-20T03:24:45.110Z",
                "transactionType": "X402_MICROPAYMENT"
            },
            "premiumPlusFeatures": {
                "aiModels": "Advanced deep learning models for predictive analytics",
                "marketData": "Expanded market coverage and institutional signals",
                "exclusiveContent": "Premium Plus trading strategies and reports"
            },
            "access": {
                "contentId": "premium-plus-1750389885110",
                "accessLevel": "PREMIUM_PLUS",
                "validUntil": "2025-06-20T04:24:45.110Z",
                "apiCallsRemaining": 199
            },
            "insights": [
                "🤖 Advanced AI models with 92%+ accuracy",
                "📈 Predictive analytics for next-day trends",
                "📊 Institutional order flow and volume signals",
                "🔮 Deep learning models trained on 100M+ data points",
                "⚡ Priority API access for premium users"
            ],
            "developer": {
                "note": "This content required X402 micropayment to access",
                "implementation": "Official X402 middleware with automatic payment handling",
                "cost": "0.1 USDC per request",
                "billing": "Pay-per-use model - no subscriptions needed"
            }
        }
    }

@app.get("/enterprise")
async def enterprise():
    """Enterprise endpoint that requires X402 payment"""
    return {
        "message": "🔓 ENTERPRISE ACCESS GRANTED - Payment Verified",
        "subtitle": "You have successfully accessed enterprise content via X402 payment",
        "data": {
            "payment": {
                "amount": "1.0 USDC",
                "timestamp": "2025-06-20T03:24:45.110Z",
                "transactionType": "X402_MICROPAYMENT"
            },
            "enterpriseFeatures": {
                "institutionalData": "Whale movements, dark pool activity, and yield opportunities",
                "advancedAI": "Institutional-grade AI analysis and risk assessment",
                "exclusiveFeatures": "Custom insights, portfolio optimization, and arbitrage signals"
            },
            "access": {
                "contentId": "enterprise-1750389885110",
                "accessLevel": "ENTERPRISE",
                "validUntil": "2025-06-20T04:24:45.110Z",
                "apiCallsRemaining": 499
            },
            "insights": [
                "🏦 Whale tracking and institutional order flow",
                "🤖 Institutional AI with 95%+ accuracy",
                "📈 Real-time dark pool and OTC desk activity",
                "🔮 Custom alpha generation and risk management",
                "⚡ Priority support and custom integrations"
            ],
            "developer": {
                "note": "This content required X402 micropayment to access",
                "implementation": "Official X402 middleware with automatic payment handling",
                "cost": "1.0 USDC per request",
                "billing": "Pay-per-use model - no subscriptions needed"
            }
        }
    } 