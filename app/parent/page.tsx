"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ParentRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard
    router.replace('/parent/dashboard')
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-6"></div>
        <p className="text-xl text-gray-600 dark:text-gray-300 font-medium">Redirecting to dashboard...</p>
      </div>
    </div>
  )
}
