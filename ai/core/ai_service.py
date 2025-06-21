"""
AI Service Module

Handles OpenAI interactions and response generation.
"""

import logging
import openai
from typing import Dict, Optional

from config import (
    OPENAI_API_KEY, USE_AI_RESPONSES, PROMPTS_DIR,
    OPENAI_MODEL, TIER_MODELS, TIER_PARAMS
)
from core.boilerplate_responses import BOILERPLATE_RESPONSES
from core.market_data_service import market_data_service

logger = logging.getLogger(__name__)

class AIService:
    """Service class for AI interactions"""
    
    def __init__(self):
        """Initialize AI service with OpenAI client if available"""
        self.openai_client = None
        self.market_data_service = market_data_service  # Attach market data service for health checks
        self._initialize_openai_client()
    
    def _initialize_openai_client(self):
        """Initialize OpenAI client if API key is available"""
        if OPENAI_API_KEY:
            try:
                self.openai_client = openai.OpenAI(api_key=OPENAI_API_KEY)
                logger.info("✅ OpenAI client initialized successfully")
                logger.debug(f"Using model: {OPENAI_MODEL}")
            except Exception as e:
                logger.warning(f"⚠️ Failed to initialize OpenAI client: {e}")
                self.openai_client = None
        else:
            logger.info("ℹ️ No OpenAI API key provided, using boilerplate responses")
    
    def load_prompt(self, tier: str) -> str:
        """
        Load prompt template for the specified tier
        
        Args:
            tier: The payment tier
            
        Returns:
            The prompt template content
        """
        prompt_file = PROMPTS_DIR / f"{tier}.txt"
        if prompt_file.exists():
            try:
                with open(prompt_file, 'r') as f:
                    content = f.read()
                logger.debug(f"Loaded prompt template for tier {tier}")
                return content
            except Exception as e:
                logger.error(f"❌ Error loading prompt for tier {tier}: {e}")
        else:
            logger.warning(f"⚠️ Prompt file not found for tier {tier}, using default")
        
        return f"Generate a comprehensive market analysis report for {tier} tier."
    
    def generate_ai_response(self, tier: str, user_prompt: str = "") -> Dict:
        """
        Generate AI response using OpenAI or fallback to boilerplate
        
        Args:
            tier: The payment tier
            user_prompt: Optional additional user prompt
            
        Returns:
            Dictionary containing response data
        """
        if not self.openai_client or not USE_AI_RESPONSES:
            logger.info(f"📋 Using boilerplate response for tier {tier}")
            return {
                "content": BOILERPLATE_RESPONSES.get(tier, BOILERPLATE_RESPONSES["free"]),
                "source": "boilerplate",
                "tier": tier
            }
        
        try:
            # Load tier-specific prompt
            base_prompt = self.load_prompt(tier)
            
            # Fetch real-time market data for all tiers
            market_context = ""
            if tier in ["tier1", "tier2", "tier3"]:
                logger.info(f"📊 Fetching real-time market data for tier {tier}")
                market_data = self.market_data_service.get_comprehensive_market_data()
                if market_data:
                    # Adjust market context based on tier complexity
                    if tier == "tier1":
                        # Lightweight market data for tier1
                        market_context = self.market_data_service.format_lightweight_market_context(market_data)
                    elif tier == "tier2":
                        # Standard comprehensive market data for tier2
                        market_context = self.market_data_service.format_market_context_for_ai(market_data)
                    elif tier == "tier3":
                        # Enhanced comprehensive market data for tier3
                        market_context = self.market_data_service.format_enhanced_market_context(market_data)
                    
                    logger.info("✅ Real-time market data fetched and formatted")
                    logger.info(f"📋 Market context length: {len(market_context)} characters")
                    logger.debug(f"📋 Market context preview: {market_context[:200]}...")
                else:
                    logger.warning("⚠️ Failed to fetch market data, proceeding without it")
            
            # Combine prompt with market data and user prompt
            full_prompt = base_prompt
            if market_context:
                full_prompt = f"{market_context}\n{base_prompt}"
                logger.info(f"📝 Full prompt length: {len(full_prompt)} characters")
                logger.debug(f"📝 Full prompt preview: {full_prompt[:300]}...")
            if user_prompt:
                full_prompt += f"\n\nAdditional context: {user_prompt}"
                logger.debug(f"Added user prompt to {tier} request")
            
            # Get tier-specific model and parameters
            model = TIER_MODELS.get(tier, OPENAI_MODEL)
            params = TIER_PARAMS.get(tier, {"max_tokens": 1000, "temperature": 0.7})
            
            logger.info(f"🤖 Generating AI response for tier {tier} using {model}")
            
            # Call OpenAI API with tier-specific model
            response = self.openai_client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "system", 
                        "content": "You are a professional cryptocurrency market analyst. Provide detailed, accurate, and actionable market analysis. Use the provided real-time market data for accurate analysis."
                    },
                    {
                        "role": "user", 
                        "content": full_prompt
                    }
                ],
                max_tokens=params["max_tokens"],
                temperature=params["temperature"]
            )
            
            content = response.choices[0].message.content
            
            logger.info(f"✅ AI response generated successfully for tier {tier} using {model}")
            logger.debug(f"Response length: {len(content)} characters")
            
            return {
                "content": content,
                "source": "openai",
                "tier": tier,
                "model": model,
                "market_data_used": bool(market_context)
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to generate AI response for tier {tier}: {e}")
            return {
                "content": BOILERPLATE_RESPONSES.get(tier, BOILERPLATE_RESPONSES["free"]),
                "source": "boilerplate",
                "tier": tier
            } 