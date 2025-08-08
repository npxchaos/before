"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { useTheme } from "@/components/ThemeProvider";

export function Navbar(): ReactElement {
  const { theme, toggleTheme } = useTheme();
  return (
    <header className="w-full">
      <div className="mx-auto max-w-[1200px] px-6 py-5 flex items-center justify-between">
        <Link href="/" className="text-base font-semibold tracking-tight">
          prompta
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          <Link href="#insights" className="text-sm text-foreground/90">
            Get insights
          </Link>
          <Link href="#plans" className="text-sm text-foreground/90">
            Plans
          </Link>
          <Link href="#blog" className="text-sm text-foreground/90">
            Blog
          </Link>
          <Link
            href="#signup"
            className="text-sm rounded-full border border-border px-4 py-2"
          >
            Sign-up
          </Link>

          {/* Theme toggle placeholder for later wiring */}
          <button
            aria-label="Toggle theme"
            className="ml-3 h-6 w-12 rounded-full border border-border relative"
            type="button"
            onClick={toggleTheme}
          >
            <span
              className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-foreground transition-all ${
                theme === "dark" ? "left-1" : "left-7"
              }`}
            />
          </button>
        </nav>
      </div>
    </header>
  );
}


