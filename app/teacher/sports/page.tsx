"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TeacherSportsPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to programs page (main sports page)
    router.replace('/teacher/sports/programs')
  }, [router])

  return null
}
