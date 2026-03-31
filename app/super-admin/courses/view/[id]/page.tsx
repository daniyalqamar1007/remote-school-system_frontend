"use client"

import React, { useEffect, useState, Suspense } from "react"
import axios from "axios"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, ArrowLeft } from "lucide-react"

function CourseDetailContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = (params?.id as string) || ''
  const schoolId = searchParams?.get('schoolId') || ''
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [course, setCourse] = useState<any>(null)

  const fetchCourse = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
      if (!schoolId) {
        setError('School ID is required')
        return
      }
      const url = `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/courses/${id}?schoolId=${schoolId}`
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } })
      if (res.data?.success && res.data?.data) setCourse(res.data.data.course)
      else setError(res.data?.message || 'Failed to load course')
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load course')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (id && schoolId) fetchCourse() }, [id, schoolId])

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Course Details</h1>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : error ? (
        <Card className="border-red-200 bg-red-50"><CardContent className="p-6 text-red-700">{error}</CardContent></Card>
      ) : !course ? (
        <Card><CardContent className="p-6">No course found.</CardContent></Card>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>{course.courseName} <span className="text-gray-500 font-normal">({course.courseCode})</span></CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div><span className="text-gray-500">Prerequisites:</span> <span className="text-gray-800">{course.Prerequisites || '—'}</span></div>
                <div><span className="text-gray-500">Description:</span> <span className="text-gray-800">{course.description || '—'}</span></div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><span className="text-gray-500">Created:</span> <span className="text-gray-800">{course.createdAt ? new Date(course.createdAt).toLocaleString() : '—'}</span></div>
                  <div><span className="text-gray-500">Updated:</span> <span className="text-gray-800">{course.updatedAt ? new Date(course.updatedAt).toLocaleString() : '—'}</span></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">School</CardTitle></CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div><span className="text-gray-500">Name:</span> <span className="text-gray-800">{course.schoolId?.name || '—'}</span></div>
                <div><span className="text-gray-500">Code:</span> <span className="text-gray-800">{course.schoolId?.code || '—'}</span></div>
                <div><span className="text-gray-500">Type:</span> <span className="text-gray-800">{course.schoolId?.type || '—'}</span></div>
                <div><span className="text-gray-500">Address:</span> <span className="text-gray-800">{[course.schoolId?.address?.street, course.schoolId?.address?.city, course.schoolId?.address?.state, course.schoolId?.address?.zipCode, course.schoolId?.address?.country].filter(Boolean).join(', ') || '—'}</span></div>
                <div><span className="text-gray-500">Phone:</span> <span className="text-gray-800">{course.schoolId?.phone || '—'}</span></div>
                <div><span className="text-gray-500">Email:</span> <span className="text-gray-800">{course.schoolId?.email || '—'}</span></div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-lg">Departments ({Array.isArray(course.departmentIds) ? course.departmentIds.length : 0})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(course.departmentIds) && course.departmentIds.length > 0 ? (
                      course.departmentIds.map((d: any) => (
                        <TableRow key={d._id}>
                          <TableCell className="font-medium">{d.departmentName}</TableCell>
                          <TableCell>{d.code || '—'}</TableCell>
                          <TableCell>{d.description || '—'}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={3} className="text-center py-8 text-gray-500">No departments</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

export default function CourseDetailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
      <CourseDetailContent />
    </Suspense>
  )
}


