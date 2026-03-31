"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SportsManagementPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to programs page (main sports page)
    router.replace('/admin/sports/programs')
  }, [router])

  return null
}