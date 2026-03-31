"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import LessonPlanApprovalPage from "@/components/lesson-plan-approval/LessonPlanApprovalPage"
import { useCanApproveLessonPlans } from "@/hooks/useCanApproveLessonPlans"
import { Loader2 } from "lucide-react"

export default function TeacherLessonPlanApproval() {
  const router = useRouter()
  const { canApprove, loading } = useCanApproveLessonPlans()

  useEffect(() => {
    if (!loading && !canApprove) {
      router.replace("/teacher/dashboard")
    }
  }, [canApprove, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (!canApprove) {
    return null
  }

  return <LessonPlanApprovalPage />
}
