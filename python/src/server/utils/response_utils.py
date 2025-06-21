"""
Response Utilities Module

Contains utility functions for creating standardized HTTP responses.
"""

from fastapi.responses import JSONResponse
from typing import Dict, Any, Optional


def create_error_response(
    status_code: int = 500,
    error_message: str = "Internal server error",
    details: Optional[Dict[str, Any]] = None
) -> JSONResponse:
    """
    Create a standardized error response
    
    Args:
        status_code: HTTP status code
        error_message: Error message
        details: Additional error details
        
    Returns:
        JSONResponse with error format
    """
    response_data = {
        "error": True,
        "message": error_message,
        "status_code": status_code
    }
    
    if details:
        response_data["details"] = details
    
    return JSONResponse(
        status_code=status_code,
        content=response_data
    )


def create_success_response(
    data: Dict[str, Any],
    status_code: int = 200,
    message: str = "Success"
) -> JSONResponse:
    """
    Create a standardized success response
    
    Args:
        data: Response data
        status_code: HTTP status code
        message: Success message
        
    Returns:
        JSONResponse with success format
    """
    response_data = {
        "error": False,
        "message": message,
        "data": data
    }
    
    return JSONResponse(
        status_code=status_code,
        content=response_data
    )


def create_402_response(
    error_message: str = "Payment required",
    details: Optional[Dict[str, Any]] = None
) -> JSONResponse:
    """
    Create a 402 Payment Required response
    
    Args:
        error_message: Error message
        details: Additional error details
        
    Returns:
        JSONResponse with 402 status
    """
    return create_error_response(
        status_code=402,
        error_message=error_message,
        details=details
    ) 