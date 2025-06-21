"""
Pydantic Models for AI Service

Defines request and response models for the API endpoints.
"""

from typing import Optional
from pydantic import BaseModel

class GenerateRequest(BaseModel):
    """Request model for report generation"""
    tier: str
    user_prompt: Optional[str] = ""

class GenerateResponse(BaseModel):
    """Response model for generated reports"""
    content: str
    source: str  # "openai" or "boilerplate"
    tier: str
    market_data: dict
    key_insights: list
    timestamp: str

class HealthResponse(BaseModel):
    """Response model for health check"""
    status: str
    service: str
    version: str
    openai_available: bool
    use_ai_responses: bool

class RootResponse(BaseModel):
    """Response model for root endpoint"""
    service: str
    version: str
    endpoints: dict 