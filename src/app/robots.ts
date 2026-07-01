import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/data/settings";

export default function robots(): MetadataRoute.Robots {
  const base = getBaseUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/growth", "/account", "/api", "/checkout"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
