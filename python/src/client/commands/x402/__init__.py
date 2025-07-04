"""
X402 Commands Module

Shared utilities and configurations for X402 payment commands.
"""

from typing import Dict, Any, Optional
from dataclasses import dataclass
from src.shared.utils.logger import logger
from src.shared.utils.wallet_manager import WalletManager
from src.client.core.custom_x402_client import CustomX402Client
from cdp import CdpClient
from src.shared.config import get_cdp_config


@dataclass
class X402EndpointConfig:
    """Configuration for X402 endpoints"""
    endpoint: str
    expected_cost: str
    tier: str
    tier_name: str
    description: str


# X402 endpoint configurations for all tiers
X402_ENDPOINTS: Dict[str, X402EndpointConfig] = {
    "tier1": X402EndpointConfig(
        endpoint="/protected",
        expected_cost="~0.01 USDC",
        tier="tier1",
        tier_name="Basic Premium",
        description="Basic premium features with AI analysis and market data"
    ),
    "tier2": X402EndpointConfig(
        endpoint="/premium",
        expected_cost="~0.1 USDC",
        tier="tier2",
        tier_name="Premium Plus",
        description="Advanced AI models, predictive analytics, and exclusive reports"
    ),
    "tier3": X402EndpointConfig(
        endpoint="/enterprise",
        expected_cost="~1.0 USDC",
        tier="tier3",
        tier_name="Enterprise",
        description="Enterprise analytics, institutional data, and custom insights"
    )
}


async def validate_balance_for_x402(wallet_manager: WalletManager) -> Optional[float]:
    """
    Validate user balance for X402 payments
    
    Args:
        wallet_manager: Wallet manager instance
        
    Returns:
        Balance amount if valid, None if insufficient
    """
    try:
        # Check balance first with validation
        logger.flow('balance_check', {'action': 'Checking wallet balance'})
        balance = await wallet_manager.get_usdc_balance()
        logger.ui(f"Balance: {balance} USDC → {'Available for X402 payments ✓' if balance > 0 else 'Zero balance - no funds available ✗'}")
        
        # Validate balance for any potential payment
        if balance is None or balance < 0:
            logger.error('Invalid balance detected', {'balance': balance})
            return None
        
        if balance == 0:
            logger.error('No USDC balance available for potential payments')
            logger.ui('💡 Type "fund" to add USDC for X402 payments')
            logger.ui('ℹ️  X402 uses dynamic pricing - we discover costs during the request')
            return None

        return balance
    except Exception as e:
        logger.error('Failed to check balance', e)
        return None


async def create_x402_client(wallet_manager: WalletManager, wallet_address: str):
    """
    Create X402-enabled client with CDP account
    
    Args:
        wallet_manager: Wallet manager instance
        wallet_address: Wallet address to use
        
    Returns:
        Tuple of (x402_client, account)
    """
    logger.flow('client_init', {'action': 'Creating X402-enabled client'})
    
    try:
        # Get CDP account
        config = get_cdp_config()
        async with CdpClient(
            api_key_id=config.api_key_id,
            api_key_secret=config.api_key_secret,
            wallet_secret=config.wallet_secret
        ) as cdp:
            account = await cdp.evm.get_account(wallet_address)
            
            if not account or not getattr(account, 'address', None):
                raise Error('Invalid account data')
            
            logger.ui(f"Wallet: {account.address}")
            
            # Create X402 client
            x402_client = CustomX402Client(account)
            
            return x402_client, account
            
    except Exception as e:
        logger.error('Failed to create X402 client', e)
        raise


def display_premium_content(response_data: Dict[str, Any], config: X402EndpointConfig):
    """
    Display premium content response in a formatted way
    
    Args:
        response_data: Response data from the server
        config: Endpoint configuration
    """
    if not response_data:
        return
    
    logger.ui(f"\n{config.tier_name.upper()} CONTENT ACCESSED")
    logger.ui("═══════════════════════════════════════════════════════════")
    
    # Payment verification status
    if response_data.get('paymentVerified'):
        logger.ui(f"✅ PAYMENT VERIFIED - Access Granted to {config.tier_name}")
    
    if response_data.get('message'):
        logger.ui(f"📢 {response_data['message']}")
    
    if response_data.get('subtitle'):
        logger.ui(f"   {response_data['subtitle']}")
    
    # Display rich content from data field
    if response_data.get('data'):
        data = response_data['data']
        
        # Payment details
        if data.get('payment'):
            payment = data['payment']
            logger.ui(f"\n💳 Payment Details:")
            logger.ui(f"   Amount: {payment.get('amount', 'N/A')}")
            logger.ui(f"   Paid By: {payment.get('paidBy', 'N/A')}")
            logger.ui(f"   Transaction: {payment.get('transactionType', 'N/A')}")
        
        # AI Analysis (for protected/premium tiers)
        if data.get('premiumFeatures', {}).get('aiAnalysis'):
            ai = data['premiumFeatures']['aiAnalysis']
            logger.ui(f"\n🤖 AI Analysis:")
            logger.ui(f"   Sentiment: {ai.get('sentiment', 'N/A')}")
            logger.ui(f"   Confidence: {ai.get('confidence', 'N/A')}")
            logger.ui(f"   Summary: {ai.get('summary', 'N/A')}")
            if ai.get('keywords'):
                logger.ui(f"   Keywords: {', '.join(ai['keywords'])}")
        
        # AI Models (for premium tier)
        if data.get('premiumPlusFeatures', {}).get('aiModels'):
            ai = data['premiumPlusFeatures']['aiModels']
            logger.ui(f"\n🤖 Advanced AI Models:")
            logger.ui(f"   Sentiment: {ai.get('sentiment', 'N/A')}")
            logger.ui(f"   Confidence: {ai.get('confidence', 'N/A')}")
            logger.ui(f"   Model: {ai.get('modelVersion', 'N/A')}")
            logger.ui(f"   Summary: {ai.get('summary', 'N/A')}")
            if ai.get('keywords'):
                logger.ui(f"   Keywords: {', '.join(ai['keywords'])}")
        
        # Advanced AI (for enterprise tier)
        if data.get('enterpriseFeatures', {}).get('advancedAI'):
            ai = data['enterpriseFeatures']['advancedAI']
            logger.ui(f"\n🏛️ Institutional AI:")
            logger.ui(f"   Sentiment: {ai.get('sentiment', 'N/A')}")
            logger.ui(f"   Confidence: {ai.get('confidence', 'N/A')}")
            logger.ui(f"   Model: {ai.get('modelVersion', 'N/A')}")
            logger.ui(f"   Summary: {ai.get('summary', 'N/A')}")
            if ai.get('riskAssessment'):
                risk = ai['riskAssessment']
                logger.ui(f"   Risk Score: {risk.get('score', 'N/A')}")
        
        # Market Data
        market_data = None
        if data.get('premiumFeatures', {}).get('marketData'):
            market_data = data['premiumFeatures']['marketData']
        elif data.get('premiumPlusFeatures', {}).get('marketData'):
            market_data = data['premiumPlusFeatures']['marketData']
        
        if market_data:
            logger.ui(f"\n📊 Market Data:")
            if market_data.get('predictiveModel'):
                model = market_data['predictiveModel']
                logger.ui(f"   Next Hour: {model.get('nextHour', 'N/A')}")
                if model.get('nextDay'):
                    logger.ui(f"   Next Day: {model.get('nextDay', 'N/A')}")
                logger.ui(f"   Accuracy: {model.get('accuracy', 'N/A')}")
                if model.get('signals'):
                    logger.ui(f"   Signals: {', '.join(model['signals'])}")
        
        # Institutional Data (for enterprise tier)
        if data.get('enterpriseFeatures', {}).get('institutionalData'):
            inst = data['enterpriseFeatures']['institutionalData']
            logger.ui(f"\n🏦 Institutional Data:")
            if inst.get('whaleMovements'):
                logger.ui(f"   Whale Movements: {len(inst['whaleMovements'])} tracked")
            if inst.get('darkPoolActivity'):
                dark = inst['darkPoolActivity']
                logger.ui(f"   Dark Pool Volume: {dark.get('volume24h', 'N/A')}")
            if inst.get('yieldOpportunities'):
                logger.ui(f"   Yield Opportunities: {len(inst['yieldOpportunities'])} available")
        
        # Access information
        if data.get('access'):
            access = data['access']
            logger.ui(f"\n🎫 Access Information:")
            logger.ui(f"   Level: {access.get('accessLevel', 'N/A')}")
            logger.ui(f"   Valid Until: {access.get('validUntil', 'N/A')}")
            logger.ui(f"   API Calls Remaining: {access.get('apiCallsRemaining', 'N/A')}")
        
        # Insights
        if data.get('insights'):
            logger.ui(f"\n💡 Key Insights:")
            for insight in data['insights']:
                logger.ui(f"   {insight}")
        
        # Developer information
        if data.get('developer'):
            dev = data['developer']
            logger.ui(f"\n🔧 Developer Info:")
            logger.ui(f"   Implementation: {dev.get('implementation', 'N/A')}")
            logger.ui(f"   Cost: {dev.get('cost', 'N/A')}")
            logger.ui(f"   Billing: {dev.get('billing', 'N/A')}")
    
    # Display tier information (fallback for old format)
    if response_data.get('tier'):
        logger.ui(f"\n🎫 Access Level: {response_data['tier']}")
    
    if response_data.get('description'):
        logger.ui(f"📋 {response_data['description']}")


def handle_x402_error(error: Exception, config: X402EndpointConfig):
    """
    Handle X402 payment errors
    
    Args:
        error: The error that occurred
        config: Endpoint configuration
    """
    logger.error(f"X402 {config.tier_name} payment failed", error)
    logger.ui(f"❌ Failed to access {config.tier_name} content")
    logger.ui(f"💡 Expected cost: {config.expected_cost}")
    logger.ui("🔧 Check your balance and try again")


async def handle_payment_completion(
    response_data: Dict[str, Any], 
    account, 
    duration: str, 
    wallet_manager: WalletManager
):
    """
    Handle payment completion and balance refresh
    
    Args:
        response_data: Response data from the server
        account: CDP account used for payment
        duration: Duration of the request
        wallet_manager: Wallet manager instance
    """
    try:
        # Log transaction details
        logger.info('Payment completed', {
            'amount': 'Dynamically discovered via X402',
            'from': getattr(account, 'address', 'unknown'),
            'to': response_data.get('userAddress', 'Server'),
            'duration': float(duration),
            'status': 'success'
        })
        
        # Refresh balance
        new_balance = await wallet_manager.get_usdc_balance()
        logger.ui(f"💰 Updated Balance: {new_balance} USDC")
        
    except Exception as e:
        logger.error('Failed to handle payment completion', e) 