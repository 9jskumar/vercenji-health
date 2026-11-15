import type { OrderStatus } from "@/generated/prisma/enums";
import { customerStatus } from "@/content/account";

const tones = {
  wait: "bg-[#FBF3E4] text-[#7A5A1E]",
  ok: "bg-[#E6EFE7] text-green",
  done: "bg-[#EDEBE5] text-charcoal",
  stop: "bg-[#FBEAEA] text-[#9B2C2C]",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const s = customerStatus[status];
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${tones[s.tone]}`}>{s.label}</span>;
}
