import type { Metadata } from "next"
import Link from "next/link"
import { formatDate, getAllPosts } from "@/lib/blog"

export const metadata: Metadata = {
  title: "Blog — SmarterEats",
  description:
    "Honest food comparisons, nutrition breakdowns, and label deep-dives from the SmarterEats team.",
  openGraph: {
    title: "Blog — SmarterEats",
    description:
      "Honest food comparisons, nutrition breakdowns, and label deep-dives.",
    type: "website",
  },
}

export default function BlogIndex() {
  const posts = getAllPosts()

  return (
    <main className="container mx-auto px-6 py-16 md:py-24 max-w-3xl">
      <header className="mb-12 md:mb-16">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-balance">
          The SmarterEats blog
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
          Food comparisons, label decoding, and nutrition takes — written for
          people who actually want to know what&apos;s in their food.
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="text-muted-foreground">No posts yet. Check back soon.</p>
      ) : (
        <ul className="space-y-10">
          {posts.map((post) => (
            <li key={post.slug}>
              <article>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <time
                    dateTime={post.date}
                    className="text-sm text-muted-foreground"
                  >
                    {formatDate(post.date)}
                  </time>
                  <h2 className="mt-1 text-2xl md:text-[1.65rem] font-semibold tracking-tight leading-tight group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  <p className="mt-2 text-muted-foreground leading-relaxed">
                    {post.description}
                  </p>
                </Link>
              </article>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
