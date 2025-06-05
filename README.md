# X402 Payment System with CDP SDK Integration

A complete payment system demonstrating X402 micropayments using Coinbase Developer Platform (CDP) SDK for wallet management and viem for blockchain interactions.

## 🌟 Features

- **X402 Micropayments**: Automated payment flow for protected content
- **CDP SDK Integration**: Secure server-side key management 
- **Type-safe Adapter**: Bridges CDP server-side signing with viem client-side interface
- **Interactive CLI**: User-friendly command-line interface for testing
- **Smart Caching**: Optimized balance caching for better performance
- **Base Sepolia Testnet**: Safe testing environment with faucet funding

## 🚀 Quick Start

### Prerequisites

1. **CDP Account**: Sign up at [Coinbase Developer Platform](https://www.coinbase.com/cloud)
2. **Node.js**: Version 18+ required
3. **API Keys**: Get your CDP API credentials

### 1. Setup Environment

Create a `.env` file with your CDP credentials:

```bash
CDP_API_KEY_ID=your_api_key_id_here
CDP_API_KEY_SECRET=your_private_key_content_here  
CDP_WALLET_SECRET=your_wallet_secret_here
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Automated Setup (Recommended)

Run the setup script to create both client and server wallets automatically:

```bash
npm run setup
```

This will:
- ✅ Create a client wallet (for making payments)
- ✅ Create a server wallet (for receiving payments)  
- ✅ Fund the client wallet with 5 USDC from testnet faucet
- ✅ Configure the server to use the new server wallet
- ✅ Save wallet data for both wallets

### 4. Start Testing

Start the server:
```bash
npm run dev:server
```

In another terminal, start the client:
```bash
npm run dev:client
```

## 🎮 CLI Commands

Once the client is running, use these commands:

| Command | Description |
|---------|-------------|
| `balance` | Check current USDC balance |
| `fund` | Add more USDC to wallet (faucet) |
| `test` | Test X402 payment flow |
| `info` | Show wallet information |
| `refresh` | Force refresh balance from blockchain |
| `help` | Show all available commands |
| `exit` / `q` | Quit the CLI |

## 🔧 Manual Setup (Alternative)

If you prefer manual setup or the automated setup fails:

1. **Create Client Wallet**: 
   ```bash
   npm run dev:client
   # Follow prompts to create wallet and fund it
   ```

2. **Create Server Wallet**: 
   - Temporarily rename `wallet-data.json` 
   - Run client again to create a new wallet
   - Save as `server-wallet-data.json`
   - Restore original client wallet data

3. **Configure Server**: Update `src/server/index.ts` with your server wallet address in the `payTo` field

## 🏗️ Architecture

### Payment Flow
```
Client Request → 402 Payment Required → X402 Facilitator → Payment Verification → Content Delivered
```

### Key Components

- **WalletManager**: Manages CDP wallets with smart caching
- **CDP-Viem Adapter**: Bridges CDP server-side signing with viem interface  
- **X402 Middleware**: Handles payment authorization and verification
- **Express Server**: Serves protected content at `/protected` endpoint
- **Interactive CLI**: User-friendly interface for testing payments

### File Structure
```
src/
├── client/           # Interactive CLI client
├── server/           # Express server with X402 middleware
├── shared/
│   ├── cdp-viem-adapter.ts    # CDP-to-viem bridge
│   └── utils/walletManager.ts # Wallet management with caching
setup.ts              # Automated wallet setup script
```

## 💳 X402 Payment Details

- **Cost**: 0.01 USDC per request to `/protected`
- **Network**: Base Sepolia testnet
- **Facilitator**: https://x402.org/facilitator
- **Payment Method**: EIP-712 signed authorization
- **Currency**: USDC (USD Coin)

## 🔍 Example Payment Flow

1. **Client Request**: `GET /protected`
2. **Server Response**: `402 Payment Required` with payment details
3. **Client Authorization**: Signs EIP-712 payment data using CDP
4. **Payment Processing**: X402 facilitator validates and executes
5. **Content Delivery**: Server delivers protected content
6. **Balance Update**: Client balance decreases by 0.01 USDC

## 🛠️ Development

### Build Commands
```bash
npm run build         # Build both server and client
npm run build:server  # Build server only  
npm run build:client  # Build client only
npm run clean         # Remove build artifacts
```

### Production Deployment
```bash
npm run build
npm run start:server  # Start production server
npm run start:client # Start production client
```

## 🐛 Troubleshooting

### Common Issues

**❌ "Missing environment variables"**
- Ensure all CDP credentials are set in `.env` file
- Check that variable names match exactly

**❌ "Failed to create wallet"**  
- Verify CDP API keys are valid and active
- Check internet connectivity
- Ensure CDP account has proper permissions

**❌ "Balance not updating"**
- Use `refresh` command to force cache invalidation
- Check if transactions are confirmed on blockchain
- Verify network connectivity to Base Sepolia

**❌ "X402 payment failed"**
- Ensure sufficient USDC balance (> 0.01)
- Check server is running and accessible
- Verify facilitator service is available

### Debug Mode
Enable verbose logging by setting:
```bash
DEBUG=true npm run dev:client
DEBUG=true npm run dev:server
```

## 📝 Technical Details

### CDP Integration
- Uses CDP SDK v1.12.0 for server-side key management
- Implements custom adapter for viem compatibility
- Handles EIP-712 signing through CDP's `signTypedData` method

### Type Safety
- Full TypeScript implementation with strict typing
- Custom interfaces for CDP responses and wallet data
- Type-safe error handling and validation

### Security
- Private keys managed server-side by CDP
- No sensitive data stored in client code
- Secure payment authorization through X402 protocol

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch  
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues or questions:
- Check the troubleshooting section above
- Review CDP SDK documentation
- Open an issue on GitHub
- Join the X402 community discussions 