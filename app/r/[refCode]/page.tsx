import type { Metadata } from "next"
import { ReferralLanding } from "@/components/referral/referral-landing"

/**
 * Static export requires at least one generated path per dynamic segment.
 * We emit a single placeholder shell; hosting rewrites `/r/:refCode` → this
 * shell and the client reads the real code from `window.location.pathname`.
 * See vercel.json.
 */
export function generateStaticParams() {
  const params = [{ refCode: "__placeholder__" }]
  if (process.env.NODE_ENV !== "production") {
    params.push({ refCode: "PREVIEW" })
  }
  return params
}

export const dynamicParams = false

export const metadata: Metadata = {
  title: "You were invited to SmarterEats",
  description: "Scan any food and get an instant nutrition score.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "You were invited to SmarterEats",
    description: "Scan any food and get an instant nutrition score.",
    type: "website",
  },
}

export default async function ReferralPage({
  params,
}: {
  params: Promise<{ refCode: string }>
}) {
  const { refCode } = await params
  return <ReferralLanding serverRefCode={refCode} />
}
