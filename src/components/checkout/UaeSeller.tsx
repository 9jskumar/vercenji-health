import { uaeSeller } from "@/lib/market";

/** "Sold by …" for UAE store orders, from the UAE company details set on the server. */
export function UaeSeller() {
  const s = uaeSeller();
  const parts = [
    s.tradeLicence && `Trade licence ${s.tradeLicence}`,
    s.trn && `TRN ${s.trn}`,
    s.address,
  ].filter(Boolean);
  return (
    <div className="flex flex-col gap-1 text-sm text-stone">
      <span>
        UAE store: prices are in UAE dirhams and include 5% VAT.
        {s.deliveryDays && <> Delivery within the UAE takes {s.deliveryDays}.</>}
      </span>
      {s.name && (
        <span>
          Sold by <strong className="font-semibold text-charcoal">{s.name}</strong>
          {parts.length > 0 && <>, {parts.join(" · ")}</>}.
        </span>
      )}
    </div>
  );
}
