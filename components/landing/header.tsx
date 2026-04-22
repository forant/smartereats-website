import Image from "next/image"
import Link from "next/link"

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="flex items-center justify-center h-16">
          <Link
            href="/"
            aria-label="SmarterEats home"
            className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Image
              src="/logo-mark.png"
              alt="SmarterEats"
              width={32}
              height={32}
              priority
              className="rounded-[22%]"
            />
            <span
              style={{
                fontFamily:
                  "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', system-ui, sans-serif",
                fontSize: "28px",
                lineHeight: 1,
              }}
            >
              <span style={{ fontWeight: 400 }}>Smarter</span>
              <span style={{ fontWeight: 600 }}>Eats</span>
            </span>
          </Link>
        </div>
      </div>
    </header>
  )
}
