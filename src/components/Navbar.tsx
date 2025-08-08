"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { UserMenu } from "@/components/auth/UserMenu";
import { AuthModal } from "@/components/auth/AuthModal";
import { useState } from "react";

export function Navbar(): ReactElement {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  const handleAuthClick = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <header className="w-full">
      <div className="mx-auto max-w-[1200px] px-6 py-5 flex items-center justify-between">
        <Link href="/" className="text-base font-semibold tracking-tight">
          prompta
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          <Link href="#insights" className="text-sm text-foreground/90 hover:text-foreground transition-colors">
            Get insights
          </Link>
          <Link href="#plans" className="text-sm text-foreground/90 hover:text-foreground transition-colors">
            Plans
          </Link>
          <Link href="#blog" className="text-sm text-foreground/90 hover:text-foreground transition-colors">
            Blog
          </Link>

          {/* Auth buttons or user menu */}
          {user ? (
            <UserMenu />
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleAuthClick("login")}
                className="text-sm text-foreground/90 hover:text-foreground transition-colors"
              >
                Sign in
              </button>
              <button
                onClick={() => handleAuthClick("signup")}
                className="text-sm rounded-full border border-border px-4 py-2 hover:bg-accent transition-colors"
              >
                Sign up
              </button>
            </div>
          )}

          {/* Theme toggle */}
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

        {/* Mobile menu button */}
        <button className="md:hidden p-2 rounded-md hover:bg-accent transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authMode}
      />
    </header>
  );
}


