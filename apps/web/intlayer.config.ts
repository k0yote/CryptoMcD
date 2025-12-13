import { type IntlayerConfig } from 'intlayer';
import { syncJSON } from '@intlayer/sync-json-plugin';
import 'dotenv/config';

const config: IntlayerConfig = {
  internationalization: {
    locales: ['en', 'ja', 'ko'],
    defaultLocale: 'en',
  },
  plugins: [
    syncJSON({
      // Single file per locale (i18next compatible format)
      source: ({ locale }) => `./src/locales/${locale}.json`,
    }),
  ],
  ai: {
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    apiKey: process.env.ANTHROPIC_API_KEY,
    applicationContext:
      'CryptoPay - A food ordering demo app supporting cryptocurrency payments (USDC, JPYC) and traditional card payments. The app simulates a fast food ordering experience.',
  },
};

export default config;
