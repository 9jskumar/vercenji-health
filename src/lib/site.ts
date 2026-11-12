export const mainNav = [
  { id: "nutrition", label: "Nutrition", href: "/nutrition" },
  { id: "ems", label: "EMS Wellness", href: "/ems" },
  { id: "water", label: "Water", href: "/water" },
  { id: "food", label: "Healthy Food", href: "/food" },
  { id: "lifestyle", label: "Lifestyle", href: "/lifestyle" },
  { id: "partner", label: "Partner with us", href: "/partner" },
] as const;

export const company = {
  legalName: "Verde Centric Energy LLP",
  brand: "Vercenji",
  gstin: "24ABBFV7993H1ZO",
  copyrightYear: 2026,
  // The company profile and the purchase order show different addresses; owner to confirm.
  registeredAddress: null as string | null,
};

export const productDisclaimer =
  "Our nutritional products are not intended to diagnose, treat, cure or prevent any disease. Please consult a qualified healthcare professional before starting any supplement or exercise programme, especially if you are pregnant, nursing, taking medication or have a medical condition.";
