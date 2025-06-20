"""
Content Routes Module

Handles different content tiers and their respective endpoints.
"""

from fastapi import APIRouter
from ...shared.utils.logger import logger

router = APIRouter()


@router.get("/protected")
async def protected_content():
    """
    Protected content endpoint - requires X402 payment
    
    Returns:
        Basic protected content
    """
    logger.info("🎯 PROTECTED ENDPOINT CALLED")
    return {
        "message": "This is protected content!",
        "tier": "protected",
        "description": "Basic protected content requiring X402 payment"
    }


@router.get("/premium")
async def premium_content():
    """
    Premium content endpoint - requires X402 payment
    
    Returns:
        Premium content
    """
    logger.info("🎯 PREMIUM ENDPOINT CALLED")
    return {
        "message": "This is premium content!",
        "tier": "premium",
        "description": "Premium content requiring X402 payment"
    }


@router.get("/enterprise")
async def enterprise_content():
    """
    Enterprise content endpoint - requires X402 payment
    
    Returns:
        Enterprise content
    """
    logger.info("🎯 ENTERPRISE ENDPOINT CALLED")
    return {
        "message": "This is enterprise content!",
        "tier": "enterprise",
        "description": "Enterprise content requiring X402 payment"
    }


@router.get("/free")
async def free_content():
    """
    Free content endpoint - no payment required
    
    Returns:
        Free content
    """
    logger.info("🎯 FREE ENDPOINT CALLED")
    return {
        "message": "This is free content!",
        "tier": "free",
        "description": "Free content - no payment required"
    } 