"use client";

import { useState } from "react";

/** Share links for a vacancy. Plain links, so no third-party scripts or trackers load on the page. */
export function ShareJob({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const text = `${title} at Vercenji`;
  const links = [
    ["LinkedIn", `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`],
    ["WhatsApp", `https://wa.me/?text=${encodeURIComponent(`${text}: ${url}`)}`],
    ["Facebook", `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`],
    ["X", `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`],
    ["Email", `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(`I thought you might be interested in this role: ${url}`)}`],
  ] as const;
  const cls = "rounded-full border border-line bg-white px-3.5 py-2 text-sm font-semibold text-green no-underline hover:border-green";
  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-xs font-bold tracking-[0.14em] text-stone uppercase">Share this job</span>
      <div className="flex flex-wrap gap-2">
        {links.map(([label, href]) => (
          <a key={label} href={href} target="_blank" rel="noopener noreferrer" className={cls}>
            {label}
          </a>
        ))}
        <button
          type="button"
          className={cls}
          onClick={async () => {
            try {
              if (navigator.share) await navigator.share({ title: text, url });
              else {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2500);
              }
            } catch {
              /* the visitor closed the share sheet */
            }
          }}
        >
          {copied ? "Link copied" : "More / copy link"}
        </button>
      </div>
    </div>
  );
}
