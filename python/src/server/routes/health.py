"""
Health Check Routes Module

Handles health check and status monitoring endpoints.
"""

from fastapi import APIRouter
from ...shared.utils.logger import logger
from ..config import wallet_config

router = APIRouter()


@router.get("/health")
async def health_check():
    """
    Health check endpoint
    
    Returns:
        Server health status and basic information
    """
    logger.info("🏥 HEALTH CHECK REQUESTED")
    
    try:
        # Get wallet info for health check
        receiving_address = wallet_config.get_receiving_address()
        
        return {
            "status": "healthy",
            "service": "x402-server",
            "version": "1.0.0",
            "wallet": {
                "receiving_address": receiving_address,
                "status": "configured"
            },
            "x402": {
                "enabled": True,
                "facilitator": "https://api.cdp.coinbase.com/platform/v2/x402"
            }
        }
    except Exception as e:
        logger.error(f"❌ Health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "service": "x402-server"
        }


@router.get("/status")
async def status():
    """
    Detailed status endpoint
    
    Returns:
        Detailed server status information
    """
    logger.info("📊 STATUS REQUESTED")
    
    try:
        wallet_config_data = wallet_config.load()
        
        return {
            "status": "operational",
            "service": "x402-server",
            "version": "1.0.0",
            "wallet": {
                "id": wallet_config_data.id,
                "default_address": wallet_config_data.default_address,
                "addresses": wallet_config_data.addresses,
                "accounts": wallet_config_data.accounts
            },
            "endpoints": {
                "protected": "/protected",
                "premium": "/premium", 
                "enterprise": "/enterprise",
                "free": "/free",
                "health": "/health"
            }
        }
    except Exception as e:
        logger.error(f"❌ Status check failed: {e}")
        return {
            "status": "error",
            "error": str(e),
            "service": "x402-server"
        } 