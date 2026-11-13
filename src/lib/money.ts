const formatters = new Map<string, Intl.NumberFormat>();

/** Formats integer minor units (paise, fils) for display, e.g. 36000 INR -> "₹360". */
export function formatMoney(minor: number, currency = "INR") {
  let f = formatters.get(currency);
  if (!f) {
    f = new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-AE", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    formatters.set(currency, f);
  }
  return f.format(minor / 100);
}
