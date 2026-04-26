import Link from "next/link"
import { AppleIcon } from "lucide-react"
import { APP_STORE_URL } from "@/lib/referral"

export function BlogCTA() {
  return (
    <aside className="mt-16 rounded-2xl border border-border bg-card p-6 md:p-8">
      <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
        Scan your food with SmarterEats
      </h2>
      <p className="text-muted-foreground mt-2">
        Get an instant nutrition score for any product. No spreadsheets, no
        guesswork.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <a
          href={APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity"
        >
          <AppleIcon className="w-5 h-5" />
          Download on the App Store
        </a>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border hover:bg-secondary transition-colors"
        >
          Back to home
        </Link>
      </div>
    </aside>
  )
}
