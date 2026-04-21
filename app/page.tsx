import { Hero } from "@/components/landing/hero"
import { HowItWorks } from "@/components/landing/how-it-works"
import { Screenshots } from "@/components/landing/screenshots"
import { WhyDifferent } from "@/components/landing/why-different"
import { CTA } from "@/components/landing/cta"
import { Footer } from "@/components/landing/footer"

export default function Home() {
  return (
    <main>
      <Hero />
      <HowItWorks />
      <Screenshots />
      <WhyDifferent />
      <CTA />
      <Footer />
    </main>
  )
}
