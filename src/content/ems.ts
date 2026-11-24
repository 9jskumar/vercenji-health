// EMS Wellness page copy, edited from the owner's "Vercenji EMS Wellness Website Content" document (2026-11-24).
// Language is tightened and unsupported claims are softened; see deploy notes for the points the owner must confirm.

export const EMS_PATH = "/vercenji-ems-wellness-training-suit";

export const emsSeo = {
  title: "Vercenji EMS Wellness | Professional 20-Minute Wireless EMS Suit",
  description:
    "Vercenji EMS Wellness: a wireless full-body EMS training suit for gyms, EMS studios and personal trainers. App control, 10 muscle groups, 5000mAh energy box. Request a demo.",
};

export const heroFacts = [
  ["20 min", "full-body sessions"],
  ["10", "muscle groups"],
  ["0–100", "intensity levels"],
  ["XXS–6XL", "size range"],
] as const;

export const muscleGroups = [
  { region: "Upper body, front", muscles: "Pectorals, abdominals, biceps and triceps" },
  { region: "Upper body, back", muscles: "Upper trapezius, latissimus dorsi, lower back" },
  { region: "Lower body", muscles: "Glutes, quadriceps, hamstrings" },
  { region: "Core and stability", muscles: "Deep core and waist stabilisers" },
] as const;

export const innovations = [
  {
    key: "app",
    title: "Wireless app control",
    body: "Run sessions from a tablet or smartphone. Adjust each muscle group channel, set intensity from 0 to 100, and manage several clients with ease.",
    detail: "12 preset programmes, including Warm-Up, Fitness, Cardio, Resistance and Relaxation, plus one customisable VIP mode.",
  },
  {
    key: "harness",
    title: "Durable, low-maintenance harness",
    body: "Built for busy studios: an anti-drop DB25 connector, hidden water-resistant wiring and snap-button pads that are quick and inexpensive to replace.",
  },
  {
    key: "fit",
    title: "Two fit options",
    body: "Choose an integrated one-piece vest for a close lower-body fit, or an adjustable split vest that fits a wider range of body types. Sizes XXS to 6XL.",
  },
  {
    key: "battery",
    title: "Portable 5000mAh energy box",
    body: "A plug-in wireless power module that runs a full day of sessions, so clients can move freely without a cable to the wall.",
  },
] as const;

export const specs: [string, string][] = [
  ["Garment structure", "Integrated one-piece vest or separate split vest"],
  ["Fabric", "3 mm composite fabric, anti-pilling and wear-resistant"],
  ["Conductivity", "Light water spray on the fabric over the inner electrode pads"],
  ["Electrodes", "10 muscle groups; pads are movable, expandable and individually replaceable"],
  ["Cable and connector", "Detachable hidden cables with DB25 anti-drop connector"],
  ["Control", "Vercenji Smart App on tablet or smartphone"],
  ["Intensity", "0 to 100, in fine steps"],
  ["Programmes", "12 preset modes plus 1 customisable VIP mode"],
  ["Pulse parameters", "Frequency up to 120 Hz; pulse width up to 400 µs"],
  ["Power", "5000mAh plug-in wireless energy box"],
  ["Sizes", "XXS to 6XL"],
  ["Warranty", "2-year machine warranty"],
];

export const steps = [
  ["Wear", "Put on the hygienic cotton innerwear, then the Vercenji EMS vest. Adjust the width straps for a snug fit."],
  ["Wet", "Lightly spray water on the fabric over the inner electrode pads for good skin contact."],
  ["Connect", "Connect the suit's harness to the 5000mAh energy box with the DB25 connector."],
  ["Select", "Open the Vercenji app, then choose the programme, session length and intensity for each muscle group."],
  ["Train", "Start the 20-minute session: simple guided movements combined with muscle stimulation, with the trainer adjusting as you go."],
] as const;

export const audiences = [
  ["Commercial gyms", "Add a premium, time-efficient service alongside your existing memberships."],
  ["EMS studios", "Equipment built for many sessions a day, with replaceable parts and a wide size range."],
  ["Personal trainers", "Full-body sessions you control from a phone or tablet, wherever you train clients."],
  ["Wellness centres", "Offer structured, supervised training as part of a wider wellness programme."],
  ["Sports and athletic coaches", "Add EMS sessions to conditioning plans under qualified supervision."],
] as const;

export const businessFlow = ["Equipment", "Paid EMS sessions", "Packages and memberships", "Repeat clients"] as const;

export const kit = [
  "1 Vercenji professional EMS training vest (one-piece or split)",
  "1 portable 5000mAh EMS energy box controller",
  "1 set of cotton innerwear",
  "Charging accessories and DB25 harness",
  "Operation guide and manual",
  "Export packaging",
] as const;

export const kitOptions = [
  ["Control tablet", "A dedicated tablet for the app, on request."],
  ["OEM and ODM", "Your logo, custom colours, packaging and app interface, for studios and distributors."],
] as const;

export const safety = [
  "Not for people with a pacemaker or other implanted electronic device.",
  "Not during pregnancy.",
  "A doctor's clearance is needed for heart conditions, epilepsy, recent surgery or any other medical condition.",
  "Sessions should be run by trainers who are trained on the equipment, after a short suitability check for each client.",
  "Start at low intensity, keep clients well hydrated, and follow the operation manual.",
] as const;

export const faqs: [string, string][] = [
  [
    "What is EMS training?",
    "EMS (electrical muscle stimulation) uses small electrical impulses, delivered through electrodes in a training suit, to make muscles contract. Combined with simple movements, it lets a trainer work several muscle groups at the same time.",
  ],
  [
    "How long is a session?",
    "A typical Vercenji EMS session lasts about 20 minutes. How often a client trains should be set by a qualified trainer for each person.",
  ],
  [
    "Who is the Vercenji EMS suit for?",
    "It is professional equipment for commercial gyms, EMS studios, personal trainers, wellness centres and sports coaches who supervise their clients' sessions.",
  ],
  [
    "Why does the suit need water?",
    "A light water spray on the fabric over the electrode pads improves contact with the skin, so the impulses are delivered evenly.",
  ],
  [
    "Is the suit wireless?",
    "Yes. The suit connects to a portable 5000mAh energy box, and you control the session from the Vercenji app on a tablet or smartphone, so clients are not tied to a wall socket.",
  ],
  [
    "Which sizes are available?",
    "Sizes run from XXS to 6XL, in an integrated one-piece vest or an adjustable split vest.",
  ],
  [
    "Is EMS safe for everyone?",
    "No. EMS is not suitable for people with a pacemaker or other implanted electronic device, or during pregnancy, and people with heart conditions, epilepsy or recent surgery need a doctor's clearance. Every client should be screened and supervised by a trained professional. EMS is not a medical treatment.",
  ],
  [
    "What warranty is included?",
    "The suit comes with a 2-year machine warranty. Full terms are shared with your quotation.",
  ],
  [
    "Can I get the suit with my own branding?",
    "Yes. OEM and ODM options cover your logo, custom colours, packaging and app interface. Tell us what you need in the demo request form.",
  ],
  [
    "How much does it cost?",
    "Prices depend on the fit option, quantity and customisation. Request a demo or a studio quote and our team will send you a quotation.",
  ],
];

export const enquiryInterests = [
  ["demo", "A product demo"],
  ["quote", "A studio quotation"],
  ["oem", "OEM or ODM branding"],
  ["other", "Something else"],
] as const;

export const enquiryCountries = [
  ["IN", "India"],
  ["AE", "United Arab Emirates"],
  ["ZZ", "Another country"],
] as const;
