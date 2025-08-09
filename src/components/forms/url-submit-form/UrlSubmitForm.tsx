"use client"

import { useState } from "react"

export interface UrlSubmitFormProps {
  onSubmitted?: (submissionId: string) => void
  className?: string
}

interface SubmitUrlResponse { submissionId: string }

function isValidUrl(value: string): boolean {
  try { new URL(value); return true } catch { return false }
}

export function UrlSubmitForm({ onSubmitted, className }: UrlSubmitFormProps) {
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

  return (
    <form id="audit-form" name="auditForm" onSubmit={handleSubmit} className={className}>
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
      {/* Honeypot (anti-bot) */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" />
      <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} className="mt-3">
        {isSubmitting ? "Submitting..." : "Start Audit"}
      </button>
      {error && <div role="alert" className="mt-2 text-red-500 text-sm">{error}</div>}
    </form>
  )
}


