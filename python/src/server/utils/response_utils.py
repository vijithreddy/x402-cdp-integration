"""
Response Utilities Module

Contains utility functions for creating standardized HTTP responses.
"""

import json
from typing import Dict, Any, Optional
from fastapi.responses import JSONResponse
from ..config import wallet_config


def create_402_response(
    error_message: str, 
    resource_path: str = "/protected",
    price: str = "0.01 USDC",
    network: str = "base-sepolia",
    recipient: Optional[str] = None
) -> JSONResponse:
    """
    Create a standardized 402 Payment Required response
    
    Args:
        error_message: Error message to include in response
        resource_path: The resource path being accessed
        price: Price for the resource
        network: Network for the payment
        recipient: Receiving wallet address (defaults to config)
        
    Returns:
        JSONResponse with 402 status and payment requirements
    """
    if recipient is None:
        recipient = wallet_config.get_receiving_address()
    
    response_data = {
        "x402Version": 1,
        "accepts": [
            {
                "scheme": "exact",
                "network": network,
                "maxAmountRequired": "10000",
                "resource": f"http://localhost:5001{resource_path}",
                "description": "",
                "mimeType": "",
                "outputSchema": {},
                "payTo": recipient,
                "maxTimeoutSeconds": 60,
                "asset": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
                "extra": {
                    "name": "USDC",
                    "version": "2"
                }
            }
        ],
        "error": error_message
    }
    
    return JSONResponse(
        status_code=402,
        content=response_data
    )


def create_error_response(
    status_code: int, 
    error_message: str, 
    details: Optional[Dict[str, Any]] = None
) -> JSONResponse:
    """
    Create a standardized error response
    
    Args:
        status_code: HTTP status code
        error_message: Error message
        details: Optional additional error details
        
    Returns:
        JSONResponse with error information
    """
    content = {"error": error_message}
    if details:
        content["details"] = details
    
    return JSONResponse(
        status_code=status_code,
        content=content
    )


def create_success_response(
    data: Any, 
    status_code: int = 200
) -> JSONResponse:
    """
    Create a standardized success response
    
    Args:
        data: Response data
        status_code: HTTP status code (defaults to 200)
        
    Returns:
        JSONResponse with success data
    """
    return JSONResponse(
        status_code=status_code,
        content=data if isinstance(data, dict) else {"data": data}
    ) 