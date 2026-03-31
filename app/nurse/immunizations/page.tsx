'use client'

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Shield, Calendar, Upload, Download, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { format, isAfter, isBefore, addDays } from "date-fns"
import { nurseApi } from "@/lib/api"

const API_BASE_URL = process.env.NEXT_PUBLIC_SRS_SERVER || 'http://localhost:3014'

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

interface Student {
  _id: string
  firstName: string
  lastName: string
  gradeLevel: string
  class: string
  healthRecord?: {
    immunizations: Array<{
      _id: string
      vaccineName: string
      dateAdministered: string
      administratorName: string
      batchNumber: string
      nextDueDate?: string
      documentId?: string
    }>
  }
}

interface Immunization {
  vaccineName: string
  dateAdministered: string
  administratorName: string
  batchNumber: string
  nextDueDate: string
}

const COMMON_VACCINES = [
  'DTaP (Diphtheria, Tetanus, Pertussis)',
  'MMR (Measles, Mumps, Rubella)',
  'Polio (IPV)',
  'Hepatitis B',
  'Hepatitis A',
  'Varicella (Chickenpox)',
  'Meningococcal',
  'HPV (Human Papillomavirus)',
  'Tdap (Tetanus, Diphtheria, Pertussis)',
  'Influenza (Flu)',
  'COVID-19'
]

export default function ImmunizationTrackingPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isAddImmunizationOpen, setIsAddImmunizationOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'all' | 'due' | 'overdue' | 'current'>('all')
  
  // Form state
  const [newImmunization, setNewImmunization] = useState<Immunization>({
    vaccineName: "",
    dateAdministered: "",
    administratorName: "",
    batchNumber: "",
    nextDueDate: ""
  })

  // Stats
  const [stats, setStats] = useState({
    totalStudents: 0,
    fullyVaccinated: 0,
    dueForVaccines: 0,
    overdueVaccines: 0
  })

  useEffect(() => {
    fetchStudents()
  }, [])

  useEffect(() => {
    let filtered = students.filter(student =>
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.gradeLevel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.healthRecord?.immunizations?.some(imm => 
        imm.vaccineName.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(student => {
        const immunizations = student.healthRecord?.immunizations || []
        const today = new Date()
        
        switch (filterStatus) {
          case 'due':
            return immunizations.some(imm => 
              imm.nextDueDate && 
              isAfter(new Date(imm.nextDueDate), today) && 
              isBefore(new Date(imm.nextDueDate), addDays(today, 30))
            )
          case 'overdue':
            return immunizations.some(imm => 
              imm.nextDueDate && isBefore(new Date(imm.nextDueDate), today)
            )
          case 'current':
            return immunizations.length > 0 && !immunizations.some(imm => 
              imm.nextDueDate && isBefore(new Date(imm.nextDueDate), today)
            )
          default:
            return true
        }
      })
    }

    setFilteredStudents(filtered)
  }, [students, searchTerm, filterStatus])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(`${API_BASE_URL}/nurse/students`, {
        headers: getAuthHeaders(),
      })
      
      if (response.ok) {
        const studentsData = await response.json()
        
        // Fetch health records for each student
        const studentsWithHealth = await Promise.all(
          studentsData.map(async (student: any) => {
            try {
              const healthResponse = await fetch(`${API_BASE_URL}/nurse/health-records/student/${student._id}`, {
                headers: getAuthHeaders(),
              })
              
              if (healthResponse.ok) {
                const healthRecord = await healthResponse.json()
                // Check if it's a "no record found" response
                if (healthRecord.message && healthRecord.message.includes('No health record found')) {
                  return {
                    ...student,
                    healthRecord: null
                  }
                }
                return {
                  ...student,
                  healthRecord
                }
              }
            } catch (error) {
              console.error(`Error fetching health record for student ${student._id}:`, error)
            }
            return student
          })
        )
        
        setStudents(studentsWithHealth)
        
        // Calculate stats
        const today = new Date()
        const totalStudents = studentsWithHealth.length
        let fullyVaccinated = 0
        let dueForVaccines = 0
        let overdueVaccines = 0
        
        studentsWithHealth.forEach(student => {
          const immunizations = student.healthRecord?.immunizations || []
          if (immunizations.length >= 5) fullyVaccinated++ // Assuming 5+ vaccines means fully vaccinated
          
          const hasDue = immunizations.some((imm: any) =>
            imm.nextDueDate && 
            isAfter(new Date(imm.nextDueDate), today) && 
            isBefore(new Date(imm.nextDueDate), addDays(today, 30))
          )
          if (hasDue) dueForVaccines++
          
          const hasOverdue = immunizations.some((imm: any) =>
            imm.nextDueDate && isBefore(new Date(imm.nextDueDate), today)
          )
          if (hasOverdue) overdueVaccines++
        })
        
        setStats({
          totalStudents,
          fullyVaccinated,
          dueForVaccines,
          overdueVaccines
        })
      }
    } catch (error) {
      console.error('Error fetching students:', error)
      toast.error('Failed to load student data')
    } finally {
      setLoading(false)
    }
  }

  const handleAddImmunization = async () => {
    if (!selectedStudent || !newImmunization.vaccineName || !newImmunization.dateAdministered) {
      toast.error('Please fill in required fields')
      return
    }

    try {
      // First check if student has a health record
      let healthRecordId = (selectedStudent.healthRecord as any)?._id

      if (!healthRecordId) {
        // Create health record first
        const createResponse = await fetch(`${API_BASE_URL}/nurse/health-records/student/${selectedStudent._id}`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            studentId: selectedStudent._id,
            immunizations: []
          }),
        })

        if (createResponse.ok) {
          const newHealthRecord = await createResponse.json()
          healthRecordId = newHealthRecord._id
        } else {
          throw new Error('Failed to create health record')
        }
      }

      // Add immunization using the specific endpoint
      const response = await fetch(`${API_BASE_URL}/nurse/health-records/student/${selectedStudent._id}/immunization`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...newImmunization,
          dateAdministered: newImmunization.dateAdministered,
          nextDueDate: newImmunization.nextDueDate || null
        }),
      })

      if (response.ok) {
        toast.success('Immunization record added successfully')
        setNewImmunization({
          vaccineName: "",
          dateAdministered: "",
          administratorName: "",
          batchNumber: "",
          nextDueDate: ""
        })
        setIsAddImmunizationOpen(false)
        fetchStudents()
      } else {
        throw new Error('Failed to add immunization record')
      }
    } catch (error) {
      console.error('Error adding immunization:', error)
      toast.error('Failed to add immunization record')
    }
  }

  const getVaccinationStatus = (student: Student) => {
    const immunizations = student.healthRecord?.immunizations || []
    const today = new Date()
    
    const hasOverdue = immunizations.some(imm => 
      imm.nextDueDate && isBefore(new Date(imm.nextDueDate), today)
    )
    
    if (hasOverdue) return { status: 'overdue', color: 'bg-red-500 text-white' }
    
    const hasDue = immunizations.some(imm => 
      imm.nextDueDate && 
      isAfter(new Date(imm.nextDueDate), today) && 
      isBefore(new Date(imm.nextDueDate), addDays(today, 30))
    )
    
    if (hasDue) return { status: 'due soon', color: 'bg-yellow-500 text-white' }
    
    if (immunizations.length >= 5) return { status: 'current', color: 'bg-green-500 text-white' }
    
    return { status: 'incomplete', color: 'bg-gray-500 text-white' }
  }

  const handleExportReport = async () => {
    try {
      const response = await nurseApi.reports.getImmunizationReport()
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `immunization-report-${format(new Date(), 'yyyy-MM-dd')}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success('Immunization report exported successfully as CSV')
      } else {
        throw new Error('Failed to export report')
      }
    } catch (error) {
      console.error('Error exporting report:', error)
      toast.error('Failed to export immunization report')
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Loading immunization records...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Immunization Tracking</h1>
          <p className="text-gray-600">Manage and track student vaccination records</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <Button onClick={handleExportReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Under immunization tracking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.fullyVaccinated}</div>
            <p className="text-xs text-muted-foreground">Up to date vaccinations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Soon</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dueForVaccines}</div>
            <p className="text-xs text-muted-foreground">Next 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overdueVaccines}</div>
            <p className="text-xs text-muted-foreground">Require immediate attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Immunization Records</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search students by name, grade, or vaccine..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
                size="sm"
              >
                All
              </Button>
              <Button 
                variant={filterStatus === 'current' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('current')}
                size="sm"
              >
                Current
              </Button>
              <Button 
                variant={filterStatus === 'due' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('due')}
                size="sm"
              >
                Due Soon
              </Button>
              <Button 
                variant={filterStatus === 'overdue' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('overdue')}
                size="sm"
              >
                Overdue
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recent Vaccines</TableHead>
                  <TableHead>Next Due</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => {
                  const vaccinationStatus = getVaccinationStatus(student)
                  const immunizations = student.healthRecord?.immunizations || []
                  const nextDue = immunizations
                    .filter(imm => imm.nextDueDate && isAfter(new Date(imm.nextDueDate), new Date()))
                    .sort((a, b) => new Date(a.nextDueDate!).getTime() - new Date(b.nextDueDate!).getTime())[0]
                  
                  return (
                    <TableRow key={student._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{student.firstName} {student.lastName}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{student.gradeLevel || student.class}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={vaccinationStatus.color}>
                          {vaccinationStatus.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {immunizations.slice(-3).map((imm, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {imm.vaccineName}
                            </Badge>
                          ))}
                          {immunizations.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{immunizations.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {nextDue ? (
                          <div className="text-sm">
                            <div>{nextDue.vaccineName}</div>
                            <div className="text-gray-500">
                              {nextDue.nextDueDate ? format(new Date(nextDue.nextDueDate), 'MMM d, yyyy') : 'No date'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">None scheduled</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedStudent(student)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Vaccine
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Add Immunization Record</DialogTitle>
                            </DialogHeader>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="md:col-span-2">
                                <label className="text-sm font-medium">Vaccine Name *</label>
                                <select
                                  className="w-full p-2 border rounded-md"
                                  value={newImmunization.vaccineName}
                                  onChange={(e) => setNewImmunization({...newImmunization, vaccineName: e.target.value})}
                                >
                                  <option value="">Select vaccine...</option>
                                  {COMMON_VACCINES.map(vaccine => (
                                    <option key={vaccine} value={vaccine}>{vaccine}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="text-sm font-medium">Date Administered *</label>
                                <Input
                                  type="date"
                                  value={newImmunization.dateAdministered}
                                  onChange={(e) => setNewImmunization({...newImmunization, dateAdministered: e.target.value})}
                                />
                              </div>

                              <div>
                                <label className="text-sm font-medium">Administrator Name</label>
                                <Input
                                  placeholder="e.g., Dr. Smith, School Nurse"
                                  value={newImmunization.administratorName}
                                  onChange={(e) => setNewImmunization({...newImmunization, administratorName: e.target.value})}
                                />
                              </div>

                              <div>
                                <label className="text-sm font-medium">Batch Number</label>
                                <Input
                                  placeholder="Vaccine batch number"
                                  value={newImmunization.batchNumber}
                                  onChange={(e) => setNewImmunization({...newImmunization, batchNumber: e.target.value})}
                                />
                              </div>

                              <div>
                                <label className="text-sm font-medium">Next Due Date</label>
                                <Input
                                  type="date"
                                  value={newImmunization.nextDueDate}
                                  onChange={(e) => setNewImmunization({...newImmunization, nextDueDate: e.target.value})}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setNewImmunization({
                                vaccineName: "",
                                dateAdministered: "",
                                administratorName: "",
                                batchNumber: "",
                                nextDueDate: ""
                              })}>
                                Cancel
                              </Button>
                              <Button onClick={handleAddImmunization}>
                                Add Immunization
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {filteredStudents.length === 0 && (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No students found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}