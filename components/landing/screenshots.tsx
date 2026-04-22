import Image from "next/image"

const screenshots = [
  {
    src: "/images/screenshot-1.jpg",
    alt: "Home screen with Add a food and saved items"
  },
  {
    src: "/images/screenshot-2.png",
    alt: "Results page: Protein Shake with Banana scoring 9/10 as a great post-workout choice"
  },
  {
    src: "/images/screenshot-3.jpg",
    alt: "Side-by-side food comparison with Best Choice"
  }
]

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {/* Phone frame */}
      <div className="relative bg-[#1a1a1a] rounded-[3rem] p-3 shadow-xl">
        {/* Dynamic Island */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-7 bg-black rounded-full z-10" />
        {/* Screen */}
        <div className="relative rounded-[2.25rem] overflow-hidden bg-black">
          {children}
        </div>
      </div>
    </div>
  )
}

export function Screenshots() {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-6 max-w-6xl">
        <h2 className="text-3xl md:text-4xl font-semibold text-center mb-16 tracking-tight">
          See it in action
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {screenshots.map((screenshot, index) => (
            <div key={index} className="flex justify-center">
              <div className="w-56 md:w-64">
                <PhoneFrame>
                  <Image
                    src={screenshot.src}
                    alt={screenshot.alt}
                    width={256}
                    height={554}
                    className="w-full h-auto"
                  />
                </PhoneFrame>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
