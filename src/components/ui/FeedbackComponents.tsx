"use client"

import { cn } from "@/lib/utils"

export interface ToastMessage {
  id: string
  type: "success" | "error" | "info"
  message: string
}

// Toast component for notifications
export function Toast({ message, type, onClose }: { message: string; type: ToastMessage["type"]; onClose: () => void }) {
  const bgColor = type === "success" ? "bg-green-500" : type === "error" ? "bg-red-500" : "bg-blue-500"
  
  return (
    <div className={cn(
      "fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white max-w-sm animate-in slide-in-from-right duration-300",
      bgColor
    )}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-4 text-white hover:text-gray-200 transition-colors"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  )
}

// Progress indicator component
export function ProgressIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  const progress = (currentStep / totalSteps) * 100
  
  return (
    <div className="w-full mb-4">
      <div className="flex justify-between text-xs text-muted-foreground mb-2">
        <span>Step {currentStep} of {totalSteps}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

// Loading spinner component
export function LoadingSpinner({ size = "sm", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  }
  
  return (
    <div className={cn("animate-spin rounded-full border-2 border-current border-t-transparent", sizeClasses[size], className)} />
  )
}

// Error message component
export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md animate-in slide-in-from-top duration-200">
      <div className="flex items-center">
        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        {message}
      </div>
    </div>
  )
}

// Success message component
export function SuccessMessage({ message }: { message: string }) {
  return (
    <div className="text-sm text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-md animate-in slide-in-from-top duration-200">
      <div className="flex items-center">
        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        {message}
      </div>
    </div>
  )
}

// Loading button component
export function LoadingButton({ 
  isLoading, 
  isComplete, 
  children, 
  loadingText, 
  completeText,
  className,
  ...props 
}: {
  isLoading: boolean
  isComplete?: boolean
  children: React.ReactNode
  loadingText: string
  completeText?: string
  className?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      disabled={isLoading}
      className={cn(
        "w-full py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 flex items-center justify-center",
        isLoading 
          ? "bg-primary/70 text-primary-foreground cursor-not-allowed" 
          : "bg-primary text-primary-foreground hover:bg-primary/90",
        isComplete && "bg-green-500 hover:bg-green-600",
        className
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size="sm" className="mr-2" />
          {isComplete ? completeText || "Complete!" : loadingText}
        </>
      ) : (
        children
      )}
    </button>
  )
}
