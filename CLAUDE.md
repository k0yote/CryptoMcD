# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
npm install    # Install dependencies
npm run dev    # Start development server (opens on port 3000)
npm run build  # Build for production (outputs to /build)
```

## Project Overview

CryptoPay is a React-based food ordering demo application that supports cryptocurrency payments (USDC, JPYC on multiple networks) and traditional card payments via Stripe. The app simulates a McDonald's-style ordering experience with passkey authentication and passkey-based wallet generation.

## Architecture

**Stack:** React 18 + TypeScript + Vite + Tailwind CSS + Radix UI primitives + Reown AppKit + react-i18next

**Key Application Flow:**
1. `SimpleLandingPage` - Product menu with shopping cart
2. `SimpleCheckout` - Multi-step checkout: auth → payment selection → QR/Stripe → success
3. `PaymentHistory` - Order history with localStorage persistence

**Component Organization:**
- `/src/components/` - Application-specific components (checkout flow, landing pages, payment screens)
- `/src/components/ui/` - shadcn/ui component library (Radix-based primitives)
- `/src/components/landing/` - Marketing/landing page sections
- `/src/components/figma/` - Figma export utilities

**Library Services (`/src/lib/`):**
- `appkit.ts` - Reown AppKit configuration for wallet connection (supports Smart Accounts)
- `passkey.ts` - WebAuthn/FIDO2 passkey authentication
- `passkeyWallet.ts` - Passkey-based Ethereum wallet generation using P-256 curve
- `i18n.ts` - Internationalization configuration (English/Japanese)

**Path Aliasing:** Use `@/` prefix for imports from `/src` (configured in vite.config.ts)

**Internationalization:**
- Supported languages: English (`en`), Japanese (`ja`)
- Translation files: `/src/locales/en.json`, `/src/locales/ja.json`
- Uses react-i18next with browser language detection

## Authentication Methods

1. **Passkey Wallet** - Generate Ethereum wallet using WebAuthn P-256 keypair
   - Uses secp256r1 (P-256) curve supported by Ethereum Fusaka upgrade (EIP-7951/RIP-7212)
   - Creates ERC-4337 Smart Account compatible addresses
   - No seed phrase required - secured by device biometrics
   - Primary login method with wallet generation
2. **Wallet Connection** - MetaMask, WalletConnect via Reown AppKit
   - For users with existing external wallets

## Payment Methods Supported

- USDC/JPYC stablecoins on Base, Polygon, Avalanche, Ethereum networks
- Credit/Debit card via Stripe
- Wallet connection (MetaMask, WalletConnect)

## Environment Variables

```bash
VITE_REOWN_PROJECT_ID=<your-reown-project-id>  # Get from https://cloud.reown.com
```
