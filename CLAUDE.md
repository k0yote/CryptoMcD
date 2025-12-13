# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
pnpm install          # Install all dependencies
pnpm dev              # Start all services in development mode
pnpm build            # Build all packages for production
pnpm dev:web          # Start only the web client (port 3000)
pnpm dev:server       # Start only the API server (port 3001)
pnpm dev:facilitator  # Start only the facilitator (port 3002)
```

## Project Overview

CryptoPay is a crypto payment demo application implementing the **x402 protocol** for HTTP-native payments. It supports gasless USDC/JPYC payments via **EIP-3009 (transferWithAuthorization)** where the facilitator covers gas fees.

**Core Features:**
- x402 protocol implementation (HTTP 402 Payment Required)
- Gasless stablecoin transfers via EIP-3009
- Passkey-based wallet generation (P-256/secp256r1)
- Multi-chain support: Base, Polygon, Avalanche, Ethereum

## Architecture

### Monorepo Structure

```
cryptopay/
├── apps/
│   ├── web/                    # React client (Vite + Tailwind)
│   │   └── src/
│   │       ├── components/     # UI components
│   │       ├── lib/            # Client utilities
│   │       └── locales/        # i18n translations
│   │
│   └── server/                 # Resource server (Hono/Express)
│       └── src/
│           ├── routes/         # API endpoints with x402
│           └── middleware/     # x402 middleware
│
├── packages/
│   ├── facilitator/            # Payment facilitator service
│   │   └── src/
│   │       ├── eip3009/        # EIP-3009 signature & transfer
│   │       ├── chains/         # Chain-specific configs
│   │       └── routes/         # /verify, /settle endpoints
│   │
│   └── shared/                 # Shared types & utilities
│       └── src/
│           ├── types/          # PaymentPayload, x402 types
│           └── constants/      # Token addresses, chain configs
│
├── package.json                # pnpm workspace config
├── turbo.json                  # Turborepo pipeline
└── pnpm-workspace.yaml
```

### Payment Flow (x402 + EIP-3009)

```
┌─────────────┐                      ┌─────────────────┐
│   Client    │  1. Request resource │  Resource Server │
│   (web)     │ ───────────────────► │    (server)      │
│             │                      │                  │
│             │  2. HTTP 402 +       │                  │
│             │     PaymentRequired  │                  │
│             │ ◄─────────────────── │                  │
│             │                      │                  │
│  3. Sign    │  4. Request +        │                  │
│  EIP-3009   │     PAYMENT-SIGNATURE│                  │
│  message    │ ───────────────────► │                  │
└─────────────┘                      └────────┬────────┘
                                              │
                                     5. POST /settle
                                              │
                                              ▼
                                     ┌─────────────────┐
                                     │   Facilitator   │
                                     │                 │
                                     │ 6. Verify sig   │
                                     │ 7. Execute      │
                                     │    transferWith │
                                     │    Authorization│
                                     │ 8. Pay gas      │
                                     └────────┬────────┘
                                              │
                                              ▼
                                        Blockchain
                                     (Base, Polygon...)
```

### Tech Stack

| Package | Technology | Purpose |
|---------|------------|---------|
| apps/web | React 18 + Vite + Tailwind | Client UI |
| apps/server | Hono | x402 resource server |
| packages/facilitator | Hono + viem | EIP-3009 execution |
| packages/shared | TypeScript | Shared types/utils |
| Build | Turborepo + pnpm | Monorepo management |

## Key Concepts

### x402 Protocol
- HTTP 402 status code for payment required
- `PaymentRequired` header with payment options
- `PAYMENT-SIGNATURE` header with signed authorization
- Facilitator handles blockchain settlement

### EIP-3009 (transferWithAuthorization)
- Gasless ERC-20 transfers via meta-transactions
- User signs EIP-712 typed data off-chain
- Facilitator submits transaction and pays gas
- Supported by USDC v2 contract

### Passkey Wallet
- WebAuthn P-256 keypair for wallet generation
- ERC-4337 Smart Account compatible
- No seed phrase - secured by device biometrics

## Supported Networks & Tokens

| Network | Chain ID | USDC | JPYC |
|---------|----------|------|------|
| Ethereum | 1 | ✓ | ✓ |
| Base | 8453 | ✓ | - |
| Polygon | 137 | ✓ | ✓ |
| Avalanche | 43114 | ✓ | ✓ |

Testnets: Sepolia, Base Sepolia, Polygon Amoy, Avalanche Fuji

## Environment Variables

```bash
# apps/web
VITE_REOWN_PROJECT_ID=<reown-project-id>
VITE_API_URL=http://localhost:3001

# apps/server
FACILITATOR_URL=http://localhost:3002
STORE_ADDRESS=<store-wallet-address>

# packages/facilitator
PRIVATE_KEY=<facilitator-wallet-private-key>  # Pays gas fees
RPC_URL_BASE=<base-rpc-url>
RPC_URL_POLYGON=<polygon-rpc-url>
```

## Development

### Adding a new chain
1. Add chain config to `packages/shared/src/constants/chains.ts`
2. Add token addresses to `packages/shared/src/constants/tokens.ts`
3. Add RPC config to `packages/facilitator/src/chains/`
4. Update `apps/web` chain selector UI

### Adding a new token
1. Verify token supports EIP-3009 (transferWithAuthorization)
2. Add token config to `packages/shared/src/constants/tokens.ts`
3. Update facilitator token whitelist

## Internationalization

```bash
pnpm --filter web i18n:build  # Build translation dictionaries
pnpm --filter web i18n:fill   # Auto-fill missing translations (requires ANTHROPIC_API_KEY)
```

Supported languages: English (`en`), Japanese (`ja`), Korean (`ko`)
