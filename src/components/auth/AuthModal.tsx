"use client"

import { useState } from "react"
import { LoginForm } from "./LoginForm"
import { SignupForm } from "./SignupForm"
import { cn } from "@/lib/utils"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultMode?: "login" | "signup"
  className?: string
}

export function AuthModal({ isOpen, onClose, defaultMode = "login", className }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">(defaultMode)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={cn(
        "relative bg-background border border-border rounded-lg shadow-lg p-6 w-full max-w-md mx-4",
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            {mode === "login" ? "Sign In" : "Create Account"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {mode === "login" ? (
            <LoginForm
              onSuccess={onClose}
              onSwitchToSignup={() => setMode("signup")}
            />
          ) : (
            <SignupForm
              onSuccess={onClose}
              onSwitchToLogin={() => setMode("login")}
            />
          )}
        </div>
      </div>
    </div>
  )
}
