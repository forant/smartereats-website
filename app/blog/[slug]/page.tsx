import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { MDXRemote } from "next-mdx-remote/rsc"
import { BlogCTA } from "@/components/blog/blog-cta"
import { formatDate, getAllSlugs, getPostBySlug } from "@/lib/blog"

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
      </header>

      <article className="prose">
        <MDXRemote source={post.content} />
      </article>

      <BlogCTA />
    </main>
  )
}
