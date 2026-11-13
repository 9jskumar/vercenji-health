import Image from "next/image";
import Link from "next/link";
import { company, productDisclaimer } from "@/lib/site";

const columns = [
  {
    title: "Shop",
    links: [
      ["Nutrition & Supplements", "/nutrition"],
      ["EMS Wellness & Equipment", "/ems"],
      ["Pure Drinking Water", "/water"],
      ["Healthy Food", "/food"],
      ["Lifestyle & Wearables", "/lifestyle"],
    ],
  },
  {
    title: "Partner",
    links: [
      ["Wellness Hub", "/partner#wellness-hub"],
      ["Home Diet & Nutrition", "/partner#home-diet"],
      ["Wellness Corner", "/partner#wellness-corner"],
      ["Cloud Kitchen Partner", "/partner#cloud-kitchen"],
      ["Apply now", "/partner#apply"],
    ],
  },
  {
    title: "Help",
    links: [
      ["About Vercenji", "/about"],
      ["FAQ and contact", "/help"],
      ["Track your order", "/account/orders"],
      ["Returns request", "/account/returns"],
    ],
  },
  {
    title: "Legal",
    links: [
      ["Privacy policy", "/legal/privacy"],
      ["Terms of use", "/legal/terms"],
      ["Shipping and refunds", "/legal/shipping-refunds"],
      ["Product disclaimer", "/legal/product-disclaimer"],
      ["Partnership disclaimer", "/legal/partnership-disclaimer"],
    ],
  },
] as const;

export function SiteFooter() {
  const year = company.copyrightYear;
  return (
    <footer className="w-full bg-forest text-sm text-[#E9E4D8]">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-11 px-6 pt-16 pb-7">
        <div className="flex flex-wrap gap-x-14 gap-y-10">
          <div className="flex max-w-[340px] flex-[1_1_260px] flex-col gap-[18px]">
            <Image src="/brand/vercenji-logo-gold.png" alt="Vercenji" width={142} height={64} className="h-16 w-auto self-start" />
            <p className="m-0 leading-relaxed text-[#CFC8B8]">
              Nourish. Move. Hydrate. Live. One wellness brand, five verticals and one connected experience.
            </p>
            {/* Social links are added once the owner confirms the handles. */}
          </div>
          {columns.map((col) => (
            <div key={col.title} className="flex flex-[1_1_150px] flex-col gap-3">
              <div className="text-xs font-bold tracking-[0.14em] text-gold-light uppercase">{col.title}</div>
              {col.links.map(([label, href]) => (
                <Link key={href} href={href} className="text-ivory no-underline hover:underline">
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <p className="m-0 rounded-xl border border-forest-line px-5 py-[18px] text-[13px] leading-relaxed text-[#CFC8B8]">
          {productDisclaimer}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-x-7 gap-y-3 border-t border-[#2E4A36] pt-[22px] text-[13px] text-[#BDB6A6]">
          <span>
            © {year} {company.legalName} · {company.brand}™ · GSTIN {company.gstin}
            {company.registeredAddress ? ` · ${company.registeredAddress}` : ""}
          </span>
          <span className="flex flex-wrap gap-4">
            <span>India · ₹ INR</span>
            <span>UAE · AED (coming soon)</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
