"""
Market Data Service

Fetches real-time cryptocurrency market data from CoinGecko APIs.
"""

import requests
import logging
from typing import Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class MarketDataService:
    """Service for fetching real-time market data from CoinGecko"""
    
    def __init__(self):
        self.base_url = "https://api.coingecko.com/api/v3"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'X402-AI-Service/1.0'
        })
    
    def get_top_coins_data(self, limit: int = 5) -> Optional[Dict[str, Any]]:
        """Get top cryptocurrencies by market cap"""
        try:
            url = f"{self.base_url}/coins/markets"
            params = {
                'vs_currency': 'usd',
                'order': 'market_cap_desc',
                'per_page': limit,
                'page': 1,
                'sparkline': False
            }
            
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            coins = response.json()
            
            # Format the data for AI consumption
            formatted_coins = []
            for coin in coins:
                formatted_coin = {
                    'name': coin['name'],
                    'symbol': coin['symbol'].upper(),
                    'current_price': coin['current_price'],
                    'market_cap': coin['market_cap'],
                    'total_volume': coin['total_volume'],
                    'price_change_24h': coin['price_change_24h'],
                    'price_change_percentage_24h': coin['price_change_percentage_24h'],
                    'high_24h': coin['high_24h'],
                    'low_24h': coin['low_24h'],
                    'market_cap_rank': coin['market_cap_rank'],
                    'last_updated': coin['last_updated']
                }
                formatted_coins.append(formatted_coin)
            
            logger.info(f"✅ Fetched data for {len(formatted_coins)} top cryptocurrencies")
            return {
                'coins': formatted_coins,
                'timestamp': datetime.utcnow().isoformat(),
                'source': 'coingecko'
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to fetch top coins data: {e}")
            return None
    
    def get_global_market_data(self) -> Optional[Dict[str, Any]]:
        """Get global cryptocurrency market data"""
        try:
            url = f"{self.base_url}/global"
            
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            data = response.json()['data']
            
            # Format the data for AI consumption
            formatted_data = {
                'total_market_cap_usd': data['total_market_cap']['usd'],
                'total_volume_usd': data['total_volume']['usd'],
                'market_cap_change_percentage_24h': data['market_cap_change_percentage_24h_usd'],
                'active_cryptocurrencies': data['active_cryptocurrencies'],
                'markets': data['markets'],
                'market_cap_percentage': data['market_cap_percentage'],
                'updated_at': data['updated_at']
            }
            
            logger.info("✅ Fetched global market data")
            return {
                'global': formatted_data,
                'timestamp': datetime.utcnow().isoformat(),
                'source': 'coingecko'
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to fetch global market data: {e}")
            return None
    
    def get_comprehensive_market_data(self) -> Optional[Dict[str, Any]]:
        """Get comprehensive market data combining top coins and global data"""
        try:
            top_coins = self.get_top_coins_data()
            global_data = self.get_global_market_data()
            
            if not top_coins or not global_data:
                logger.warning("⚠️ Partial market data available")
                return top_coins or global_data
            
            # Combine the data
            comprehensive_data = {
                'top_coins': top_coins['coins'],
                'global_market': global_data['global'],
                'timestamp': datetime.utcnow().isoformat(),
                'source': 'coingecko'
            }
            
            logger.info("✅ Fetched comprehensive market data")
            return comprehensive_data
            
        except Exception as e:
            logger.error(f"❌ Failed to fetch comprehensive market data: {e}")
            return None
    
    def format_market_context_for_ai(self, market_data: Dict[str, Any]) -> str:
        """Format market data as context for AI prompts"""
        if not market_data:
            return "Market data unavailable."
        
        context = "=== REAL-TIME MARKET DATA ===\n\n"
        
        # Add global market info
        if 'global_market' in market_data:
            global_data = market_data['global_market']
            context += f"Global Market Cap: ${global_data['total_market_cap_usd']:,.0f}\n"
            context += f"24h Volume: ${global_data['total_volume_usd']:,.0f}\n"
            context += f"24h Market Cap Change: {global_data['market_cap_change_percentage_24h']:.2f}%\n"
            context += f"Active Cryptocurrencies: {global_data['active_cryptocurrencies']:,}\n\n"
        
        # Add top coins data
        if 'top_coins' in market_data:
            context += "Top 5 Cryptocurrencies:\n"
            for coin in market_data['top_coins']:
                context += f"- {coin['name']} ({coin['symbol']}): ${coin['current_price']:,.2f} "
                context += f"({coin['price_change_percentage_24h']:+.2f}% 24h)\n"
                context += f"  Market Cap: ${coin['market_cap']:,.0f} | Volume: ${coin['total_volume']:,.0f}\n"
            context += "\n"
        
        context += f"Data Source: CoinGecko | Last Updated: {market_data.get('timestamp', 'Unknown')}\n"
        context += "=== END MARKET DATA ===\n\n"
        
        return context

    def format_lightweight_market_context(self, market_data: Dict[str, Any]) -> str:
        """Format lightweight market data for tier1 (basic overview)"""
        if not market_data:
            return "Market data unavailable."
        
        context = "=== REAL-TIME MARKET DATA ===\n\n"
        
        # Add basic global market info
        if 'global_market' in market_data:
            global_data = market_data['global_market']
            context += f"Global Market Cap: ${global_data['total_market_cap_usd']:,.0f}\n"
            context += f"24h Market Cap Change: {global_data['market_cap_change_percentage_24h']:.2f}%\n\n"
        
        # Add top 3 coins data (simplified)
        if 'top_coins' in market_data:
            context += "Top 3 Cryptocurrencies:\n"
            for coin in market_data['top_coins'][:3]:  # Only top 3
                context += f"- {coin['name']} ({coin['symbol']}): ${coin['current_price']:,.2f} "
                context += f"({coin['price_change_percentage_24h']:+.2f}% 24h)\n"
            context += "\n"
        
        context += f"Data Source: CoinGecko | Last Updated: {market_data.get('timestamp', 'Unknown')}\n"
        context += "=== END MARKET DATA ===\n\n"
        
        return context

    def format_enhanced_market_context(self, market_data: Dict[str, Any]) -> str:
        """Format enhanced market data for tier3 (comprehensive analysis)"""
        if not market_data:
            return "Market data unavailable."
        
        context = "=== REAL-TIME MARKET DATA ===\n\n"
        
        # Add comprehensive global market info
        if 'global_market' in market_data:
            global_data = market_data['global_market']
            context += f"Global Market Cap: ${global_data['total_market_cap_usd']:,.0f}\n"
            context += f"24h Volume: ${global_data['total_volume_usd']:,.0f}\n"
            context += f"24h Market Cap Change: {global_data['market_cap_change_percentage_24h']:.2f}%\n"
            context += f"Active Cryptocurrencies: {global_data['active_cryptocurrencies']:,}\n"
            context += f"Active Markets: {global_data['markets']:,}\n\n"
            
            # Add market cap distribution
            if 'market_cap_percentage' in global_data:
                context += "Market Cap Distribution:\n"
                for symbol, percentage in global_data['market_cap_percentage'].items():
                    if percentage > 1.0:  # Only show significant holdings
                        context += f"- {symbol.upper()}: {percentage:.1f}%\n"
                context += "\n"
        
        # Add comprehensive top coins data
        if 'top_coins' in market_data:
            context += "Top 5 Cryptocurrencies (Detailed):\n"
            for coin in market_data['top_coins']:
                context += f"- {coin['name']} ({coin['symbol']}): ${coin['current_price']:,.2f} "
                context += f"({coin['price_change_percentage_24h']:+.2f}% 24h)\n"
                context += f"  Market Cap: ${coin['market_cap']:,.0f} | Volume: ${coin['total_volume']:,.0f}\n"
                context += f"  High 24h: ${coin['high_24h']:,.2f} | Low 24h: ${coin['low_24h']:,.2f}\n"
                context += f"  Rank: #{coin['market_cap_rank']}\n"
            context += "\n"
        
        context += f"Data Source: CoinGecko | Last Updated: {market_data.get('timestamp', 'Unknown')}\n"
        context += "=== END MARKET DATA ===\n\n"
        
        return context

# Global instance
market_data_service = MarketDataService() 