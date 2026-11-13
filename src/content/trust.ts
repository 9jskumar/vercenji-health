// Operational claims shown on the site. A claim marked confirmed: false is NOT rendered.
// The owner must confirm each one is true in practice before it is switched on
// (approved plan, section 10: never publish an unverified claim).
export const trustClaims = {
  batchTesting: {
    confirmed: false,
    short: "Batch-tested products",
    title: "Batch testing",
    body: "Each batch is checked against its specification before release, with certificates of analysis on file.",
  },
  qrVerification: {
    confirmed: false,
    short: "QR batch verification",
    title: "QR batch verification",
    body: "Scan the code on any pack to see its batch, manufacturing and expiry details.",
  },
  reviewedClaims: {
    confirmed: true,
    short: "Reviewed product claims",
    title: "Reviewed claims",
    body: "Every product description is reviewed for the country it is sold in before it is published.",
  },
  securePayments: {
    confirmed: true,
    short: "Secure checkout",
    title: "Secure payments and privacy",
    body: "Payments run on the gateway's secure page. Health information is asked only when a service needs it.",
  },
} as const;

export type TrustKey = keyof typeof trustClaims;
export const confirmedTrust = (Object.keys(trustClaims) as TrustKey[]).filter((k) => trustClaims[k].confirmed);
