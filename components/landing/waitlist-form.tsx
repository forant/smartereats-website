"use client"

import { CheckCircle2, Loader2 } from "lucide-react"
import { useId, useState } from "react"
import { cn } from "@/lib/utils"

type State = "idle" | "submitting" | "success" | "error"

type Props = {
  /** "default" matches the green primary CTAs; "muted" sits on darker bg. */
  variant?: "default" | "muted"
  className?: string
}

export function WaitlistForm({ variant = "default", className }: Props) {
  const [email, setEmail] = useState("")
  const [state, setState] = useState<State>("idle")
  const [error, setError] = useState<string | null>(null)
  const [alreadyOn, setAlreadyOn] = useState(false)
  const inputId = useId()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (state === "submitting") return
    setState("submitting")
    setError(null)
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        error?: string
        alreadyOnList?: boolean
      }
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Something went wrong. Please try again.")
        setState("error")
        return
      }
      setAlreadyOn(Boolean(data.alreadyOnList))
      setState("success")
    } catch {
      setError("Network error. Please try again.")
      setState("error")
    }
  }

  if (state === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "inline-flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 text-foreground px-5 py-3.5",
          className
        )}
      >
        <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
        <div className="text-left">
          <div className="font-medium">
            {alreadyOn ? "You're already on the list." : "You're on the waitlist."}
          </div>
          <div className="text-sm text-muted-foreground">
            We&apos;ll email you when SmarterEats launches.
          </div>
        </div>
      </div>
    )
  }

  const isSubmitting = state === "submitting"

  return (
    <form
      onSubmit={submit}
      noValidate
      className={cn("w-full max-w-md", className)}
    >
      <label htmlFor={inputId} className="sr-only">
        Email address
      </label>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          id={inputId}
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (state === "error") setState("idle")
          }}
          disabled={isSubmitting}
          aria-invalid={state === "error"}
          aria-describedby={error ? `${inputId}-err` : undefined}
          className={cn(
            "flex-1 px-4 py-3.5 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground/70",
            "focus:outline-none focus:ring-2 focus:ring-ring",
            "disabled:opacity-60 disabled:cursor-not-allowed",
            state === "error" ? "border-destructive" : "border-border",
            variant === "muted" && "bg-card"
          )}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3.5 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? "Signing up…" : "Sign up to join the waitlist"}
        </button>
      </div>
      {error && (
        <p
          id={`${inputId}-err`}
          role="alert"
          className="mt-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}
    </form>
  )
}
