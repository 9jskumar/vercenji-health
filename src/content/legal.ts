import { company, productDisclaimer } from "@/lib/site";
import { partnershipDisclaimer, PRIVACY_NOTICE_VERSION } from "@/content/partner";

// Policy pages. Every page starts as a DRAFT written from how the website actually works.
// The owner (and their legal adviser) must review the wording and fill in each "toConfirm" item,
// then set approved: true. Draft pages show a review banner and are not indexed by search engines.

export type LegalSection = { heading: string; body: (string | string[])[] };
export type LegalPage = {
  slug: string;
  title: string;
  summary: string;
  version: string;
  approved: boolean;
  toConfirm: string[];
  sections: LegalSection[];
};

const who = `${company.legalName} ("${company.brand}", "we", "us"), GSTIN ${company.gstin}`;

export const legalPages: LegalPage[] = [
  {
    slug: "privacy",
    title: "Privacy notice",
    summary: "What personal information we collect, why, how long we keep it and your rights.",
    version: PRIVACY_NOTICE_VERSION,
    approved: false,
    toConfirm: [
      "Registered address to print in this notice",
      "Name and email of the grievance officer (Digital Personal Data Protection Act, 2023)",
      "Retention period for order and invoice records (tax law usually needs several years)",
      "Whether customer data will also be handled from the UAE once the UAE store opens",
      "Country of the hosting data centre, to state where data is stored",
    ],
    sections: [
      { heading: "Who we are", body: [`This notice explains how ${who} handles personal information collected through this website.`] },
      {
        heading: "What we collect",
        body: [
          [
            "When you order: your name, email, mobile number, delivery address, optional GSTIN and delivery notes, and the items you buy.",
            "When you pay: Razorpay processes your payment on its own secure page. We receive the payment status, amount and method (for example UPI or card), but never your card number, UPI PIN or bank login.",
            "When you apply to become a partner: the details you enter in the application and any documents you upload.",
            "When you join our mailing list: your email address and the time you agreed.",
            "Technical information: your IP address, used to protect forms from abuse and kept in security logs.",
          ],
        ],
      },
      {
        heading: "Why we use it",
        body: [
          [
            "To process, deliver and support your orders, and to issue GST invoices.",
            "To review partnership applications and contact you about yours.",
            "To send marketing emails, only if you ticked the box to receive them.",
            "To keep the website secure and prevent fraud.",
            "To meet our legal and tax obligations.",
          ],
        ],
      },
      {
        heading: "Cookies",
        body: [
          "We use only cookies that the website needs to work: one remembers your cart, one lets you see the confirmation of your latest order, and one keeps staff signed in to the admin area. We do not currently use advertising or analytics cookies. If that changes, we will ask for your consent first.",
        ],
      },
      {
        heading: "Who we share it with",
        body: [
          [
            "Razorpay, to take payments.",
            "Courier partners, who receive your name, phone number and delivery address to deliver your order.",
            "Our hosting provider, which stores the website and its database.",
            "Government authorities, where the law requires it.",
          ],
          "We do not sell your personal information.",
        ],
      },
      {
        heading: "How long we keep it",
        body: [
          [
            "Partnership applications that do not go ahead are deleted 24 months after they are received, together with uploaded documents.",
            "Order and invoice records are kept for as long as tax and accounting law requires.",
            "Mailing list details are kept until you unsubscribe.",
          ],
        ],
      },
      {
        heading: "How we protect it",
        body: [
          "The website uses encrypted connections. Uploaded documents are stored outside the public website and only authorised staff can open them. Staff accounts use two-factor sign-in, and staff actions are logged.",
        ],
      },
      {
        heading: "Your rights",
        body: [
          "You can ask to see the personal information we hold about you, to correct it, or to delete it where we are not required to keep it. You can withdraw consent to marketing at any time. To make a request or raise a complaint, contact our grievance officer. If you are not satisfied with our response, you may complain to the Data Protection Board of India.",
        ],
      },
      { heading: "Changes", body: ["We will post any changes to this notice on this page and update the version shown above."] },
    ],
  },
  {
    slug: "terms",
    title: "Terms of sale and use",
    summary: "The terms that apply when you use this website and buy from us.",
    version: "draft-2026-11",
    approved: false,
    toConfirm: [
      "Customer support email and phone number",
      "City whose courts have jurisdiction (for example Vadodara)",
      "Whether orders may be cancelled after dispatch",
    ],
    sections: [
      { heading: "About these terms", body: [`This website is operated by ${who}. By using it or placing an order, you agree to these terms.`] },
      {
        heading: "Prices and payment",
        body: [
          "Prices are shown in Indian rupees and include GST. Any delivery charge is shown before you pay. Payment is taken through Razorpay. Your order is confirmed only once Razorpay confirms the payment.",
        ],
      },
      {
        heading: "Orders and availability",
        body: [
          "We may decline or cancel an order, for example if an item is unavailable or a price was shown in error. If this happens after you have paid, we refund you in full to the original payment method.",
        ],
      },
      {
        heading: "Cancellations",
        body: ["You can ask to cancel an order before it is dispatched. Contact us with your order number. Paid orders cancelled before dispatch are refunded in full."],
      },
      { heading: "Delivery and returns", body: ["Delivery, returns and refunds are covered by our Shipping and refunds policy."] },
      {
        heading: "Product information",
        body: [
          "We describe products as accurately as we can, including ingredients, directions and warnings. Please read the label before use. Our Product disclaimer also applies.",
        ],
      },
      {
        heading: "Using the website",
        body: ["Do not misuse the website, try to gain unauthorised access, or copy its content, trademarks or images without our written permission."],
      },
      {
        heading: "Liability",
        body: [
          "Nothing in these terms limits rights you have under the Consumer Protection Act, 2019, or other law that cannot be excluded. Otherwise, our liability for any order is limited to the amount you paid for it.",
        ],
      },
      { heading: "Law", body: ["These terms are governed by the laws of India."] },
    ],
  },
  {
    slug: "shipping-refunds",
    title: "Shipping and refunds",
    summary: "Where we deliver, how returns work and when refunds are made.",
    version: "draft-2026-11",
    approved: false,
    toConfirm: [
      "Delivery charge and free delivery threshold",
      "Dispatch time and typical delivery times",
      "Return window in days, and which products can be returned (for example sealed supplements only)",
      "How customers start a return (email, phone or online form)",
    ],
    sections: [
      { heading: "Where we deliver", body: ["We currently deliver to addresses in India. Deliveries to the UAE will follow when our UAE store opens."] },
      { heading: "Delivery charges", body: ["Any delivery charge is calculated from your order and shown at checkout before you pay."] },
      {
        heading: "Dispatch and tracking",
        body: ["We dispatch paid orders through courier partners. Once your order ships, we share the courier name and tracking number."],
      },
      {
        heading: "Damaged, wrong or missing items",
        body: [
          "If an item arrives damaged or is not what you ordered, contact us with your order number and photos as soon as possible. We will replace it or refund you.",
        ],
      },
      {
        heading: "Returns",
        body: [
          "For safety and hygiene, nutrition products can only be returned if they are unopened with the seal intact. Lifestyle products must be unused and in their original packaging.",
        ],
      },
      {
        heading: "Refunds",
        body: [
          "Approved refunds are made to the original payment method through Razorpay. Your bank or payment provider decides how long the money takes to reach your account.",
        ],
      },
    ],
  },
  {
    slug: "product-disclaimer",
    title: "Product disclaimer",
    summary: "Important information about our nutrition and wellness products.",
    version: "draft-2026-11",
    approved: false,
    toConfirm: ["Final wording, checked against the FSSAI labelling of each product"],
    sections: [
      { heading: "Health information", body: [productDisclaimer] },
      {
        heading: "Product claims",
        body: [
          "We publish only product claims that have been reviewed and approved. Results vary from person to person. Always follow the directions and warnings on the label.",
        ],
      },
    ],
  },
  {
    slug: "partnership-disclaimer",
    title: "Partnership disclaimer",
    summary: "What submitting a partnership or franchise application does and does not mean.",
    version: "draft-2026-11",
    approved: false,
    toConfirm: ["Final wording reviewed by the owner's legal adviser"],
    sections: [{ heading: "Applications", body: [partnershipDisclaimer] }],
  },
];

export function getLegalPage(slug: string) {
  return legalPages.find((p) => p.slug === slug) ?? null;
}
