import { connection } from "next/server";
import { setMarket } from "@/lib/actions/market";
import { getMarket, MARKETS, uaeStoreOpen } from "@/lib/market";

const tag = { IN: "India · ₹ INR", AE: "UAE · AED" } as const;

/** "India · ₹ INR", or a two-way switch once the UAE store is open. */
export async function MarketSwitch() {
  await connection();
  if (!(await uaeStoreOpen())) return <span>{tag.IN}</span>;
  const current = (await getMarket()).code;
  return (
    <form action={setMarket} className="flex items-center gap-1" aria-label="Choose your store">
      {(Object.keys(MARKETS) as (keyof typeof MARKETS)[]).map((code) => (
        <button
          key={code}
          type="submit"
          name="market"
          value={code}
          aria-pressed={current === code}
          className={`cursor-pointer rounded-full border-0 px-2.5 py-0.5 text-xs ${current === code ? "bg-ivory font-semibold text-forest" : "bg-transparent text-ivory underline"}`}
        >
          {tag[code]}
        </button>
      ))}
    </form>
  );
}
