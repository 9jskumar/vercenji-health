"use client";

export function PickModelButton({ model, children }: { model: string; children: React.ReactNode }) {
  return (
    <a
      href="#apply"
      onClick={() => window.dispatchEvent(new CustomEvent("vercenji:pick-model", { detail: model }))}
      className="btn-ghost mt-auto self-start py-3"
    >
      {children}
    </a>
  );
}
