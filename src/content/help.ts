import { company, productDisclaimer } from "@/lib/site";

/** Help page answers. Every answer restates something the owner has confirmed or a published policy; nothing new is promised here. */
export const faqs: { group: string; items: { q: string; a: string; link?: [label: string, href: string] }[] }[] = [
  {
    group: "Orders and delivery",
    items: [
      {
        q: "Do I need an account to order?",
        a: "No. You can check out as a guest. Later, sign in with the same email address and your orders appear in your account.",
      },
      {
        q: "How do I track my order?",
        a: "Sign in and open My orders. Once your order ships, the courier name and tracking number are shown there.",
        link: ["Go to My orders", "/account/orders"],
      },
      {
        q: "Where do you deliver, and how long does it take?",
        a: "We deliver to addresses in India. Vercenji dispatches orders as soon as possible after payment is confirmed, and they usually arrive within 3 to 5 working days.",
      },
      {
        q: "How much is delivery?",
        a: "Delivery is free on orders of ₹3,000 or more. For smaller orders, a delivery charge is added and shown at checkout before you pay.",
      },
    ],
  },
  {
    group: "Payments",
    items: [
      {
        q: "How can I pay?",
        a: "Payment is taken on Razorpay's secure payment page, so your card, UPI or bank details never reach our website. Your order is confirmed once Razorpay confirms the payment.",
      },
      {
        q: "Do prices include GST?",
        a: "Yes. Prices are shown in Indian rupees and include GST. You can add a GSTIN at checkout for a business invoice.",
      },
    ],
  },
  {
    group: "Returns and refunds",
    items: [
      {
        q: "Something arrived damaged or wrong. What do I do?",
        a: "Tell us within 24 hours of delivery. Sign in and use Returns, or contact us with your order number and photos. We will replace the item or refund you.",
        link: ["Request a return", "/account/returns"],
      },
      {
        q: "Can I return a supplement?",
        a: "Returns are accepted only for wrong or damaged deliveries reported within 24 hours. For safety and hygiene, supplements can only be returned unopened with the seal intact.",
      },
      {
        q: "When do I get my refund?",
        a: "Approved refunds are made to the original payment method through Razorpay. Your bank or payment provider decides how long the money takes to reach your account.",
        link: ["Shipping and refunds policy", "/legal/shipping-refunds"],
      },
    ],
  },
  {
    group: "My account",
    items: [
      {
        q: "How do I sign in?",
        a: "Enter your email address and we send you a 6-digit code. There is no password to remember. Vercenji will never ask you for this code by phone or chat.",
        link: ["Sign in", "/login"],
      },
      {
        q: "The code has not arrived.",
        a: "It can take a minute. Check your spam or promotions folder, then ask for a new code. Each code works for 10 minutes.",
      },
    ],
  },
  {
    group: "Products",
    items: [{ q: "Is a supplement right for me?", a: productDisclaimer }],
  },
];

export const contact = {
  email: company.supportEmail,
  phone: company.supportPhone,
  phoneHref: `tel:${company.supportPhone.replace(/\s/g, "")}`,
  grievance: company.grievanceOfficer,
  address: company.registeredAddress,
  legalName: company.legalName,
};
