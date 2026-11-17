import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private or per-visitor pages. Job application forms are reached from each vacancy page.
        disallow: ["/admin", "/account", "/cart", "/checkout", "/login", "/api/", "/careers/*/apply"],
      },
    ],
    sitemap: `${(process.env.SITE_URL ?? "https://vercenji.com").replace(/\/$/, "")}/sitemap.xml`,
  };
}
