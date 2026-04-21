import { ScanLine, CheckCircle2, Scale } from "lucide-react"

const steps = [
  {
    icon: ScanLine,
    title: "Scan or search",
    description: "Point your camera at any barcode or search by name to find a food instantly."
  },
  {
    icon: CheckCircle2,
    title: "Get a clear verdict",
    description: "See a simple score that tells you if a food is a good choice for you."
  },
  {
    icon: Scale,
    title: "Compare for your goal",
    description: "Quickly compare options to pick the one that best fits your health goals."
  }
]

export function HowItWorks() {
  return (
    <section className="py-20 md:py-28 bg-surface-light">
      <div className="container mx-auto px-6 max-w-6xl">
        <h2 className="text-3xl md:text-4xl font-semibold text-center mb-16 tracking-tight">
          How it works
        </h2>
        <div className="grid md:grid-cols-3 gap-10 md:gap-12">
          {steps.map((step, index) => (
            <div key={index} className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-background">
                <step.icon className="w-6 h-6 text-foreground" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-medium">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
