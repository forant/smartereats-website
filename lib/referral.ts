/**
 * Referral link wiring.
 *
 * Everything routing / deep-link related lives here so the iOS team can adjust
 * scheme, host, path shape, or App Store metadata without touching the UI.
 */

export const REFERRAL_ROUTE_PREFIX = "/r"

/** iOS team may finalize a different scheme — change here only. */
export const DEEP_LINK_SCHEME = "smartereats"
export const DEEP_LINK_HOST = "open"

/** TODO: replace with the final App Store URL once the listing is live. */
export const APP_STORE_URL =
  "https://apps.apple.com/app/smartereats/id0000000000"

/** localStorage key used to preserve referral attribution across navigations. */
export const REFERRAL_STORAGE_KEY = "smartereats.referral"

/** Query params we forward into the app. Keep in sync with iOS expectations. */
export const FORWARDED_QUERY_PARAMS = ["comparison", "result"] as const

export type ForwardedParam = (typeof FORWARDED_QUERY_PARAMS)[number]

export type ReferralParams = {
  refCode: string
} & Partial<Record<ForwardedParam, string>>

/** Shape persisted to storage. Keeps attribution recoverable post-install. */
export type StoredReferral = ReferralParams & {
  capturedAt: number
  source: "web-fallback"
}

/**
 * Extract referral params from a pathname + search string. Isolated so the
 * route segment can change (e.g. /i/:code, /ref/:code) without rewriting UI.
 */
export function parseReferralFromUrl(
  pathname: string,
  search: string | URLSearchParams
): ReferralParams | null {
  const prefix = REFERRAL_ROUTE_PREFIX.replace(/\/$/, "")
  const pattern = new RegExp(`^${prefix}/([^/?#]+)`)
  const match = pathname.match(pattern)
  if (!match) return null

  const refCode = decodeURIComponent(match[1])
  if (!refCode || refCode === "__placeholder__") return null

  const params =
    typeof search === "string" ? new URLSearchParams(search) : search

  const parsed: ReferralParams = { refCode }
  for (const key of FORWARDED_QUERY_PARAMS) {
    const value = params.get(key)
    if (value) parsed[key] = value
  }
  return parsed
}

/** smartereats://open?ref=...&comparison=...&result=... */
export function buildDeepLink(params: ReferralParams): string {
  const qs = new URLSearchParams({ ref: params.refCode })
  for (const key of FORWARDED_QUERY_PARAMS) {
    const value = params[key]
    if (value) qs.set(key, value)
  }
  return `${DEEP_LINK_SCHEME}://${DEEP_LINK_HOST}?${qs.toString()}`
}

/**
 * App Store URL with an iTunes campaign token so the app can read the ref
 * on first launch (via Apple Search Ads Attribution or `ct` parsing).
 */
export function buildAppStoreUrl(params?: ReferralParams): string {
  if (!params?.refCode) return APP_STORE_URL
  const url = new URL(APP_STORE_URL)
  url.searchParams.set("ct", `ref_${params.refCode}`)
  url.searchParams.set("pt", "smartereats-referral")
  return url.toString()
}

export function persistReferral(params: ReferralParams): void {
  if (typeof window === "undefined") return
  try {
    const payload: StoredReferral = {
      ...params,
      capturedAt: Date.now(),
      source: "web-fallback",
    }
    window.localStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Storage may be unavailable (private mode, quotas). Non-fatal.
  }
}

export function readStoredReferral(): StoredReferral | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(REFERRAL_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredReferral) : null
  } catch {
    return null
  }
}
