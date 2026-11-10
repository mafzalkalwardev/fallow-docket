import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://fallow-docket.apps.grok.bot/sitemap.xml",
    host: "https://fallow-docket.apps.grok.bot",
  };
}
