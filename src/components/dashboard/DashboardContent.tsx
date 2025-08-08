"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth, supabase } from "@/components/providers/AuthProvider"
import { cn } from "@/lib/utils"

interface Submission {
  id: string
  url: string
  status: string
  created_at: string
  updated_at: string
}

export function DashboardContent() {
  const { user } = useAuth()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      setSubmissions(data || [])
    } catch (err) {
      setError("Failed to load submissions")
      console.error("Error fetching submissions:", err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (user) {
      fetchSubmissions()
    }
  }, [user, fetchSubmissions])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
      case "processing":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your submissions...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, {user?.email}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Total Submissions</h3>
            <p className="text-2xl font-bold text-foreground">{submissions.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Completed</h3>
            <p className="text-2xl font-bold text-foreground">
              {submissions.filter(s => s.status === "completed").length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Processing</h3>
            <p className="text-2xl font-bold text-foreground">
              {submissions.filter(s => s.status === "processing").length}
            </p>
          </div>
        </div>

        {/* Submissions List */}
        <div className="bg-card border border-border rounded-lg">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Your Submissions</h2>
          </div>

          {error && (
            <div className="p-6">
              <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                {error}
              </div>
            </div>
          )}

          {submissions.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-muted-foreground">No submissions yet.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Submit your first URL to get started!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {submissions.map((submission) => (
                <div key={submission.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {submission.url}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Submitted {formatDate(submission.created_at)}
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          getStatusColor(submission.status)
                        )}
                      >
                        {submission.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
