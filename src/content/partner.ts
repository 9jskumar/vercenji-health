// Partner programme content. Descriptions are working text from the approved prototype;
// the owner confirms final wording before launch (plan section 14). No fees, royalties,
// investment figures or returns are ever published (decision 12).

export const partnerModels = [
  { id: "WELLNESS_HUB", anchor: "wellness-hub", name: "Wellness Hub", desc: "A multi-vertical studio combining EMS training, nutrition retail and water delivery.", suits: "investors and operators with retail or fitness experience" },
  { id: "HOME_DIET_NUTRITION", anchor: "home-diet", name: "Home Diet & Nutrition", desc: "Nutrition consultations and product distribution from a home or small office, with meals fulfilled by licensed kitchens.", suits: "qualified nutrition professionals and coaches" },
  { id: "WELLNESS_CORNER", anchor: "wellness-corner", name: "Wellness Corner", desc: "A compact Vercenji counter inside a gym, clinic, pharmacy or residential society.", suits: "existing businesses adding a wellness offer" },
  { id: "CLOUD_KITCHEN", anchor: "cloud-kitchen", name: "Cloud Kitchen Partner", desc: "Prepare Vercenji healthy menus from a licensed kitchen, with our recipes, standards and ordering platform.", suits: "food entrepreneurs and licensed kitchens" },
  { id: "OTHER", anchor: "other", name: "Other partnership", desc: "Distribution, corporate wellness, institutional or another idea you would like us to evaluate.", suits: "distributors, corporates and institutions" },
] as const;

export type PartnerModelId = (typeof partnerModels)[number]["id"];

export const kitchenStructures = [
  "Existing licensed kitchen",
  "New independent cloud kitchen",
  "Compact neighbourhood kitchen",
  "Regional production kitchen",
  "Multi-location kitchen operator",
] as const;

// Bands only: applicants never type figures, and nothing here is a fee or a promise.
export const investmentRanges = [
  "Up to ₹10 lakh",
  "₹10 to 25 lakh",
  "₹25 to 50 lakh",
  "₹50 lakh to 1 crore",
  "Above ₹1 crore",
  "Prefer to discuss",
] as const;

export const launchTimelines = ["Within 3 months", "3 to 6 months", "6 to 12 months", "More than 12 months"] as const;

export const countries = [
  { code: "IN", name: "India" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "ZZ", name: "Other" },
] as const;

export const PRIVACY_NOTICE_VERSION = "draft-2026-11";

export const partnershipDisclaimer =
  "Submitting an application does not create a franchise, partnership, territory right, exclusivity or any obligation on either party. All opportunities are subject to evaluation, due diligence, location suitability, regulatory approvals and the signing of a formal written agreement. Investment, fees, territory, royalties, revenue sharing and support are discussed only after the initial review. Vercenji does not promise or guarantee any income, profit or return on investment.";

export const processSteps = [
  ["Apply online", "Three short steps, about 10 minutes."],
  ["Initial review", "We may ask for more information."],
  ["Discovery meeting", "A call or visit to discuss fit and location."],
  ["Due diligence", "Site, licences and commercial terms."],
  ["Written agreement", "Nothing is binding until both sides sign."],
] as const;

export const partnerFaqs = [
  ["What does it cost to become a partner?", "Investment depends on the model, location and format. We share details after the initial review and discovery meeting, never as a published price."],
  ["Do you offer exclusive territories?", "No territory or exclusivity is offered through this form. Any such terms would only be part of a separate written agreement."],
  ["Can I apply from the UAE?", "Yes. Applications from the UAE are welcome and are reviewed as our UAE plans are confirmed."],
  ["How long does the review take?", "Our partnerships team reviews every application personally. Complex proposals may need a meeting before a decision."],
] as const;
