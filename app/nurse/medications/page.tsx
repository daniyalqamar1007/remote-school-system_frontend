'use client'

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Pill, Clock, AlertTriangle, FileText, Download } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
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
    medicationLog: Array<{
      _id: string
      medicationName: string
      dosage: string
      frequency: string
      startDate: string
      endDate?: string
      prescribedBy: string
      administeredBy: string
      instructions: string
      sideEffects: string[]
      storageMethod: string
      isActive: boolean
    }>
  }
}

interface Medication {
  medicationName: string
  dosage: string
  frequency: string
  startDate: string
  endDate: string
  prescribedBy: string
  administeredBy: string
  instructions: string
  sideEffects: string
  storageMethod: string
}

const COMMON_MEDICATIONS = [
  'Acetaminophen (Tylenol)',
  'Ibuprofen (Advil, Motrin)',
  'Albuterol Inhaler',
  'EpiPen (Epinephrine)',
  'Insulin',
  'Methylphenidate (Ritalin)',
  'Amphetamine (Adderall)',
  'Clonidine',
  'Guanfacine (Tenex)',
  'Diphenhydramine (Benadryl)',
  'Loratadine (Claritin)',
  'Fluticasone (Flonase)'
]

const STORAGE_METHODS = [
  'Room Temperature',
  'Refrigerated',
  'Controlled Room Temperature',
  'Cool, Dry Place',
  'Protect from Light',
  'Freezer',
  'With Student',
  'Nurse Office - Locked Cabinet'
]

const FREQUENCY_OPTIONS = [
  'Once Daily',
  'Twice Daily',
  'Three Times Daily',
  'Four Times Daily',
  'Every 4 Hours',
  'Every 6 Hours',
  'Every 8 Hours',
  'Every 12 Hours',
  'As Needed (PRN)',
  'Before Meals',
  'After Meals',
  'At Bedtime',
  'Weekly',
  'Monthly'
]

export default function MedicationManagementPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isAddMedicationOpen, setIsAddMedicationOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('active')
  
  // Form state
  const [newMedication, setNewMedication] = useState<Medication>({
    medicationName: "",
    dosage: "",
    frequency: "",
    startDate: "",
    endDate: "",
    prescribedBy: "",
    administeredBy: "",
    instructions: "",
    sideEffects: "",
    storageMethod: ""
  })

  // Stats
  const [stats, setStats] = useState({
    totalStudents: 0,
    studentsOnMedication: 0,
    activeMedications: 0,
    scheduledToday: 0
  })

  useEffect(() => {
    fetchStudents()
  }, [])

  useEffect(() => {
    let filtered = students.filter(student =>
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.gradeLevel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.healthRecord?.medicationLog?.some((med: any) => 
        med.medicationName.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    // Apply status filter
    if (filterStatus === 'active') {
      filtered = filtered.filter(student => 
        student.healthRecord?.medicationLog?.some((med: any) => med.isActive)
      )
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter(student => 
        student.healthRecord?.medicationLog?.some((med: any) => !med.isActive)
      )
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
        const totalStudents = studentsWithHealth.length
        const studentsOnMedication = studentsWithHealth.filter(s => 
          s.healthRecord?.medicationLog?.some((med: any) => med.isActive)).length
        const activeMedications = studentsWithHealth.reduce((sum, s) => 
          sum + (s.healthRecord?.medicationLog?.filter((med: any) => med.isActive)?.length || 0), 0)
        const scheduledToday = studentsWithHealth.reduce((sum, s) => {
          const todayMeds = s.healthRecord?.medicationLog?.filter((med: any) => 
            med.isActive && (
              med.frequency.includes('Daily') || 
              med.frequency.includes('As Needed') ||
              med.frequency.includes('Hours')
            )
          ) || []
          return sum + todayMeds.length
        }, 0)
        
        setStats({
          totalStudents,
          studentsOnMedication,
          activeMedications,
          scheduledToday
        })
      }
    } catch (error) {
      console.error('Error fetching students:', error)
      toast.error('Failed to load student data')
    } finally {
      setLoading(false)
    }
  }

  const handleAddMedication = async () => {
    if (!selectedStudent || !newMedication.medicationName || !newMedication.dosage || !newMedication.frequency) {
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
            medications: []
          }),
        })

        if (createResponse.ok) {
          const newHealthRecord = await createResponse.json()
          healthRecordId = newHealthRecord._id
        } else {
          throw new Error('Failed to create health record')
        }
      }

      // Add medication using the specific endpoint
      const response = await fetch(`${API_BASE_URL}/nurse/health-records/student/${selectedStudent._id}/medication`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...newMedication,
          startDate: newMedication.startDate,
          endDate: newMedication.endDate || null,
          sideEffects: newMedication.sideEffects.split(',').map(s => s.trim()).filter(s => s),
          isActive: true
        }),
      })

      if (response.ok) {
        toast.success('Medication added successfully')
        setNewMedication({
          medicationName: "",
          dosage: "",
          frequency: "",
          startDate: "",
          endDate: "",
          prescribedBy: "",
          administeredBy: "",
          instructions: "",
          sideEffects: "",
          storageMethod: ""
        })
        setIsAddMedicationOpen(false)
        fetchStudents()
      } else {
        throw new Error('Failed to add medication')
      }
    } catch (error) {
      console.error('Error adding medication:', error)
      toast.error('Failed to add medication')
    }
  }

  const getMedicationStatusColor = (medication: any) => {
    if (!medication.isActive) return 'bg-gray-500 text-white'
    
    const today = new Date()
    const endDate = medication.endDate ? new Date(medication.endDate) : null
    
    if (endDate && endDate < today) return 'bg-red-500 text-white'
    if (endDate && endDate < new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)) return 'bg-yellow-500 text-white'
    
    return 'bg-green-500 text-white'
  }

  const getMedicationStatusText = (medication: any) => {
    if (!medication.isActive) return 'Inactive'
    
    const today = new Date()
    const endDate = medication.endDate ? new Date(medication.endDate) : null
    
    if (endDate && endDate < today) return 'Expired'
    if (endDate && endDate < new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)) return 'Ending Soon'
    
    return 'Active'
  }

  const handleExportReport = async () => {
    try {
      const response = await nurseApi.reports.getMedicationReport()
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `medication-report-${format(new Date(), 'yyyy-MM-dd')}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success('Medication report exported successfully as CSV')
      } else {
        throw new Error('Failed to export report')
      }
    } catch (error) {
      console.error('Error exporting report:', error)
      toast.error('Failed to export medication report')
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Loading medication records...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Medication Management</h1>
          <p className="text-gray-600">Track and manage student medication administration</p>
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
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Under medication monitoring</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Medication</CardTitle>
            <Pill className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.studentsOnMedication}</div>
            <p className="text-xs text-muted-foreground">Students with active medications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Medications</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeMedications}</div>
            <p className="text-xs text-muted-foreground">Currently prescribed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Today</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.scheduledToday}</div>
            <p className="text-xs text-muted-foreground">Doses due today</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Medication Records</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search students by name, grade, or medication..."
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
                variant={filterStatus === 'active' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('active')}
                size="sm"
              >
                Active
              </Button>
              <Button 
                variant={filterStatus === 'inactive' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('inactive')}
                size="sm"
              >
                Inactive
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
                  <TableHead>Active Medications</TableHead>
                  <TableHead>Recent Activity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => {
                  const medications = student.healthRecord?.medicationLog || []
                  const activeMeds = medications.filter(med => med.isActive)
                  const recentMed = medications[medications.length - 1]
                  
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
                        <div className="space-y-1">
                          {activeMeds.length > 0 ? (
                            activeMeds.slice(0, 2).map((med, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <Badge className={getMedicationStatusColor(med)}>
                                  {getMedicationStatusText(med)}
                                </Badge>
                                <span className="text-sm">
                                  {med.medicationName} - {med.dosage}
                                </span>
                              </div>
                            ))
                          ) : (
                            <span className="text-gray-400">No active medications</span>
                          )}
                          {activeMeds.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{activeMeds.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {recentMed ? (
                          <div className="text-sm">
                            <div>{recentMed.medicationName}</div>
                            <div className="text-gray-500">
                              Started {format(new Date(recentMed.startDate), 'MMM d, yyyy')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">No medications</span>
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
                              Add Medication
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Add Medication Record</DialogTitle>
                            </DialogHeader>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="md:col-span-2">
                                <label className="text-sm font-medium">Medication Name *</label>
                                <select
                                  className="w-full p-2 border rounded-md"
                                  value={newMedication.medicationName}
                                  onChange={(e) => setNewMedication({...newMedication, medicationName: e.target.value})}
                                >
                                  <option value="">Select medication...</option>
                                  {COMMON_MEDICATIONS.map(med => (
                                    <option key={med} value={med}>{med}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="text-sm font-medium">Dosage *</label>
                                <Input
                                  placeholder="e.g., 500mg, 1 tablet, 2 puffs"
                                  value={newMedication.dosage}
                                  onChange={(e) => setNewMedication({...newMedication, dosage: e.target.value})}
                                />
                              </div>

                              <div>
                                <label className="text-sm font-medium">Frequency *</label>
                                <select
                                  className="w-full p-2 border rounded-md"
                                  value={newMedication.frequency}
                                  onChange={(e) => setNewMedication({...newMedication, frequency: e.target.value})}
                                >
                                  <option value="">Select frequency...</option>
                                  {FREQUENCY_OPTIONS.map(freq => (
                                    <option key={freq} value={freq}>{freq}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="text-sm font-medium">Start Date *</label>
                                <Input
                                  type="date"
                                  value={newMedication.startDate}
                                  onChange={(e) => setNewMedication({...newMedication, startDate: e.target.value})}
                                />
                              </div>

                              <div>
                                <label className="text-sm font-medium">End Date (Optional)</label>
                                <Input
                                  type="date"
                                  value={newMedication.endDate}
                                  onChange={(e) => setNewMedication({...newMedication, endDate: e.target.value})}
                                />
                              </div>

                              <div>
                                <label className="text-sm font-medium">Prescribed By</label>
                                <Input
                                  placeholder="e.g., Dr. Smith, MD"
                                  value={newMedication.prescribedBy}
                                  onChange={(e) => setNewMedication({...newMedication, prescribedBy: e.target.value})}
                                />
                              </div>

                              <div>
                                <label className="text-sm font-medium">Administered By</label>
                                <Input
                                  placeholder="e.g., School Nurse, Self-administered"
                                  value={newMedication.administeredBy}
                                  onChange={(e) => setNewMedication({...newMedication, administeredBy: e.target.value})}
                                />
                              </div>

                              <div>
                                <label className="text-sm font-medium">Storage Method</label>
                                <select
                                  className="w-full p-2 border rounded-md"
                                  value={newMedication.storageMethod}
                                  onChange={(e) => setNewMedication({...newMedication, storageMethod: e.target.value})}
                                >
                                  <option value="">Select storage method...</option>
                                  {STORAGE_METHODS.map(method => (
                                    <option key={method} value={method}>{method}</option>
                                  ))}
                                </select>
                              </div>

                              <div className="md:col-span-2">
                                <label className="text-sm font-medium">Instructions</label>
                                <Textarea
                                  placeholder="Special administration instructions..."
                                  value={newMedication.instructions}
                                  onChange={(e) => setNewMedication({...newMedication, instructions: e.target.value})}
                                  rows={2}
                                />
                              </div>

                              <div className="md:col-span-2">
                                <label className="text-sm font-medium">Side Effects (comma-separated)</label>
                                <Input
                                  placeholder="e.g., drowsiness, nausea, headache"
                                  value={newMedication.sideEffects}
                                  onChange={(e) => setNewMedication({...newMedication, sideEffects: e.target.value})}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setNewMedication({
                                medicationName: "",
                                dosage: "",
                                frequency: "",
                                startDate: "",
                                endDate: "",
                                prescribedBy: "",
                                administeredBy: "",
                                instructions: "",
                                sideEffects: "",
                                storageMethod: ""
                              })}>
                                Cancel
                              </Button>
                              <Button onClick={handleAddMedication}>
                                Add Medication
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
              <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No students found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}