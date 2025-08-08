"use client";
import { useState, useCallback } from "react";
import type { ReactElement } from "react";
import { cn } from "@/lib/utils";

// TypeScript interfaces
interface FormData {
  url: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    url: string;
    status: string;
  };
}

interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

// URL validation function
function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === "http:" || urlObj.protocol === "https:";
  } catch {
    return false;
  }
}

// Toast component
function Toast({ message, type, onClose }: { message: string; type: ToastMessage["type"]; onClose: () => void }) {
  const bgColor = type === "success" ? "bg-green-500" : type === "error" ? "bg-red-500" : "bg-blue-500";
  
  return (
    <div className={cn(
      "fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white max-w-sm",
      bgColor
    )}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-4 text-white hover:text-gray-200"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export function Hero(): ReactElement {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounced submission to prevent spam
  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (isSubmitting) return; // Prevent multiple submissions
    
    setIsSubmitting(true);
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const url = formData.get("url") as string;

      // Client-side validation
      if (!url || url.trim() === "") {
        throw new Error("Please enter a website URL");
      }

      if (!isValidUrl(url)) {
        throw new Error("Please enter a valid URL (e.g., https://example.com)");
      }

      // API call
      const response = await fetch("/api/submit-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url.trim() } as FormData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Network error" }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Submission failed");
      }

      // Success feedback
      setToast({
        id: Date.now().toString(),
        type: "success",
        message: "URL submitted successfully! We'll process it shortly.",
      });

      // Clear form
      const form = e.currentTarget;
      form.reset();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      setToast({
        id: Date.now().toString(),
        type: "error",
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
      // Reset submission lock after a delay
      setTimeout(() => setIsSubmitting(false), 2000);
    }
  }, [isSubmitting]);

  const closeToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <section className="relative w-full min-h-[100svh] flex items-center justify-center">
      <div className="mx-auto max-w-[1200px] px-6 w-full flex flex-col items-center text-center">
        <div className="max-w-[1100px] mx-auto">
          <p className="text-sm mb-8 text-foreground/80">Get featured answers in AI</p>
          <h1 className="text-[40px] sm:text-[64px] md:text-[96px] font-extrabold leading-[1.02] tracking-tight">
            turn any webpage into
            <br />
            an AI answer engine
          </h1>
          <p className="mt-8 max-w-2xl mx-auto text-base sm:text-lg text-foreground/85">
            Get featured answers in Google Search and AI tools like ChatGPT, Google AI
            Overviews, Claude, Gemini, Grok, Perplexity, and more.
          </p>

          <div className="mt-12 w-full">
            <form
              id="audit-form"
              name="auditForm"
              className="w-full max-w-[980px] relative mx-auto"
              onSubmit={handleSubmit}
            >
              <label htmlFor="url-input" className="sr-only">
                Enter the website url
              </label>
              <input
                id="url-input"
                name="url"
                type="url"
                placeholder="Enter the website url"
                autoComplete="url"
                data-testid="url-input"
                aria-label="Website URL input field"
                required
                disabled={isLoading}
                className={cn(
                  "w-full h-16 rounded-2xl bg-background text-foreground border px-5 pr-14 text-base transition-colors",
                  error ? "border-red-500" : "border-border",
                  isLoading && "opacity-50 cursor-not-allowed"
                )}
                aria-invalid={!!error}
                aria-describedby={error ? "url-error" : undefined}
              />

              <button
                type="submit"
                disabled={isLoading || isSubmitting}
                className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full border border-border grid place-items-center transition-all",
                  isLoading || isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:bg-accent"
                )}
                aria-label={isLoading ? "Submitting..." : "Submit URL"}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  "↑"
                )}
              </button>
            </form>

            {/* Error message */}
            {error && (
              <div
                id="url-error"
                className="mt-2 text-sm text-red-500 text-center"
                role="alert"
                aria-live="polite"
              >
                {error}
              </div>
            )}

            {/* Loading indicator */}
            {isLoading && (
              <div className="mt-2 text-sm text-foreground/70 text-center" aria-live="polite">
                Processing your URL...
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              <span className="px-3 py-1.5 rounded-full border border-border text-xs/5">Webflow</span>
              <span className="px-3 py-1.5 rounded-full border border-border text-xs/5">SEMrush</span>
              <span className="px-3 py-1.5 rounded-full border border-border text-xs/5">Zapier</span>
              <span className="px-3 py-1.5 rounded-full border border-border text-xs/5">Hubspot</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}
    </section>
  );
}


