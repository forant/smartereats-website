import { WaitlistForm } from "@/components/landing/waitlist-form"

export function CTA() {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-6 max-w-3xl text-center">
        <div className="space-y-8">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Be first to know when we launch
          </h2>
          <p className="text-lg text-muted-foreground">
            Join the waitlist and we&apos;ll send you an invite the moment
            SmarterEats goes live.
          </p>
          <div className="flex justify-center">
            <WaitlistForm />
          </div>
        </div>
      </div>
    </section>
  )
}
