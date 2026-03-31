'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Plus, 
  Trash2, 
  Play, 
  Save, 
  Download, 
  Eye,
  Filter,
  BarChart3,
  FileSpreadsheet,
  Settings,
  Calendar,
  Users,
  GraduationCap,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { customReportsApi } from '@/lib/api'

interface DataSource {
  id: string
  name: string
  table: string
  description: string
  fields: Field[]
}

interface Field {
  id: string
  name: string
  type: 'string' | 'number' | 'date' | 'boolean'
  description: string
}

interface ReportFilter {
  id: string
  field: string
  operator: string
  value: string
}

interface ReportColumn {
  id: string
  field: string
  label: string
  aggregation?: string
  format?: string
}

interface CustomReport {
  id: string
  name: string
  description: string
  dataSource: string
  columns: ReportColumn[]
  filters: ReportFilter[]
  groupBy: string[]
  orderBy: string[]
  status: 'draft' | 'published'
  createdAt: string
  lastRun?: string
}

export default function ReportBuilderPage() {
  const [reports, setReports] = useState<CustomReport[]>([])
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [selectedReport, setSelectedReport] = useState<CustomReport | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('list')

  // Form states
  const [reportName, setReportName] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const [selectedDataSource, setSelectedDataSource] = useState('')
  const [columns, setColumns] = useState<ReportColumn[]>([])
  const [filters, setFilters] = useState<ReportFilter[]>([])
  const [groupBy, setGroupBy] = useState<string[]>([])
  const [orderBy, setOrderBy] = useState<string[]>([])
  const [previewData, setPreviewData] = useState<any[]>([])

  useEffect(() => {
    fetchReports()
    fetchDataSources()
  }, [])

  const fetchReports = async () => {
    try {
      const data = await customReportsApi.getAll(1, 100)
      const reportsList = data?.reports || []
      const transformedReports = reportsList.map((r: any) => ({
        id: r.id || r._id,
        name: r.name,
        description: r.description || '',
        dataSource: r.dataSource,
        columns: r.columns || [],
        filters: r.filters || [],
        groupBy: r.groupBy || [],
        orderBy: Array.isArray(r.orderBy) ? (typeof r.orderBy[0] === 'object' ? r.orderBy.map((o: any) => o.field) : r.orderBy) : [],
        status: r.status || 'draft',
        createdAt: r.createdAt,
        lastRun: r.lastRun
      }))
      setReports(transformedReports)
    } catch (error: any) {
      console.error('Error fetching reports:', error)
      toast.error(error?.message || 'Error fetching reports')
    } finally {
      setLoading(false)
    }
  }

  const fetchDataSources = async () => {
    // Define available data sources based on backend implementation
    const dataSourcesList: DataSource[] = [
      {
        id: 'students',
        name: 'Students',
        table: 'students',
        description: 'Student information and profiles',
        fields: [
          { id: 'studentId', name: 'Student ID', type: 'string', description: 'Unique student identifier' },
          { id: 'firstName', name: 'First Name', type: 'string', description: 'Student first name' },
          { id: 'lastName', name: 'Last Name', type: 'string', description: 'Student last name' },
          { id: 'email', name: 'Email', type: 'string', description: 'Student email address' },
          { id: 'class', name: 'Class', type: 'string', description: 'Student class' },
          { id: 'section', name: 'Section', type: 'string', description: 'Student section' },
          { id: 'enrollDate', name: 'Enrollment Date', type: 'date', description: 'Date of enrollment' }
        ]
      },
      {
        id: 'teachers',
        name: 'Teachers',
        table: 'teachers',
        description: 'Teacher information and profiles',
        fields: [
          { id: 'employeeId', name: 'Employee ID', type: 'string', description: 'Unique employee identifier' },
          { id: 'firstName', name: 'First Name', type: 'string', description: 'Teacher first name' },
          { id: 'lastName', name: 'Last Name', type: 'string', description: 'Teacher last name' },
          { id: 'email', name: 'Email', type: 'string', description: 'Teacher email address' }
        ]
      },
      {
        id: 'grades',
        name: 'Grades',
        table: 'grades',
        description: 'Student grades and academic performance',
        fields: [
          { id: 'studentName', name: 'Student Name', type: 'string', description: 'Student full name' },
          { id: 'courseName', name: 'Course', type: 'string', description: 'Course name' },
          { id: 'marksObtained', name: 'Marks Obtained', type: 'number', description: 'Marks obtained' },
          { id: 'totalMarks', name: 'Total Marks', type: 'number', description: 'Total marks' },
          { id: 'percentage', name: 'Percentage', type: 'number', description: 'Percentage score' }
        ]
      },
      {
        id: 'attendance',
        name: 'Attendance',
        table: 'attendance',
        description: 'Student attendance records',
        fields: [
          { id: 'studentName', name: 'Student Name', type: 'string', description: 'Student full name' },
          { id: 'courseName', name: 'Course', type: 'string', description: 'Course name' },
          { id: 'date', name: 'Date', type: 'date', description: 'Attendance date' },
          { id: 'status', name: 'Status', type: 'string', description: 'Attendance status' }
        ]
      },
      {
        id: 'behavior',
        name: 'Behavior/Discipline',
        table: 'discipline',
        description: 'Student behavior and disciplinary actions',
        fields: [
          { id: 'studentName', name: 'Student Name', type: 'string', description: 'Student full name' },
          { id: 'type', name: 'Type', type: 'string', description: 'Behavior type' },
          { id: 'description', name: 'Description', type: 'string', description: 'Behavior description' },
          { id: 'date', name: 'Date', type: 'date', description: 'Incident date' }
        ]
      },
      {
        id: 'clubs',
        name: 'Clubs',
        table: 'clubs',
        description: 'Club information and membership',
        fields: [
          { id: 'name', name: 'Club Name', type: 'string', description: 'Club name' },
          { id: 'type', name: 'Type', type: 'string', description: 'Club type' },
          { id: 'currentMembers', name: 'Current Members', type: 'number', description: 'Number of members' }
        ]
      }
    ]
    setDataSources(dataSourcesList)
  }

  const handleCreateReport = () => {
    setIsCreating(true)
    setSelectedReport(null)
    setReportName('')
    setReportDescription('')
    setSelectedDataSource('')
    setColumns([])
    setFilters([])
    setGroupBy([])
    setOrderBy([])
    setActiveTab('builder')
  }

  const handleEditReport = (report: CustomReport) => {
    setSelectedReport(report)
    setIsCreating(false)
    setReportName(report.name)
    setReportDescription(report.description)
    setSelectedDataSource(report.dataSource)
    setColumns((report.columns || []).map((col: any, i) => ({
      id: col.id || `col-${i}-${Date.now()}`,
      field: col.field,
      label: col.label ?? col.field,
      aggregation: col.aggregation,
      format: col.format
    })))
    setFilters((report.filters || []).map((f: any, i) => ({
      id: f.id || `filter-${i}-${Date.now()}`,
      field: f.field,
      operator: f.operator || 'equals',
      value: f.value ?? ''
    })))
    setGroupBy(report.groupBy || [])
    setOrderBy(report.orderBy || [])
    setActiveTab('builder')
  }

  const addColumn = () => {
    const newColumn: ReportColumn = {
      id: Date.now().toString(),
      field: '',
      label: '',
    }
    setColumns([...columns, newColumn])
  }

  const updateColumn = (id: string, updates: Partial<ReportColumn>) => {
    setColumns(columns.map(col => col.id === id ? { ...col, ...updates } : col))
  }

  const removeColumn = (id: string) => {
    setColumns(columns.filter(col => col.id !== id))
  }

  const addFilter = () => {
    const newFilter: ReportFilter = {
      id: Date.now().toString(),
      field: '',
      operator: 'equals',
      value: '',
    }
    setFilters([...filters, newFilter])
  }

  const updateFilter = (id: string, updates: Partial<ReportFilter>) => {
    setFilters(filters.map(filter => filter.id === id ? { ...filter, ...updates } : filter))
  }

  const removeFilter = (id: string) => {
    setFilters(filters.filter(filter => filter.id !== id))
  }

  const handlePreviewReport = async () => {
    try {
      if (!selectedDataSource || columns.length === 0) {
        toast.error('Please select a data source and add at least one column')
        return
      }

      const previewConfig = {
        name: 'Preview Report',
        dataSource: selectedDataSource,
        columns: columns.map(col => ({
          field: col.field,
          label: col.label || col.field,
          aggregation: col.aggregation || null,
          format: 'text',
          visible: true,
          order: columns.indexOf(col)
        })),
        filters: filters.map(filter => ({
          field: filter.field,
          operator: filter.operator,
          value: filter.value
        })),
        groupBy: groupBy,
        orderBy: orderBy.map((field) => ({ field, direction: 'asc' })),
        status: 'draft'
      }

      const result = await customReportsApi.preview(previewConfig)
      const rows = Array.isArray(result) ? result : (result?.data ?? result?.rows ?? [])
      setPreviewData(rows)
      setActiveTab('preview')
      toast.success('Preview generated')
    } catch (error: any) {
      console.error('Error previewing report:', error)
      toast.error(error?.message || 'Error previewing report')
    }
  }

  const handleSaveReport = async () => {
    try {
      if (!reportName || !selectedDataSource || columns.length === 0) {
        toast.error('Please fill in report name, select data source, and add at least one column')
        return
      }

      const reportData = {
        name: reportName,
        description: reportDescription,
        dataSource: selectedDataSource,
        columns: columns.map(col => ({
          field: col.field,
          label: col.label || col.field,
          aggregation: col.aggregation || null,
          format: 'text',
          visible: true,
          order: columns.indexOf(col)
        })),
        filters: filters.map(filter => ({
          field: filter.field,
          operator: filter.operator,
          value: filter.value
        })),
        groupBy: groupBy,
        orderBy: orderBy.map((field) => ({ field, direction: 'asc' })),
        status: 'draft'
      }

      if (selectedReport) {
        await customReportsApi.update(selectedReport.id, reportData)
      } else {
        await customReportsApi.create(reportData)
      }
      toast.success('Report saved successfully')
      fetchReports()
      setActiveTab('list')
    } catch (error: any) {
      console.error('Error saving report:', error)
      toast.error(error?.message || 'Error saving report')
    }
  }

  const handleRunReport = async (reportId: string) => {
    try {
      toast.info('Generating report...')
      const blob = await customReportsApi.run(reportId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `custom-report-${reportId}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Report downloaded successfully')
    } catch (error: any) {
      console.error('Error running report:', error)
      toast.error(error?.message || 'Error downloading report')
    }
  }

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return

    try {
      await customReportsApi.delete(reportId)
      toast.success('Report deleted successfully')
      fetchReports()
    } catch (error: any) {
      console.error('Error deleting report:', error)
      toast.error(error?.message || 'Error deleting report')
    }
  }

  const getDataSourceFields = () => {
    const source = dataSources.find(ds => ds.id === selectedDataSource)
    return source?.fields || []
  }

  const operators = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'starts_with', label: 'Starts With' },
    { value: 'ends_with', label: 'Ends With' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'between', label: 'Between' },
    { value: 'in', label: 'In' },
    { value: 'is_null', label: 'Is Null' },
    { value: 'is_not_null', label: 'Is Not Null' }
  ]

  const aggregations = [
    { value: 'count', label: 'Count' },
    { value: 'sum', label: 'Sum' },
    { value: 'avg', label: 'Average' },
    { value: 'min', label: 'Minimum' },
    { value: 'max', label: 'Maximum' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Custom Report Builder</h1>
          <p className="text-muted-foreground">
            Create and manage custom reports with advanced filtering and aggregation
          </p>
        </div>
        <Button onClick={handleCreateReport} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Report
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="list">Reports List</TabsTrigger>
          <TabsTrigger value="builder">Report Builder</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          <div className="grid gap-4">
            {!Array.isArray(reports) || reports.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Custom Reports</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Get started by creating your first custom report
                  </p>
                  <Button onClick={handleCreateReport} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Report
                  </Button>
                </CardContent>
              </Card>
            ) : (
              (Array.isArray(reports) ? reports : []).map((report) => (
                <Card key={report.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {report.name}
                        <Badge variant={report.status === 'published' ? 'default' : 'secondary'}>
                          {report.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{report.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditReport(report)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRunReport(report.id)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteReport(report.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Created: {new Date(report.createdAt).toLocaleDateString()}</span>
                      {report.lastRun && (
                        <span>Last Run: {new Date(report.lastRun).toLocaleDateString()}</span>
                      )}
                      <span>Columns: {report.columns.length}</span>
                      <span>Filters: {report.filters.length}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="builder" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Configuration</CardTitle>
              <CardDescription>
                Configure your custom report settings and data selection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reportName">Report Name</Label>
                  <Input
                    id="reportName"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    placeholder="Enter report name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataSource">Data Source</Label>
                  <Select value={selectedDataSource} onValueChange={setSelectedDataSource}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select data source" />
                    </SelectTrigger>
                    <SelectContent>
                      {dataSources.map((source) => (
                        <SelectItem key={source.id} value={source.id}>
                          {source.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reportDescription">Description</Label>
                <Textarea
                  id="reportDescription"
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Enter report description"
                  rows={3}
                />
              </div>

              <Separator />

              {/* Columns Configuration */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Columns</h3>
                  <Button onClick={addColumn} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Column
                  </Button>
                </div>

                <div className="space-y-3">
                  {columns.map((column) => (
                    <div key={column.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Select 
                        value={column.field} 
                        onValueChange={(value) => updateColumn(column.id, { field: value })}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          {getDataSourceFields().map((field) => (
                            <SelectItem key={field.id} value={field.id}>
                              {field.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Input
                        placeholder="Column label"
                        value={column.label}
                        onChange={(e) => updateColumn(column.id, { label: e.target.value })}
                        className="flex-1"
                      />

                      <Select 
                        value={column.aggregation || 'none'} 
                        onValueChange={(value) => updateColumn(column.id, { aggregation: value === 'none' ? undefined : value })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Aggregation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {aggregations.map((agg) => (
                            <SelectItem key={agg.value} value={agg.value}>
                              {agg.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeColumn(column.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Filters Configuration */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Filters</h3>
                  <Button onClick={addFilter} size="sm" variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Add Filter
                  </Button>
                </div>

                <div className="space-y-3">
                  {filters.map((filter) => (
                    <div key={filter.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Select 
                        value={filter.field} 
                        onValueChange={(value) => updateFilter(filter.id, { field: value })}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          {getDataSourceFields().map((field) => (
                            <SelectItem key={field.id} value={field.id}>
                              {field.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select 
                        value={filter.operator} 
                        onValueChange={(value) => updateFilter(filter.id, { operator: value })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {operators.map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Input
                        placeholder="Filter value"
                        value={filter.value}
                        onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                        className="flex-1"
                      />

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFilter(filter.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <Button onClick={handleSaveReport} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Report
                </Button>
                <Button onClick={handlePreviewReport} variant="outline" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Preview Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Preview</CardTitle>
              <CardDescription>
                Preview of your custom report with sample data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {previewData.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing {previewData.length} rows (limited to 100 for preview)
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => selectedReport && handleRunReport(selectedReport.id)}
                      disabled={!selectedReport}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Full Report
                    </Button>
                  </div>
                  
                  <ScrollArea className="h-96 w-full border rounded-md">
                    <table className="w-full">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          {columns.map((column) => (
                            <th key={column.id} className="text-left p-3 font-medium">
                              {column.label || column.field}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((row, index) => (
                          <tr key={index} className="border-t">
                            {columns.map((column) => (
                              <td key={column.id} className="p-3">
                                {row[column.field]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollArea>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Preview Data</h3>
                  <p className="text-muted-foreground text-center">
                    Configure your report in the builder tab and click "Preview Report" to see the results
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
