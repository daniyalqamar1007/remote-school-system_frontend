"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  Stethoscope, 
  ShieldCheck, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  ArrowLeft,
  Eye,
  Clock,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { sportsApi, nurseApi } from '@/lib/api'
import { toast } from 'sonner'

export default function EligibilityMedicalPage() {
  const [assignments, setAssignments] = useState<any[]>([])
  const [programs, setPrograms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [programFilter, setProgramFilter] = useState('all')
  const [clearanceFilter, setClearanceFilter] = useState('all')
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalAssignments, setTotalAssignments] = useState(0)
  const [assignmentsLoading, setAssignmentsLoading] = useState(false)
  
  // Modal states
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null)
  const [isEligibilityModalOpen, setIsEligibilityModalOpen] = useState(false)
  const [isMedicalModalOpen, setIsMedicalModalOpen] = useState(false)
  const [eligibilityResult, setEligibilityResult] = useState<any>(null)
  const [checkingEligibility, setCheckingEligibility] = useState(false)
  const [updatingMedical, setUpdatingMedical] = useState(false)

  // Medical form state
  const [medicalForm, setMedicalForm] = useState({
    physicalExamCompleted: false,
    physicalExamDate: '',
    physicalExamExpiryDate: '',
    medicalClearanceObtained: false,
    medicalClearanceDate: '',
    consentFormSigned: false,
    consentFormDate: '',
  })

  useEffect(() => {
    fetchPrograms()
    fetchAssignments(currentPage, pageSize, searchTerm, programFilter, clearanceFilter)
  }, [])

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchAssignments(1, pageSize, searchTerm, programFilter, clearanceFilter)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, programFilter, clearanceFilter, pageSize])

  useEffect(() => {
    fetchAssignments(currentPage, pageSize, searchTerm, programFilter, clearanceFilter)
  }, [currentPage])

  const fetchPrograms = async () => {
    try {
      const programsRes = await sportsApi.programs.getAll({ page: '1', limit: '100' })
      
      let programsList: any[] = []
      if (programsRes?.data) {
        programsList = Array.isArray(programsRes.data.programs) 
          ? programsRes.data.programs 
          : Array.isArray(programsRes.data)
            ? programsRes.data
            : []
      } else if (programsRes?.programs) {
        programsList = Array.isArray(programsRes.programs) ? programsRes.programs : []
      } else if (Array.isArray(programsRes)) {
        programsList = programsRes
      }
      
      setPrograms(programsList)
    } catch (error: any) {
      console.error('Error fetching programs:', error)
      toast.error(error?.message || 'Failed to load programs')
    }
  }

  const fetchAssignments = async (page: number, limit: number, search: string, program: string, clearance: string) => {
    try {
      setAssignmentsLoading(true)
      const filters: any = { page: page.toString(), limit: limit.toString(), status: 'active' }
      
      if (program !== 'all') {
        filters.sportsProgramId = program
      }

      const assignmentsRes = await sportsApi.assignments.getAll(filters)

      let assignmentsList: any[] = []
      let total = 0

      if (assignmentsRes?.data) {
        if (assignmentsRes.data.assignments) {
          assignmentsList = Array.isArray(assignmentsRes.data.assignments) 
            ? assignmentsRes.data.assignments 
            : []
          total = assignmentsRes.data.pagination?.total || assignmentsRes.data.pagination?.totalCount || assignmentsList.length
        } else if (Array.isArray(assignmentsRes.data)) {
          assignmentsList = assignmentsRes.data
          total = assignmentsList.length
        }
      } else if (assignmentsRes?.assignments) {
        assignmentsList = Array.isArray(assignmentsRes.assignments) ? assignmentsRes.assignments : []
        total = assignmentsList.length
      } else if (Array.isArray(assignmentsRes)) {
        assignmentsList = assignmentsRes
        total = assignmentsList.length
      }

      // Apply search filter on frontend
      if (search) {
        assignmentsList = assignmentsList.filter((assignment: any) => {
          const student = assignment.student || assignment.studentId
          const program = assignment.program || assignment.sportsProgramId
          return (
            student?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
            student?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
            program?.name?.toLowerCase().includes(search.toLowerCase())
          )
        })
      }

      // Apply clearance filter on frontend
      if (clearance !== 'all') {
        assignmentsList = assignmentsList.filter((assignment: any) => {
          const status = assignment.medicalClearanceStatus || (assignment.medicalClearance ? 'cleared' : 'no_record')
          if (clearance === 'cleared') return status === 'cleared'
          if (clearance === 'no_record') return status === 'no_record'
          return true
        })
      }

      // Fetch health status and health warnings for each assignment
      const assignmentsWithHealth = await Promise.all(
        assignmentsList.map(async (assignment: any) => {
          const student = assignment.student || assignment.studentId
          const studentId = student?._id || student?.id || assignment.studentId
          
          if (!studentId) {
            return {
              ...assignment,
              healthStatus: 'No Record',
              isEligible: false,
              healthWarnings: ['Student ID not found']
            }
          }

          try {
            // Fetch health record (backend will return the most recent one if academic year not specified)
            const healthRecord = await nurseApi.healthRecords.getByStudentId(studentId)
            
            if (!healthRecord) {
              return {
                ...assignment,
                healthStatus: 'No Record',
                isEligible: false,
                healthWarnings: ['No health record found']
              }
            }

            // Calculate health status (same logic as backend)
            const activeAlerts = healthRecord.healthAlerts?.filter((alert: any) => alert.isActive) || []
            const highPriorityAlerts = activeAlerts.filter((alert: any) =>
              alert.severity === 'high' || alert.severity === 'critical'
            )

            let healthStatus = 'Healthy'
            let isEligible = true

            if (highPriorityAlerts.length > 0) {
              healthStatus = 'High Risk'
              isEligible = false
            } else if (activeAlerts.length > 0) {
              healthStatus = 'Has Alerts'
              isEligible = false
            } else {
              const activeMeds = healthRecord.medicationLog?.filter((med: any) => med.isActive) || []
              if (activeMeds.length > 0) {
                healthStatus = 'On Medication'
                isEligible = true // Still eligible if on medication but no alerts
              } else {
                healthStatus = 'Healthy'
                isEligible = true
              }
            }

            // Get health warnings from active alerts
            const healthWarnings = activeAlerts.map((alert: any) => {
              if (alert.title) return alert.title
              if (alert.description) return alert.description
              return `${alert.type} alert (${alert.severity} severity)`
            })

            return {
              ...assignment,
              healthStatus,
              isEligible,
              healthWarnings: healthWarnings.length > 0 ? healthWarnings : assignment.healthWarnings || []
            }
          } catch (error) {
            console.error(`Error fetching health record for student ${studentId}:`, error)
            return {
              ...assignment,
              healthStatus: 'No Record',
              isEligible: false,
              healthWarnings: ['Unable to fetch health record']
            }
          }
        })
      )

      setAssignments(assignmentsWithHealth)
      setTotalAssignments(total)
    } catch (error: any) {
      console.error('Error fetching assignments:', error)
      toast.error(error?.message || 'Failed to load assignments')
    } finally {
      setAssignmentsLoading(false)
      setLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setCurrentPage(1)
  }

  const handleCheckEligibility = async (assignment: any) => {
    try {
      setCheckingEligibility(true)
      setSelectedAssignment(assignment)
      setIsEligibilityModalOpen(true)
      setEligibilityResult(null)

      const studentId = assignment.student?._id || assignment.studentId?._id || assignment.studentId
      const programId = assignment.program?._id || assignment.sportsProgramId?._id || assignment.sportsProgramId

      if (!studentId || !programId) {
        toast.error('Missing student or program information')
        setIsEligibilityModalOpen(false)
        return
      }

      const result = await sportsApi.eligibility.check(studentId, programId)
      
      // Handle response format: { success, statusCode, message, data }
      if (result?.data) {
        setEligibilityResult(result.data)
      } else if (result?.isEligible !== undefined) {
        setEligibilityResult(result)
      } else {
        setEligibilityResult(result)
      }

      // Refresh data after checking eligibility
      await fetchAssignments(currentPage, pageSize, searchTerm, programFilter, clearanceFilter)
    } catch (error: any) {
      console.error('Error checking eligibility:', error)
      toast.error(error?.message || 'Failed to check eligibility')
      setIsEligibilityModalOpen(false)
    } finally {
      setCheckingEligibility(false)
    }
  }

  const handleOpenMedicalModal = (assignment: any) => {
    setSelectedAssignment(assignment)
    setMedicalForm({
      physicalExamCompleted: assignment.physicalExamCompleted || false,
      physicalExamDate: assignment.physicalExamDate ? new Date(assignment.physicalExamDate).toISOString().split('T')[0] : '',
      physicalExamExpiryDate: assignment.physicalExamExpiryDate ? new Date(assignment.physicalExamExpiryDate).toISOString().split('T')[0] : '',
      medicalClearanceObtained: assignment.medicalClearanceObtained || false,
      medicalClearanceDate: assignment.medicalClearanceDate ? new Date(assignment.medicalClearanceDate).toISOString().split('T')[0] : '',
      consentFormSigned: assignment.consentFormSigned || false,
      consentFormDate: assignment.consentFormDate ? new Date(assignment.consentFormDate).toISOString().split('T')[0] : '',
    })
    setIsMedicalModalOpen(true)
  }

  const handleUpdateMedical = async () => {
    if (!selectedAssignment) return

    try {
      setUpdatingMedical(true)
      const assignmentId = selectedAssignment._id

      const result = await sportsApi.eligibility.updateMedical(assignmentId, medicalForm)
      
      // Handle response format
      if (result?.success || result?.statusCode === 200) {
        toast.success(result?.message || 'Medical information updated successfully')
      } else {
        toast.success('Medical information updated successfully')
      }

      setIsMedicalModalOpen(false)
      await fetchAssignments(currentPage, pageSize, searchTerm, programFilter, clearanceFilter)
    } catch (error: any) {
      console.error('Error updating medical info:', error)
      toast.error(error?.message || 'Failed to update medical information')
    } finally {
      setUpdatingMedical(false)
    }
  }

  const getClearanceBadge = (assignment: any) => {
    const status = assignment.medicalClearanceStatus || (assignment.medicalClearance ? 'cleared' : 'no_record')
    
    switch (status) {
      case 'cleared':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Cleared</Badge>
      case 'no_record':
        return <Badge variant="outline"><AlertTriangle className="w-3 h-3 mr-1" /> No Record</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getEligibilityBadge = (assignment: any) => {
    // Check eligibility based on health status
    // If health status is "Healthy" or "On Medication" (with no alerts), student is eligible
    // Otherwise, not eligible
    const healthStatus = assignment.healthStatus
    
    if (healthStatus === 'Healthy' || healthStatus === 'On Medication') {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Eligible</Badge>
    } else if (healthStatus === 'Has Alerts' || healthStatus === 'High Risk' || healthStatus === 'No Record') {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Not Eligible</Badge>
    } else if (assignment.isEligible === true) {
      // Fallback to assignment.isEligible if healthStatus is not available
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Eligible</Badge>
    } else if (assignment.isEligible === false) {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Not Eligible</Badge>
    }
    return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Not Checked</Badge>
  }

  const totalPages = Math.ceil(totalAssignments / pageSize)

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/secretary/sports">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sports
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Eligibility & Medical</h1>
            <p className="text-gray-600 mt-1">Manage student eligibility and medical clearance</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by student name or program..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={programFilter} onValueChange={setProgramFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by Program" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                {programs.map((program: any) => (
                  <SelectItem key={program._id} value={program._id}>
                    {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={clearanceFilter} onValueChange={setClearanceFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Medical Clearance" />
              </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="cleared">Cleared</SelectItem>
                  <SelectItem value="no_record">No Record</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assignments Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold">
              Student Assignments ({totalAssignments})
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Badge variant="secondary">
                Page {currentPage} of {totalPages || 1}
              </Badge>
              <Badge variant="outline">
                {pageSize} per page
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Medical Clearance</TableHead>
                  <TableHead>Eligibility</TableHead>
                  <TableHead className="hidden lg:table-cell">Health Warnings</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignmentsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12">
                      <div className="flex items-center justify-center">
                        <div className="flex items-center gap-3 text-gray-600">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Loading...</span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : !Array.isArray(assignments) || assignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No assignments found
                    </TableCell>
                  </TableRow>
                ) : (
                  assignments.map((assignment: any) => {
                    const student = assignment.student || assignment.studentId
                    const program = assignment.program || assignment.sportsProgramId
                    
                    return (
                      <TableRow key={assignment._id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {student?.firstName || 'Unknown'} {student?.lastName || 'Student'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student?.studentId || student?.id || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{program?.name || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{program?.season || 'N/A'}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getClearanceBadge(assignment)}
                          {assignment.medicalCheckDate && (
                            <div className="text-xs text-gray-500 mt-1">
                              Checked: {new Date(assignment.medicalCheckDate).toLocaleDateString()}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {getEligibilityBadge(assignment)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {assignment.healthWarnings && assignment.healthWarnings.length > 0 ? (
                            <div className="space-y-1">
                              {assignment.healthWarnings.slice(0, 2).map((warning: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs text-red-600 border-red-200">
                                  <AlertTriangle className="w-2 h-2 mr-1" />
                                  {warning.length > 30 ? warning.substring(0, 30) + '...' : warning}
                                </Badge>
                              ))}
                              {assignment.healthWarnings.length > 2 && (
                                <div className="text-xs text-gray-500">
                                  +{assignment.healthWarnings.length - 2} more
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">None</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {/* <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCheckEligibility(assignment)}
                              disabled={checkingEligibility}
                              title="Check Eligibility"
                            >
                              <ShieldCheck className="h-4 w-4 text-blue-600" />
                            </Button> */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenMedicalModal(assignment)}
                              title="Update Medical Info"
                            >
                              <Stethoscope className="h-4 w-4 text-green-600" />
                            </Button>
                            <Link href={`/admin/sports/assignments/${assignment._id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4 text-gray-600" />
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        
        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Show</span>
            <Select value={pageSize.toString()} onValueChange={(value) => handlePageSizeChange(Number(value))}>
              <SelectTrigger className="w-20">
                <SelectValue placeholder={pageSize.toString()} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-600">per page</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || assignmentsLoading}
            >
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="w-8 h-8 p-0"
                    disabled={assignmentsLoading}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || assignmentsLoading}
            >
              Next
            </Button>
          </div>
          
          <div className="text-sm text-gray-600">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalAssignments)} of {totalAssignments} assignments
          </div>
        </div>
      </Card>

      {/* Eligibility Check Modal */}
      <Dialog open={isEligibilityModalOpen} onOpenChange={setIsEligibilityModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Eligibility Check Results</DialogTitle>
            <DialogDescription>
              {selectedAssignment && (
                <span>
                  {selectedAssignment.student?.firstName || selectedAssignment.studentId?.firstName || 'Unknown'} {selectedAssignment.student?.lastName || selectedAssignment.studentId?.lastName || 'Student'} - {selectedAssignment.program?.name || selectedAssignment.sportsProgramId?.name || 'N/A'}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {checkingEligibility ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : eligibilityResult ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${eligibilityResult.isEligible ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {eligibilityResult.isEligible ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={`font-semibold ${eligibilityResult.isEligible ? 'text-green-800' : 'text-red-800'}`}>
                    {eligibilityResult.isEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
                  </span>
                </div>
                {eligibilityResult.issues && eligibilityResult.issues.length > 0 && (
                  <div className="space-y-1">
                    {eligibilityResult.issues.map((issue: string, index: number) => (
                      <p key={index} className="text-sm text-red-700">• {issue}</p>
                    ))}
                  </div>
                )}
              </div>

              {eligibilityResult.checks && (
                <div className="space-y-2">
                  <h4 className="font-medium">Eligibility Checks:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(eligibilityResult.checks).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        {value ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {eligibilityResult.lastChecked && (
                <div className="text-sm text-gray-500">
                  Last checked: {new Date(eligibilityResult.lastChecked).toLocaleString()}
                </div>
              )}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEligibilityModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Medical Info Modal */}
      <Dialog open={isMedicalModalOpen} onOpenChange={setIsMedicalModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Medical Information</DialogTitle>
            <DialogDescription>
              {selectedAssignment && (
                <span>
                  {selectedAssignment.student?.firstName || selectedAssignment.studentId?.firstName || 'Unknown'} {selectedAssignment.student?.lastName || selectedAssignment.studentId?.lastName || 'Student'} - {selectedAssignment.program?.name || selectedAssignment.sportsProgramId?.name || 'N/A'}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Physical Exam */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Physical Exam</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="physicalExamCompleted"
                    checked={medicalForm.physicalExamCompleted}
                    onChange={(e) => setMedicalForm(prev => ({ ...prev, physicalExamCompleted: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="physicalExamCompleted">Physical Exam Completed</Label>
                </div>
                {medicalForm.physicalExamCompleted && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Exam Date</Label>
                      <Input
                        type="date"
                        value={medicalForm.physicalExamDate}
                        onChange={(e) => setMedicalForm(prev => ({ ...prev, physicalExamDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Expiry Date</Label>
                      <Input
                        type="date"
                        value={medicalForm.physicalExamExpiryDate}
                        onChange={(e) => setMedicalForm(prev => ({ ...prev, physicalExamExpiryDate: e.target.value }))}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Medical Clearance */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Medical Clearance</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="medicalClearanceObtained"
                    checked={medicalForm.medicalClearanceObtained}
                    onChange={(e) => setMedicalForm(prev => ({ ...prev, medicalClearanceObtained: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="medicalClearanceObtained">Medical Clearance Obtained</Label>
                </div>
                {medicalForm.medicalClearanceObtained && (
                  <div>
                    <Label>Clearance Date</Label>
                    <Input
                      type="date"
                      value={medicalForm.medicalClearanceDate}
                      onChange={(e) => setMedicalForm(prev => ({ ...prev, medicalClearanceDate: e.target.value }))}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Consent Form */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Consent Form</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="consentFormSigned"
                    checked={medicalForm.consentFormSigned}
                    onChange={(e) => setMedicalForm(prev => ({ ...prev, consentFormSigned: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="consentFormSigned">Consent Form Signed</Label>
                </div>
                {medicalForm.consentFormSigned && (
                  <div>
                    <Label>Sign Date</Label>
                    <Input
                      type="date"
                      value={medicalForm.consentFormDate}
                      onChange={(e) => setMedicalForm(prev => ({ ...prev, consentFormDate: e.target.value }))}
                    />
                  </div>
                )}
              </div>
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMedicalModalOpen(false)} disabled={updatingMedical}>
              Cancel
            </Button>
            <Button onClick={handleUpdateMedical} disabled={updatingMedical}>
              {updatingMedical ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Medical Info'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
