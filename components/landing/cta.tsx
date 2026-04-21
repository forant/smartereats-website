import { AppleIcon } from "lucide-react"

export function CTA() {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-6 max-w-3xl text-center">
        <div className="space-y-8">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Start making smarter choices
          </h2>
          <p className="text-lg text-muted-foreground">
            Download SmarterEats and take control of your nutrition today.
          </p>
          <a
            href="https://apps.apple.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-primary text-primary-foreground px-6 py-3.5 rounded-xl hover:opacity-90 transition-opacity"
          >
            <AppleIcon className="w-6 h-6" />
            <div className="text-left">
              <div className="text-xs opacity-80">Download on the</div>
              <div className="text-base font-medium -mt-0.5">App Store</div>
            </div>
          </a>
        </div>
      </div>
    </section>
  )
}
