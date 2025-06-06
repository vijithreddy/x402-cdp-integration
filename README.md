# X402 Payment System - Interactive Developer Testbed

A professional X402 micropayment system with interactive CLI for testing and development. Features structured logging, real-time payment flows, and comprehensive developer tooling.

## 🚀 **Quick Start**

```bash
# 1. Clone and install
git clone <your-repo-url>
cd x402-cdp-integration
npm install

# 2. Setup environment (.env file)
cp .env.example .env
# Add your CDP credentials to .env

# 3. One-command setup
npm run setup

# 4. Start testing
npm run dev:server  # Terminal 1
npm run dev:client  # Terminal 2
```

## 📋 **Dependencies**

### Required Dependencies
```json
{
  "@coinbase/cdp-sdk": "^1.12.0",
  "@coinbase/x402": "^0.3.8", 
  "express": "^4.18.0",
  "viem": "^2.30.6",
  "x402-express": "^0.3.4",
  "x402-axios": "^0.3.3",
  "winston": "^3.0.0",
  "axios": "^1.6.0",
  "dotenv": "^16.3.0"
}
```

### Development Dependencies
```json
{
  "@types/express": "^4.17.17",
  "@types/node": "^20.0.0",
  "typescript": "^5.0.0",
  "ts-node": "^10.9.0"
}
```

## 🎮 **Interactive CLI Usage**

### Start the Client
```bash
# Standard mode
npm run dev:client

# Verbose debugging 
npm run dev:client -- --verbose

# Quiet mode (minimal output)
npm run dev:client -- --quiet

# JSON output (for tooling)
npm run dev:client -- --json
```

### Available Commands
Once in the CLI, use these commands:

| Command | Description | Example Output |
|---------|-------------|----------------|
| `test` / `x402` | Test X402 payment flow | Professional payment flow with transaction details |
| `balance` / `bal` | Check USDC balance | Current balance with caching status |
| `fund [amount]` | Add USDC from faucet | Funding status and new balance |
| `info` / `status` | Show wallet information | Address, balance, session status |
| `refresh` / `reload` | Force refresh from blockchain | Updated balance without cache |
| `help` / `h` | Show all commands | Complete command reference |
| `clear` / `cls` | Clear screen | - |
| `exit` / `quit` / `q` | Exit CLI | Graceful session cleanup |

## 📊 **Logging Output**

### Standard Mode
```
X402 Payment Test
Testing protected endpoint access
=================================
Balance: 2.89 USDC → Sufficient for 0.01 USDC payment ✓
Wallet: 0xA35d0FD4a75b50F2Bc71c50a922C8215b9bBE308

[11:03:34] [PAYMENT_REQUEST] Client: 0xA35d...E308
[11:03:39] [PAYMENT_COMPLETE] 0.01 USDC 0xA35d...E308 → Server (4.4s)

Result: ✅ Payment successful
Transaction: 0x78b289e46a5e04df9da40daf7329915d3c66fcd5e97b539dcb8100985822b963
Updated Balance: 2.88 USDC (-0.01)
──────────────────────────────────────────────────
```

### Verbose Mode (`--verbose`)
```
[DEBUG] Viem account ready
{
  "address": "0xA35d0FD4a75b50F2Bc71c50a922C8215b9bBE308",
  "hasSignTypedData": true
}
[DEBUG] CDP Adapter: Signing EIP-712 typed data for X402...
[DEBUG] Response data: { "success": true, "message": "Payment successful!" }
```

### Server Logging
```
X402 Payment Server - Base Sepolia
Listening: http://localhost:3000
==================================
Server Wallet: 0x9c5F...cA36 | Client Wallet: 0xA35d...E308
──────────────────────────────────────────────────

[11:03:34] [REQUEST] Client: 0xA35d...E308
[11:03:34] [PAYMENT_REQUIRED] Client: 0xA35d...E308 | Amount: 0.01 USDC
[11:03:35] [PAYMENT_VERIFIED] 0.01 USDC 0xA35d...E308 → 0x9c5F...cA36
[11:03:35] [CONTENT_DELIVERED] Client: 0xA35d...E308 | Status: Success
```

## ⚙️ **Environment Setup**

### Prerequisites
- **Node.js**: Version 23+
- **CDP Account**: [Coinbase Developer Platform](https://www.coinbase.com/cloud)

### Environment Variables
Copy the example file and add your CDP credentials:
```bash
cp .env-example .env
# Edit .env file with your CDP credentials:
# CDP_API_KEY_ID=your_api_key_id_here
# CDP_API_KEY_SECRET=your_private_key_content_here  
# CDP_WALLET_SECRET=your_wallet_secret_here
```

## 🏗️ **System Architecture**

### Payment Flow
```
Client CLI → X402 Request → 402 Response → EIP-712 Signing → Payment Verification → Content Access
```

### Logging Levels
- **UI**: Clean user interface messages
- **FLOW**: Payment process steps with timestamps
- **DEBUG**: Technical details (verbose mode only)
- **ERROR**: Failures with context
- **TRANSACTION**: Payment-specific logging with amounts and hashes

### Key Features
- **Interactive CLI**: Real-time command interface
- **Professional Logging**: Structured, configurable output
- **Smart Caching**: Optimized balance management
- **Type Safety**: Full TypeScript implementation
- **Error Handling**: Comprehensive error recovery
- **Payment Tracking**: Transaction hashes and timing

## 🔧 **Development Workflow**

1. **Setup**: `npm run setup` (one-time wallet creation)
2. **Server**: `npm run dev:server` (payment endpoint)
3. **Client**: `npm run dev:client` (interactive testing)
4. **Test**: Use `test` command in CLI
5. **Monitor**: Watch structured logs in real-time
6. **Debug**: Use `--verbose` flag for detailed output

## 💳 **Payment Details**

- **Cost**: 0.01 USDC per protected request
- **Network**: Base Sepolia (testnet)
- **Method**: EIP-712 signed authorization
- **Facilitator**: Official Coinbase X402 facilitator

## 🛠️ **Troubleshooting**

### Common Issues
| Issue | Solution |
|-------|----------|
| Missing environment variables | Check `.env` file has all CDP credentials |
| X402 payment failed | Ensure balance > 0.01 USDC, use `fund` command |
| Server not responding | Verify `npm run dev:server` is running |
| Balance not updating | Use `refresh` command to clear cache |

### Debug Commands
```bash
# Verbose client logging
npm run dev:client -- --verbose

# Check server health
curl http://localhost:3000/health

# Fund wallet if balance low
# In CLI: fund 5
```

This testbed provides a complete X402 payment system with professional logging, perfect for developers testing micropayment integrations.

