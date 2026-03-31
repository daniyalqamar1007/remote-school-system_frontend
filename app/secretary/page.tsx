"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SecretaryPage() {
  const router = useRouter()

  useEffect(() => {
    router.push("/secretary/dashboard")
  }, [router])

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <p className="text-lg">Redirecting to dashboard...</p>
      </div>
    </div>
  )
}
