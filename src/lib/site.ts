/**
 * Sections that customers can see. The owner asked (2026-11-15) to hide the ones that are not ready yet:
 * set a section to true to show its links again across the header, footer and home page.
 */
export const liveSections = {
  nutrition: true,
  partner: true,
  ems: true, // EMS equipment page, turned on 2026-11-24
  water: false,
  food: false,
  lifestyle: false,
  about: false,
  search: false,
  careers: true,
} as const;

export type Section = keyof typeof liveSections;
export const isLive = (section: Section) => liveSections[section];

const allNav = [
  { id: "nutrition", label: "Nutrition", href: "/nutrition" },
  { id: "ems", label: "EMS Wellness", href: "/vercenji-ems-wellness-training-suit" },
  { id: "water", label: "Water", href: "/water" },
  { id: "food", label: "Healthy Food", href: "/food" },
  { id: "lifestyle", label: "Lifestyle", href: "/lifestyle" },
  { id: "partner", label: "Partner with us", href: "/partner" },
] as const;

export const mainNav = allNav.filter((item) => isLive(item.id));

export const company = {
  legalName: "Verde Centric Energy LLP",
  brand: "Vercenji",
  gstin: "24ABBFV7993H1ZO",
  copyrightYear: 2026,
  // Confirmed by the owner on 2026-11-13.
  registeredAddress: "Sun Pharma Road, Tandalja, Vadodara 390012, Gujarat, India",
  supportEmail: "support@vercenji.com",
  enquiryEmail: "info@vercenji.com", // EMS demo and quotation requests (owner, 2026-11-24)
  supportPhone: "+91 97254 34579",
  grievanceOfficer: { name: "JS Kumar", email: "info@vercenji.com" },
  disputeCity: "Ahmedabad",
};

export const productDisclaimer =
  "Our nutritional products are not intended to diagnose, treat, cure or prevent any disease. Please consult a qualified healthcare professional before starting any supplement or exercise programme, especially if you are pregnant, nursing, taking medication or have a medical condition.";
