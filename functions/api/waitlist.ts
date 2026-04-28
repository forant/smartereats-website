/// <reference types="@cloudflare/workers-types" />

/**
 * Cloudflare Pages Function — POST /api/waitlist
 *
 * Captures emails into a KV namespace bound as `WAITLIST`. The email itself
 * is the key (so re-submits are idempotent), and the value is a JSON blob
 * with capture metadata for later attribution / debugging.
 *
 * Setup (one time, in the Cloudflare dashboard):
 *   1. Workers & Pages → KV → Create namespace → name it "smartereats_waitlist"
 *      (or anything; the binding name below is what matters).
 *   2. Pages project → Settings → Functions → KV namespace bindings →
 *      Add: Variable name = "WAITLIST", KV namespace = the one you created.
 *   3. Redeploy.
 *
 * To export later:
 *   wrangler kv:key list --namespace-id <ID>
 *   wrangler kv:key get <email> --namespace-id <ID>
 */

interface Env {
  WAITLIST: KVNamespace
}

type Stored = {
  email: string
  capturedAt: string
  ua: string | null
  ip: string | null
  referer: string | null
  country: string | null
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  })

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.WAITLIST) {
    return json(
      { ok: false, error: "Server misconfigured: WAITLIST binding missing." },
      500
    )
  }

  let body: { email?: unknown }
  try {
    body = await request.json()
  } catch {
    return json({ ok: false, error: "Invalid request body." }, 400)
  }

  const raw = typeof body.email === "string" ? body.email : ""
  const email = raw.trim().toLowerCase()

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return json({ ok: false, error: "Please enter a valid email." }, 400)
  }

  const existing = await env.WAITLIST.get(email)
  if (existing) {
    return json({ ok: true, alreadyOnList: true })
  }

  const record: Stored = {
    email,
    capturedAt: new Date().toISOString(),
    ua: request.headers.get("user-agent"),
    ip: request.headers.get("cf-connecting-ip"),
    referer: request.headers.get("referer"),
    country: request.cf?.country ? String(request.cf.country) : null,
  }

  await env.WAITLIST.put(email, JSON.stringify(record))

  return json({ ok: true, alreadyOnList: false })
}

export const onRequest: PagesFunction = async () =>
  json({ ok: false, error: "Method not allowed." }, 405)
