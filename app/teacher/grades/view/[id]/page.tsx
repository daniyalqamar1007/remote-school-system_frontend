"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { 
  BookOpen, 
  Users, 
  Loader2,
  ArrowLeft,
  Edit
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import axios from "axios"
import { getLocalStorageValue } from "@/lib/utils"

interface GradeRecord {
  _id: string
  courseId: {
    _id: string
    courseName: string
    courseCode: string
  }
  class: string
  section: string
  term?: string
  markingType: string
  totalMarks: number
  students: Array<{
    studentId: {
      _id: string
      firstName: string
      lastName: string
      studentId: string
      class: string
      section: string
    }
    score: number
    _id: string
  }>
  createdAt: string
}

export default function ViewGradePage() {
  const router = useRouter()
  const params = useParams()
  const gradeId = params.id as string
  const [grade, setGrade] = useState<GradeRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGrade = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken')
        
        // First, get the single grade to get the combination details
        const singleGradeResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_SRS_SERVER}/grade/teacher/${gradeId}?_=${Date.now()}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )
        
        const singleGrade = singleGradeResponse.data
        
        // Now fetch all grades for the same combination (course, class, section, markingType, term)
        // Add cache-busting parameter to ensure fresh data
        const params = new URLSearchParams({
          page: '1',
          limit: '1000', // Get all records
          _: Date.now().toString(), // Cache busting
        })
        
        if (singleGrade.courseId?._id) params.append('courseId', singleGrade.courseId._id)
        if (singleGrade.class) params.append('className', singleGrade.class)
        if (singleGrade.section) params.append('section', singleGrade.section)
        if (singleGrade.markingType) params.append('markingType', singleGrade.markingType)
        if (singleGrade.term) params.append('term', singleGrade.term)
        
        const groupedResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_SRS_SERVER}/grade/teacher/records?${params.toString()}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )
        
        // Find the matching grouped record
        const groupedRecords = groupedResponse.data?.grouped || []
        console.log('Grouped records:', groupedRecords)
        console.log('Single grade:', singleGrade)
        
        const matchingGroup = groupedRecords.find((g: any) => 
          g.courseId?._id === singleGrade.courseId?._id &&
          g.class === singleGrade.class &&
          g.section === singleGrade.section &&
          g.markingType === singleGrade.markingType &&
          (g.term || 'N/A') === (singleGrade.term || 'N/A')
        )
        
        if (matchingGroup) {
          console.log('Matching group found:', matchingGroup)
          console.log('Students in group:', matchingGroup.students)
          setGrade({
            _id: matchingGroup._id,
            courseId: matchingGroup.courseId,
            class: matchingGroup.class,
            section: matchingGroup.section,
            term: matchingGroup.term,
            markingType: matchingGroup.markingType,
            totalMarks: matchingGroup.totalMarks,
            students: (matchingGroup.students || []).filter((s: any) => s.studentId), // Filter out null studentIds
            createdAt: matchingGroup.createdAt,
          })
        } else {
          // Fallback to single grade if grouped not found
          console.log('No matching group, using single grade')
          setGrade({
            _id: singleGrade._id,
            courseId: singleGrade.courseId,
            class: singleGrade.class,
            section: singleGrade.section,
            term: singleGrade.term,
            markingType: singleGrade.markingType,
            totalMarks: singleGrade.totalMarks,
            students: singleGrade.studentId ? [{
              studentId: singleGrade.studentId,
              score: singleGrade.score,
              _id: singleGrade._id,
            }] : [],
            createdAt: singleGrade.createdAt,
          })
        }
      } catch (error: any) {
        console.error('Error fetching grade:', error)
        toast.error('Failed to load grade record')
        router.push('/teacher/grades')
      } finally {
        setLoading(false)
      }
    }

    if (gradeId) {
      fetchGrade()
    }
  }, [gradeId, router])

  const getLetterGrade = (score: number) => {
    if (score >= 90) return "A"
    if (score >= 80) return "B"
    if (score >= 70) return "C"
    if (score >= 60) return "D"
    return "F"
  }

  const getGradeColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800'
    if (score >= 80) return 'bg-blue-100 text-blue-800'
    if (score >= 70) return 'bg-yellow-100 text-yellow-800'
    if (score >= 60) return 'bg-orange-100 text-orange-800'
    return 'bg-red-100 text-red-800'
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!grade) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Grade record not found</p>
          <Button className="mt-4" onClick={() => router.push('/teacher/grades')}>
            Back to Grades
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 w-full max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/teacher/grades')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">View Grade</h1>
        </div>
        <Button onClick={() => router.push(`/teacher/grades/update/${gradeId}`)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>

      {/* Grade Details */}
      <Card>
        <CardHeader>
          <CardTitle>Grade Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Course</label>
              <p className="text-lg font-semibold">{grade.courseId?.courseName || 'N/A'}</p>
              <p className="text-sm text-muted-foreground">{grade.courseId?.courseCode || ''}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Grade</label>
              <p className="text-lg font-semibold">{grade.class || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Section</label>
              <p className="text-lg font-semibold">{grade.section || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Marking Type</label>
              <p className="text-lg font-semibold">
                <Badge variant="outline" className="text-base px-3 py-1">{grade.markingType || 'N/A'}</Badge>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Total Marks</label>
              <p className="text-lg font-semibold">{grade.totalMarks || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Grades Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Students Marks ({grade.students?.length || 0})
          </CardTitle>
          <CardDescription>
            All students and their marks for this grade record
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!grade.students || grade.students.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No students found for this grade record</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grade.students.map((item, index) => {
                    const percentage = grade.totalMarks > 0 ? (item.score / grade.totalMarks) * 100 : 0
                    // Handle both populated object and direct access
                    const student = item.studentId
                    const studentName = student?.firstName && student?.lastName 
                      ? `${student.firstName} ${student.lastName}` 
                      : (student?.firstName || student?.lastName || 'N/A')
                    const studentIdValue = student?.studentId || 'N/A'
                    
                    console.log('Rendering student item:', { item, student, studentName, studentIdValue })
                    
                    return (
                      <TableRow key={item._id || item.studentId?._id || index}>
                        <TableCell className="font-medium">
                          {studentName}
                        </TableCell>
                        <TableCell>
                          {studentIdValue}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-lg">{item.score || 0} / {grade.totalMarks || 0}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={getGradeColor(percentage)}>
                            {percentage.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

