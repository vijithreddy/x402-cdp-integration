"""
Response Utilities for X402 Server

Provides utilities for handling responses, errors, and AI service integration
with comprehensive error handling and fallback mechanisms.
"""

import json
import asyncio
from typing import Dict, Any, Optional, Union
import aiohttp
from fastapi import HTTPException
from ...shared.config import Config
from ...shared.utils.logger import logger

class X402ServerError(Exception):
    """Base error class for X402 server operations"""
    def __init__(self, message: str, code: str = "SERVER_ERROR", status_code: int = 500, details: Optional[Dict] = None):
        super().__init__(message)
        self.code = code
        self.status_code = status_code
        self.details = details or {}

class AIServiceError(X402ServerError):
    """AI service specific errors"""
    def __init__(self, message: str, details: Optional[Dict] = None):
        super().__init__(message, "AI_SERVICE_ERROR", 503, details)

class PaymentError(X402ServerError):
    """Payment specific errors"""
    def __init__(self, message: str, details: Optional[Dict] = None):
        super().__init__(message, "PAYMENT_ERROR", 402, details)

class ContentError(X402ServerError):
    """Content generation errors"""
    def __init__(self, message: str, details: Optional[Dict] = None):
        super().__init__(message, "CONTENT_ERROR", 500, details)

class ErrorHandler:
    """Error handling utilities for the server"""
    
    @staticmethod
    def create_error_response(error: X402ServerError) -> Dict[str, Any]:
        """Create a standardized error response"""
        return {
            "error": {
                "code": error.code,
                "message": error.message,
                "status_code": error.status_code,
                "details": error.details,
                "timestamp": asyncio.get_event_loop().time()
            }
        }
    
    @staticmethod
    def log_error(error: X402ServerError, context: Optional[Dict] = None):
        """Log error with appropriate level and context"""
        log_data = {
            "code": error.code,
            "message": error.message,
            "status_code": error.status_code,
            "details": error.details,
            "context": context
        }
        
        if error.status_code >= 500:
            logger.error(f"❌ Server Error: {error.message}", log_data)
        elif error.status_code >= 400:
            logger.warn(f"⚠️ Client Error: {error.message}", log_data)
        else:
            logger.info(f"ℹ️ Info: {error.message}", log_data)

class AIServiceClient:
    """
    AI Service Client with comprehensive error handling and fallback mechanisms
    """
    
    def __init__(self, config: Config):
        self.config = config
        self.ai_config = config.get_server_config('ai')
        self.base_url = f"http://{self.ai_config['host']}:{self.ai_config['port']}"
        self.timeout = aiohttp.ClientTimeout(total=30)
    
    async def _make_request(self, endpoint: str, data: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Make request to AI service with error handling
        
        Args:
            endpoint: API endpoint to call
            data: Request data (optional)
            
        Returns:
            Response data from AI service
            
        Raises:
            AIServiceError: For various AI service errors
        """
        url = f"{self.base_url}{endpoint}"
        
        try:
            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                if data:
                    async with session.post(url, json=data) as response:
                        if response.status == 503:
                            raise AIServiceError("AI service unavailable", {"status": response.status})
                        elif response.status >= 500:
                            raise AIServiceError(f"AI service error: {response.status}", {"status": response.status})
                        elif response.status >= 400:
                            raise AIServiceError(f"AI service client error: {response.status}", {"status": response.status})
                        
                        response_data = await response.json()
                        return response_data
                else:
                    async with session.get(url) as response:
                        if response.status == 503:
                            raise AIServiceError("AI service unavailable", {"status": response.status})
                        elif response.status >= 500:
                            raise AIServiceError(f"AI service error: {response.status}", {"status": response.status})
                        elif response.status >= 400:
                            raise AIServiceError(f"AI service client error: {response.status}", {"status": response.status})
                        
                        response_data = await response.json()
                        return response_data
                        
        except aiohttp.ClientError as e:
            raise AIServiceError(f"AI service connection failed: {str(e)}", {"connection_error": str(e)})
        except asyncio.TimeoutError:
            raise AIServiceError("AI service request timed out", {"timeout": "30s"})
        except json.JSONDecodeError as e:
            raise AIServiceError(f"Invalid JSON response from AI service: {str(e)}", {"json_error": str(e)})
        except Exception as e:
            raise AIServiceError(f"Unexpected AI service error: {str(e)}", {"unexpected_error": str(e)})
    
    async def generate_content(self, tier: str, prompt: str) -> Dict[str, Any]:
        """
        Generate content from AI service
        
        Args:
            tier: Content tier (free, tier1, tier2, tier3)
            prompt: User prompt
            
        Returns:
            AI service response
            
        Raises:
            AIServiceError: For AI service errors
        """
        try:
            logger.flow('ai_request', {'action': f'Requesting AI content for {tier}', 'prompt_length': len(prompt)})
            
            request_data = {
                "tier": tier,
                "prompt": prompt
            }
            
            response = await self._make_request(f"/generate/{tier}", request_data)
            
            logger.flow('ai_response', {'action': f'Received AI response for {tier}', 'source': response.get('source', 'unknown')})
            
            return response
            
        except AIServiceError:
            # Re-raise AI service errors
            raise
        except Exception as e:
            # Convert any other errors to AI service errors
            raise AIServiceError(f"Failed to generate AI content: {str(e)}", {"tier": tier, "original_error": str(e)})
    
    async def check_health(self) -> Dict[str, Any]:
        """
        Check AI service health
        
        Returns:
            Health status from AI service
            
        Raises:
            AIServiceError: For AI service errors
        """
        try:
            return await self._make_request("/health")
        except AIServiceError:
            # Re-raise AI service errors
            raise
        except Exception as e:
            # Convert any other errors to AI service errors
            raise AIServiceError(f"Failed to check AI service health: {str(e)}", {"original_error": str(e)})

class ResponseBuilder:
    """
    Response builder with standardized structure and error handling
    """
    
    @staticmethod
    def create_success_response(
        payment_verified: bool,
        content_tier: str,
        message: str,
        data: Dict[str, Any],
        subtitle: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a standardized success response
        
        Args:
            payment_verified: Whether payment was verified
            content_tier: Tier of content accessed
            message: Success message
            data: Response data
            subtitle: Optional subtitle
            
        Returns:
            Standardized response structure
        """
        response = {
            "paymentVerified": payment_verified,
            "contentTier": content_tier,
            "message": message,
            "data": data
        }
        
        if subtitle:
            response["subtitle"] = subtitle
            
        return response
    
    @staticmethod
    def create_payment_data(amount: str, paid_by: str, transaction_type: str = "X402") -> Dict[str, Any]:
        """Create payment data structure"""
        return {
            "amount": amount,
            "paidBy": paid_by,
            "timestamp": asyncio.get_event_loop().time(),
            "transactionType": transaction_type
        }
    
    @staticmethod
    def create_access_data(content_id: str, access_level: str, api_calls_remaining: int = 100) -> Dict[str, Any]:
        """Create access data structure"""
        return {
            "contentId": content_id,
            "accessLevel": access_level,
            "validUntil": asyncio.get_event_loop().time() + 3600,  # 1 hour from now
            "apiCallsRemaining": api_calls_remaining
        }
    
    @staticmethod
    def create_fallback_response(tier: str, message: str) -> Dict[str, Any]:
        """
        Create fallback response when AI service is unavailable
        
        Args:
            tier: Content tier
            message: Fallback message
            
        Returns:
            Fallback response structure
        """
        return {
            "content": f"🤖 AI Service Unavailable - {message}",
            "source": "fallback",
            "tier": tier,
            "market_data": {},
            "key_insights": ["AI service is temporarily unavailable", "Using fallback content"],
            "timestamp": asyncio.get_event_loop().time()
        }

class ContentTransformer:
    """
    Transform AI service responses into standardized server responses
    """
    
    @staticmethod
    def transform_ai_response(ai_response: Dict[str, Any], tier: str) -> Dict[str, Any]:
        """
        Transform AI service response to server response format
        
        Args:
            ai_response: Response from AI service
            tier: Content tier
            
        Returns:
            Transformed response for server
        """
        try:
            # Extract AI analysis
            ai_analysis = {
                "content": ai_response.get("content", ""),
                "source": ai_response.get("source", "unknown"),
                "tier": tier,
                "sentiment": ai_response.get("sentiment"),
                "confidence": ai_response.get("confidence"),
                "model": ai_response.get("model"),
                "market_data_used": bool(ai_response.get("market_data"))
            }
            
            # Extract market data
            market_data = ai_response.get("market_data", {})
            
            # Extract key insights
            key_insights = ai_response.get("key_insights", [])
            
            # Create features structure
            features = {
                "aiAnalysis": ai_analysis,
                "marketData": market_data,
                "exclusiveContent": [],
                "keyInsights": key_insights,
                "timestamp": ai_response.get("timestamp", asyncio.get_event_loop().time())
            }
            
            return features
            
        except Exception as e:
            logger.error(f"Failed to transform AI response: {e}", {"ai_response": ai_response, "tier": tier})
            raise ContentError(f"Failed to transform AI response: {str(e)}", {"tier": tier, "original_error": str(e)}) 