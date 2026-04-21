import { Zap, Brain, Target } from "lucide-react"

const benefits = [
  {
    icon: Zap,
    text: "Instant answers, not data overload"
  },
  {
    icon: Brain,
    text: "Built for quick decisions at the store"
  },
  {
    icon: Target,
    text: "Personalized to your specific goal"
  }
]

export function WhyDifferent() {
  return (
    <section className="py-20 md:py-28 bg-surface-light">
      <div className="container mx-auto px-6 max-w-3xl">
        <div className="text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Why it&apos;s different
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Most nutrition apps overwhelm you with data. SmarterEats gives you a clear answer so you can decide quickly.
          </p>
          <div className="pt-6 space-y-5 max-w-md mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-background flex items-center justify-center">
                  <benefit.icon className="w-5 h-5 text-foreground" strokeWidth={1.5} />
                </div>
                <span className="text-base md:text-lg font-medium">{benefit.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
