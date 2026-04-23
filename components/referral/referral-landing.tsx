"use client"

import { AppleIcon, SmartphoneIcon } from "lucide-react"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import {
  APP_STORE_URL,
  buildAppStoreUrl,
  buildDeepLink,
  parseReferralFromUrl,
  persistReferral,
  type ReferralParams,
} from "@/lib/referral"

type Props = {
  /**
   * Placeholder value injected at build time by the static export. The client
   * replaces this with the real refCode from `window.location` on mount.
   */
  serverRefCode?: string
}

export function ReferralLanding({ serverRefCode }: Props) {
  const [params, setParams] = useState<ReferralParams | null>(() => {
    if (!serverRefCode || serverRefCode === "__placeholder__") return null
    return { refCode: serverRefCode }
  })
  const [attemptedOpen, setAttemptedOpen] = useState(false)

  useEffect(() => {
    const parsed = parseReferralFromUrl(
      window.location.pathname,
      window.location.search
    )
    if (parsed) {
      setParams(parsed)
      persistReferral(parsed)
    }
  }, [])

  const deepLink = useMemo(
    () => (params ? buildDeepLink(params) : null),
    [params]
  )
  const appStoreUrl = useMemo(
    () => buildAppStoreUrl(params ?? undefined),
    [params]
  )

  const handleOpenInApp = () => {
    if (!deepLink) return
    setAttemptedOpen(true)
    // Simple attempt. If the app is installed, iOS hands off. If not, iOS
    // shows a "cannot open" sheet; we still surface the App Store CTA below.
    window.location.href = deepLink
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-[#f7faf8] to-[#f3f4f6]">
      <section className="container mx-auto px-6 py-12 md:py-20 max-w-xl">
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="relative w-20 h-20 rounded-[22%] overflow-hidden shadow-lg">
            <Image
              src="/logo-mark.png"
              alt="SmarterEats"
              width={80}
              height={80}
              priority
              className="w-full h-full"
            />
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-balance leading-[1.15]">
              You were invited to SmarterEats
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
              Scan any food and get an instant nutrition score.
            </p>
            <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-4 py-1.5 text-sm font-medium">
              Unlock 7 free days of Pro
            </p>
          </div>

          <div className="w-full flex flex-col gap-3 pt-2">
            <button
              type="button"
              onClick={handleOpenInApp}
              disabled={!deepLink}
              className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3.5 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SmartphoneIcon className="w-5 h-5" />
              Open in SmarterEats
            </button>

            <a
              href={appStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-3 bg-foreground text-background px-6 py-3.5 rounded-xl hover:opacity-90 transition-opacity"
            >
              <AppleIcon className="w-6 h-6" />
              <div className="text-left">
                <div className="text-[11px] opacity-80 leading-none">
                  Download on the
                </div>
                <div className="text-base font-medium leading-tight">
                  App Store
                </div>
              </div>
            </a>
          </div>

          {attemptedOpen && (
            <p className="text-sm text-muted-foreground">
              Didn&apos;t open? Install the app to continue.
            </p>
          )}

          {params?.refCode && (
            <p className="text-xs text-muted-foreground/70 pt-4">
              Referral code:{" "}
              <span className="font-mono">{params.refCode}</span>
            </p>
          )}
        </div>
      </section>
    </main>
  )
}

export { APP_STORE_URL }
