"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/AuthProvider"
import { cn } from "@/lib/utils"
import { 
  Toast, 
  ToastMessage, 
  ProgressIndicator, 
  ErrorMessage, 
  SuccessMessage,
  LoadingButton 
} from "@/components/ui/FeedbackComponents"

interface SignupFormProps {
  onSuccess?: () => void
  onSwitchToLogin?: () => void
  className?: string
}

// Email verification screen component
function EmailVerificationScreen({ 
  email, 
  onResendEmail, 
  onSwitchToLogin, 
  onClose 
}: { 
  email: string
  onResendEmail: () => void
  onSwitchToLogin: () => void
  onClose: () => void
}) {
  const [isResending, setIsResending] = useState(false)

  const handleResendEmail = async () => {
    setIsResending(true)
    await onResendEmail()
    setIsResending(false)
  }

  const handleCheckEmail = () => {
    // Try to open email client
    window.open(`mailto:${email}`, '_blank')
  }

  return (
    <div className="text-center space-y-6">
      {/* Success Icon */}
      <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      </div>

      {/* Success Message */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Account Created Successfully!
        </h3>
        <p className="text-sm text-muted-foreground">
          We&apos;ve sent a verification email to activate your account.
        </p>
      </div>

      {/* Email Display */}
      <div className="bg-muted/50 dark:bg-muted/20 rounded-lg p-4">
        <p className="text-xs text-muted-foreground mb-1">Verification email sent to:</p>
        <p className="text-sm font-medium text-foreground">{email}</p>
      </div>

      {/* Instructions */}
      <div className="text-sm text-muted-foreground space-y-2">
        <p>Please check your email and click the verification link to activate your account.</p>
        <p>Don&apos;t see the email? Check your spam folder.</p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleCheckEmail}
          className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors"
        >
          📧 Check Email
        </button>
        <button
          onClick={handleResendEmail}
          disabled={isResending}
          className="flex-1 bg-secondary text-secondary-foreground py-2 px-4 rounded-md hover:bg-secondary/90 transition-colors disabled:opacity-50"
        >
          {isResending ? "Sending..." : "Resend Email"}
        </button>
      </div>

      {/* Additional Actions */}
      <div className="flex justify-center gap-4 text-sm">
        <button
          onClick={onSwitchToLogin}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          Switch to Login
        </button>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  )
}

export function SignupForm({ onSuccess, onSwitchToLogin, className }: SignupFormProps) {
  const { signUp } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [isValidating, setIsValidating] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [showEmailVerification, setShowEmailVerification] = useState(false)

  const totalSteps = 4 // Validation, Creation, Email Verification, Complete

  const validatePassword = (password: string) => {
    const minLength = 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    if (password.length < minLength) {
      return "Password must be at least 8 characters long"
    }
    if (!hasUpperCase) {
      return "Password must contain at least one uppercase letter"
    }
    if (!hasLowerCase) {
      return "Password must contain at least one lowercase letter"
    }
    if (!hasNumbers) {
      return "Password must contain at least one number"
    }
    if (!hasSpecialChar) {
      return "Password must contain at least one special character"
    }
    return null
  }

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

  const handleResendEmail = async () => {
    try {
      const { error } = await signUp(email, password)
      if (error) {
        showToast(error.message, "error")
      } else {
        showToast("Verification email resent successfully!", "success")
      }
    } catch {
      showToast("Failed to resend verification email. Please try again.", "error")
    }
  }

  const handleCloseModal = () => {
    setShowEmailVerification(false)
    onSuccess?.()
  }

  const handleSwitchToLogin = () => {
    setShowEmailVerification(false)
    onSwitchToLogin?.()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    setCurrentStep(1)

    // Step 1: Validation
    setIsValidating(true)
    setCurrentStep(1)
    
    // Simulate validation time for better UX
    await new Promise(resolve => setTimeout(resolve, 800))

    // Validate password
    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      showToast(passwordError, "error")
      setIsLoading(false)
      setIsValidating(false)
      setCurrentStep(0)
      return
    }

    // Check password confirmation
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      showToast("Passwords do not match", "error")
      setIsLoading(false)
      setIsValidating(false)
      setCurrentStep(0)
      return
    }

    // Step 2: Account Creation
    setIsValidating(false)
    setIsCreating(true)
    setCurrentStep(2)

    try {
      const { error } = await signUp(email, password)
      
      if (error) {
        setError(error.message)
        showToast(error.message, "error")
        setCurrentStep(0)
      } else {
        // Step 3: Email Verification
        setCurrentStep(3)
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Step 4: Complete
        setCurrentStep(4)
        setIsComplete(true)
        
        setSuccess("Account created successfully! Please check your email to verify your account.")
        showToast("Account created successfully! Check your email for verification.", "success")
        
        // Show email verification screen instead of auto-closing
        setShowEmailVerification(true)
      }
    } catch {
      setError("An unexpected error occurred. Please try again.")
      showToast("An unexpected error occurred. Please try again.", "error")
      setCurrentStep(0)
    } finally {
      setIsLoading(false)
      setIsCreating(false)
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

  // Show email verification screen
  if (showEmailVerification) {
    return (
      <div className={cn("w-full max-w-md mx-auto", className)}>
        <EmailVerificationScreen
          email={email}
          onResendEmail={handleResendEmail}
          onSwitchToLogin={handleSwitchToLogin}
          onClose={handleCloseModal}
        />
        
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

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      {/* Progress Indicator */}
      {isLoading && (
        <ProgressIndicator currentStep={currentStep} totalSteps={totalSteps} />
      )}

      {/* Step Labels */}
      {isLoading && (
        <div className="mb-4 text-center">
          <div className="text-sm text-muted-foreground">
            {currentStep === 1 && "Validating your information..."}
            {currentStep === 2 && "Creating your account..."}
            {currentStep === 3 && "Setting up email verification..."}
            {currentStep === 4 && "Account created successfully!"}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="signup-email" className="block text-sm font-medium text-foreground mb-2">
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className={cn(
              "w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200",
              isLoading && "opacity-50 cursor-not-allowed",
              error && "border-destructive focus:ring-destructive"
            )}
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label htmlFor="signup-password" className="block text-sm font-medium text-foreground mb-2">
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            className={cn(
              "w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200",
              isLoading && "opacity-50 cursor-not-allowed",
              error && "border-destructive focus:ring-destructive"
            )}
            placeholder="Create a password"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Must be at least 8 characters with uppercase, lowercase, number, and special character
          </p>
        </div>

        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-foreground mb-2">
            Confirm Password
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading}
            className={cn(
              "w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200",
              isLoading && "opacity-50 cursor-not-allowed",
              error && "border-destructive focus:ring-destructive"
            )}
            placeholder="Confirm your password"
          />
        </div>

        {error && <ErrorMessage message={error} />}
        {success && <SuccessMessage message={success} />}

        <LoadingButton
          type="submit"
          isLoading={isLoading}
          isComplete={isComplete}
          loadingText={
            isValidating ? "Validating..." :
            isCreating ? "Creating account..." :
            isComplete ? "Account created!" : "Creating account..."
          }
          completeText="Account created!"
        >
          Create Account
        </LoadingButton>

        {onSwitchToLogin && (
          <div className="text-center">
            <button
              type="button"
              onClick={onSwitchToLogin}
              disabled={isLoading}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              Already have an account? Sign in
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

