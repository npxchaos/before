"use client"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/components/providers/AuthProvider"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface UserMenuProps {
  className?: string
}

export function UserMenu({ className }: UserMenuProps) {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    setIsOpen(false)
  }

  const handleDashboardClick = () => {
    router.push("/dashboard")
    setIsOpen(false)
  }

  if (!user) return null

  return (
    <div className={cn("relative", className)} ref={menuRef}>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent transition-colors"
        aria-label="User menu"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
            {user.email?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-foreground">{user.email || 'User'}</p>
          </div>
        </div>
        <svg
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-md shadow-lg py-1 z-50">
          <div className="px-4 py-2 border-b border-border">
            <p className="text-sm font-medium text-foreground">{user.email || 'User'}</p>
            <p className="text-xs text-muted-foreground">
              Member since {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
          
          <div className="py-1">
            <button
              onClick={handleDashboardClick}
              className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
            >
              Dashboard
            </button>
            
            <button
              onClick={() => {
                // TODO: Navigate to profile page
                setIsOpen(false)
              }}
              className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
            >
              Profile Settings
            </button>
            
            <button
              onClick={handleSignOut}
              className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
