"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SuperAdminPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard
    router.replace("/super-admin/dashboard")
  }, [router])

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-muted-foreground">Redirecting to dashboard...</div>
    </div>
  )
}
