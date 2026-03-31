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
import { Search, Plus, AlertTriangle, Heart, Edit, Trash2, Eye, Shield } from "lucide-react"
import { toast } from "sonner"

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
    medicalConditions: string[]
    allergies: string[]
    healthAlerts: Array<{
      _id: string
      alertType: string
      severity: string
      description: string
      visibleToStaff: boolean
      isActive: boolean
      createdDate: string
      expiryDate?: string
    }>
  }
}

interface HealthAlert {
  alertType: string
  severity: string
  description: string
  visibleToStaff: boolean
  expiryDate?: string
}

export default function MedicalConditionsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isAddConditionOpen, setIsAddConditionOpen] = useState(false)
  const [isAddAllergyOpen, setIsAddAllergyOpen] = useState(false)
  const [isAddAlertOpen, setIsAddAlertOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Form states
  const [newCondition, setNewCondition] = useState("")
  const [newAllergy, setNewAllergy] = useState("")
  const [newAlert, setNewAlert] = useState<HealthAlert>({
    alertType: "medical_condition",
    severity: "medium",
    description: "",
    visibleToStaff: true,
    expiryDate: ""
  })

  // Stats
  const [stats, setStats] = useState({
    totalStudents: 0,
    studentsWithConditions: 0,
    studentsWithAllergies: 0,
    activeAlerts: 0
  })

  useEffect(() => {
    fetchStudents()
  }, [])

  useEffect(() => {
    const filtered = students.filter(student =>
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.gradeLevel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.healthRecord?.medicalConditions?.some(condition => 
        condition.toLowerCase().includes(searchTerm.toLowerCase())) ||
      student.healthRecord?.allergies?.some(allergy => 
        allergy.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    setFilteredStudents(filtered)
  }, [students, searchTerm])

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
        const studentsWithConditions = studentsWithHealth.filter(s => 
          s.healthRecord?.medicalConditions?.length > 0).length
        const studentsWithAllergies = studentsWithHealth.filter(s => 
          s.healthRecord?.allergies?.length > 0).length
        const activeAlerts = studentsWithHealth.reduce((sum, s) => 
          sum + (s.healthRecord?.healthAlerts?.filter((alert: any) => alert.isActive)?.length || 0), 0)
        
        setStats({
          totalStudents,
          studentsWithConditions,
          studentsWithAllergies,
          activeAlerts
        })
      }
    } catch (error) {
      console.error('Error fetching students:', error)
      toast.error('Failed to load student data')
    } finally {
      setLoading(false)
    }
  }

  const handleAddCondition = async () => {
    if (!selectedStudent || !newCondition.trim()) {
      toast.error('Please enter a medical condition')
      return
    }

    try {
      // First, get or create a health record
      let healthRecord
      try {
        const healthResponse = await fetch(`${API_BASE_URL}/nurse/health-records/student/${selectedStudent._id}`, {
          headers: getAuthHeaders(),
        })
        if (healthResponse.ok) {
          const responseData = await healthResponse.json()
          // Check if it's a "no record found" response
          if (responseData.message && responseData.message.includes('No health record found')) {
            healthRecord = null
          } else {
            healthRecord = responseData
          }
        }
      } catch (error) {
        console.log('No existing health record found')
      }

      // If no health record exists, create one
      if (!healthRecord) {
        const currentYear = new Date().getFullYear()
        const academicYear = `${currentYear}-${currentYear + 1}`
        
        const createResponse = await fetch(`${API_BASE_URL}/nurse/health-records`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            studentId: selectedStudent._id,
            academicYear: academicYear,
            medicalConditions: [newCondition.trim()],
            allergies: [],
            medications: [],
            nurseVisits: [],
            immunizations: [],
            medicationLog: [],
            healthAlerts: [],
            documents: []
          }),
        })

        if (createResponse.ok) {
          toast.success('Medical condition added successfully')
          setNewCondition("")
          setIsAddConditionOpen(false)
          fetchStudents()
          return
        } else {
          throw new Error('Failed to create health record')
        }
      }

      // Update existing health record
      const currentConditions = healthRecord.medicalConditions || []
      const updatedConditions = [...currentConditions, newCondition.trim()]

      const response = await fetch(`${API_BASE_URL}/nurse/health-records/student/${selectedStudent._id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          medicalConditions: updatedConditions
        }),
      })

      if (response.ok) {
        toast.success('Medical condition added successfully')
        setNewCondition("")
        setIsAddConditionOpen(false)
        fetchStudents()
      } else {
        throw new Error('Failed to add medical condition')
      }
    } catch (error) {
      console.error('Error adding medical condition:', error)
      toast.error('Failed to add medical condition')
    }
  }

  const handleAddAllergy = async () => {
    if (!selectedStudent || !newAllergy.trim()) {
      toast.error('Please enter an allergy')
      return
    }

    try {
      const currentAllergies = selectedStudent.healthRecord?.allergies || []
      const updatedAllergies = [...currentAllergies, newAllergy.trim()]

      const response = await fetch(`${API_BASE_URL}/nurse/health-records/student/${selectedStudent._id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          allergies: updatedAllergies
        }),
      })

      if (response.ok) {
        toast.success('Allergy added successfully')
        setNewAllergy("")
        setIsAddAllergyOpen(false)
        fetchStudents()
      } else {
        throw new Error('Failed to add allergy')
      }
    } catch (error) {
      console.error('Error adding allergy:', error)
      toast.error('Failed to add allergy')
    }
  }

  const handleAddHealthAlert = async () => {
    if (!selectedStudent || !newAlert.description.trim()) {
      toast.error('Please enter alert description')
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/nurse/health-records/student/${selectedStudent._id}/health-alert`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...newAlert,
          isActive: true,
          expiryDate: newAlert.expiryDate ? new Date(newAlert.expiryDate) : null
        }),
      })

      if (response.ok) {
        toast.success('Health alert added successfully')
        setNewAlert({
          alertType: "medical_condition",
          severity: "medium",
          description: "",
          visibleToStaff: true,
          expiryDate: ""
        })
        setIsAddAlertOpen(false)
        fetchStudents()
      } else {
        throw new Error('Failed to add health alert')
      }
    } catch (error) {
      console.error('Error adding health alert:', error)
      toast.error('Failed to add health alert')
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white'
      case 'high': return 'bg-red-500 text-white'
      case 'medium': return 'bg-yellow-500 text-white'
      case 'low': return 'bg-blue-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'allergy': return <AlertTriangle className="h-4 w-4" />
      case 'medical_condition': return <Heart className="h-4 w-4" />
      case 'medication': return <Plus className="h-4 w-4" />
      case 'emergency': return <Shield className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Loading medical conditions...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Medical Conditions & Allergies</h1>
          <p className="text-gray-600">Manage student health conditions and alerts</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Eye className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Under health monitoring</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medical Conditions</CardTitle>
            <Heart className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.studentsWithConditions}</div>
            <p className="text-xs text-muted-foreground">Students with conditions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Allergies</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.studentsWithAllergies}</div>
            <p className="text-xs text-muted-foreground">Students with allergies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Shield className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAlerts}</div>
            <p className="text-xs text-muted-foreground">Staff notifications active</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Student Health Management</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search students by name, grade, condition, or allergy..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Medical Conditions</TableHead>
                  <TableHead>Allergies</TableHead>
                  <TableHead>Active Alerts</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
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
                      <div className="flex flex-wrap gap-1">
                        {student.healthRecord?.medicalConditions?.map((condition, index) => (
                          <Badge key={index} className="bg-red-50 text-red-700 border-red-200">
                            {condition}
                          </Badge>
                        )) || <span className="text-gray-400">None</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {student.healthRecord?.allergies?.map((allergy, index) => (
                          <Badge key={index} className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            {allergy}
                          </Badge>
                        )) || <span className="text-gray-400">None</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {student.healthRecord?.healthAlerts?.filter(alert => alert.isActive)?.map((alert, index) => (
                          <Badge key={index} className={getSeverityColor(alert.severity)}>
                            {getAlertTypeIcon(alert.alertType)}
                            <span className="ml-1">{alert.severity}</span>
                          </Badge>
                        )) || <span className="text-gray-400">None</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedStudent(student)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Condition
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Medical Condition</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Medical Condition</label>
                                <Input
                                  placeholder="e.g., Asthma, Diabetes, Heart condition"
                                  value={newCondition}
                                  onChange={(e) => setNewCondition(e.target.value)}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setNewCondition("")}>
                                Cancel
                              </Button>
                              <Button onClick={handleAddCondition}>
                                Add Condition
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedStudent(student)}
                            >
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              Add Allergy
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Allergy</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Allergy</label>
                                <Input
                                  placeholder="e.g., Peanuts, Milk, Dust, Pollen"
                                  value={newAllergy}
                                  onChange={(e) => setNewAllergy(e.target.value)}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setNewAllergy("")}>
                                Cancel
                              </Button>
                              <Button onClick={handleAddAllergy}>
                                Add Allergy
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedStudent(student)}
                            >
                              <Shield className="h-4 w-4 mr-1" />
                              Add Alert
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Add Health Alert</DialogTitle>
                            </DialogHeader>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Alert Type</label>
                                <Select 
                                  value={newAlert.alertType} 
                                  onValueChange={(value) => setNewAlert({...newAlert, alertType: value})}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="allergy">Allergy</SelectItem>
                                    <SelectItem value="medical_condition">Medical Condition</SelectItem>
                                    <SelectItem value="medication">Medication</SelectItem>
                                    <SelectItem value="emergency">Emergency</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <label className="text-sm font-medium">Severity</label>
                                <Select 
                                  value={newAlert.severity} 
                                  onValueChange={(value) => setNewAlert({...newAlert, severity: value})}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="critical">Critical</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="md:col-span-2">
                                <label className="text-sm font-medium">Description</label>
                                <Textarea
                                  placeholder="Detailed description of the health alert..."
                                  value={newAlert.description}
                                  onChange={(e) => setNewAlert({...newAlert, description: e.target.value})}
                                  rows={3}
                                />
                              </div>

                              <div>
                                <label className="text-sm font-medium">Visible to Staff</label>
                                <Select 
                                  value={newAlert.visibleToStaff ? "yes" : "no"} 
                                  onValueChange={(value) => setNewAlert({...newAlert, visibleToStaff: value === "yes"})}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="yes">Yes</SelectItem>
                                    <SelectItem value="no">No</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <label className="text-sm font-medium">Expiry Date (Optional)</label>
                                <Input
                                  type="date"
                                  value={newAlert.expiryDate}
                                  onChange={(e) => setNewAlert({...newAlert, expiryDate: e.target.value})}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setNewAlert({
                                alertType: "medical_condition",
                                severity: "medium",
                                description: "",
                                visibleToStaff: true,
                                expiryDate: ""
                              })}>
                                Cancel
                              </Button>
                              <Button onClick={handleAddHealthAlert}>
                                Add Alert
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredStudents.length === 0 && (
            <div className="text-center py-12">
              <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No students found matching your search.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}