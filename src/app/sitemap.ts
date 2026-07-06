import type { MetadataRoute } from "next";
import { BRANDS } from "@/lib/constants";
import { absoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const brandRoutes = BRANDS.map((brand) => ({
    url: absoluteUrl(`/products/${brand.slug}`),
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/products"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...brandRoutes,
    {
      url: absoluteUrl("/terms"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];
}
