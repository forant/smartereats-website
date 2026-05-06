import type { Metadata } from "next"
import { TopicCard } from "@/components/topics/topic-card"
import { getAllTopics, resolveTopic } from "@/lib/topics"

export const metadata: Metadata = {
  title: "Topics — SmarterEats",
  description:
    "Browse SmarterEats by topic: high-protein snacks, weight loss snacks, healthy drinks, protein bars, Costco picks, and more.",
  alternates: { canonical: "https://smartereats.ai/topics" },
  openGraph: {
    title: "Topics — SmarterEats",
    description:
      "Browse SmarterEats by topic: high-protein snacks, weight loss snacks, healthy drinks, and more.",
    type: "website",
    url: "https://smartereats.ai/topics",
  },
}

export default function TopicsIndex() {
  const topics = getAllTopics().map((t) => ({
    meta: t,
    postCount: resolveTopic(t).postCount,
  }))

  return (
    <main className="container mx-auto px-6 py-16 md:py-24 max-w-4xl">
      <header className="mb-12 md:mb-16">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-balance">
          Browse by topic
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Curated collections across SmarterEats — pick a topic to get our full
          take on the category, including comparisons, reviews, and the smartest
          picks.
        </p>
      </header>

      {topics.length === 0 ? (
        <p className="text-muted-foreground">No topics published yet.</p>
      ) : (
        <ul role="list" className="grid gap-4 sm:grid-cols-2">
          {topics.map(({ meta, postCount }) => (
            <li key={meta.slug}>
              <TopicCard topic={meta} postCount={postCount} />
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
