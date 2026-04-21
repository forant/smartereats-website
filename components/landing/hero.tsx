import Image from "next/image"
import { AppleIcon } from "lucide-react"

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
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-balance leading-[1.1]">
              Make smarter food choices, fast
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed">
              Scan or search foods, get a clear score, and decide what&apos;s better for your goal.
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
          <div className="flex justify-center lg:justify-end">
            <div className="w-64 md:w-72 lg:w-80">
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
