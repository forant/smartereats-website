import Image from "next/image"
import { WaitlistForm } from "@/components/landing/waitlist-form"

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="relative bg-[#1a1a1a] rounded-[3rem] p-3 shadow-2xl">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-7 bg-black rounded-full z-10" />
        <div className="relative rounded-[2.25rem] overflow-hidden bg-black">
          {children}
        </div>
      </div>
    </div>
  )
}

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32 bg-gradient-to-b from-[#f7faf8] to-[#f3f4f6]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />
      <div className="relative container mx-auto px-6 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-balance leading-[1.1]">
              Make smarter food choices, fast
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed">
              Scan or search foods, get a clear score, and decide what&apos;s better for your goal.
            </p>
            <WaitlistForm />
          </div>
          <div className="relative flex justify-center lg:justify-end">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.10), transparent 60%)",
              }}
            />
            <div className="relative w-64 md:w-72 lg:w-80">
              <PhoneFrame>
                <Image
                  src="/images/hero-phone.png"
                  alt="SmarterEats splash screen"
                  width={1206}
                  height={2622}
                  className="w-full h-auto"
                  priority
                />
              </PhoneFrame>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
