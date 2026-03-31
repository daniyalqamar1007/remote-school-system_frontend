'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  Users, 
  AlertTriangle, 
  Stethoscope, 
  Pill, 
  Shield,
  Heart,
  FileText,
  Loader2,
  TrendingUp,
  Activity
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

const API_BASE_URL = process.env.NEXT_PUBLIC_SRS_SERVER || 'http://localhost:3014'

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

const AVAILABLE_REPORTS = [
  {
    id: 'health-overview',
    name: 'Health Overview Report',
    description: 'Student names, grades, ages and health statistics',
    category: 'General',
    icon: BarChart3
  },
  {
    id: 'nurse-visit-medication',
    name: 'Nurse Visit & Medication Report',
    description: 'Nurse who did the visit, student name, medication name and visit details',
    category: 'General',
    icon: Stethoscope
  },
  {
    id: 'immunization-status',
    name: 'Immunization Status Report',
    description: 'Student immunization compliance and upcoming due dates',
    category: 'Compliance',
    icon: Shield
  },
  {
    id: 'medication-log',
    name: 'Medication Administration Log',
    description: 'Detailed medication administration records and schedules',
    category: 'Medications',
    icon: Pill
  },
  {
    id: 'health-alerts',
    name: 'Health Alerts Report',
    description: 'Active and resolved health alerts by severity and type',
    category: 'Alerts',
    icon: AlertTriangle
  }
]

export default function StatisticsReportPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalStudents: 0,
    studentsWithHealthRecords: 0,
    activeAlerts: 0,
    todayVisits: 0,
    weekVisits: 0,
    activeMedications: 0,
    immunizationsDue: 0,
    studentsWithAllergies: 0,
    studentsWithMedicalConditions: 0,
    totalNurseVisits: 0,
    emergencyVisits: 0,
    followUpRequired: 0,
    totalDocuments: 0,
    confidentialDocuments: 0
  })

  const [healthOverview, setHealthOverview] = useState<any>(null)
  const [generatingReport, setGeneratingReport] = useState<string | null>(null)

  useEffect(() => {
    fetchStatisticsData()
  }, [])

  const fetchStatisticsData = async () => {
    try {
      setLoading(true)
      
      // Fetch dashboard stats
      const statsResponse = await fetch(`${API_BASE_URL}/nurse/dashboard/stats`, {
        headers: getAuthHeaders(),
      })

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(prev => ({
          ...prev,
          ...statsData
        }))
      }

      // Fetch health overview
      const overviewResponse = await fetch(`${API_BASE_URL}/nurse/dashboard/health-overview`, {
        headers: getAuthHeaders(),
      })

      if (overviewResponse.ok) {
        const overviewData = await overviewResponse.json()
        setHealthOverview(overviewData)
      }

      // Fetch additional stats
      try {
        const visitsResponse = await fetch(`${API_BASE_URL}/nurse/visits?limit=1000`, {
          headers: getAuthHeaders(),
        })
        if (visitsResponse.ok) {
          const visitsData = await visitsResponse.json()
          const visitsList = visitsData?.visits || visitsData?.data || []
          const today = new Date().toISOString().split('T')[0]
          const todayVisits = visitsList.filter((v: any) => 
            v.visitDate && new Date(v.visitDate).toISOString().split('T')[0] === today
          ).length
          const emergencyVisits = visitsList.filter((v: any) => 
            v.priority === 'Emergency' || v.priority === 'High'
          ).length
          const followUpRequired = visitsList.filter((v: any) => 
            v.status === 'Follow-up Required' || v.followUpNeeded
          ).length

          setStats(prev => ({
            ...prev,
            totalNurseVisits: visitsList.length,
            emergencyVisits,
            followUpRequired
          }))
        }
      } catch (error) {
        console.error('Error fetching visits:', error)
      }

      // Fetch documents stats
      try {
        const documentsResponse = await fetch(`${API_BASE_URL}/nurse/documents?limit=1000`, {
          headers: getAuthHeaders(),
        })
        if (documentsResponse.ok) {
          const documentsData = await documentsResponse.json()
          const documentsList = documentsData?.documents || documentsData?.data || []
          const confidentialDocuments = documentsList.filter((d: any) => d.isConfidential).length

          setStats(prev => ({
            ...prev,
            totalDocuments: documentsList.length,
            confidentialDocuments
          }))
        }
      } catch (error) {
        console.error('Error fetching documents:', error)
      }

    } catch (error: any) {
      console.error('Error fetching statistics:', error)
      toast.error('Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateReport = async (reportId: string) => {
    try {
      setGeneratingReport(reportId)
      
      let endpoint = ''
      let fileName = ''
      
      switch (reportId) {
        case 'health-overview':
          endpoint = '/nurse/reports/health-overview'
          fileName = 'health-overview-report'
          break
        case 'nurse-visit-medication':
          endpoint = '/nurse/reports/nurse-visit-medication'
          fileName = 'nurse-visit-medication-report'
          break
        case 'immunization-status':
          endpoint = '/nurse/reports/immunization'
          fileName = 'immunization-status-report'
          break
        case 'medication-log':
          endpoint = '/nurse/reports/medication'
          fileName = 'medication-log-report'
          break
        case 'nurse-visits':
          endpoint = '/nurse/reports/visits'
          fileName = 'nurse-visits-report'
          break
        case 'health-alerts':
          endpoint = '/nurse/reports/health-alerts'
          fileName = 'health-alerts-report'
          break
        default:
          toast.error('Report generation not yet implemented')
          return
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        // Check if response is actually CSV
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          // If it's JSON, it might be an error response
          const errorData = await response.json()
          throw new Error(errorData.message || 'Failed to generate report')
        }

        const blob = await response.blob()
        
        // Check if blob is empty or too small (might be an error)
        if (blob.size < 10) {
          const text = await blob.text()
          try {
            const errorData = JSON.parse(text)
            throw new Error(errorData.message || 'Failed to generate report')
          } catch {
            // If not JSON, continue with download
          }
        }

        const url = window.URL.createObjectURL(blob)
        const a = window.document.createElement('a')
        a.href = url
        a.download = `${fileName}-${new Date().toISOString().split('T')[0]}.csv`
        window.document.body.appendChild(a)
        a.click()
        window.document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        toast.success('Report generated and downloaded successfully')
      } else {
        // Try to get error message from response
        const errorText = await response.text()
        let errorMessage = 'Failed to generate report'
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.message || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }
        throw new Error(errorMessage)
      }
    } catch (error: any) {
      console.error('Error generating report:', error)
      const errorMessage = error.message || 'Failed to generate report'
      toast.error(errorMessage)
    } finally {
      setGeneratingReport(null)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3 text-gray-600">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading statistics...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Statistics Report</h1>
          <p className="text-gray-600 mt-1">Comprehensive health statistics and available reports</p>
        </div>
        <Link href="/nurse/dashboard">
          <Button variant="outline">
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              {stats.studentsWithHealthRecords} with health records
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAlerts}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Visits</CardTitle>
            <Stethoscope className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayVisits}</div>
            <p className="text-xs text-muted-foreground">
              {stats.weekVisits} this week
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Nurse Visits</CardTitle>
            <Stethoscope className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalNurseVisits}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocuments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.confidentialDocuments} confidential
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students with Allergies</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.studentsWithAllergies}</div>
            <p className="text-xs text-muted-foreground">Students with recorded allergies</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medical Conditions</CardTitle>
            <Heart className="h-4 w-4 text-pink-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.studentsWithMedicalConditions}</div>
            <p className="text-xs text-muted-foreground">Students with conditions</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Follow-up Required</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.followUpRequired}</div>
            <p className="text-xs text-muted-foreground">Visits requiring follow-up</p>
          </CardContent>
        </Card>
      </div>

      {/* Health Overview Insights */}
      {healthOverview && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {healthOverview.visitReasons && healthOverview.visitReasons.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Top Visit Reasons
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {healthOverview.visitReasons.slice(0, 5).map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium capitalize text-black">{item.reason}</span>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {healthOverview.allergies && healthOverview.allergies.common && healthOverview.allergies.common.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Common Allergies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 mb-2">
                    {healthOverview.allergies.total} students with allergies
                  </p>
                  {healthOverview.allergies.common.slice(0, 5).map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded">
                      <span className="text-sm font-medium text-black">{item.allergy}</span>
                      <Badge variant="destructive">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {healthOverview.medications && healthOverview.medications.common && healthOverview.medications.common.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Pill className="h-5 w-5 text-purple-600" />
                  Common Medications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 mb-2">
                    {healthOverview.medications.studentsOnMedication} students on medication
                  </p>
                  {healthOverview.medications.common.slice(0, 5).map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-purple-50 rounded">
                      <span className="text-sm font-medium text-black">{item.medication}</span>
                      <Badge className="bg-purple-600">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Available Reports Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Available Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report Name</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead className="hidden lg:table-cell">Category</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {AVAILABLE_REPORTS.map((report) => {
                  const Icon = report.icon
                  return (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5 text-gray-600" />
                          <div>
                            <div className="font-medium text-black">{report.name}</div>
                            <div className="text-sm text-gray-500 md:hidden mt-1">
                              {report.description}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-black">
                        {report.description}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline">{report.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerateReport(report.id)}
                          disabled={generatingReport === report.id}
                          className="bg-black hover:bg-gray-800 text-white border-black"
                        >
                          {generatingReport === report.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <BarChart3 className="w-4 h-4 mr-2" />
                              Generate
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
