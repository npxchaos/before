"use client"

import { useEffect, useState } from "react"
import { 
  Toast, 
  ToastMessage 
} from "@/components/ui/FeedbackComponents"
import { Logo } from "@/components/ui/Logo"

export default function VerifyEmailPage() {
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    // Show modal after a brief delay for better UX
    const timer = setTimeout(() => {
      setShowModal(true)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (showModal) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            // Redirect to home page
            window.location.href = "/"
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [showModal])

  const closeToast = () => {
    setToast(null)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    window.location.href = "/"
  }

  const handleGoToHome = () => {
    window.location.href = "/"
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background overlay */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-6 text-center space-y-6">
              {/* Success Icon */}
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>

              {/* Success Message */}
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Email Verified Successfully!
                </h2>
                <p className="text-sm text-muted-foreground">
                  Your account has been activated and you can now use all features.
                </p>
              </div>

              {/* Welcome Message */}
              <div className="bg-muted/50 dark:bg-muted/20 rounded-lg p-4">
                <p className="text-sm text-foreground">
                  Welcome to <Logo width={60} height={12} className="text-foreground inline" />! 🎉
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  You&apos;re all set to start using our AI-powered tools.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleGoToHome}
                  className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors"
                >
                  🚀 Get Started
                </button>
                <button
                  onClick={handleCloseModal}
                  className="w-full bg-secondary text-secondary-foreground py-2 px-4 rounded-md hover:bg-secondary/90 transition-colors"
                >
                  Close
                </button>
              </div>

              {/* Countdown */}
              <div className="text-xs text-muted-foreground">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span>Auto-redirecting in {countdown} seconds</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1 dark:bg-gray-700">
                  <div 
                    className="bg-primary h-1 rounded-full transition-all duration-1000"
                    style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {!showModal && (
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Verifying your email...</p>
        </div>
      )}

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
