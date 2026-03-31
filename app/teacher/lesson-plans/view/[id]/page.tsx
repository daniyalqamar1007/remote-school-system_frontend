"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { 
  Loader2,
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import axios from "axios"
import { getLocalStorageValue } from "@/lib/utils"

interface LessonPlan {
  _id: string
  title: string
  description: string
  courseId: {
    _id: string
    courseCode: string
    courseName: string
  }
  objectives: string[]
  materials: string[]
  duration: number
  status: 'pending' | 'approved' | 'rejected' | 'revision_required'
  reviewComments: string[]
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: {
    firstName: string
    lastName: string
  }
}

export default function ViewLessonPlanPage() {
  const router = useRouter()
  const params = useParams()
  const lessonPlanId = params.id as string
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLessonPlan = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken')
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_SRS_SERVER}/lesson-plan/${lessonPlanId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )
        setLessonPlan(response.data)
      } catch (error: any) {
        console.error('Error fetching lesson plan:', error)
        // Handle error - maybe redirect or show error message
      } finally {
        setLoading(false)
      }
    }

    if (lessonPlanId) {
      fetchLessonPlan()
    }
  }, [lessonPlanId])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      case 'revision_required':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800"><AlertTriangle className="h-3 w-3 mr-1" />Revision Required</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!lessonPlan) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Lesson plan not found</h3>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 w-full max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Lesson Plan Details</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{lessonPlan.title}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {lessonPlan.courseId?.courseCode ? 
                  `${lessonPlan.courseId.courseCode} - ${lessonPlan.courseId.courseName}` : 
                  'Course information unavailable'
                }
              </p>
            </div>
            {getStatusBadge(lessonPlan.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{lessonPlan.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Duration</h3>
              <p className="text-gray-700">{lessonPlan.duration} minutes</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Submitted</h3>
              <p className="text-gray-700">{formatDate(lessonPlan.submittedAt)}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Learning Objectives</h3>
            <ul className="list-disc list-inside space-y-1">
              {lessonPlan.objectives.map((objective, index) => (
                <li key={index} className="text-gray-700">{objective}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Required Materials</h3>
            <ul className="list-disc list-inside space-y-1">
              {lessonPlan.materials.map((material, index) => (
                <li key={index} className="text-gray-700">{material}</li>
              ))}
            </ul>
          </div>

          {lessonPlan.reviewComments && lessonPlan.reviewComments.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Review Comments</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                {lessonPlan.reviewComments.map((comment, index) => (
                  <p key={index} className="text-gray-700">• {comment}</p>
                ))}
              </div>
            </div>
          )}

          {lessonPlan.reviewedBy && (
            <div>
              <h3 className="font-semibold mb-2">Reviewed By</h3>
              <p className="text-gray-700">
                {lessonPlan.reviewedBy.firstName} {lessonPlan.reviewedBy.lastName}
                {lessonPlan.reviewedAt && ` on ${formatDate(lessonPlan.reviewedAt)}`}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button 
              onClick={() => router.push(`/teacher/lesson-plans/update/${lessonPlan._id}`)}
              className="bg-black hover:bg-gray-800 text-white"
            >
              Edit Lesson Plan
            </Button>
            <Button variant="outline" onClick={() => router.back()}>
              Back to List
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

