"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth, supabase } from "@/components/providers/AuthProvider"
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Users, TrendingUp, CheckCircle, Clock } from 'lucide-react'
import { DashboardCard } from '@/components/mvpblocks/ui/dashboard-card'
import { DashboardHeader } from '@/components/mvpblocks/ui/dashboard-header'
import { cn } from "@/lib/utils"

interface Submission {
  id: string
  url: string
  status: string
  created_at: string
  updated_at: string
  user_id?: string
  result_lighthouse?: {
    performance: number
    accessibility: number
    seo: number
    bestPractices: number
  }
  result_aeo?: {
    score: number
    summary: string
    audit: {
      clarity: number
      entities: number
      semanticDepth: number
      snippetCompatibility: number
      schemaMarkup: number
    }
  }
  visibility_score?: number
  started_at?: string
}

export function DashboardContent() {
  const { user } = useAuth()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

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

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchSubmissions()
    setIsRefreshing(false)
  }

  const handleExport = () => {
    const csvContent = [
      ['URL', 'Status', 'Score', 'Submitted', 'Updated'],
      ...submissions.map(s => [
        s.url,
        s.status,
        s.visibility_score || 'N/A',
        new Date(s.created_at).toLocaleDateString(),
        new Date(s.updated_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'prompta-submissions.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleAddSubmission = () => {
    window.location.href = '/'
  }

  // Calculate dashboard stats
  const totalSubmissions = submissions.length
  const completedSubmissions = submissions.filter(s => s.status === 'succeeded').length
  const processingSubmissions = submissions.filter(s => s.status === 'processing').length
  const averageScore = submissions.length > 0 
    ? Math.round(submissions.reduce((sum, s) => sum + (s.visibility_score || 0), 0) / submissions.length)
    : 0

  // Dashboard stats data
  const stats = [
    {
      title: 'Total Submissions',
      value: totalSubmissions.toString(),
      change: `+${totalSubmissions > 0 ? Math.round((totalSubmissions / Math.max(1, totalSubmissions - 1)) * 100) : 0}%`,
      changeType: 'positive' as const,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Completed',
      value: completedSubmissions.toString(),
      change: `${completedSubmissions > 0 ? Math.round((completedSubmissions / totalSubmissions) * 100) : 0}%`,
      changeType: 'positive' as const,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Processing',
      value: processingSubmissions.toString(),
      change: `${processingSubmissions > 0 ? Math.round((processingSubmissions / totalSubmissions) * 100) : 0}%`,
      changeType: 'positive' as const,
      icon: Clock,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'Average Score',
      value: `${averageScore}/100`,
      change: averageScore > 80 ? 'Excellent' : averageScore > 60 ? 'Good' : 'Needs Work',
      changeType: (averageScore > 80 ? 'positive' : averageScore > 60 ? 'positive' : 'negative') as 'positive' | 'negative',
      icon: TrendingUp,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <SidebarInset>
        <DashboardHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={handleRefresh}
          onExport={handleExport}
          isRefreshing={isRefreshing}
        />

        <div className="flex flex-1 flex-col gap-2 p-2 pt-0 sm:gap-4 sm:p-4">
          <div className="min-h-[calc(100vh-4rem)] flex-1 rounded-lg p-3 sm:rounded-xl sm:p-4 md:p-6">
            <div className="mx-auto max-w-6xl space-y-4 sm:space-y-6">
              <div className="px-2 sm:px-0">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Welcome back, {user?.email?.split('@')[0] || 'User'}
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Here&apos;s what&apos;s happening with your AEO submissions today.
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                {stats.map((stat, index) => (
                  <DashboardCard key={stat.title} stat={stat} index={index} />
                ))}
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3">
                {/* Main Content Section */}
                <div className="space-y-4 sm:space-y-6 xl:col-span-2">
                  {/* Submissions Table */}
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
                        <button
                          onClick={handleAddSubmission}
                          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                        >
                          Submit URL
                        </button>
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
                                  Submitted {new Date(submission.created_at).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                                {submission.visibility_score && (
                                  <p className="text-sm text-primary mt-1">
                                    Score: {submission.visibility_score}/100
                                  </p>
                                )}
                              </div>
                              <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
                                <span
                                  className={cn(
                                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                                    submission.status === "succeeded" ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" :
                                    submission.status === "processing" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300" :
                                    submission.status === "failed" ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300" :
                                    "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
                                  )}
                                >
                                  {submission.status}
                                </span>
                                {submission.visibility_score && submission.visibility_score >= 80 && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                                    🎯 Excellent
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Show AEO results if available */}
                            {submission.result_aeo && (
                              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                                <h4 className="text-sm font-medium text-foreground mb-2">AEO Analysis Results</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Clarity:</span>
                                    <span className="ml-2 font-medium">{submission.result_aeo.audit.clarity}/100</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Entities:</span>
                                    <span className="ml-2 font-medium">{submission.result_aeo.audit.entities}/100</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Semantic Depth:</span>
                                    <span className="ml-2 font-medium">{submission.result_aeo.audit.semanticDepth}/100</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Schema Markup:</span>
                                    <span className="ml-2 font-medium">{submission.result_aeo.audit.schemaMarkup}/100</span>
                                  </div>
                                </div>
                                {submission.result_aeo.summary && (
                                  <p className="text-sm text-muted-foreground mt-3">
                                    {submission.result_aeo.summary}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Show Lighthouse results if available */}
                            {submission.result_lighthouse && (
                              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                                <h4 className="text-sm font-medium text-foreground mb-2">Lighthouse Results</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Performance:</span>
                                    <span className="ml-2 font-medium">{Math.round(submission.result_lighthouse.performance * 100)}/100</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Accessibility:</span>
                                    <span className="ml-2 font-medium">{Math.round(submission.result_lighthouse.accessibility * 100)}/100</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">SEO:</span>
                                    <span className="ml-2 font-medium">{Math.round(submission.result_lighthouse.seo * 100)}/100</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Best Practices:</span>
                                    <span className="ml-2 font-medium">{Math.round(submission.result_lighthouse.bestPractices * 100)}/100</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sidebar Section */}
                <div className="space-y-4 sm:space-y-6">
                  {/* Quick Actions */}
                  <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <button
                        onClick={handleAddSubmission}
                        className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      >
                        Submit New URL
                      </button>
                      <button
                        onClick={handleExport}
                        className="w-full inline-flex items-center justify-center px-4 py-2 border border-border text-sm font-medium rounded-md text-foreground bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-border"
                      >
                        Export Data
                      </button>
                    </div>
                  </div>

                  {/* System Status */}
                  <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">System Status</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">API Status</span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                          Online
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Database</span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                          Connected
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">n8n Workflows</span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                          Pending
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                      {submissions.slice(0, 5).map((submission) => (
                        <div key={submission.id} className="flex items-center space-x-3">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            submission.status === "succeeded" ? "bg-green-500" :
                            submission.status === "processing" ? "bg-yellow-500" :
                            submission.status === "failed" ? "bg-red-500" :
                            "bg-gray-500"
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground truncate">{submission.url}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(submission.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
