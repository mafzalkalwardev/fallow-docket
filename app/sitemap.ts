import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://fallow-docket.apps.grok.bot",
      lastModified: new Date("2026-11-09"),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
