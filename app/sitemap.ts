import type { MetadataRoute } from "next";

// /rebuild is intentionally absent — it 308s to dailyrebuild.app now.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.mediaseed.io";
  const lastModified = new Date("2026-08-06");

  return [
    { url: `${base}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/apps`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/daytapes`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/daytapes/support`, lastModified, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/daytapes/privacy`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/jaxlendar`, lastModified, changeFrequency: "daily", priority: 0.7 },
  ];
}
