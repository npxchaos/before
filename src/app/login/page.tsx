"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { LoginForm } from "@/components/auth/LoginForm"
import { SignupForm } from "@/components/auth/SignupForm"
import { Logo } from "@/components/ui/Logo"

export default function LoginPage() {
  return (
    <Suspense fallback={<div className={cn("min-h-screen bg-background flex items-center justify-center px-4")}>
      <div className={cn("w-full max-w-md border border-border rounded-2xl bg-card p-6 shadow-sm text-center")}>Loading…</div>
    </div>}>
      <LoginPageContent />
    </Suspense>
  )
}

function LoginPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const next = searchParams.get("next") || "/dashboard"
  const initialMode = (searchParams.get("mode") || "login").toLowerCase() as "login" | "signup"
  const [mode, setMode] = useState<"login" | "signup">(initialMode)

  useEffect(() => {
    const m = (searchParams.get("mode") || "login").toLowerCase()
    if (m === "login" || m === "signup") setMode(m)
  }, [searchParams])

  const title = useMemo(() => (
    mode === "login" ? (
      <>Sign in to <Logo width={60} height={12} className="text-foreground inline" /></>
    ) : (
      <>Create your <Logo width={60} height={12} className="text-foreground inline" /> account</>
    )
  ), [mode])

  return (
    <div className={cn("min-h-screen bg-background flex items-center justify-center px-4")}> 
      <div className={cn("w-full max-w-md border border-border rounded-2xl bg-card p-6 shadow-sm")}> 
        <div className="mb-4 text-center">
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login" ? "Welcome back!" : "Join us and start your audit."}
          </p>
        </div>

        {mode === "login" ? (
          <LoginForm
            onSuccess={() => router.push(next)}
            onSwitchToSignup={() => setMode("signup")}
          />
        ) : (
          <SignupForm
            onSuccess={() => router.push("/login?mode=login")} 
            onSwitchToLogin={() => setMode("login")}
          />
        )}

        <div className="mt-4 text-center">
          {mode === "login" ? (
            <button
              type="button"
              onClick={() => setMode("signup")}
              className="text-sm text-primary hover:underline"
            >
              Don&apos;t have an account? Sign up
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setMode("login")}
              className="text-sm text-primary hover:underline"
            >
              Already have an account? Sign in
            </button>
          )}
        </div>
      </div>
    </div>
  )
}


