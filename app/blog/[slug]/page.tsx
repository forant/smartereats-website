import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { MDXRemote } from "next-mdx-remote/rsc"
import { BlogCTA } from "@/components/blog/blog-cta"
import { BlogDisclaimer } from "@/components/blog/disclaimer"
import { RelatedPosts } from "@/components/blog/related-posts"
import { formatDate, getAllSlugs, getPostBySlug } from "@/lib/blog"
import { findRelatedPosts, getTopicsForPost } from "@/lib/topics"

const mdxComponents = { RelatedPosts }

const SITE_URL = "https://smartereats.ai"

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }))
}

export const dynamicParams = false

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}

  const url = `${SITE_URL}/blog/${post.slug}`
  return {
    title: `${post.title} — SmarterEats`,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url,
      publishedTime: post.date,
      images: post.image ? [{ url: post.image }] : undefined,
    },
    twitter: {
      card: post.image ? "summary_large_image" : "summary",
      title: post.title,
      description: post.description,
      images: post.image ? [post.image] : undefined,
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const url = `${SITE_URL}/blog/${post.slug}`
  const topics = getTopicsForPost(post.slug)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Organization", name: "SmarterEats" },
    publisher: {
      "@type": "Organization",
      name: "SmarterEats",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo-mark.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    image: post.image ? `${SITE_URL}${post.image}` : undefined,
  }

  return (
    <main className="container mx-auto px-6 py-12 md:py-16 max-w-3xl">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="mb-8 text-sm">
        <Link
          href="/blog"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          ← All posts
        </Link>
      </nav>

      <header className="mb-10">
        <time
          dateTime={post.date}
          className="text-sm text-muted-foreground"
        >
          {formatDate(post.date)}
        </time>
        <h1 className="mt-2 text-3xl md:text-[2.5rem] font-semibold tracking-tight leading-[1.15] text-balance">
          {post.title}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
          {post.description}
        </p>
        {topics.length > 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            <span className="text-muted-foreground/70">In </span>
            {topics.map((t, i) => (
              <span key={t.slug}>
                {i > 0 && (
                  <span aria-hidden="true" className="text-muted-foreground/50">
                    {" · "}
                  </span>
                )}
                <Link
                  href={`/topics/${t.slug}`}
                  className="underline underline-offset-2 hover:text-foreground transition-colors"
                >
                  {t.title}
                </Link>
              </span>
            ))}
          </p>
        )}
      </header>

      <article className="prose">
        <MDXRemote source={post.content} components={mdxComponents} />
      </article>

      <AutoRelatedFallback post={post} />

      <BlogCTA />

      <BlogDisclaimer />
    </main>
  )
}

/**
 * If the MDX body doesn't already include a `<RelatedPosts>` component,
 * synthesize one from topic-hub membership. Lets posts that haven't yet been
 * regenerated through the new generator template still get an internal-link
 * exit at the bottom. Once a post's body has its own `<RelatedPosts>`, this
 * silently no-ops.
 */
function AutoRelatedFallback({
  post,
}: {
  post: { slug: string; content: string }
}) {
  if (/<RelatedPosts\b/.test(post.content)) return null
  const related = findRelatedPosts(post.slug, 4)
  if (related.length === 0) return null

  return (
    <section
      aria-labelledby="auto-related-heading"
      className="mt-14 border-t border-border pt-10"
    >
      <h2
        id="auto-related-heading"
        className="text-xl font-semibold tracking-tight"
      >
        Related Comparisons
      </h2>
      <ul role="list" className="mt-4 space-y-3">
        {related.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/blog/${p.slug}`}
              className="group block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="font-medium leading-snug group-hover:text-primary transition-colors">
                {p.title}
              </span>
              <span className="block text-sm text-muted-foreground leading-relaxed">
                {p.description}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
