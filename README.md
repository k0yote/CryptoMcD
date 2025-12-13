# CryptoMcD

A crypto payment demo application for a fast-food ordering experience. Pay with stablecoins (USDC, JPYC) or credit card via Stripe.

## Features

- **Multi-Wallet Login**
  - Passkey Wallet (biometric authentication, no seed phrase)
  - MetaMask
  - WalletConnect (Coinbase, etc.)

- **Crypto Payments**
  - USDC and JPYC stablecoin support
  - QR code payment for external wallets
  - Direct payment from connected wallet
  - Real-time balance checking

- **Multi-Network Support** (Testnets only)
  - Ethereum Sepolia
  - Base Sepolia
  - Polygon Amoy
  - Avalanche Fuji

- **Stripe Integration**
  - Credit/Debit card payments
  - Stripe Checkout redirect flow

- **Bilingual Support**
  - English
  - Japanese

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- wagmi / viem (Ethereum interactions)
- @reown/appkit (WalletConnect)
- @simplewebauthn (Passkey authentication)
- @stripe/stripe-js (Stripe payments)
- i18next (Internationalization)
- qrcode.react (QR code generation)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
# WalletConnect Project ID (required for wallet connections)
VITE_WALLETCONNECT_PROJECT_ID=your_project_id

# Store wallet address for receiving payments
VITE_STORE_ADDRESS=0x...

# Stripe (optional - demo mode if not set)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=https://your-api.com
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── SimpleLandingPage.tsx  # Main landing page
│   ├── SimpleCheckout.tsx     # Payment flow
│   ├── LoginModal.tsx         # Authentication modal
│   ├── DirectPayment.tsx      # Wallet payment UI
│   ├── PaymentQRCode.tsx      # QR code payment
│   ├── StripeCheckout.tsx     # Stripe payment
│   ├── BalanceView.tsx        # Wallet balance display
│   └── ProfileMenu.tsx        # User profile dropdown
├── lib/
│   ├── payment-config.ts      # Network & token configuration
│   ├── payment.ts             # Payment utilities
│   ├── stripe.ts              # Stripe integration
│   ├── passkeyWallet.ts       # Passkey wallet logic
│   └── appkit.ts              # WalletConnect config
└── locales/
    ├── en.json                # English translations
    └── ja.json                # Japanese translations
```

## Token Availability by Network (Testnets)

| Network | USDC | JPYC |
|---------|------|------|
| Sepolia | ✅ | ❌ |
| Base Sepolia | ✅ | ❌ |
| Polygon Amoy | ✅ | ✅ |
| Avalanche Fuji | ✅ | ❌ |

## Getting Test USDC

To test payments, you'll need testnet USDC. Use the Circle USDC Faucet to get free test tokens:

| Network | Faucet Link |
|---------|-------------|
| Sepolia | [Circle Faucet](https://faucet.circle.com/) - Select Ethereum Sepolia |
| Base Sepolia | [Circle Faucet](https://faucet.circle.com/) - Select Base Sepolia |
| Polygon Amoy | [Circle Faucet](https://faucet.circle.com/) - Select Polygon Amoy |
| Avalanche Fuji | [Circle Faucet](https://faucet.circle.com/) - Select Avalanche Fuji |

You'll also need testnet native tokens (ETH/POL/AVAX) for gas fees:
- **Sepolia ETH**: [Alchemy Faucet](https://sepoliafaucet.com/) or [Infura Faucet](https://www.infura.io/faucet/sepolia)
- **Base Sepolia ETH**: [Base Faucet](https://www.base.org/ecosystem/faucets)
- **Polygon Amoy POL**: [Polygon Faucet](https://faucet.polygon.technology/)
- **Avalanche Fuji AVAX**: [Avalanche Faucet](https://faucet.avax.network/)

## License

MIT
