"""
X402 Commands Module

Shared utilities and configurations for X402 payment commands.
"""

from typing import Dict, Any, Optional, List
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
    Display premium content response in a professional market analysis report format with tables
    
    Args:
        response_data: Response data from the server
        config: Endpoint configuration
    """
    if not response_data:
        return
    
    # Header
    print("\n" + "=" * 100)
    print(f"📊 {config.tier_name.upper()} MARKET ANALYSIS REPORT")
    print("=" * 100)
    
    # Payment verification status
    if response_data.get('paymentVerified'):
        print(f"✅ Payment Verified - Access Granted to {config.tier_name}")
        print()
    
    if response_data.get('message'):
        print(f"📢 {response_data['message']}")
        print()
    
    # Display rich content from data field
    if response_data.get('data'):
        data = response_data['data']
        
        # Payment details (if available)
        if data.get('payment'):
            payment = data['payment']
            print_table("PAYMENT DETAILS", [
                ["Amount", payment.get('amount', 'N/A')],
                ["Paid By", payment.get('paidBy', 'N/A')],
                ["Transaction", payment.get('transactionType', 'N/A')]
            ])
        
        # Get features data (now standardized across all tiers)
        features_data = data.get('features')
        
        # AI Analysis (for all tiers)
        if features_data:
            # Handle different AI structures
            ai_data = None
            if features_data.get('aiAnalysis'):
                ai_data = features_data['aiAnalysis']
            elif features_data.get('aiModels'):
                ai_data = features_data['aiModels']
            elif features_data.get('advancedAI'):
                ai_data = features_data['advancedAI']
            elif features_data.get('basicAnalysis'):
                ai_data = features_data['basicAnalysis']
            
            if ai_data:
                print_table("AI ANALYSIS", [
                    ["Source", ai_data.get('source', 'N/A')],
                    ["Tier", ai_data.get('tier', config.tier)],
                    ["Sentiment", ai_data.get('sentiment', 'N/A')],
                    ["Confidence", ai_data.get('confidence', 'N/A')]
                ])
                
                if ai_data.get('content'):
                    # Parse and format the AI content professionally
                    format_ai_content_tabular(ai_data['content'])
                elif ai_data.get('summary'):
                    print("📋 ANALYSIS SUMMARY")
                    print("-" * 80)
                    print(f"   {ai_data['summary']}")
                    print()
        
        # Market Data (AI-Generated)
        market_data = None
        if features_data and features_data.get('marketData'):
            market_data = features_data['marketData']
        elif data.get('marketData'):
            market_data = data['marketData']
        
        if market_data:
            if market_data.get('predictiveModel'):
                model = market_data['predictiveModel']
                table_data = [
                    ["Next Hour", model.get('nextHour', 'N/A')],
                    ["Accuracy", model.get('accuracy', 'N/A')]
                ]
                
                if model.get('nextDay'):
                    table_data.append(["Next Day", model.get('nextDay', 'N/A')])
                
                signals = model.get('signals', [])
                if signals:
                    table_data.append(["Signals", ', '.join(signals)])
                else:
                    table_data.append(["Signals", "None available"])
                
                print_table("MARKET DATA (AI-GENERATED)", table_data)
                print("   ℹ️  Note: Market data is AI-generated from real-time analysis")
                print()
        
        # Key Insights
        key_insights = None
        if features_data and features_data.get('keyInsights'):
            key_insights = features_data['keyInsights']
        elif data.get('keyInsights'):
            key_insights = data['keyInsights']
        elif data.get('insights'):
            key_insights = data['insights']
        
        if key_insights:
            print("💡 KEY INSIGHTS (AI-GENERATED)")
            print("-" * 80)
            for i, insight in enumerate(key_insights, 1):
                print(f"   {i:2d}. {insight}")
            print()
        
        # Exclusive Content
        exclusive_content = None
        if features_data and features_data.get('exclusiveContent'):
            exclusive_content = features_data['exclusiveContent']
        elif features_data and features_data.get('exclusiveFeatures'):
            exclusive_content = features_data['exclusiveFeatures']
        elif features_data and features_data.get('basicFeatures'):
            exclusive_content = features_data['basicFeatures']
        
        if exclusive_content:
            print_table("EXCLUSIVE CONTENT", [
                ["Report ID", exclusive_content.get('reportId', 'N/A')],
                ["Access Level", exclusive_content.get('accessLevel', 'N/A')],
                ["Content Type", exclusive_content.get('contentType', 'N/A')],
                ["Remaining Credits", exclusive_content.get('remainingCredits', 'N/A')]
            ])
        
        # Footer with actual timestamp
        print("=" * 100)
        report_timestamp = data.get('timestamp', 'N/A')
        if report_timestamp != 'N/A':
            # Format timestamp for display
            try:
                from datetime import datetime
                dt = datetime.fromisoformat(report_timestamp.replace('Z', '+00:00'))
                formatted_time = dt.strftime('%Y-%m-%d %H:%M:%S UTC')
                print(f"📅 Report generated at: {formatted_time}")
            except:
                print(f"📅 Report generated at: {report_timestamp}")
        else:
            print(f"📅 Report generated at: {report_timestamp}")
        print(f"🔗 Data source: {config.tier_name} AI Analysis")
        print("=" * 100)


def print_table(title: str, data: List[List[str]]):
    """
    Print a formatted table with title and data
    
    Args:
        title: Table title
        data: List of [key, value] pairs
    """
    print(f"\n{title}")
    print("-" * 80)
    max_key_length = max(len(row[0]) for row in data) if data else 0
    
    for key, value in data:
        print(f"{key:<{max_key_length + 5}} {value}")
    print()


def format_ai_content_tabular(content: str):
    """
    Format AI content into a professional tabular report structure
    
    Args:
        content: Raw AI content string
    """
    lines = content.split('\n')
    current_section = None
    section_data = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Handle section headers
        if line.startswith('### '):
            # Print previous section if exists
            if current_section and section_data:
                print_section_table(current_section, section_data)
                section_data = []
            
            current_section = line.replace('### ', '').strip()
            continue
        
        # Handle key-value pairs
        if '**' in line and ':**' in line:
            parts = line.split(':**')
            if len(parts) == 2:
                key = parts[0].replace('**', '').strip()
                value = parts[1].strip()
                section_data.append([key, value])
                continue
        
        # Handle bullet points
        if line.startswith('- ') or line.startswith('• '):
            bullet = line[2:].strip()
            section_data.append(["•", bullet])
            continue
        
        # Handle numbered lists
        if line.startswith('1. ') or line.startswith('2. ') or line.startswith('3. ') or line.startswith('4. ') or line.startswith('5. '):
            section_data.append(["", line])
            continue
        
        # Handle regular content (paragraphs)
        if line and not line.startswith('###') and not line.startswith('**') and not line.startswith('-') and not line.startswith('•'):
            # For paragraphs, add as description
            if len(line) > 80:
                # Wrap long lines
                words = line.split()
                current_line = ""
                for word in words:
                    if len(current_line + word) > 80:
                        section_data.append(["", current_line])
                        current_line = word
                    else:
                        current_line += " " + word if current_line else word
                if current_line:
                    section_data.append(["", current_line])
            else:
                section_data.append(["", line])
    
    # Print final section
    if current_section and section_data:
        print_section_table(current_section, section_data)


def print_section_table(section_name: str, data: List[List[str]]):
    """
    Print a section as a formatted table
    
    Args:
        section_name: Name of the section
        data: List of [key, value] pairs
    """
    print(f"\n📋 {section_name.upper()}")
    print("-" * 80)
    
    for key, value in data:
        if key == "•":
            print(f"   • {value}")
        elif key == "":
            print(f"   {value}")
        else:
            print(f"   {key}: {value}")
    print()


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