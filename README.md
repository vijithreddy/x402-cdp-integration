# X402 CDP Integration

A comprehensive integration of the X402 payment protocol with Coinbase Developer Platform (CDP), featuring both Python and TypeScript implementations with AI-powered content generation.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- OpenAI API key (for AI features)
- CDP API credentials (for wallet operations)

### Setup
```bash
# Install dependencies and setup environment
npm run setup

# This will:
# - Install TypeScript dependencies
# - Install Python dependencies  
# - Install AI service dependencies
# - Copy OpenAI keys to AI service
```

### Running the Services

**Start all services together:**
```bash
npm run dev
```

**Or start services individually:**

1. **AI Server** (required for AI content):
   ```bash
   npm run ai:server
   ```

2. **TypeScript Server**:
   ```bash
   npm run ts:server
   ```

3. **Python Server**:
   ```bash
   npm run py:server
   ```

4. **TypeScript Client**:
   ```bash
   npm run ts:client
   ```

5. **Python Client**:
   ```bash
   npm run py:client
   ```

## 🧪 Testing

### Test X402 Payments
```bash
# TypeScript client
npm run ts:client
# Then run: tier1, tier2, tier3

# Python client
npm run py:client  
# Then run: tier1, tier2, tier3
```

## 🏗️ Architecture

### Services
- **AI Service** (Port 8001): Python FastAPI microservice for AI content generation
- **TypeScript Server** (Port 5002): Express.js server with X402 middleware
- **Python Server** (Port 5001): FastAPI server with X402 middleware

### Features
- **X402 Payment Integration**: Dynamic payment discovery and processing
- **AI-Powered Content**: Real-time market analysis using OpenAI models
- **Market Data**: Live cryptocurrency data from CoinGecko APIs
- **Multi-Tier Content**: Free, Tier1, Tier2, and Tier3 content levels
- **Comprehensive Error Handling**: Specific error types and fallback mechanisms
- **Health Checks**: Detailed health monitoring for all services

## 🔧 Configuration

All configuration is centralized in `config.yaml`:

```yaml
servers:
  python:
    host: localhost
    port: 5001
    log_level: info
  typescript:
    host: localhost
    port: 5002
    log_level: info
  ai:
    host: localhost
    port: 8001
    log_level: info
    use_ai_responses: true

clients:
  python:
    log_level: info
    verbose: false
  typescript:
    log_level: info
    verbose: false

x402:
  facilitator_url: https://x402.fun
  network: base-sepolia
  scheme: usdc
```

## 📊 Health Monitoring

### Health Checks
```bash
# AI Service
curl http://localhost:8001/health

# TypeScript Server
curl http://localhost:5002/health

# Python Server
curl http://localhost:5001/health
```

## 🛠️ Development

### Project Structure
```
x402-cdp-integration/
├── ai/                    # AI microservice (Python FastAPI)
├── typescript/           # TypeScript client & server
├── python/              # Python client & server
├── scripts/             # Setup and utility scripts
├── config.yaml          # Centralized configuration
└── package.json         # NPM scripts and dependencies
```

### Key Features
- **X402 Protocol**: Full payment integration with CDP SDK v2 compatibility
- **AI Integration**: Real-time market data and AI-powered content generation
- **Error Handling**: Specific error types for different failure modes
- **Health Checks**: Component-level status and diagnostics
- **TypeScript Types**: Comprehensive interfaces for all responses

## 🔍 Troubleshooting

### AI Server Issues
If `npm run ai:server` fails, run directly:
```bash
cd ai && python3 main.py
```

### Common Issues
1. **Port conflicts**: Check if ports 5001, 5002, 8001 are available
2. **OpenAI API**: Ensure OPENAI_API_KEY is set in ai/.env
3. **CDP credentials**: Verify CDP API key and secret are configured
4. **Architecture issues**: On Apple Silicon Macs, reinstall pydantic if needed

## 📝 License

MIT License - see LICENSE file for details.

