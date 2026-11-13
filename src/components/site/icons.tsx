// Line icons from the approved prototype. Decorative: always aria-hidden.
type P = { size?: number; className?: string };
const base = { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const VerticalIcon = {
  nutrition: ({ size = 64, className }: P) => (
    <svg width={size} height={size} viewBox="0 0 48 48" strokeWidth={1.6} className={className} aria-hidden="true" {...base}>
      <path d="M24 42c-9-5-14-12-14-21 6 0 11 3 14 8 3-5 8-8 14-8 0 9-5 16-14 21z" />
      <path d="M24 42V20" />
      <path d="M24 20c0-6 3-10 7-13" />
    </svg>
  ),
  ems: ({ size = 64, className }: P) => (
    <svg width={size} height={size} viewBox="0 0 48 48" strokeWidth={1.6} className={className} aria-hidden="true" {...base}>
      <circle cx="24" cy="9" r="4" />
      <path d="M14 20l10-4 10 4" />
      <path d="M24 16v12l-6 14" />
      <path d="M24 28l6 14" />
    </svg>
  ),
  water: ({ size = 64, className }: P) => (
    <svg width={size} height={size} viewBox="0 0 48 48" strokeWidth={1.6} className={className} aria-hidden="true" {...base}>
      <path d="M24 6c7 9 12 16 12 23a12 12 0 0 1-24 0c0-7 5-14 12-23z" />
      <path d="M18 30a6 6 0 0 0 6 6" />
    </svg>
  ),
  food: ({ size = 64, className }: P) => (
    <svg width={size} height={size} viewBox="0 0 48 48" strokeWidth={1.6} className={className} aria-hidden="true" {...base}>
      <path d="M6 24h36a18 18 0 0 1-36 0z" />
      <path d="M16 18c0-3 2-4 2-7" />
      <path d="M24 18c0-3 2-4 2-7" />
      <path d="M32 18c0-3 2-4 2-7" />
    </svg>
  ),
  lifestyle: ({ size = 64, className }: P) => (
    <svg width={size} height={size} viewBox="0 0 48 48" strokeWidth={1.6} className={className} aria-hidden="true" {...base}>
      <path d="M17 6l-9 5 3 8 4-2v23h18V17l4 2 3-8-9-5c-1 3-4 5-7 5s-6-2-7-5z" />
    </svg>
  ),
};

export const TrustIcon = {
  batchTesting: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" strokeWidth={1.5} aria-hidden="true" {...base}>
      <path d="M9 3h6" />
      <path d="M10 3v6L5 19a1.5 1.5 0 0 0 1.3 2h11.4a1.5 1.5 0 0 0 1.3-2L14 9V3" />
      <path d="M7.5 15h9" />
    </svg>
  ),
  qrVerification: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" strokeWidth={1.5} aria-hidden="true" {...base}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3" />
    </svg>
  ),
  reviewedClaims: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" strokeWidth={1.5} aria-hidden="true" {...base}>
      <path d="M6 3h9l3 3v15H6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  securePayments: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" strokeWidth={1.5} aria-hidden="true" {...base}>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  ),
};

export const Tick = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" strokeWidth={1.8} className="shrink-0 text-gold" aria-hidden="true" {...base}>
    <path d="M5 12l4 4 10-10" />
  </svg>
);
