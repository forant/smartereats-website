import type { MetadataRoute } from "next"

export const dynamic = "force-static"

const SITE_URL = "https://smartereats.ai"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Referral landing pages are personalized + noindex'd at the page level.
        // Excluding them from crawl avoids wasting crawl budget on the placeholder.
        disallow: ["/r/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
