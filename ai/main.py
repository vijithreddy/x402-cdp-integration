#!/usr/bin/env python3
"""
AI Service for X402 CDP Integration

This service generates market analysis reports based on payment tiers.
Runs on Unix socket for security and falls back to boilerplate responses.
"""

import logging
import sys
import signal
import asyncio
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

# Import our modular components
from config import (
    SERVICE_NAME, SERVICE_VERSION, HOST, PORT, 
    VALID_TIERS, USE_AI_RESPONSES, logger
)
from models.schemas import GenerateRequest, GenerateResponse, HealthResponse, RootResponse
from core.ai_service import AIService
from core.market_data_extractor import extract_market_data_from_content
from core.ai_response_transformer import AIResponseTransformer

# QUICK FIX: Ensure OPENAI_MODEL and TIER_MODELS are always defined
try:
    from config import OPENAI_MODEL, TIER_MODELS
except ImportError:
    OPENAI_MODEL = "gpt-4o-mini"
    TIER_MODELS = {
        "free": "gpt-3.5-turbo",
        "tier1": "gpt-4o-mini",
        "tier2": "gpt-4o-mini",
        "tier3": "gpt-4o"
    }

# Global variables for graceful shutdown
ai_service = None
app = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan"""
    # Startup
    global ai_service
    logger.info("🚀 Starting AI Service...")
    ai_service = AIService()
    logger.info("✅ AI Service started successfully")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down AI Service...")
    if ai_service and ai_service.openai_client:
        logger.info("🔒 Closing OpenAI client...")
    logger.info("✅ AI Service shutdown complete")

# Initialize FastAPI app with lifespan management
app = FastAPI(
    title="X402 AI Service",
    description="AI-powered market analysis service for X402 payment tiers",
    version=SERVICE_VERSION,
    lifespan=lifespan
)

# Add middleware for security and logging
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]  # Configure appropriately for production
)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for unhandled errors"""
    logger.error(f"❌ Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred",
            "timestamp": datetime.utcnow().isoformat()
        }
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions"""
    logger.warning(f"⚠️ HTTP {exc.status_code}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": f"HTTP {exc.status_code}",
            "message": exc.detail,
            "timestamp": datetime.utcnow().isoformat()
        }
    )

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    try:
        logger.info("🏥 Health check requested")
        
        # Check OpenAI availability
        openai_available = ai_service.openai_client is not None if ai_service else False
        
        # Check market data service
        market_data_available = False
        try:
            if ai_service and hasattr(ai_service, 'market_data_service') and ai_service.market_data_service:
                market_data = ai_service.market_data_service.get_comprehensive_market_data()
                market_data_available = market_data is not None
            else:
                logger.warning("Market data service not initialized on ai_service")
        except Exception as e:
            logger.warning(f"Market data service check failed: {e}")
        
        # Check AI service configuration
        use_ai_responses = USE_AI_RESPONSES
        
        return HealthResponse(
            status="healthy",
            service=SERVICE_NAME,
            version=SERVICE_VERSION,
            openai_available=openai_available,
            use_ai_responses=use_ai_responses,
            market_data_available=market_data_available,
            last_check=datetime.utcnow().isoformat()
        )
    except Exception as e:
        logger.error(f"❌ Health check failed: {e}")
        raise HTTPException(status_code=500, detail="Health check failed")

@app.get("/health/detailed")
async def detailed_health_check():
    """Detailed health check with component status"""
    try:
        logger.info("🏥 Detailed health check requested")
        
        health_status = {
            "status": "healthy",
            "service": SERVICE_NAME,
            "version": SERVICE_VERSION,
            "timestamp": datetime.utcnow().isoformat(),
            "components": {
                "openai": {
                    "status": "unknown",
                    "available": False,
                    "details": None
                },
                "market_data": {
                    "status": "unknown", 
                    "available": False,
                    "details": None
                },
                "configuration": {
                    "status": "healthy",
                    "use_ai_responses": USE_AI_RESPONSES,
                    "model": OPENAI_MODEL,
                    "tier_models": TIER_MODELS
                }
            }
        }
        
        # Check OpenAI service
        try:
            if ai_service and ai_service.openai_client:
                health_status["components"]["openai"] = {
                    "status": "healthy",
                    "available": True,
                    "details": f"OpenAI client initialized, model: {OPENAI_MODEL}"
                }
            else:
                health_status["components"]["openai"] = {
                    "status": "unavailable",
                    "available": False,
                    "details": "OpenAI client not initialized"
                }
        except Exception as e:
            health_status["components"]["openai"] = {
                "status": "error",
                "available": False,
                "details": f"OpenAI client error: {str(e)}"
            }
        
        # Check market data service
        try:
            if ai_service and hasattr(ai_service, 'market_data_service') and ai_service.market_data_service:
                market_data = ai_service.market_data_service.get_comprehensive_market_data()
                if market_data:
                    health_status["components"]["market_data"] = {
                        "status": "healthy",
                        "available": True,
                        "details": f"Connected to CoinGecko API, {len(market_data.get('top_coins', []))} coins fetched"
                    }
                else:
                    health_status["components"]["market_data"] = {
                        "status": "unavailable",
                        "available": False,
                        "details": "Market data service returned no data"
                    }
            else:
                health_status["components"]["market_data"] = {
                    "status": "unavailable",
                    "available": False,
                    "details": "Market data service not initialized"
                }
        except Exception as e:
            health_status["components"]["market_data"] = {
                "status": "error",
                "available": False,
                "details": f"Market data service error: {str(e)}"
            }
        
        # Determine overall status
        component_statuses = [comp["status"] for comp in health_status["components"].values()]
        if "error" in component_statuses:
            health_status["status"] = "degraded"
        elif "unavailable" in component_statuses:
            health_status["status"] = "partial"
        
        return health_status
        
    except Exception as e:
        logger.error(f"❌ Detailed health check failed: {e}")
        raise HTTPException(status_code=500, detail="Detailed health check failed")

@app.get("/health/ready")
async def readiness_check():
    """Readiness check for Kubernetes/container orchestration"""
    try:
        # Check if AI service is properly initialized
        if not ai_service:
            raise HTTPException(status_code=503, detail="AI service not initialized")
        
        # Check if we can at least provide fallback responses
        if not USE_AI_RESPONSES:
            # Service is ready even without AI if fallback is enabled
            return {"status": "ready", "message": "Service ready with fallback responses"}
        
        # Check if OpenAI is available
        if not ai_service.openai_client:
            raise HTTPException(status_code=503, detail="OpenAI service not available")
        
        return {"status": "ready", "message": "Service ready with AI capabilities"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Readiness check failed: {e}")
        raise HTTPException(status_code=503, detail="Service not ready")

@app.get("/health/live")
async def liveness_check():
    """Liveness check for Kubernetes/container orchestration"""
    try:
        # Simple check that the service is responding
        return {
            "status": "alive",
            "timestamp": datetime.utcnow().isoformat(),
            "service": SERVICE_NAME,
            "version": SERVICE_VERSION
        }
    except Exception as e:
        logger.error(f"❌ Liveness check failed: {e}")
        raise HTTPException(status_code=503, detail="Service not alive")

@app.post("/generate/{tier}", response_model=GenerateResponse)
async def generate_report(tier: str, request: GenerateRequest):
    """Generate market analysis report for the specified tier"""
    try:
        logger.info(f"📊 Generating report for tier: {tier}")
        
        # Validate tier
        if tier not in VALID_TIERS:
            logger.warning(f"❌ Invalid tier requested: {tier}")
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid tier. Must be one of: {VALID_TIERS}"
            )
        
        # Validate AI service is available
        if not ai_service:
            logger.error("❌ AI service not initialized")
            raise HTTPException(
                status_code=503,
                detail="AI service is not available"
            )
        
        # Generate AI response
        ai_response = ai_service.generate_ai_response(tier, request.user_prompt)
        
        # Extract market data from content
        market_data = extract_market_data_from_content(ai_response["content"], tier)
        
        # Transform response using AIResponseTransformer
        transformed_response = AIResponseTransformer.transform_ai_response(
            ai_content=ai_response["content"],
            tier=tier,
            market_data=market_data,
            source=ai_response["source"]
        )
        
        logger.info(f"✅ Report generated successfully for tier {tier}")
        return transformed_response
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"❌ Failed to generate report for tier {tier}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to generate report: {str(e)}"
        )

@app.get("/", response_model=RootResponse)
async def root():
    """Root endpoint"""
    logger.debug("🏠 Root endpoint accessed")
    return RootResponse(
        service="X402 AI Service",
        version=SERVICE_VERSION,
        endpoints={
            "health": "/health",
            "generate": "/generate/{tier}",
            "tiers": VALID_TIERS
        }
    )

def signal_handler(signum, frame):
    """Handle shutdown signals gracefully"""
    logger.info(f"📡 Received signal {signum}, shutting down gracefully...")
    sys.exit(0)

if __name__ == "__main__":
    import uvicorn
    
    # Set up signal handlers for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    logger.info(f"🚀 Starting {SERVICE_NAME} v{SERVICE_VERSION}")
    logger.info(f"📍 Server will run on {HOST}:{PORT}")
    logger.info(f"🤖 AI responses enabled: {USE_AI_RESPONSES}")
    logger.info("🔧 Press Ctrl+C to stop the server")
    
    try:
        uvicorn.run(
            app,
            host=HOST,
            port=PORT,
            log_level="info",
            access_log=True
        )
    except KeyboardInterrupt:
        logger.info("👋 Server stopped by user")
    except Exception as e:
        logger.error(f"❌ Server failed to start: {e}")
        sys.exit(1) 