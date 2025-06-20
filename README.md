# X402 Payment System - Interactive Developer Playground

A **X402 micropayment system** with modular architecture, comprehensive logging, and tiered payment system. Perfect for learning X402 integration or building payment-protected content APIs.

**Supports both Python and TypeScript implementations** with identical functionality and clean, professional logging.

## 🚀 **Quick Start**

```bash
# 1. Clone the repository
git clone git@github.com:vijithreddy/x402-cdp-integration.git
cd x402-cdp-integration

# 2. Setup environment (.env file)
cp .env-example .env
# Edit .env with your CDP API credentials:
# CDP_API_KEY_ID=your_api_key_id
# CDP_API_KEY_SECRET=your_api_key_secret
# CDP_WALLET_SECRET=your_wallet_secret

# 3. Copy .env to language folders and install dependencies
npm run setup          # Copies .env to typescript/ and python/
npm run setup:ts       # Install TypeScript dependencies
npm run setup:py       # Install Python dependencies

# 4. (Optional) Setup wallets for testing
cd typescript && npm run setup  # Creates and funds test wallets

# 5. Start testing X402 payments
# Choose your preferred language:

# TypeScript:
npm run ts:server  # Terminal 1: TypeScript payment server
npm run ts:client  # Terminal 2: TypeScript interactive CLI

# Python:
npm run py:server  # Terminal 1: Python payment server  
npm run py:client  # Terminal 2: Python interactive CLI
```

## ⚙️ **Configuration**

The project uses a centralized `config.yaml` file at the root level to manage server and client configurations:

### **Server Configuration**
```yaml
servers:
  python:
    port: 5001
    log_level: "INFO"  # DEBUG, INFO, WARNING, ERROR
    host: "localhost"
    
  typescript:
    port: 5002
    log_level: "INFO"
    host: "localhost"
```

### **Client Configuration**
```yaml
clients:
  python:
    log_level: "INFO"
    verbose: false
    
  typescript:
    log_level: "INFO"
    verbose: false
```

### **X402 Configuration**
```yaml
x402:
  facilitator_url: "https://x402.org/facilitator"
  network: "base-sepolia"
  scheme: "exact"
```

### **Running Servers with Config**
```bash
# Python server (uses config.yaml)
npm run py:server

# TypeScript server (uses config.yaml)
npm run ts:server
```

## 🎮 **Interactive CLI Features**

### **Three-Tier Payment System**
Test different pricing models and content quality levels:

| Command | Cost | Content Type | Features |
|---------|------|--------------|----------|
| `free` | **FREE** | Public content | Basic data, 15-min delays, limited features |
| `tier1` | **0.01 USDC** | Basic premium | Real-time AI analysis, market predictions |
| `tier2` | **0.1 USDC** | Premium Plus | Institutional-grade analytics, whale tracking |
| `tier3` | **1.0 USDC** | Enterprise | Custom insights, sub-millisecond data, compliance |

### **Wallet Management Commands**
| Command | Description | Example |
|---------|-------------|---------|
| `balance` / `bal` | Check USDC balance | `💰 Current USDC balance: 4.75 USDC` |
| `fund [amount]` | Add USDC from faucet | `✅ Funding operation completed!` |
| `info` / `status` | Show wallet info | Address, balance, session status |
| `refresh` / `reload` | Force refresh from blockchain | Updates cached balance |

### **Utility Commands**
| Command | Description |
|---------|-------------|
| `help` / `h` | Show all available commands |
| `clear` / `cls` | Clear the screen |
| `exit` / `quit` / `q` | Exit CLI with cleanup |

## 📊 **Server Logging Examples**

### **Clean, Professional Output**
Both Python and TypeScript servers provide identical, clean logging:

```bash
# Free content access
🔄 2025-06-20T21:42:43.801Z [FLOW] free_content_accessed
{
  "client": "public",
  "endpoint": "/free",
  "cost": "FREE",
  "tier": "PUBLIC"
}

# Basic premium payment flow
🔄 2025-06-20T21:42:48.194Z [FLOW] payment_required
{
  "client": "requesting Basic",
  "endpoint": "/protected",
  "amount": "0.01 USDC"
}
ℹ️  2025-06-20T21:42:49.088Z [INFO] Payment verified
{
  "amount": "0.01 USDC",
  "from": "0xA35d...E308",
  "to": "server",
  "status": "success"
}
🔄 2025-06-20T21:42:49.088Z [FLOW] content_delivered
{
  "client": "0xA35d...E308",
  "status": "Success"
}

# Premium Plus payment flow  
🔄 2025-06-20T21:42:55.194Z [FLOW] payment_required
{
  "client": "requesting Premium Plus",
  "endpoint": "/premium",
  "amount": "0.1 USDC"
}
ℹ️  2025-06-20T21:42:56.088Z [INFO] Payment verified
{
  "amount": "0.1 USDC",
  "from": "0xA35d...E308",
  "to": "server",
  "status": "success"
}
🔄 2025-06-20T21:42:56.088Z [FLOW] content_delivered
{
  "client": "0xA35d...E308",
  "status": "Success"
}

# Enterprise payment flow
🔄 2025-06-20T21:43:05.194Z [FLOW] payment_required
{
  "client": "requesting Enterprise",
  "endpoint": "/enterprise",
  "amount": "1.0 USDC"
}
ℹ️  2025-06-20T21:43:06.088Z [INFO] Payment verified
{
  "amount": "1.0 USDC",
  "from": "0xA35d...E308",
  "to": "server",
  "status": "success"
}
🔄 2025-06-20T21:43:06.088Z [FLOW] content_delivered
{
  "client": "0xA35d...E308",
  "status": "Success"
}
```

## 🏗️ **Modular Architecture**

### **🎯 Key Architectural Decision: Centralized X402 Middleware**

**No per-route middleware needed!** We use a **centralized approach**:

```python
# Python: ONE middleware handles ALL payment routes
app.middleware("http")(require_payment(
    path="/protected",
    price=TokenAmount(amount="10000", asset=usdc_asset),
    pay_to_address=wallet_config.get_receiving_address(),
    network_id="base-sepolia"
))
```

```typescript
// TypeScript: ONE middleware handles ALL payment routes
app.use(paymentMiddleware(serverWallet, routeConfigs, facilitator));
```

**Benefits:**
- 🚀 **Simple route handlers** - Just return content, no payment code
- 🔧 **Auto-configuration** - Payment setup derived from route definitions  
- 📊 **Consistent logging** - All payments tracked the same way
- 🛠️ **Easy maintenance** - One place to update payment logic

### **Python Architecture**
```
python/
├── run_server.py              # Server runner with config support
├── src/
│   ├── server/
│   │   ├── app.py             # Main FastAPI app with X402 middleware
│   │   ├── routes/
│   │   │   ├── content.py     # Rich content endpoints (protected, premium, enterprise)
│   │   │   └── health.py      # Health check endpoint
│   │   ├── config/
│   │   │   └── wallet.py      # Wallet configuration
│   │   └── utils/
│   │       └── response.py    # Response utilities
│   ├── client/
│   │   ├── core/
│   │   │   ├── cli.py         # Main CLI with session management
│   │   │   ├── commands.py    # Command registry and router
│   │   │   ├── cdp_signer.py  # CDP account wrapper
│   │   │   └── custom_x402_client.py  # X402 client for CDP integration
│   │   └── commands/
│   │       ├── x402/
│   │       │   ├── __init__.py # Shared utilities & config
│   │       │   ├── tier1.py    # Basic Premium (0.01 USDC)
│   │       │   ├── tier2.py    # Premium Plus (0.1 USDC)
│   │       │   └── tier3.py    # Enterprise (1.0 USDC)
│   │       ├── balance.py      # Wallet balance checking
│   │       ├── fund.py         # Faucet funding
│   │       └── info.py         # Wallet information
│   └── shared/
│       ├── config.py           # Centralized configuration
│       └── utils/
│           ├── logger.py       # Professional logging utilities
│           └── wallet_manager.py # Wallet management
```

### **TypeScript Architecture**
```
typescript/src/
├── client/
│   ├── index.ts               # Clean entry point
│   ├── core/
│   │   ├── cli.ts             # Main CLI class with session management  
│   │   └── commands.ts        # Command registry and router
│   ├── commands/
│   │   ├── balance.ts         # Wallet balance checking
│   │   ├── fund.ts            # Faucet funding
│   │   ├── info.ts            # Wallet information
│   │   ├── free.ts            # Free content test
│   │   ├── help.ts            # Command help system
│   │   └── x402/              # Modular X402 payment system
│   │       ├── index.ts       # Shared utilities & config
│   │       ├── types.ts       # TypeScript interfaces
│   │       ├── tier1.ts       # Basic Premium (0.01 USDC)
│   │       ├── tier2.ts       # Premium Plus (0.1 USDC)
│   │       └── tier3.ts       # Enterprise (1.0 USDC)
│   ├── types/
│   │   └── commands.ts        # CLI command interfaces
│   └── utils/
│       └── display.ts         # Output formatting utilities
└── server/
    ├── index.ts               # Main server with proper imports
    ├── routes/
    │   ├── index.ts           # Route registry with auto-discovery
    │   ├── health.ts          # Health check endpoint
    │   ├── free.ts            # Free content endpoint
    │   ├── protected.ts       # Basic premium (0.01 USDC)
    │   ├── premium-plus.ts    # Premium Plus (0.1 USDC)
    │   └── enterprise.ts      # Enterprise (1.0 USDC)
    ├── middleware/
    │   ├── logging.ts         # Professional request/response logging
    │   └── security.ts        # Security headers & validation
    └── utils/
        └── payment-parser.ts  # X402 payment header parsing
```

## 🏗️ **Monorepo Structure**

```
x402-cdp-integration/
├── .env                    # Shared environment variables
├── .env-example           # Environment template
├── package.json           # Root scripts and metadata
├── typescript/            # TypeScript implementation
│   ├── package.json
│   ├── src/
│   │   ├── client/        # Interactive CLI
│   │   ├── server/        # Payment server
│   │   └── shared/        # Shared utilities
│   └── setup.ts           # Wallet setup script
└── python/                # Python implementation (coming soon)
    ├── requirements.txt
    └── src/
        ├── client/
        ├── server/
        └── shared/
```

## 📦 **Available Commands**

### **Root Level (from x402-cdp-integration/)**
```bash
npm run setup          # Copy .env to language folders
npm run setup:ts       # Install TypeScript dependencies
npm run setup:py       # Install Python dependencies
npm run ts:client      # Start TypeScript CLI
npm run ts:server      # Start TypeScript server
npm run ts:setup       # Setup TypeScript wallets
```

### **TypeScript (from typescript/)**
```bash
npm run setup          # Create and fund test wallets
npm run dev:client     # Start interactive CLI
npm run dev:server     # Start payment server
npm run build          # Build TypeScript code
npm run test           # Run tests
```

