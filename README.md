# TypeScript Server & CLI Project

A TypeScript project with an Express server and CLI client.

## Project Structure

```
├── package.json                 # Root package.json with shared dependencies
├── tsconfig.json               # Root TypeScript configuration
├── src/
│   ├── server/
│   │   ├── index.ts            # Express server entry point
│   │   ├── routes/             # API routes
│   │   └── middleware/         # Custom middleware
│   ├── client/
│   │   ├── index.ts            # CLI entry point
│   │   └── commands/           # CLI commands
│   └── shared/
│       ├── types/              # Shared types/interfaces
│       └── utils/              # Shared utilities
├── dist/                       # Compiled code
└── scripts/                    # Build and utility scripts
```

## Setup

```bash
npm install
```

## Development

```bash
# Run server in development mode
npm run dev:server

# Run client in development mode
npm run dev:client

# Run both concurrently
npm run dev
```

## Build

```bash
# Build everything
npm run build

# Build server only
npm run build:server

# Build client only
npm run build:client
```

## Production

```bash
# Start server
npm run start:server

# Run client
npm run start:client
```

## Path Aliases

- `@shared/*` → `src/shared/*`
- `@server/*` → `src/server/*`
- `@client/*` → `src/client/*`

## CDP Wallet Management

### Setup Environment Variables

Create a `.env` file with your Coinbase Developer Platform credentials:

```bash
CDP_API_KEY_ID=your-api-key-id
CDP_API_KEY_SECRET=your-api-key-secret
CDP_WALLET_SECRET=your-wallet-secret
```

### CLI Commands

```bash
# Create or get existing EVM wallet
npm run dev:client wallet

# Display wallet information
npm run dev:client info

# Show available commands
npm run dev:client --help
```

### Wallet Features

- **Automatic Creation**: Creates a new EVM wallet if none exists
- **Persistence**: Saves wallet data locally for reuse (wallet-data.json)
- **Secure**: Wallet data file is git-ignored for security
- **Multi-Address Support**: Supports multiple addresses per wallet
- **Default Address**: Automatically assigns a default address for transactions 