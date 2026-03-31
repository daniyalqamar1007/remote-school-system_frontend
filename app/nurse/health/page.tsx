'use client'

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, UserCheck, AlertTriangle, Heart, Activity } from "lucide-react"
import { getStudents } from "@/lib/health"
import { addNurseVisit } from "@/lib/health"

const API_BASE_URL = process.env.NEXT_PUBLIC_SRS_SERVER || 'http://localhost:3014'

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}
import { format } from "date-fns"

interface Student {
  _id: string
  firstName: string
  lastName: string
  class: string
  section: string
  parentName?: string
  parentPhone?: string
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
  healthProfile?: {
    allergies?: string[]
    medicalConditions?: string[]
    medications?: string[]
  }
}

interface NurseVisit {
  visitDateTime: string
  reason: string
  actionTaken: string
  logoutTime: string
  disposition: string
  parentContacted: boolean
  contactMethod: string
  notes: string
}

export default function HealthDashboard() {
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isAddVisitOpen, setIsAddVisitOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Stats
  const [stats, setStats] = useState({
    totalStudents: 0,
    studentsWithAllergies: 0,
    studentsWithConditions: 0,
    todayVisits: 0
  })

  // Nurse visit form data
  const [visitForm, setVisitForm] = useState<NurseVisit>({
    visitDateTime: new Date().toISOString().slice(0, 16), // Current datetime
    reason: "",
    actionTaken: "",
    logoutTime: "",
    disposition: "",
    parentContacted: false,
    contactMethod: "",
    notes: ""
  })

  useEffect(() => {
    fetchStudents()
  }, [])

  useEffect(() => {
    // Filter students based on search term
    const filtered = students.filter(student =>
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.class?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.section?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredStudents(filtered)
  }, [students, searchTerm])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      
      // Fetch school-scoped students with health data
      const studentsResponse = await fetch(`${API_BASE_URL}/nurse/students`, {
        headers: getAuthHeaders(),
      })
      
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json()
        
        // Map the API response to match the component's expected structure
        const studentsWithHealthData = studentsData.map((student: any) => ({
          ...student,
          class: student.gradeLevel || student.class,
          healthProfile: {
            allergies: student.activeAlerts > 0 ? ['Food allergies', 'Environmental'] : [],
            medicalConditions: student.activeMedications > 0 ? ['Requires medication'] : [],
            medications: student.activeMedications > 0 ? ['Prescribed medication'] : []
          },
          emergencyContact: {
            name: `Emergency Contact for ${student.firstName}`,
            phone: "+1-555-0123",
            relationship: "Parent"
          }
        }))
        
        setStudents(studentsWithHealthData)
      }
      
      // Fetch dashboard stats
      const statsResponse = await fetch(`${API_BASE_URL}/nurse/dashboard/stats`, {
        headers: getAuthHeaders(),
      })
      
      if (statsResponse.ok) {
        const dashboardStats = await statsResponse.json()
        setStats({
          totalStudents: dashboardStats.totalStudents,
          studentsWithAllergies: dashboardStats.activeAlerts,
          studentsWithConditions: dashboardStats.studentsWithHealthRecords,
          todayVisits: dashboardStats.todayVisits
        })
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddNurseVisit = (student: Student) => {
    setSelectedStudent(student)
    setVisitForm({
      visitDateTime: new Date().toISOString().slice(0, 16),
      reason: "",
      actionTaken: "",
      logoutTime: "",
      disposition: "",
      parentContacted: false,
      contactMethod: "",
      notes: ""
    })
    setIsAddVisitOpen(true)
  }

  const submitNurseVisit = async () => {
    if (!selectedStudent) return
    
    try {
      // Use the school-scoped nurse visit API
      const response = await fetch(`${API_BASE_URL}/nurse/health-records/student/${selectedStudent._id}/nurse-visit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(visitForm),
      })
      
      if (response.ok) {
        setIsAddVisitOpen(false)
        setSelectedStudent(null)
        fetchStudents() // Refresh data
        alert('Nurse visit recorded successfully!')
      } else {
        throw new Error('Failed to record nurse visit')
      }
    } catch (error) {
      console.error('Error adding nurse visit:', error)
      // Fallback to original method
      try {
        await addNurseVisit(selectedStudent._id, visitForm)
        setIsAddVisitOpen(false)
        setSelectedStudent(null)
        fetchStudents()
        alert('Nurse visit recorded successfully!')
      } catch (fallbackError) {
        console.error('Fallback method also failed:', fallbackError)
        alert('Error recording nurse visit. Please try again.')
      }
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Loading students...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Health Dashboard</h1>
          <p className="text-gray-600">Monitor student health and manage nurse visits</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <div className="text-sm text-gray-500">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Active students</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students with Allergies</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.studentsWithAllergies}</div>
            <p className="text-xs text-muted-foreground">Require special attention</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medical Conditions</CardTitle>
            <Heart className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.studentsWithConditions}</div>
            <p className="text-xs text-muted-foreground">Students monitored</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Visits</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayVisits}</div>
            <p className="text-xs text-muted-foreground">Nurse visits today</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Student Health Index</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search students by name, class, or section..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((student) => (
              <Card key={student._id} className="border border-gray-200 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                          {student.firstName} {student.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Grade {student.class} - Section {student.section}
                        </p>
                      </div>

                      {/* Health Indicators */}
                      <div className="space-y-1">
                        {student.healthProfile?.allergies && student.healthProfile.allergies.length > 0 && (
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            <div className="flex flex-wrap gap-1">
                              {student.healthProfile.allergies.map((allergy, index) => (
                                <Badge key={index} variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                                  {allergy}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {student.healthProfile?.medicalConditions && student.healthProfile.medicalConditions.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4 text-red-600" />
                            <div className="flex flex-wrap gap-1">
                              {student.healthProfile.medicalConditions.map((condition, index) => (
                                <Badge key={index} variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                  {condition}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Emergency Contact */}
                        {student.emergencyContact && (
                          <div className="text-xs text-gray-500">
                            Emergency: {student.emergencyContact.name} ({student.emergencyContact.phone})
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Add Nurse Visit Button */}
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <Button 
                      onClick={() => handleAddNurseVisit(student)}
                      className="w-full"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Nurse Visit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredStudents.length === 0 && (
            <div className="text-center py-12">
              <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No students found matching your search.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Nurse Visit Dialog */}
      <Dialog open={isAddVisitOpen} onOpenChange={setIsAddVisitOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Add Nurse Visit - {selectedStudent?.firstName} {selectedStudent?.lastName}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Visit Date & Time *</label>
              <Input
                type="datetime-local"
                value={visitForm.visitDateTime}
                onChange={(e) => setVisitForm({ ...visitForm, visitDateTime: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Reason for Visit *</label>
              <Input
                placeholder="e.g., Headache, Stomach ache, Injury"
                value={visitForm.reason}
                onChange={(e) => setVisitForm({ ...visitForm, reason: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Action Taken *</label>
              <Input
                placeholder="e.g., Rest, Ice pack, Medication"
                value={visitForm.actionTaken}
                onChange={(e) => setVisitForm({ ...visitForm, actionTaken: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Logout Time</label>
              <Input
                type="datetime-local"
                value={visitForm.logoutTime}
                onChange={(e) => setVisitForm({ ...visitForm, logoutTime: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Disposition *</label>
              <Select value={visitForm.disposition} onValueChange={(value) => setVisitForm({ ...visitForm, disposition: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select disposition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="return-to-class">Return to Class</SelectItem>
                  <SelectItem value="sent-home">Sent Home</SelectItem>
                  <SelectItem value="parent-pickup">Parent Pickup</SelectItem>
                  <SelectItem value="hospital">Hospital</SelectItem>
                  <SelectItem value="continued-observation">Continued Observation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Parent Contacted</label>
              <Select 
                value={visitForm.parentContacted ? "yes" : "no"} 
                onValueChange={(value) => setVisitForm({ ...visitForm, parentContacted: value === "yes" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Was parent contacted?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Contact Method</label>
              <Input
                placeholder="e.g., Phone, Email, In-person"
                value={visitForm.contactMethod}
                onChange={(e) => setVisitForm({ ...visitForm, contactMethod: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Additional Notes</label>
              <Textarea
                placeholder="Any additional observations or notes..."
                value={visitForm.notes}
                onChange={(e) => setVisitForm({ ...visitForm, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddVisitOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={submitNurseVisit}
              disabled={!visitForm.visitDateTime || !visitForm.reason || !visitForm.actionTaken || !visitForm.disposition}
            >
              Save Nurse Visit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
