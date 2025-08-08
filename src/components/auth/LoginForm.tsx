"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/AuthProvider"
import { cn } from "@/lib/utils"
import { 
  Toast, 
  ToastMessage, 
  ErrorMessage,
  LoadingButton 
} from "@/components/ui/FeedbackComponents"

interface LoginFormProps {
  onSuccess?: () => void
  onSwitchToSignup?: () => void
  className?: string
}

export function LoginForm({ onSuccess, onSwitchToSignup, className }: LoginFormProps) {
  const { signIn } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const showToast = (message: string, type: ToastMessage["type"]) => {
    setToast({
      id: Date.now().toString(),
      type,
      message
    })
  }

  const closeToast = () => {
    setToast(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Simulate authentication time for better UX
    await new Promise(resolve => setTimeout(resolve, 600))
    setIsAuthenticating(true)

    try {
      const { error } = await signIn(email, password)
      
      if (error) {
        setError(error.message)
        showToast(error.message, "error")
      } else {
        setIsComplete(true)
        showToast("Successfully signed in!", "success")
        
        // Auto-close modal after success
        setTimeout(() => {
          onSuccess?.()
        }, 1000)
      }
    } catch {
      setError("An unexpected error occurred. Please try again.")
      showToast("An unexpected error occurred. Please try again.", "error")
    } finally {
      setIsLoading(false)
      setIsAuthenticating(false)
    }
  }

  // Auto-hide toast after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        closeToast()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      {/* Loading indicator */}
      {isLoading && (
        <div className="mb-4 text-center">
          <div className="text-sm text-muted-foreground">
            {isAuthenticating && "Authenticating..."}
            {isComplete && "Welcome back!"}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className={cn(
              "w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200",
              isLoading && "opacity-50 cursor-not-allowed",
              error && "border-red-500 focus:ring-red-500"
            )}
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            className={cn(
              "w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200",
              isLoading && "opacity-50 cursor-not-allowed",
              error && "border-red-500 focus:ring-red-500"
            )}
            placeholder="Enter your password"
          />
        </div>

        {error && <ErrorMessage message={error} />}

        <LoadingButton
          type="submit"
          isLoading={isLoading}
          isComplete={isComplete}
          loadingText={
            isAuthenticating ? "Signing in..." :
            isComplete ? "Welcome back!" : "Signing in..."
          }
          completeText="Welcome back!"
        >
          Sign In
        </LoadingButton>

        {onSwitchToSignup && (
          <div className="text-center">
            <button
              type="button"
              onClick={onSwitchToSignup}
              disabled={isLoading}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              Don&apos;t have an account? Sign up
            </button>
          </div>
        )}
      </form>

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}
    </div>
  )
}

