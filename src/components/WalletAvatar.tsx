import { useMemo } from 'react';

interface WalletAvatarProps {
  address: string;
  size?: number;
  className?: string;
}

/**
 * Generate a deterministic avatar based on wallet address
 * Creates a unique gradient pattern from the address hash
 */
export function WalletAvatar({ address, size = 40, className = '' }: WalletAvatarProps) {
  const avatarStyle = useMemo(() => {
    // Use address to generate deterministic colors
    const hash = address.toLowerCase().slice(2); // Remove 0x prefix

    // Extract color values from different parts of the address
    const color1 = `#${hash.slice(0, 6)}`;
    const color2 = `#${hash.slice(6, 12)}`;
    const color3 = `#${hash.slice(12, 18)}`;

    // Generate angle from address
    const angle = parseInt(hash.slice(18, 20), 16) * 1.4; // 0-360

    return {
      background: `linear-gradient(${angle}deg, ${color1}, ${color2}, ${color3})`,
      width: size,
      height: size,
    };
  }, [address, size]);

  // Generate initials from address
  const initials = useMemo(() => {
    return address.slice(2, 4).toUpperCase();
  }, [address]);

  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-bold shadow-inner ${className}`}
      style={avatarStyle}
    >
      <span style={{ fontSize: size * 0.35, textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
        {initials}
      </span>
    </div>
  );
}
