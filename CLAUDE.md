# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
pnpm install          # Install all dependencies
pnpm dev              # Start all services in development mode
pnpm build            # Build all packages for production
pnpm dev:web          # Start only the web client (port 3000)
pnpm dev:server       # Start only the API server (port 3001)
pnpm dev:facilitator  # Start only the facilitator (port 3003)
```

## Project Overview

CryptoPay is a crypto payment demo application implementing the **x402 protocol** for HTTP-native payments. It supports gasless USDC/JPYC payments via **EIP-3009 (transferWithAuthorization)** where the facilitator covers gas fees.

**Core Features:**
- x402 protocol implementation (HTTP 402 Payment Required)
- Gasless stablecoin transfers via EIP-3009
- Passkey-based wallet generation (P-256/secp256r1)
- Multi-chain testnet support
- GCP KMS signer integration for production

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
│   └── server/                 # Resource server (Hono)
│       └── src/
│           ├── routes/         # API endpoints with x402
│           └── middleware/     # x402 middleware
│
├── packages/
│   ├── facilitator/            # Payment facilitator service
│   │   └── src/
│   │       ├── signers/        # Signer implementations (local, GCP KMS)
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
                                    (Sepolia, Base Sepolia...)
```

### Tech Stack

| Package | Technology | Purpose |
|---------|------------|---------|
| apps/web | React 18 + Vite + Tailwind | Client UI |
| apps/web | tempo.ts + ox | Passkey/WebAuthn P256 signing |
| apps/web | Chainlink | JPY/USD price feed |
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
- Supported by USDC and JPYC contracts

### Chainlink Price Feed (JPY/USD)
- Real-time exchange rate from Chainlink oracle on Sepolia
- Used for JPYC payment amount calculation
- Contract: `0x8A6af2B75F23831ADc973ce6288e5329F63D86c6`
- 1-minute cache with automatic refresh
- Fallback rate if oracle unavailable

**Related Files:**
- `apps/web/src/lib/chainlink.ts` - Chainlink integration
- `apps/web/src/hooks/useJpyRate.ts` - React hook for rate

### Passkey Wallet
- WebAuthn P-256 keypair for wallet generation
- ERC-4337 Smart Account compatible
- No seed phrase - secured by device biometrics

### Passkey Payment Flow (P256 + EIP-7951)

Passkey wallets use P-256 curve (secp256r1) which is different from Ethereum's native secp256k1. This requires special handling:

```
┌─────────────────┐                      ┌─────────────────┐
│  Client (web)   │                      │   Facilitator   │
│                 │                      │                 │
│ 1. User clicks  │                      │                 │
│    "Pay"        │                      │                 │
│                 │                      │                 │
│ 2. Sign EIP-712 │                      │                 │
│    with Passkey │                      │                 │
│    (P256/WebAuthn)                     │                 │
│                 │  3. Send payload     │                 │
│                 │     with P256 sig    │                 │
│                 │ ───────────────────► │                 │
│                 │                      │ 4. Verify P256  │
│                 │                      │    (off-chain   │
│                 │                      │    or via       │
│                 │                      │    EIP-7951)    │
│                 │                      │                 │
│                 │                      │ 5. Execute      │
│                 │  6. Return tx hash   │    transfer     │
│                 │ ◄─────────────────── │                 │
└─────────────────┘                      └─────────────────┘
```

**Key Technical Details:**
- **P256 vs secp256k1**: Token contracts (USDC/JPYC) use `ecrecover` which only verifies secp256k1 signatures. P256 signatures from passkeys can't be verified directly.
- **EIP-7951 (Fusaka upgrade)**: Added P256VERIFY precompile at address `0x100` on Sepolia, enabling on-chain P256 verification.
- **Tempo SDK**: Uses `tempo.ts` for WebAuthnP256 signing (`apps/web/src/lib/passkeySigner.ts`)
- **Demo Mode**: For demo, facilitator executes transfers from its pre-funded account after verifying P256 signature.
- **Production**: Would use ERC-4337 Smart Accounts that verify P256 signatures via the precompile.

**Related Files:**
- `apps/web/src/lib/passkeySigner.ts` - Tempo WebAuthnP256 integration
- `apps/web/src/lib/eip3009.ts` - `createPasskeyEIP3009Authorization()` function
- `apps/web/src/components/DirectPayment.tsx` - Passkey wallet detection and UI
- `packages/facilitator/src/routes/settle.ts` - Passkey payment handling
- `packages/facilitator/src/eip3009/transfer.ts` - `executePasskeyTransfer()` function

## Supported Networks & Tokens (Testnets Only)

| Network | Chain ID | USDC | JPYC |
|---------|----------|------|------|
| Sepolia | 11155111 | ✅ | ✅ |
| Base Sepolia | 84532 | ✅ | ❌ |
| Polygon Amoy | 80002 | ✅ | ✅ |
| Avalanche Fuji | 43113 | ✅ | ✅ |

## Facilitator Signer Types

The facilitator supports multiple signing backends:

| Signer | Env Value | Use Case |
|--------|-----------|----------|
| Local Private Key | `local` | Development, testing |
| GCP KMS secp256k1 | `gcp-kms-secp256k1` | Production (native Ethereum) |
| GCP KMS P-256 | `gcp-kms-p256` | Production (Smart Account) |

## Environment Variables

```bash
# apps/web
VITE_REOWN_PROJECT_ID=<reown-project-id>
VITE_API_URL=http://localhost:3001
VITE_STORE_ADDRESS=<store-wallet-address>

# apps/server
FACILITATOR_URL=http://localhost:3003
STORE_ADDRESS=<store-wallet-address>

# packages/facilitator
SIGNER_TYPE=local                    # local | gcp-kms-secp256k1 | gcp-kms-p256
FACILITATOR_PRIVATE_KEY=<private-key> # For local signer

# GCP KMS (when using gcp-kms-* signer)
GCP_PROJECT_ID=<gcp-project-id>
GCP_KMS_LOCATION=global
GCP_KMS_KEY_RING=<key-ring-name>
GCP_KMS_KEY_ID=<key-id>
GCP_KMS_KEY_VERSION=1

# For P-256 signer with Smart Account
SMART_ACCOUNT_ADDRESS=<smart-account-address>

# Custom RPC URLs (optional)
RPC_URL_SEPOLIA=<sepolia-rpc>
RPC_URL_BASE_SEPOLIA=<base-sepolia-rpc>
RPC_URL_POLYGON_AMOY=<polygon-amoy-rpc>
RPC_URL_AVALANCHE_FUJI=<avalanche-fuji-rpc>
```

## Development

### Adding a new chain
1. Add chain config to `packages/shared/src/constants/chains.ts`
2. Add token addresses to `packages/shared/src/constants/tokens.ts`
3. Add viem chain to `packages/facilitator/src/chains/config.ts`
4. Update `apps/web/src/lib/payment-config.ts`
5. Update `apps/web/src/components/ChainIcons.tsx`

### Adding a new token
1. Verify token supports EIP-3009 (transferWithAuthorization)
2. Add token config to `packages/shared/src/constants/tokens.ts`
3. Add to `apps/web/src/lib/payment-config.ts`

### Adding a new signer type
1. Create signer class in `packages/facilitator/src/signers/`
2. Implement the `Signer` interface
3. Add to factory in `packages/facilitator/src/signers/factory.ts`

## Internationalization

```bash
pnpm --filter @cryptopay/web i18n:build  # Build translation dictionaries
pnpm --filter @cryptopay/web i18n:fill   # Auto-fill missing translations
```

Supported languages: English (`en`), Japanese (`ja`), Korean (`ko`)
