"use client";
import type { ReactElement } from "react";

export function Hero(): ReactElement {
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
              className="w-full max-w-[980px] relative mx-auto"
              onSubmit={(e) => e.preventDefault()}
            >
              <label htmlFor="site" className="sr-only">
                Enter the website url
              </label>
              <input
                id="site"
                name="site"
                type="url"
                placeholder="Enter the website url"
                className="w-full h-16 rounded-2xl bg-background text-foreground border border-border px-5 pr-14 text-base"
              />

              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full border border-border grid place-items-center"
                aria-label="Submit"
              >
                ↑
              </button>
            </form>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              <span className="px-3 py-1.5 rounded-full border border-border text-xs/5">Webflow</span>
              <span className="px-3 py-1.5 rounded-full border border-border text-xs/5">SEMrush</span>
              <span className="px-3 py-1.5 rounded-full border border-border text-xs/5">Zapier</span>
              <span className="px-3 py-1.5 rounded-full border border-border text-xs/5">Hubspot</span>
            </div>
          </div>
        </div>

        {/* Scroll hint button bottom-right inside the field in the mock is already represented above */}
      </div>
    </section>
  );
}


