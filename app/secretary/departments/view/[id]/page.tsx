"use client"

import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, ArrowLeft, School, User2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface DepartmentDetail {
  _id: string
  departmentName: string
  code?: string
  description?: string
  schoolId?: {
    _id: string
    name: string
    code?: string
    type?: string
    address?: {
      street?: string
      city?: string
      state?: string
      zipCode?: string
      country?: string
    }
    phone?: string
    email?: string
  }
  createdBy?: {
    _id: string
    email: string
    firstName: string
    lastName: string
    role: string
  }
  createdAt?: string
  updatedAt?: string
}

interface CourseLite {
  _id: string
  courseName: string
  courseCode: string
  schoolId: string
  createdAt?: string
  departmentsCount?: number
}

export default function DepartmentViewPage() {
  const params = useParams()
  const router = useRouter()
  const id = (params?.id as string) || ''
  const searchParams = useSearchParams()
  const schoolIdParam = searchParams?.get('schoolId') || ''

  const [loading, setLoading] = useState(true)
  const [department, setDepartment] = useState<DepartmentDetail | null>(null)
  const [courses, setCourses] = useState<CourseLite[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      const res = await axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/departments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      , params: schoolIdParam ? { schoolId: schoolIdParam } : undefined })

      if (res.data?.success && res.data?.data) {
        setDepartment(res.data.data.department)
        setCourses(res.data.data.courses || [])
      } else {
        setError(res.data?.message || 'Failed to load department')
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load department')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) fetchDetails()
  }, [id])

  const addressToString = (schoolObj?: DepartmentDetail['schoolId']) => {
    const addr = schoolObj?.address
    if (!addr) return '—'
    const parts = [addr.street, addr.city, addr.state, addr.zipCode, addr.country].filter(Boolean)
    return parts.length ? parts.join(', ') : '—'
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.push('/admin/departments')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Department Details</h1>
        </div>
      </div>

      {/* Loader */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-red-700">{error}</CardContent>
        </Card>
      ) : !department ? (
        <Card>
          <CardContent className="p-6">No department found.</CardContent>
        </Card>
      ) : (
        <>
          {/* Department Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <School className="h-5 w-5" /> {department.departmentName}
                  {department.code && <Badge variant="secondary">{department.code}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500">Description</div>
                  <div className="text-gray-800">{department.description || '—'}</div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Created</div>
                    <div className="text-gray-800">{department.createdAt ? new Date(department.createdAt).toLocaleString() : '—'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Updated</div>
                    <div className="text-gray-800">{department.updatedAt ? new Date(department.updatedAt).toLocaleString() : '—'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* School and Creator */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">School</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div><span className="text-gray-500">Name:</span> <span className="text-gray-800">{department.schoolId?.name || '—'}</span></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-gray-500">Code:</span> <span className="text-gray-800">{department.schoolId?.code || '—'}</span></div>
                    <div><span className="text-gray-500">Type:</span> <span className="text-gray-800">{department.schoolId?.type || '—'}</span></div>
                  </div>
                  <div><span className="text-gray-500">Address:</span> <span className="text-gray-800">{addressToString(department.schoolId)}</span></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-gray-500">Phone:</span> <span className="text-gray-800">{department.schoolId?.phone || '—'}</span></div>
                    <br></br>
                    <div><span className="text-gray-500">Email:</span> <span className="text-gray-800">{department.schoolId?.email || '—'}</span></div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Created By</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-gray-800"><User2 className="h-4 w-4" /> {department.createdBy ? `${department.createdBy.firstName} ${department.createdBy.lastName}` : '—'}</div>
                  <div className="text-gray-600">{department.createdBy?.email || '—'}</div>
                  <Badge variant="outline" className="w-fit">{department.createdBy?.role || '—'}</Badge>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Courses */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Courses in this Department ({courses.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead className="hidden sm:table-cell">Created</TableHead>
                      <TableHead className="hidden md:table-cell">Departments Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-gray-500">No courses found</TableCell>
                      </TableRow>
                    ) : (
                      courses.map((c) => (
                        <TableRow key={c._id}>
                          <TableCell className="font-medium">{c.courseName}</TableCell>
                          <TableCell>{c.courseCode}</TableCell>
                          <TableCell className="hidden sm:table-cell">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}</TableCell>
                          <TableCell className="hidden md:table-cell">{c.departmentsCount ?? '—'}</TableCell>
                        </TableRow>
                      ))
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


