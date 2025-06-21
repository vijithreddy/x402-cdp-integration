"""
Content Routes Module

Handles different content tiers and their respective endpoints.
"""

import json
import time
import random
import requests
from datetime import datetime, timedelta
from fastapi import APIRouter, Request
from ...shared.utils.logger import logger
from ...shared.config import config as shared_config

router = APIRouter()

# AI Service configuration from centralized config
ai_config = shared_config.get_server_config("ai")
AI_SERVICE_HOST = ai_config.get("host", "localhost")
AI_SERVICE_PORT = ai_config.get("port", 8001)
AI_SERVICE_URL = f"http://{AI_SERVICE_HOST}:{AI_SERVICE_PORT}"

def call_ai_service(tier: str, user_prompt: str = "") -> dict:
    """Call the AI service to generate content for the specified tier"""
    try:
        logger.info(f"🤖 Calling AI service for tier: {tier}")
        logger.info(f"📍 AI Service URL: {AI_SERVICE_URL}")
        logger.flow('ai_service_request', {
            "tier": tier,
            "service_url": AI_SERVICE_URL,
            "status": "requesting"
        })
        
        response = requests.post(
            f"{AI_SERVICE_URL}/generate/{tier}",
            json={"tier": tier, "user_prompt": user_prompt},
            timeout=30
        )
        
        logger.info(f"✅ AI service response received - Status: {response.status_code}")
        logger.flow('ai_service_response', {
            "tier": tier,
            "status_code": response.status_code,
            "status": "success" if response.status_code == 200 else "error"
        })
        
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.warning(f"❌ AI service call failed for tier {tier}: {e}")
        logger.flow('ai_service_error', {
            "tier": tier,
            "error": str(e),
            "status": "failed"
        })
        return None

def generate_premium_content() -> dict:
    """Generate premium content with AI analysis"""
    logger.info("📊 Generating tier1 (Basic Premium) content")
    
    # Call AI service for tier1
    ai_response = call_ai_service("tier1")
    
    if ai_response and ai_response.get("source") in ["openai", "boilerplate"]:
        # AI service now returns standardized format
        return {
            "aiAnalysis": {
                "content": ai_response["content"],
                "source": ai_response["source"],
                "tier": "tier1",
                "sentiment": ai_response.get("market_data", {}).get("sentiment", "neutral"),
                "confidence": ai_response.get("market_data", {}).get("confidence", "85%")
            },
            "marketData": {
                "predictiveModel": {
                    "nextHour": ai_response.get("market_data", {}).get("nextHour", "+1.5%"),
                    "accuracy": ai_response.get("market_data", {}).get("accuracy", "87.3%"),
                    "signals": ai_response.get("market_data", {}).get("signals", ["bullish_momentum", "volume_surge"])
                }
            },
            "exclusiveContent": {
                "reportId": f"PREMIUM-{int(time.time() * 1000)}",
                "accessLevel": "GOLD_TIER",
                "contentType": "Real-time Analytics + AI Insights",
                "remainingCredits": random.randint(10, 60)
            },
            "keyInsights": ai_response.get("key_insights", [
                "📊 Real-time market analysis updated every 30 seconds",
                "🤖 AI-powered predictions with 87%+ accuracy",
                "📈 Exclusive trading signals not available on free tier",
                "🔮 Predictive models based on 10M+ data points",
                "⚡ Sub-millisecond API response times"
            ])
        }
    else:
        # Fallback to mock data
        return {
            "aiAnalysis": {
                "content": "# Market Analysis - Tier1\n\n**Status:** AI service temporarily unavailable\n\n**Fallback Analysis:** Market conditions are being monitored.",
                "source": "fallback",
                "tier": "tier1",
                "sentiment": "neutral",
                "confidence": "N/A"
            },
            "marketData": {
                "predictiveModel": {
                    "nextHour": "+1.5%",
                    "accuracy": "87.3%",
                    "signals": ["bullish_momentum", "volume_surge"]
                }
            },
            "exclusiveContent": {
                "reportId": f"PREMIUM-{int(time.time() * 1000)}",
                "accessLevel": "GOLD_TIER",
                "contentType": "Real-time Analytics + AI Insights",
                "remainingCredits": random.randint(10, 60)
            },
            "keyInsights": [
                "📊 Real-time market analysis updated every 30 seconds",
                "🤖 AI-powered predictions with 87%+ accuracy",
                "📈 Exclusive trading signals not available on free tier",
                "🔮 Predictive models based on 10M+ data points",
                "⚡ Sub-millisecond API response times"
            ]
        }

def generate_premium_plus_content() -> dict:
    """Generate premium plus content with advanced AI models"""
    logger.info("📊 Generating tier2 (Premium Plus) content")
    
    # Call AI service for tier2
    ai_response = call_ai_service("tier2")
    
    if ai_response and ai_response.get("source") in ["openai", "boilerplate"]:
        # AI service now returns standardized format
        return {
            "aiAnalysis": {
                "content": ai_response["content"],
                "source": ai_response["source"],
                "tier": "tier2",
                "sentiment": ai_response.get("market_data", {}).get("sentiment", "neutral"),
                "confidence": ai_response.get("market_data", {}).get("confidence", "92%")
            },
            "marketData": {
                "predictiveModel": {
                    "nextHour": ai_response.get("market_data", {}).get("nextHour", "+2.1%"),
                    "nextDay": ai_response.get("market_data", {}).get("nextDay", "+5.3%"),
                    "accuracy": ai_response.get("market_data", {}).get("accuracy", "92.5%"),
                    "signals": ai_response.get("market_data", {}).get("signals", ["bullish_momentum", "volume_surge", "institutional_interest"])
                }
            },
            "exclusiveContent": {
                "reportId": f"PREMIUM-PLUS-{int(time.time() * 1000)}",
                "accessLevel": "PLATINUM_TIER",
                "contentType": "Advanced Analytics + AI Insights",
                "remainingCredits": random.randint(50, 150)
            },
            "keyInsights": ai_response.get("key_insights", [
                "📊 Advanced market analysis with deep learning models",
                "🤖 AI-powered predictions with 92%+ accuracy",
                "📈 Exclusive trading signals and institutional data",
                "🔮 Predictive models based on 100M+ data points",
                "⚡ Sub-millisecond API response times",
                "🎯 Custom alerts and notifications",
                "📱 Mobile-optimized data delivery"
            ])
        }
    else:
        # Fallback to mock data
        return {
            "aiAnalysis": {
                "content": "# Market Analysis - Tier2\n\n**Status:** AI service temporarily unavailable\n\n**Fallback Analysis:** Advanced market conditions are being monitored.",
                "source": "fallback",
                "tier": "tier2",
                "sentiment": "neutral",
                "confidence": "N/A"
            },
            "marketData": {
                "predictiveModel": {
                    "nextHour": "+2.1%",
                    "nextDay": "+5.3%",
                    "accuracy": "92.5%",
                    "signals": ["bullish_momentum", "volume_surge", "institutional_interest"]
                }
            },
            "exclusiveContent": {
                "reportId": f"PREMIUM-PLUS-{int(time.time() * 1000)}",
                "accessLevel": "PLATINUM_TIER",
                "contentType": "Advanced Analytics + AI Insights",
                "remainingCredits": random.randint(50, 150)
            },
            "keyInsights": [
                "📊 Advanced market analysis with deep learning models",
                "🤖 AI-powered predictions with 92%+ accuracy",
                "📈 Exclusive trading signals and institutional data",
                "🔮 Predictive models based on 100M+ data points",
                "⚡ Sub-millisecond API response times",
                "🎯 Custom alerts and notifications",
                "📱 Mobile-optimized data delivery"
            ]
        }

def generate_enterprise_content() -> dict:
    """Generate enterprise content with institutional features"""
    logger.info("📊 Generating tier3 (Enterprise) content")
    
    # Call AI service for tier3
    ai_response = call_ai_service("tier3")
    
    if ai_response and ai_response.get("source") in ["openai", "boilerplate"]:
        # AI service now returns standardized format
        return {
            "aiAnalysis": {
                "content": ai_response["content"],
                "source": ai_response["source"],
                "tier": "tier3",
                "sentiment": ai_response.get("market_data", {}).get("sentiment", "neutral"),
                "confidence": ai_response.get("market_data", {}).get("confidence", "95%")
            },
            "exclusiveFeatures": {
                "reportId": f"ENTERPRISE-{int(time.time() * 1000)}",
                "accessLevel": "ENTERPRISE_TIER",
                "contentType": "Institutional Analytics + Yield Strategies",
                "remainingCredits": random.randint(5, 25),
                "personalizedInsights": [
                    "🏦 Institutional-grade portfolio optimization",
                    "📊 Real-time market analysis and alerts",
                    "💎 Advanced DeFi yield strategies",
                    "🎯 Cross-chain arbitrage opportunities",
                    "⚡ Sub-100ms execution signals"
                ]
            },
            "keyInsights": ai_response.get("key_insights", [
                "🏛️ Institutional-grade analytics and insights",
                "🤖 Advanced AI models with 95%+ accuracy",
                "📈 Real-time market structure analysis",
                "🔮 Quantitative models using real market statistics",
                "⚡ Priority API access with sub-millisecond latency",
                "🎯 Custom alpha generation for systematic trading",
                "🔒 Advanced risk management and compliance tools"
            ])
        }
    else:
        # Fallback to mock data
        return {
            "aiAnalysis": {
                "content": "# Market Analysis - Tier3\n\n**Status:** AI service temporarily unavailable\n\n**Fallback Analysis:** Institutional market conditions are being monitored.",
                "source": "fallback",
                "tier": "tier3",
                "sentiment": "neutral",
                "confidence": "N/A"
            },
            "exclusiveFeatures": {
                "reportId": f"ENTERPRISE-{int(time.time() * 1000)}",
                "accessLevel": "ENTERPRISE_TIER",
                "contentType": "Institutional Analytics + Yield Strategies",
                "remainingCredits": random.randint(5, 25),
                "personalizedInsights": [
                    "🏦 Institutional-grade portfolio optimization",
                    "📊 Real-time market analysis and alerts",
                    "💎 Advanced DeFi yield strategies",
                    "🎯 Cross-chain arbitrage opportunities",
                    "⚡ Sub-100ms execution signals"
                ]
            },
            "keyInsights": [
                "🏛️ Institutional-grade analytics and insights",
                "🤖 Advanced AI models with 95%+ accuracy",
                "📈 Real-time market structure analysis",
                "🔮 Quantitative models using real market statistics",
                "⚡ Priority API access with sub-millisecond latency",
                "🎯 Custom alpha generation for systematic trading",
                "🔒 Advanced risk management and compliance tools"
            ]
        }

def generate_free_content() -> dict:
    """Generate free content with basic AI analysis"""
    logger.info("📊 Generating free tier content")
    
    # Call AI service for free tier
    ai_response = call_ai_service("free")
    
    if ai_response and ai_response.get("source") in ["openai", "boilerplate"]:
        # AI service now returns standardized format
        return {
            "aiAnalysis": {
                "content": ai_response["content"],
                "source": ai_response["source"],
                "tier": "free",
                "sentiment": ai_response.get("market_data", {}).get("sentiment", "neutral"),
                "confidence": ai_response.get("market_data", {}).get("confidence", "75%")
            },
            "basicFeatures": {
                "reportId": f"FREE-{int(time.time() * 1000)}",
                "accessLevel": "FREE_TIER",
                "contentType": "Basic Market Overview",
                "upgradeMessage": "Upgrade to Premium for advanced analytics"
            }
        }
    else:
        # Fallback to mock data
        return {
            "aiAnalysis": {
                "content": "# Market Analysis - Free\n\n**Status:** AI service temporarily unavailable\n\n**Fallback Analysis:** Basic market conditions are being monitored.",
                "source": "fallback",
                "tier": "free",
                "sentiment": "neutral",
                "confidence": "N/A"
            },
            "basicFeatures": {
                "reportId": f"FREE-{int(time.time() * 1000)}",
                "accessLevel": "FREE_TIER",
                "contentType": "Basic Market Overview",
                "upgradeMessage": "Upgrade to Premium for advanced analytics"
            }
        }

def get_client_from_payment(request: Request) -> str:
    """Extract client address from payment header"""
    x_payment = request.headers.get('x-payment')
    if not x_payment:
        return "unknown"
    
    try:
        import base64
        decoded = base64.b64decode(x_payment).decode('utf-8')
        payment_data = json.loads(decoded)
        
        if payment_data.get('payload', {}).get('authorization', {}).get('from'):
            client_address = payment_data['payload']['authorization']['from']
            if isinstance(client_address, str) and client_address.startswith('0x'):
                return client_address
        return "unknown"
    except:
        return "unknown"

@router.get("/protected")
async def protected_content(request: Request):
    """
    Protected content endpoint - requires X402 payment
    
    Returns:
        Premium content with AI analysis and market data
    """
    logger.flow('payment_required', {
        "client": "requesting Basic",
        "endpoint": "/protected", 
        "amount": "0.01 USDC"
    })
    
    premium_features = generate_premium_content()
    client_address = get_client_from_payment(request)
    
    logger.info('Payment verified', {
        "amount": "0.01 USDC",
        "from": f"{client_address[:6]}...{client_address[-4:]}",
        "to": "server",
        "status": "success"
    })
    
    logger.flow('content_delivered', {
        "client": f"{client_address[:6]}...{client_address[-4:]}",
        "status": "Success"
    })
    
    return {
        "paymentVerified": True,
        "contentTier": "PREMIUM",
        "message": "🔓 PREMIUM ACCESS GRANTED - Payment Verified",
        "subtitle": "You have successfully accessed protected content via X402 payment",
        "data": {
            "payment": {
                "amount": "0.01 USDC",
                "paidBy": client_address,
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "transactionType": "X402_MICROPAYMENT"
            },
            "features": premium_features,
            "access": {
                "contentId": f"protected-{int(time.time() * 1000)}",
                "accessLevel": "PREMIUM",
                "validUntil": (datetime.utcnow() + timedelta(hours=1)).isoformat() + "Z",
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
            },
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    }

@router.get("/premium")
async def premium_content(request: Request):
    """
    Premium content endpoint - requires X402 payment
    
    Returns:
        Premium plus content with advanced AI models
    """
    premium_plus_features = generate_premium_plus_content()
    client_address = get_client_from_payment(request)
    
    return {
        "paymentVerified": True,
        "contentTier": "PREMIUM_PLUS",
        "message": "🔓 PREMIUM PLUS ACCESS GRANTED - Payment Verified",
        "subtitle": "You have successfully accessed premium plus content via X402 payment",
        "data": {
            "payment": {
                "amount": "0.1 USDC",
                "paidBy": client_address,
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "transactionType": "X402_MICROPAYMENT"
            },
            "features": premium_plus_features,
            "access": {
                "tier": "premium_plus",
                "expiresAt": (datetime.utcnow() + timedelta(hours=24)).isoformat() + "Z",
                "features": ["Advanced AI Models", "Predictive Analytics", "Exclusive Reports"]
            },
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    }

@router.get("/enterprise")
async def enterprise_content(request: Request):
    """
    Enterprise content endpoint - requires X402 payment
    
    Returns:
        Enterprise content with institutional features
    """
    enterprise_features = generate_enterprise_content()
    client_address = get_client_from_payment(request)
    
    return {
        "paymentVerified": True,
        "contentTier": "ENTERPRISE",
        "message": "🔓 ENTERPRISE ACCESS GRANTED - Payment Verified",
        "subtitle": "You have successfully accessed enterprise content via X402 payment",
        "data": {
            "payment": {
                "amount": "1.0 USDC",
                "paidBy": client_address,
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "transactionType": "X402_MICROPAYMENT"
            },
            "features": enterprise_features,
            "access": {
                "tier": "enterprise",
                "expiresAt": (datetime.utcnow() + timedelta(hours=24)).isoformat() + "Z",
                "features": ["Institutional Data", "Advanced AI", "Custom Insights"]
            },
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    }

@router.get("/free")
async def free_content():
    """
    Free content endpoint - no payment required
    
    Returns:
        Free content with AI analysis
    """
    logger.flow('content_delivered', {
        "client": "anonymous",
        "status": "Success",
        "tier": "free"
    })
    
    free_features = generate_free_content()
    
    return {
        "paymentVerified": False,
        "contentTier": "FREE",
        "message": "🎉 FREE CONTENT ACCESS GRANTED",
        "subtitle": "Basic market overview - no payment required",
        "data": {
            "features": free_features,
            "access": {
                "contentId": f"free-{int(time.time() * 1000)}",
                "accessLevel": "FREE_TIER",
                "upgradeMessage": "Upgrade to Premium for advanced analytics and AI insights"
            },
            "developer": {
                "note": "This content is free - no X402 payment required",
                "implementation": "Direct access without payment verification",
                "upgrade": "Use /protected, /premium, or /enterprise for paid tiers"
            },
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    } 