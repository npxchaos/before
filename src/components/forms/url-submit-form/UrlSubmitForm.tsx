"use client"

import { useState } from "react"

export interface UrlSubmitFormProps {
  onSubmitted?: (submissionId: string) => void
  className?: string
  variant?: "inline" | "stacked"
}

interface SubmitUrlResponse { submissionId: string }

function isValidUrl(value: string): boolean {
  try { new URL(value); return true } catch { return false }
}

export function UrlSubmitForm({ onSubmitted, className, variant = "stacked" }: UrlSubmitFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const url = String(formData.get("url") || "").trim()
    if (!isValidUrl(url)) {
      setError("Enter a valid URL")
      setIsSubmitting(false)
      return
    }

    try {
      const res = await fetch("/api/submit-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })
      if (!res.ok) throw new Error("Failed to submit")
      const data: SubmitUrlResponse = await res.json()
      onSubmitted?.(data.submissionId)
      e.currentTarget.reset()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong"
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const inline = (
    <div className={className}>
      <label htmlFor="url-input" className="sr-only">Enter the website url</label>
      <div className="w-full max-w-[980px] relative mx-auto">
        <input
          id="url-input"
          name="url"
          type="url"
          placeholder="Enter the website url"
          autoComplete="url"
          required
          data-testid="url-input"
          aria-label="Website URL input field"
          aria-invalid={!!error}
          className="w-full h-16 rounded-2xl bg-background text-foreground border border-border px-5 pr-14 text-base"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full border border-border grid place-items-center transition-all disabled:opacity-50"
          aria-label={isSubmitting ? "Submitting..." : "Submit URL"}
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            "↑"
          )}
        </button>
      </div>
      {error && <div role="alert" className="mt-2 text-sm text-red-500 text-center">{error}</div>}
      {isSubmitting && (
        <div className="mt-2 text-sm text-foreground/70 text-center" aria-live="polite">
          Processing your URL...
        </div>
      )}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" />
    </div>
  )

  const stacked = (
    <div className={className}>
      <label htmlFor="url-input" className="sr-only">Enter the website url</label>
      <input
        id="url-input"
        name="url"
        type="url"
        autoComplete="url"
        required
        data-testid="url-input"
        aria-label="Website URL input field"
        aria-invalid={!!error}
        className="w-full h-16 rounded-2xl bg-background text-foreground border border-border px-5 pr-14 text-base"
      />
      <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} className="mt-3">
        {isSubmitting ? "Submitting..." : "Start Audit"}
      </button>
      {error && <div role="alert" className="mt-2 text-red-500 text-sm">{error}</div>}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" />
    </div>
  )

  return (
    <form id="audit-form" name="auditForm" onSubmit={handleSubmit}>
      {variant === "inline" ? inline : stacked}
    </form>
  )
}


