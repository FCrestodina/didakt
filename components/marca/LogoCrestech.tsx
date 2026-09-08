import { useId } from 'react';

/** Isotipo de Crestech. Mismo path y mismo degradé que `crestech-web/src/components/Logo.tsx`. */
export function LogoCrestech({ size = 32 }: { size?: number }) {
  const gradientId = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="-60 -60 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5DC7B" />
          <stop offset="40%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#8B6914" />
        </linearGradient>
      </defs>
      <path
        d="M 32 -42 A 50 50 0 1 0 32 42 L 24 24 A 33 33 0 1 1 24 -24 Z"
        fill={`url(#${gradientId})`}
      />
      <rect x="-12" y="-8" width="36" height="5" fill={`url(#${gradientId})`} />
      <rect x="3" y="-8" width="6" height="28" fill={`url(#${gradientId})`} />
    </svg>
  );
}
