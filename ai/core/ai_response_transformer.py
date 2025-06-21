"""
AI Response Transformer

Standardizes the AI service response structure for all tiers.
"""

from typing import Any, Dict
from datetime import datetime

class AIResponseTransformer:
    @staticmethod
    def transform_ai_response(ai_content: str, tier: str, market_data: Dict[str, Any], source: str = "openai") -> Dict[str, Any]:
        """
        Standardize the AI response for all tiers.
        Args:
            ai_content: The raw AI-generated content (str)
            tier: The payment tier (str)
            market_data: Extracted market data (dict)
            source: The source of the response ("openai" or "boilerplate")
        Returns:
            dict: Standardized response matching GenerateResponse schema
        """
        return {
            "content": ai_content,
            "source": source,
            "tier": tier,
            "market_data": market_data,
            "key_insights": market_data.get("keyInsights", []),
            "timestamp": datetime.utcnow().isoformat()
        } 