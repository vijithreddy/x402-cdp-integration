"""
Free Command Module

Accesses the free endpoint without requiring payment.
Demonstrates basic API access and response handling.
"""

import asyncio
import aiohttp
from typing import Dict, Any
from src.shared.utils.logger import logger
from src.shared.config import config as shared_config


async def free_command(args: list) -> None:
    """
    Free command implementation
    
    Args:
        args: Command arguments (unused)
    """
    try:
        # Log free endpoint access attempt
        logger.flow('free_endpoint', {
            'action': 'Accessing free endpoint',
            'timestamp': '2025-06-20T03:24:45.110Z'
        })

        # Get server configuration
        server_config = shared_config.get_server_config("python")
        base_url = f"http://{server_config['host']}:{server_config['port']}"
        
        # Create HTTP client and access free endpoint
        logger.ui('\n🔓 Accessing free endpoint...')
        
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{base_url}/free", timeout=aiohttp.ClientTimeout(total=10)) as response:
                if response.status != 200:
                    logger.error(f'Server error: {response.status}')
                    logger.ui(f'💡 Make sure the server is running: npm run py:server')
                    return
                
                response_data = await response.json()
                
                # Validate response format
                if not response_data or not isinstance(response_data, dict):
                    logger.error('Invalid response format from free endpoint')
                    return

                # Display response
                if response_data.get('message'):
                    logger.ui(f"\n📢 {response_data['message']}")
                if response_data.get('subtitle'):
                    logger.ui(f"   {response_data['subtitle']}")

                # Display free content details
                if response_data.get('data'):
                    data = response_data['data']
                    
                    # Basic info
                    if data.get('basicInfo'):
                        info = data['basicInfo']
                        logger.ui(f"\n📋 Basic Information:")
                        logger.ui(f"   Service: {info.get('service', 'N/A')}")
                        logger.ui(f"   Version: {info.get('version', 'N/A')}")
                        logger.ui(f"   Access Level: {info.get('accessLevel', 'N/A')}")
                    
                    # Free features
                    if data.get('freeFeatures'):
                        logger.ui(f"\n✅ Free Features:")
                        for feature in data['freeFeatures']:
                            logger.ui(f"   {feature}")
                    
                    # Limitations
                    if data.get('limitations'):
                        limits = data['limitations']
                        logger.ui(f"\n⚠️  Limitations:")
                        logger.ui(f"   Update Frequency: {limits.get('updateFrequency', 'N/A')}")
                        logger.ui(f"   Data Accuracy: {limits.get('dataAccuracy', 'N/A')}")
                        logger.ui(f"   API Calls/Hour: {limits.get('apiCallsPerHour', 'N/A')}")
                        logger.ui(f"   Support Level: {limits.get('supportLevel', 'N/A')}")
                    
                    # Upgrade info
                    if data.get('upgradeInfo'):
                        upgrade = data['upgradeInfo']
                        logger.ui(f"\n💡 {upgrade.get('note', 'Want more features?')}")
                        logger.ui(f"   {upgrade.get('upgrade', 'Try premium tiers')}")
                        logger.ui(f"   {upgrade.get('benefits', 'Unlock premium features')}")

                # Log successful access
                logger.flow('free_success', {
                    'action': 'Accessed free endpoint',
                    'status': response.status,
                    'timestamp': '2025-06-20T03:24:45.110Z'
                })
                
    except asyncio.TimeoutError:
        logger.error('Request timeout - server may be down')
        logger.ui('💡 Make sure the server is running: npm run py:server')
    except aiohttp.ClientConnectorError:
        logger.error('Network error: Cannot connect to server')
        logger.ui('💡 Make sure the server is running: npm run py:server')
    except Exception as e:
        logger.error('Failed to access free endpoint', e)
        logger.ui('💡 Make sure the server is running: npm run py:server')


# Command registration
COMMANDS = {
    'free': {
        'function': free_command,
        'description': 'Access the free endpoint without payment',
        'usage': 'free'
    }
} 