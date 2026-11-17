// Line icons for the careers page, in the style of the site's vertical icons. Decorative: always aria-hidden.
const base = { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1.6 } as const;

export function WhyIcon({ name, size = 40 }: { name: "growth" | "spark" | "team" | "leaf" | "book"; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" {...base}>
      {name === "growth" && (
        <>
          <path d="M8 38l10-10 7 7 15-15" />
          <path d="M31 20h9v9" />
        </>
      )}
      {name === "spark" && (
        <>
          <path d="M24 6v8M24 34v8M6 24h8M34 24h8M11 11l6 6M31 31l6 6M37 11l-6 6M17 31l-6 6" />
          <circle cx="24" cy="24" r="5" />
        </>
      )}
      {name === "team" && (
        <>
          <circle cx="17" cy="16" r="5" />
          <circle cx="32" cy="18" r="4" />
          <path d="M7 38c1.5-7 5.5-11 10-11s8.5 4 10 11" />
          <path d="M28 28c1.2-.6 2.6-1 4-1 4 0 7 3.5 8 9" />
        </>
      )}
      {name === "leaf" && (
        <>
          <path d="M10 38C10 20 22 10 40 9c0 18-11 29-28 29z" />
          <path d="M10 38c8-9 15-15 22-20" />
        </>
      )}
      {name === "book" && (
        <>
          <path d="M8 11c6-2 11-1 16 3 5-4 10-5 16-3v26c-6-2-11-1-16 3-5-4-10-5-16-3z" />
          <path d="M24 14v26" />
        </>
      )}
    </svg>
  );
}

export function MetaIcon({ name }: { name: "pin" | "clock" | "briefcase" | "cap" | "calendar" | "rupee" | "building" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0 text-gold-deep" {...base}>
      {name === "pin" && (
        <>
          <path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z" />
          <circle cx="12" cy="9" r="2.5" />
        </>
      )}
      {name === "clock" && (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 2" />
        </>
      )}
      {name === "briefcase" && (
        <>
          <rect x="3.5" y="7.5" width="17" height="12" rx="2" />
          <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3.5 13h17" />
        </>
      )}
      {name === "cap" && (
        <>
          <path d="M2.5 9.5L12 5l9.5 4.5L12 14z" />
          <path d="M6.5 11.5v4c1.5 1.5 3.5 2.3 5.5 2.3s4-.8 5.5-2.3v-4" />
        </>
      )}
      {name === "calendar" && (
        <>
          <rect x="3.5" y="5" width="17" height="15" rx="2" />
          <path d="M3.5 10h17M8 3v4M16 3v4" />
        </>
      )}
      {name === "rupee" && <path d="M7 5h10M7 9h10M7 5c6 0 6 8 0 8h-.5L14 20" />}
      {name === "building" && (
        <>
          <rect x="5" y="3.5" width="14" height="17" rx="1.5" />
          <path d="M9 8h2M13 8h2M9 12h2M13 12h2M10.5 20.5v-4h3v4" />
        </>
      )}
    </svg>
  );
}
