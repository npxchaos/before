"use client";
import { useRouter } from "next/navigation"
import { UrlSubmitForm } from "@/components/forms/url-submit-form/UrlSubmitForm"
import { useAuth } from "@/components/providers/AuthProvider"
import Beams from "@/components/ui/Beams"
// import { cn } from "@/lib/utils"

export function Hero() {
  const router = useRouter()
  const { user } = useAuth()
  return (
    <section className="relative overflow-hidden">
      {/* Beams Background */}
      <div className="absolute inset-0 -z-10">
        <Beams
          beamWidth={2}
          beamHeight={15}
          beamNumber={12}
          lightColor="var(--primary)"
          speed={2}
          noiseIntensity={1.75}
          scale={0.2}
          rotation={0}
        />
      </div>

      <div className="mx-auto max-w-[1200px] px-6 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Turn any webpage into{" "}
            <span className="text-primary">an AI answer engine</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-[600px] mx-auto">
            Get featured answers in Google Search and AI tools like ChatGPT, Google AI Overviews, Claude, Gemini, Grok, Perplexity, and more.
          </p>

          {user && (
            <div className="text-sm text-muted-foreground">Signed in as {user.email || "User"}</div>
          )}

          <div className="mt-12 w-full">
            <div className="w-full">
              <UrlSubmitForm
                variant="inline"
                onSubmitted={(id) => router.push(`/dashboard?submissionId=${id}`)}
              />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              <span className="px-3 py-1.5 rounded-full border border-border text-xs/5">Webflow</span>
              <span className="px-3 py-1.5 rounded-full border border-border text-xs/5">SEMrush</span>
              <span className="px-3 py-1.5 rounded-full border border-border text-xs/5">Zapier</span>
              <span className="px-3 py-1.5 rounded-full border border-border text-xs/5">Hubspot</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}


