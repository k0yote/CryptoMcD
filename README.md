# CryptoPay

A crypto payment demo application implementing the **x402 protocol** for HTTP-native payments. Supports gasless USDC/JPYC payments via **EIP-3009 (transferWithAuthorization)**.

## Features

- **x402 Payment Protocol**
  - HTTP 402 Payment Required flow
  - Gasless stablecoin transfers (facilitator pays gas)
  - EIP-3009 meta-transactions

- **Multi-Wallet Login**
  - Passkey Wallet (biometric authentication, no seed phrase)
  - MetaMask
  - WalletConnect (Coinbase, etc.)

- **Crypto Payments**
  - USDC and JPYC stablecoin support
  - QR code payment for external wallets
  - Direct payment from connected wallet

- **Multi-Network Support** (Testnets only)
  - Ethereum Sepolia
  - Base Sepolia
  - Polygon Amoy
  - Avalanche Fuji

- **Stripe Integration**
  - Credit/Debit card payments
  - Stripe Checkout redirect flow

## Architecture

```
cryptopay/
├── apps/
│   ├── web/                    # React client (Vite + Tailwind)
│   └── server/                 # Resource server (Hono)
│
├── packages/
│   ├── facilitator/            # Payment facilitator (EIP-3009)
│   └── shared/                 # Shared types & constants
│
├── pnpm-workspace.yaml
└── turbo.json
```

### Services

| Service | Port | Description |
|---------|------|-------------|
| web | 3000 | React frontend |
| server | 3001 | x402 API server |
| facilitator | 3003 | EIP-3009 transaction executor |

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Hono (lightweight web framework)
- **Blockchain**: viem, wagmi, @reown/appkit
- **Build**: Turborepo + pnpm workspace
- **Auth**: @simplewebauthn (Passkey)

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
pnpm install
```

### Development

```bash
# Start all services
pnpm dev

# Or start individually
pnpm dev:web          # Web client (port 3000)
pnpm dev:server       # API server (port 3001)
pnpm dev:facilitator  # Facilitator (port 3003)
```

### Environment Variables

Create `.env` files in each package:

**apps/web/.env**
```env
VITE_REOWN_PROJECT_ID=your_project_id
VITE_API_URL=http://localhost:3001
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_STORE_ADDRESS=0x...
```

**apps/server/.env**
```env
# Stripe (get keys from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # Optional, for webhook verification
```

**packages/facilitator/.env**
```env
# Signer type: local | gcp-kms-secp256k1 | gcp-kms-p256
SIGNER_TYPE=local

# For local signer
FACILITATOR_PRIVATE_KEY=0x...

# For GCP KMS signer
# GCP_PROJECT_ID=your-project
# GCP_KMS_LOCATION=global
# GCP_KMS_KEY_RING=your-ring
# GCP_KMS_KEY_ID=your-key
```

## Token Availability by Network (Testnets)

| Network | USDC | JPYC |
|---------|------|------|
| Sepolia | ✅ | ✅ |
| Base Sepolia | ✅ | ❌ |
| Polygon Amoy | ✅ | ✅ |
| Avalanche Fuji | ✅ | ✅ |

## Getting Test Tokens

### USDC Faucet

Use the [Circle Faucet](https://faucet.circle.com/) to get free testnet USDC:
- Ethereum Sepolia
- Base Sepolia
- Polygon Amoy
- Avalanche Fuji

### JPYC Faucet

Use the [JPYC Faucet](https://faucet.jpyc.jp/) to get free testnet JPYC:
- Ethereum Sepolia
- Polygon Amoy
- Avalanche Fuji

### Native Tokens (for gas)

- **Sepolia ETH**: [Alchemy Faucet](https://sepoliafaucet.com/)
- **Base Sepolia ETH**: [Base Faucet](https://www.base.org/ecosystem/faucets)
- **Polygon Amoy POL**: [Polygon Faucet](https://faucet.polygon.technology/)
- **Avalanche Fuji AVAX**: [Avalanche Faucet](https://faucet.avax.network/)

## Facilitator Signer Options

The facilitator supports multiple signing backends:

| Signer | Use Case |
|--------|----------|
| `local` | Development, testing |
| `gcp-kms-secp256k1` | Production (native Ethereum signing) |
| `gcp-kms-p256` | Production (Smart Account / EIP-7212) |

## License

MIT
