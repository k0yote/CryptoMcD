import { SUPPORTED_NETWORKS, type NetworkId } from '../lib/payment-config';

// SVG icons for each chain
const chainSvgs: Record<string, React.ReactNode> = {
  ethereum: (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <g fill="none" fillRule="evenodd">
        <circle fill="#627EEA" cx="16" cy="16" r="16" />
        <g fill="#FFF" fillRule="nonzero">
          <path fillOpacity=".602" d="M16.498 4v8.87l7.497 3.35z" />
          <path d="M16.498 4L9 16.22l7.498-3.35z" />
          <path fillOpacity=".602" d="M16.498 21.968v6.027L24 17.616z" />
          <path d="M16.498 27.995v-6.028L9 17.616z" />
          <path fillOpacity=".2" d="M16.498 20.573l7.497-4.353-7.497-3.348z" />
          <path fillOpacity=".602" d="M9 16.22l7.498 4.353v-7.701z" />
        </g>
      </g>
    </svg>
  ),
  base: (
    <svg viewBox="0 0 111 111" className="w-full h-full">
      <g fill="none">
        <circle fill="#0052FF" cx="55.5" cy="55.5" r="55.5" />
        <path
          d="M55.4 93.1c20.8 0 37.6-16.9 37.6-37.6S76.1 17.9 55.4 17.9c-19.5 0-35.5 14.8-37.4 33.8h49.6v11.7H18c1.9 19 17.9 33.7 37.4 33.7z"
          fill="#FFF"
        />
      </g>
    </svg>
  ),
  polygon: (
    <svg viewBox="0 0 38 33" className="w-full h-full">
      <g fill="none">
        <path
          d="M28.8 11.5c-.7-.4-1.6-.4-2.2 0l-5.2 3.1-3.5 2-5.2 3.1c-.7.4-1.6.4-2.2 0l-4.1-2.4c-.7-.4-1.1-1.1-1.1-1.9v-4.7c0-.8.4-1.5 1.1-1.9l4-2.3c.7-.4 1.5-.4 2.2 0l4 2.3c.7.4 1.1 1.1 1.1 1.9v3.1l3.5-2.1v-3.1c0-.8-.4-1.5-1.1-1.9l-7.4-4.3c-.7-.4-1.6-.4-2.2 0L2.9 6.8c-.7.4-1.1 1.1-1.1 1.9v8.7c0 .8.4 1.5 1.1 1.9l7.5 4.3c.7.4 1.5.4 2.2 0l5.2-3 3.5-2.1 5.2-3c.7-.4 1.6-.4 2.2 0l4 2.3c.7.4 1.1 1.1 1.1 1.9v4.7c0 .8-.4 1.5-1.1 1.9l-4 2.4c-.7.4-1.5.4-2.2 0l-4-2.3c-.7-.4-1.1-1.1-1.1-1.9v-3l-3.5 2.1v3.1c0 .8.4 1.5 1.1 1.9l7.5 4.3c.7.4 1.5.4 2.2 0l7.5-4.3c.7-.4 1.1-1.1 1.1-1.9v-8.7c0-.8-.4-1.5-1.1-1.9l-7.6-4.5z"
          fill="#8247E5"
        />
      </g>
    </svg>
  ),
  avalanche: (
    <svg viewBox="0 0 254 254" className="w-full h-full">
      <g fill="none">
        <circle fill="#E84142" cx="127" cy="127" r="127" />
        <path
          d="M171.8 130.3c4.4-7.6 11.5-7.6 15.9 0l27.4 48.1c4.4 7.6.8 13.8-8 13.8h-55.2c-8.7 0-12.3-6.2-8-13.8l27.9-48.1zm-53.7-93.7c4.4-7.6 11.4-7.6 15.8 0l6.1 11.2 14.7 26.6c3.5 7.2 3.5 15.7 0 22.9l-39 67.4c-4.4 7-11.9 11.3-20.1 11.5H46.1c-8.8 0-12.4-6.1-8-13.7l80-125.9z"
          fill="#FFF"
        />
      </g>
    </svg>
  ),
};

// Main networks to display (excluding testnets)
const mainNetworks: NetworkId[] = ['ethereum', 'base', 'polygon', 'avalanche'];

interface ChainIconProps {
  chainId: NetworkId;
  size?: number;
  showName?: boolean;
}

export function ChainIcon({ chainId, size = 32, showName = false }: ChainIconProps) {
  const network = SUPPORTED_NETWORKS[chainId];
  const svg = chainSvgs[chainId];

  if (!svg) return null;

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="rounded-full overflow-hidden shadow-sm"
        style={{ width: size, height: size }}
      >
        {svg}
      </div>
      {showName && <span className="text-xs text-white/80">{network.name}</span>}
    </div>
  );
}

interface SupportedChainsProps {
  iconSize?: number;
  showNames?: boolean;
  className?: string;
}

export function SupportedChains({
  iconSize = 28,
  showNames = true,
  className = '',
}: SupportedChainsProps) {
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      {mainNetworks.map((networkId) => (
        <ChainIcon key={networkId} chainId={networkId} size={iconSize} showName={showNames} />
      ))}
    </div>
  );
}
