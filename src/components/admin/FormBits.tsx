"use client";

export function Input({ label, name, error, hint, ...rest }: { label: string; name: string; error?: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-semibold">
      {label}
      {hint && <span className="text-xs font-normal text-stone">{hint}</span>}
      <input name={name} className="field font-normal" {...rest} />
      {error && <span className="font-semibold text-[#9B2C2C]">{error}</span>}
    </label>
  );
}

export function TextArea({ label, name, error, hint, ...rest }: { label: string; name: string; error?: string; hint?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-semibold">
      {label}
      {hint && <span className="text-xs font-normal text-stone">{hint}</span>}
      <textarea name={name} rows={3} className="field font-normal" {...rest} />
      {error && <span className="font-semibold text-[#9B2C2C]">{error}</span>}
    </label>
  );
}

export function Notice({ state }: { state: { ok?: boolean; error?: string } }) {
  if (state.error) return <p role="alert" className="m-0 rounded-xl bg-[#FBEAEA] p-3 text-sm font-semibold text-[#9B2C2C]">{state.error}</p>;
  if (state.ok) return <p role="status" className="m-0 text-sm font-semibold text-green">Saved.</p>;
  return null;
}
