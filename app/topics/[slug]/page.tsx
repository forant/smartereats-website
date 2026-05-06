import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { PostLink } from "@/components/topics/post-link"
import { TopicCard } from "@/components/topics/topic-card"
import {
  getAllTopicSlugs,
  getTopicBySlug,
  resolveTopic,
} from "@/lib/topics"

const SITE_URL = "https://smartereats.ai"

export function generateStaticParams() {
  return getAllTopicSlugs().map((slug) => ({ slug }))
}

export const dynamicParams = false

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const topic = getTopicBySlug(slug)
  if (!topic) return {}

  const url = `${SITE_URL}/topics/${topic.slug}`
  return {
    title: `${topic.title} — SmarterEats`,
    description: topic.description,
    keywords: topic.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: topic.title,
      description: topic.description,
      type: "website",
      url,
      images: topic.image ? [{ url: topic.image }] : undefined,
    },
    twitter: {
      card: topic.image ? "summary_large_image" : "summary",
      title: topic.title,
      description: topic.description,
      images: topic.image ? [topic.image] : undefined,
    },
  }
}

export default async function TopicHubPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const topicMeta = getTopicBySlug(slug)
  if (!topicMeta) notFound()

  const topic = resolveTopic(topicMeta)
  const url = `${SITE_URL}/topics/${topic.slug}`

  // CollectionPage JSON-LD with an ItemList of every linked post.
  const allPosts = [
    ...topic.featured,
    ...topic.resolvedSections.flatMap((s) => s.posts),
  ]
  const seenSlugs = new Set<string>()
  const dedupedPosts = allPosts.filter((p) => {
    if (seenSlugs.has(p.slug)) return false
    seenSlugs.add(p.slug)
    return true
  })

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": url,
    name: topic.title,
    description: topic.description,
    url,
    keywords: topic.keywords.join(", "),
    isPartOf: {
      "@type": "WebSite",
      name: "SmarterEats",
      url: SITE_URL,
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: dedupedPosts.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/blog/${p.slug}`,
        name: p.title,
      })),
    },
  }

  return (
    <main className="container mx-auto px-6 py-12 md:py-16 max-w-4xl">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <ol className="flex items-center gap-2">
          <li>
            <Link
              href="/topics"
              className="hover:text-foreground transition-colors"
            >
              Topics
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-foreground font-medium">{topic.title}</li>
        </ol>
      </nav>

      <header className="mb-10 md:mb-14">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-balance leading-[1.1]">
          {topic.title}
        </h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl">
          {topic.description}
        </p>
        {topic.intro && (
          <p className="mt-4 text-base text-muted-foreground leading-relaxed max-w-3xl">
            {topic.intro}
          </p>
        )}
      </header>

      {topic.featured.length > 0 && (
        <section aria-labelledby="featured-heading" className="mb-12">
          <h2
            id="featured-heading"
            className="text-2xl font-semibold tracking-tight mb-5"
          >
            Featured Articles
          </h2>
          <ul role="list" className="space-y-5">
            {topic.featured.map((post) => (
              <li key={post.slug}>
                <PostLink post={post} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {topic.resolvedSections.map((section, i) => (
        <section
          key={`${section.title}-${i}`}
          aria-labelledby={`section-${i}-heading`}
          className="mb-12"
        >
          <h2
            id={`section-${i}-heading`}
            className="text-2xl font-semibold tracking-tight"
          >
            {section.title}
          </h2>
          {section.description && (
            <p className="mt-2 text-muted-foreground leading-relaxed max-w-3xl">
              {section.description}
            </p>
          )}
          {section.posts.length > 0 ? (
            <ul role="list" className="mt-5 space-y-5">
              {section.posts.map((post) => (
                <li key={post.slug}>
                  <PostLink post={post} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground italic">
              More posts coming soon.
            </p>
          )}
        </section>
      ))}

      {topic.featured.length === 0 && topic.resolvedSections.length === 0 && (
        <section className="mb-12 rounded-2xl border border-border bg-card p-8">
          <h2 className="text-xl font-semibold tracking-tight">
            We&apos;re growing this collection
          </h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            New {topic.title.toLowerCase()} reviews land here as we test them.
            In the meantime, browse our{" "}
            <Link href="/blog" className="underline underline-offset-2">
              full blog
            </Link>{" "}
            or check the related topics below.
          </p>
        </section>
      )}

      {topic.related.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-16">
          <h2
            id="related-heading"
            className="text-2xl font-semibold tracking-tight mb-5"
          >
            Related Topics
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {topic.related.map((rel) => (
              <TopicCard key={rel.slug} topic={rel} />
            ))}
          </div>
        </section>
      )}

      <aside className="mt-16 border-t border-border pt-8 text-sm text-muted-foreground">
        <Link href="/topics" className="hover:text-foreground transition-colors">
          ← All topics
        </Link>
      </aside>
    </main>
  )
}
