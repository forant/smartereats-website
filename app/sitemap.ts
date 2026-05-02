import type { MetadataRoute } from "next"
import { getAllPosts } from "@/lib/blog"

export const dynamic = "force-static"

const SITE_URL = "https://smartereats.ai"

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts()
  const latestPostDate = posts[0]?.date ?? new Date().toISOString().slice(0, 10)
  const buildDate = new Date().toISOString().slice(0, 10)

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: latestPostDate,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: latestPostDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...posts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.date,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: `${SITE_URL}/privacy`,
      lastModified: buildDate,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: buildDate,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
  ]
}
