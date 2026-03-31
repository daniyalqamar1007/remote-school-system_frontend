"use client"

import React, { useEffect, useState, Suspense } from "react"
import axios from "axios"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, ArrowLeft, User } from "lucide-react"
import Image from "next/image"

function TeacherViewContent() {
  const params = useParams()
  const router = useRouter()
  const id = (params?.id as string) || ''

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [teacher, setTeacher] = useState<any>(null)

  const fetchTeacher = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
      const res = await axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/teachers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = res?.data?.data?.teacher
      if (!data) throw new Error(res?.data?.message || 'Failed to load teacher')
      setTeacher(data)
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load teacher')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (id) fetchTeacher() }, [id])

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Teacher Details</h1>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : error ? (
        <Card className="border-red-200 bg-red-50"><CardContent className="p-6 text-red-700">{error}</CardContent></Card>
      ) : !teacher ? (
        <Card><CardContent className="p-6">No teacher found.</CardContent></Card>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 ring-1 ring-gray-200 overflow-hidden flex-shrink-0">
                    {teacher.profilePicture ? (
                      <Image
                        src={teacher.profilePicture}
                        alt={`${teacher.firstName} ${teacher.lastName}`}
                        width={80}
                        height={80}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-10 w-10 text-gray-400" />
                    )}
                  </div>
                  <div>
                <CardTitle>
                  {teacher.firstName} {teacher.lastName}
                  <span className="text-gray-500 font-normal">{teacher.employeeId ? ` • ${teacher.employeeId}` : ''}</span>
                </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><span className="text-gray-500">Email:</span> <span className="text-gray-800">{teacher.email || '—'}</span></div>
                  <div><span className="text-gray-500">Gender:</span> <span className="text-gray-800 capitalize">{String(teacher.gender || '').toLowerCase() || '—'}</span></div>
                  <div><span className="text-gray-500">Phone:</span> <span className="text-gray-800">{teacher.phone || '—'}</span></div>
                  <div><span className="text-gray-500">Designation:</span> <span className="text-gray-800">{teacher.designation || '—'}</span></div>
                  <div><span className="text-gray-500">Date of Joining:</span> <span className="text-gray-800">{teacher.dateOfJoining ? new Date(teacher.dateOfJoining).toLocaleDateString() : '—'}</span></div>
                  <div><span className="text-gray-500">Nationality:</span> <span className="text-gray-800">{teacher.nationality || '—'}</span></div>
                  <div><span className="text-gray-500">Total Experience:</span> <span className="text-gray-800">{typeof teacher.totalExperience === 'number' ? `${teacher.totalExperience} years` : (teacher.totalExperience || '—')}</span></div>
                </div>
                <div><span className="text-gray-500">Address:</span> <span className="text-gray-800">{teacher.address || '—'}</span></div>
                <div><span className="text-gray-500">Qualifications:</span> <span className="text-gray-800">{Array.isArray(teacher.qualifications) ? (teacher.qualifications.join(', ') || '—') : '—'}</span></div>
                <div><span className="text-gray-500">Certifications:</span> <span className="text-gray-800">{Array.isArray(teacher.certifications) ? (teacher.certifications.join(', ') || '—') : '—'}</span></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">School</CardTitle></CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div><span className="text-gray-500">Name:</span> <span className="text-gray-800">{teacher.schoolId?.name || '—'}</span></div>
                <div><span className="text-gray-500">Code:</span> <span className="text-gray-800">{teacher.schoolId?.code || '—'}</span></div>
                <div><span className="text-gray-500">Type:</span> <span className="text-gray-800">{teacher.schoolId?.type || '—'}</span></div>
                <div><span className="text-gray-500">Address:</span> <span className="text-gray-800">{[teacher.schoolId?.address?.street, teacher.schoolId?.address?.city, teacher.schoolId?.address?.state, teacher.schoolId?.address?.zipCode, teacher.schoolId?.address?.country].filter(Boolean).join(', ') || '—'}</span></div>
                <div><span className="text-gray-500">Phone:</span> <span className="text-gray-800">{teacher.schoolId?.phone || '—'}</span></div>
                <div><span className="text-gray-500">Email:</span> <span className="text-gray-800">{teacher.schoolId?.email || '—'}</span></div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-lg">Departments ({Array.isArray(teacher.departmentIds) ? teacher.departmentIds.length : 0})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(teacher.departmentIds) && teacher.departmentIds.length > 0 ? (
                      teacher.departmentIds.map((d: any) => (
                        <TableRow key={d._id || d}>
                          <TableCell className="font-medium">{d?.departmentName || d}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={1} className="text-center py-8 text-gray-500">No departments</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-lg">Course Assignments ({Array.isArray(teacher.courseAssignments) ? teacher.courseAssignments.length : 0})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Grades</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(teacher.courseAssignments) && teacher.courseAssignments.length > 0 ? (
                      teacher.courseAssignments.map((a: any) => (
                        <TableRow key={a._id}>
                          <TableCell className="font-medium">{a.courseName || '—'}</TableCell>
                          <TableCell>{a.courseCode || '—'}</TableCell>
                          <TableCell>
                            {Array.isArray(a.grades) && a.grades.length > 0 ? (
                              <div className="space-y-2">
                                {a.grades.map((g: any, idx: number) => (
                                  <div
                                    key={`${a._id}-${idx}`}
                                    className="rounded-md border border-gray-200 p-2"
                                  >
                                    <div className="font-medium">
                                      Grade/Class: {g.level}
                                      {g.section ? `-${g.section}` : ""}
                                      {g.roomNumber ? ` • Room: ${g.roomNumber}` : ""}
                                    </div>
                                    {Array.isArray(g.timeSlots) && g.timeSlots.length > 0 ? (
                                      <div className="mt-1 space-y-1 text-sm text-gray-600">
                                        {g.timeSlots.map((slot: any, slotIdx: number) => (
                                          <div key={`${slot.day}-${slotIdx}`}>
                                            {slot.day}: {slot.startTime} - {slot.endTime}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-sm text-gray-400">
                                        No time slots configured
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={3} className="text-center py-8 text-gray-500">No course assignments</TableCell></TableRow>
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

export default function TeacherViewPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
      <TeacherViewContent />
    </Suspense>
  )
}


