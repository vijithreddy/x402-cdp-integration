"""
Configuration module for AI Service

Centralizes all configuration settings and environment variables.
"""

import os
import logging
import yaml
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from ai directory
load_dotenv(Path(__file__).parent / ".env")

# Load centralized config
def load_config():
    """Load configuration from root config.yaml"""
    config_path = Path(__file__).parent.parent / "config.yaml"
    try:
        with open(config_path, 'r') as f:
            return yaml.safe_load(f)
    except Exception as e:
        print(f"Warning: Could not load config.yaml: {e}")
        return {}

config = load_config()
ai_config = config.get('servers', {}).get('ai', {})

# Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
USE_AI_RESPONSES = ai_config.get('use_ai_responses', True)
PROMPTS_DIR = Path(__file__).parent / "prompts"

# Server configuration
HOST = ai_config.get('host', 'localhost')
PORT = ai_config.get('port', 8001)
SERVICE_NAME = "x402-ai-service"
SERVICE_VERSION = "1.0.0"

# OpenAI configuration
OPENAI_MODEL = ai_config.get('openai_model', 'gpt-4o-mini')

# Tier-based model selection
TIER_MODELS = {
    "free": "gpt-3.5-turbo",
    "tier1": "gpt-4o-mini", 
    "tier2": "gpt-4o-mini",
    "tier3": "gpt-4o"
}

# Tier-based parameters
TIER_PARAMS = {
    "free": {
        "max_tokens": 1000,
        "temperature": 0.7
    },
    "tier1": {
        "max_tokens": 1500,
        "temperature": 0.7
    },
    "tier2": {
        "max_tokens": 2000,
        "temperature": 0.6
    },
    "tier3": {
        "max_tokens": 3000,
        "temperature": 0.5
    }
}

# Valid tiers
VALID_TIERS = ["free", "tier1", "tier2", "tier3"]

# Configure logging
def setup_logging():
    """Setup logging based on config"""
    log_level_name = ai_config.get('log_level', 'INFO')
    
    # Convert string log level to logging constant
    log_level_map = {
        "DEBUG": logging.DEBUG,
        "INFO": logging.INFO,
        "WARNING": logging.WARNING,
        "ERROR": logging.ERROR
    }
    log_level = log_level_map.get(log_level_name.upper(), logging.INFO)
    
    # Configure logging
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler('ai_service.log')
        ]
    )
    
    return logging.getLogger(__name__)

# Initialize logger
logger = setup_logging()

# Log configuration for debugging
logger.info(f"🔧 AI Service Configuration:")
logger.info(f"   Host: {HOST}")
logger.info(f"   Port: {PORT}")
logger.info(f"   Log Level: {ai_config.get('log_level', 'INFO')}")
logger.info(f"   OpenAI API Key present: {bool(OPENAI_API_KEY)}")
logger.info(f"   Use AI responses: {USE_AI_RESPONSES}")
logger.info(f"   Default Model: {OPENAI_MODEL}")
logger.info(f"   Tier Models: {TIER_MODELS}")
logger.info(f"   Tier Parameters: {TIER_PARAMS}")
logger.info(f"   Prompts directory: {PROMPTS_DIR}") 