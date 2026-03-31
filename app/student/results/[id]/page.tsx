"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Book, FileText, Presentation, Beaker, PenTool, Loader2, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import axios from "axios"

interface GradeComponent {
  score: number
  weightage: number
}

interface GradeData {
  studentId: string
  courseId: string
  teacherId: string
  courseName: string
  quiz?: GradeComponent
  midTerm?: GradeComponent
  project?: GradeComponent
  finalTerm?: GradeComponent
  overAll?: number
}

interface ComponentDisplay {
  name: string
  score: number
  weight: number
  icon: any
}

export default function GradeDetail({ params }: { params: { id: string } }) {
  const [gradeData, setGradeData] = useState<GradeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const courseId = params.id

  useEffect(() => {
    const fetchGradeData = async () => {
      try {
        setLoading(true)
        setError(null)
        const studentId = localStorage.getItem("id")
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken')

        if (!studentId) {
          throw new Error("Student ID not found. Please log in again.")
        }

        if (!token) {
          throw new Error("Authentication token not found. Please log in again.")
        }

        const apiUrl = `${process.env.NEXT_PUBLIC_SRS_SERVER}/grade/student-course?studentId=${studentId}&courseId=${courseId}`

        const response = await axios.get(apiUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.data) {
          setGradeData(response.data)
        } else {
          throw new Error("No grade data received from server")
        }
      } catch (err: any) {
        console.error("Error fetching grade data:", err)
        if (err.response?.status === 404) {
          setError("Grade not found for this course. Please check back later.")
        } else if (err.response?.status === 401) {
          setError("Authentication failed. Please log in again.")
        } else if (err.response?.data?.message) {
          setError(err.response.data.message)
        } else if (err.message) {
          setError(err.message)
        } else {
          setError("An error occurred while loading grade details. Please try again later.")
        }
      } finally {
        setLoading(false)
      }
    }

    if (courseId) {
      fetchGradeData()
    }
  }, [courseId])

  const getGradeColor = (score: number) => {
    if (score >= 90) return "text-green-600 dark:text-green-400"
    if (score >= 80) return "text-blue-600 dark:text-blue-400"
    if (score >= 70) return "text-yellow-600 dark:text-yellow-400"
    if (score >= 60) return "text-orange-600 dark:text-orange-400"
    return "text-red-600 dark:text-red-400"
  }

  const getGradeBgColor = (score: number) => {
    if (score >= 90) return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
    if (score >= 80) return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
    if (score >= 70) return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200"
    if (score >= 60) return "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200"
    return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
  }

  const getLetterGrade = (score: number) => {
    if (score >= 90) return "A"
    if (score >= 80) return "B"
    if (score >= 70) return "C"
    if (score >= 60) return "D"
    return "F"
  }

  const getComponents = (data: GradeData): ComponentDisplay[] => {
    const components: ComponentDisplay[] = []
    
    if (data.quiz) {
      components.push({ 
        name: "Quiz", 
        score: data.quiz.score || 0, 
        weight: data.quiz.weightage || 0, 
        icon: PenTool 
      })
    }
    
    if (data.midTerm) {
      components.push({ 
        name: "Mid Term", 
        score: data.midTerm.score || 0, 
        weight: data.midTerm.weightage || 0, 
        icon: FileText 
      })
    }
    
    if (data.project) {
      components.push({ 
        name: "Project", 
        score: data.project.score || 0, 
        weight: data.project.weightage || 0, 
        icon: Presentation 
      })
    }
    
    if (data.finalTerm) {
      components.push({ 
        name: "Final Term", 
        score: data.finalTerm.score || 0, 
        weight: data.finalTerm.weightage || 0, 
        icon: Beaker 
      })
    }

    return components
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-950 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-indigo-500" />
              <p className="text-lg font-medium text-gray-600 dark:text-gray-400">Loading grade details...</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Please wait</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-950 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/student/results"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="font-medium">Back to Results</span>
          </Link>
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                    Error Loading Grade Details
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                  <Button 
                    onClick={() => window.location.reload()} 
                    variant="outline"
                    className="mt-2"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!gradeData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-950 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/student/results"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="font-medium">Back to Results</span>
          </Link>
          <Card>
            <CardContent className="p-6 sm:p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400 text-lg">No grade data found for this course</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const components = getComponents(gradeData)
  const overallScore = gradeData.overAll || 0
  const letterGrade = getLetterGrade(overallScore)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-950 p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <Link
          href="/student/results"
          className="inline-flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Results</span>
        </Link>

        <Card className="mb-6 sm:mb-8 shadow-lg border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl sm:text-3xl flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <Book className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="break-words">{gradeData.courseName || 'Course'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg">
              <div>
                <span className="text-base sm:text-xl text-gray-600 dark:text-gray-400 block mb-1">Overall Grade</span>
                <div className="flex items-center gap-3">
                  <Badge className={`text-2xl sm:text-4xl font-bold px-4 py-2 ${getGradeBgColor(overallScore)}`}>
                    {letterGrade}
                  </Badge>
                  <span className={`text-xl sm:text-2xl font-semibold ${getGradeColor(overallScore)}`}>
                    {overallScore.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Progress</span>
                <span className="font-medium">{overallScore.toFixed(1)}%</span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${overallScore >= 90 ? 'bg-green-500' : overallScore >= 80 ? 'bg-blue-500' : overallScore >= 70 ? 'bg-yellow-500' : overallScore >= 60 ? 'bg-orange-500' : 'bg-red-500'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(overallScore, 100)}%` }}
                  transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {components.length > 0 ? (
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">Grade Components</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Component</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                      <TableHead className="text-right">Weight</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {components.map((component, index) => {
                      const Icon = component.icon
                      return (
                        <motion.tr
                          key={component.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                              <span>{component.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className={`text-right font-semibold ${getGradeColor(component.score)}`}>
                            {component.score.toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-right text-gray-600 dark:text-gray-400">
                            {component.weight}%
                          </TableCell>
                        </motion.tr>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-lg border-0">
            <CardContent className="p-6 sm:p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                No grade components available for this course yet.
              </p>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  )
}
