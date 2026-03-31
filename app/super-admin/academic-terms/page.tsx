"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Calendar,
  Plus,
  Edit,
  Trash2,
  Star,
  Clock,
  School,
  Download,
  RefreshCw
} from "lucide-react"
import { toast } from 'sonner'

interface AcademicTerm {
  _id: string
  name: string
  type: string
  academicYear: string
  startDate: string
  endDate: string
  isActive: boolean
  isCurrent: boolean
  schoolId?: {
    _id: string
    name: string
    code: string
  }
  description?: string
  sortOrder: number
}

export default function AcademicTermsPage() {
  const [terms, setTerms] = useState<AcademicTerm[]>([])
  const [schools, setSchools] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedTerm, setSelectedTerm] = useState<AcademicTerm | null>(null)
  const [filters, setFilters] = useState({
    schoolId: 'all',
    academicYear: 'all',
    isActive: 'all'
  })

  const [formData, setFormData] = useState({
    name: '',
    type: 'semester',
    academicYear: new Date().getFullYear().toString(),
    startDate: '',
    endDate: '',
    schoolId: '',
    description: '',
    sortOrder: 1
  })

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
  }

  useEffect(() => {
    fetchTerms()
    fetchSchools()
  }, [filters])

  const fetchTerms = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.schoolId !== 'all') params.append('schoolId', filters.schoolId)
      if (filters.academicYear !== 'all') params.append('academicYear', filters.academicYear)
      if (filters.isActive !== 'all') params.append('isActive', filters.isActive)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/academic-terms?${params}`,
        { headers: getAuthHeaders() }
      )
      if (response.ok) {
        const data = await response.json()
        const payload = data?.data ?? data
        setTerms(payload?.terms ?? [])
      } else {
        toast.error('Failed to fetch academic terms')
      }
    } catch (error) {
      console.error('Error fetching terms:', error)
      toast.error('Error fetching academic terms')
    } finally {
      setLoading(false)
    }
  }

  const fetchSchools = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/schools?limit=500`,
        { headers: getAuthHeaders() }
      )
      if (response.ok) {
        const data = await response.json()
        const payload = data?.data ?? data
        const list = payload?.schools ?? payload ?? []
        setSchools(Array.isArray(list) ? list : [])
      } else {
        setSchools([])
      }
    } catch (error) {
      console.error('Error fetching schools:', error)
      setSchools([])
    }
  }

  const handleCreateTerm = async () => {
    if (!formData.schoolId) {
      toast.error('Please select a school')
      return
    }
    try {
      const termData = {
        ...formData,
        schoolId: formData.schoolId,
        sortOrder: parseInt(formData.sortOrder.toString())
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/academic-terms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(termData),
      })

      if (response.ok) {
        toast.success('Academic term created successfully')
        setIsCreateDialogOpen(false)
        resetForm()
        fetchTerms()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to create academic term')
      }
    } catch (error) {
      console.error('Error creating term:', error)
      toast.error('Error creating academic term')
    }
  }

  const handleUpdateTerm = async () => {
    if (!selectedTerm) return

    try {
      const payload = {
        name: formData.name,
        type: formData.type,
        academicYear: formData.academicYear,
        startDate: formData.startDate,
        endDate: formData.endDate,
        description: formData.description,
        sortOrder: parseInt(formData.sortOrder.toString()),
      }
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/academic-terms/${selectedTerm._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast.success('Academic term updated successfully')
        setIsEditDialogOpen(false)
        setSelectedTerm(null)
        resetForm()
        fetchTerms()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to update academic term')
      }
    } catch (error) {
      console.error('Error updating term:', error)
      toast.error('Error updating academic term')
    }
  }

  const handleDeleteTerm = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/academic-terms/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Academic term deleted successfully')
        fetchTerms()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to delete academic term')
      }
    } catch (error) {
      console.error('Error deleting term:', error)
      toast.error('Error deleting academic term')
    }
  }

  const handleSetCurrent = async (id: string, schoolId?: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/academic-terms/${id}/set-current`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ schoolId }),
      })

      if (response.ok) {
        toast.success('Current term updated successfully')
        fetchTerms()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to set current term')
      }
    } catch (error) {
      console.error('Error setting current term:', error)
      toast.error('Error setting current term')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'semester',
      academicYear: new Date().getFullYear().toString(),
      startDate: '',
      endDate: '',
      schoolId: '',
      description: '',
      sortOrder: 1
    })
  }

  const openEditDialog = (term: AcademicTerm) => {
    setSelectedTerm(term)
    setFormData({
      name: term.name,
      type: term.type,
      academicYear: term.academicYear,
      startDate: term.startDate.split('T')[0],
      endDate: term.endDate.split('T')[0],
      schoolId: term.schoolId?._id ?? '',
      description: term.description || '',
      sortOrder: term.sortOrder
    })
    setIsEditDialogOpen(true)
  }

  const getAcademicYears = () => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let i = currentYear - 2; i <= currentYear + 5; i++) {
      years.push(`${i}-${i + 1}`)
    }
    return years
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Academic Terms</h2>
          <p className="text-muted-foreground">
            Manage academic years and terms per school
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          <Button variant="outline" size="sm" onClick={fetchTerms}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Term
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Academic Term</DialogTitle>
                <DialogDescription>
                  Set up a new academic term or semester for schools
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Term Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Fall 2024"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="semester">Semester</SelectItem>
                        <SelectItem value="quarter">Quarter</SelectItem>
                        <SelectItem value="trimester">Trimester</SelectItem>
                        <SelectItem value="term">Term</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="academicYear">Academic Year</Label>
                    <Select value={formData.academicYear} onValueChange={(value) => setFormData({ ...formData, academicYear: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getAcademicYears().map((year) => (
                          <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="schoolId">School (required)</Label>
                  <Select value={formData.schoolId || 'none'} onValueChange={(value) => setFormData({ ...formData, schoolId: value === 'none' ? '' : value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a school" />
                    </SelectTrigger>
                    <SelectContent>
                      {schools.map((school) => (
                        <SelectItem key={school._id} value={school._id}>
                          {school.name} ({school.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">Each term applies to one school. Select the school this term belongs to.</p>
                </div>
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Term description"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTerm}>Create Term</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>School</Label>
              <Select value={filters.schoolId} onValueChange={(value) => setFilters({ ...filters, schoolId: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Schools</SelectItem>
                  {schools.map((school) => (
                    <SelectItem key={school._id} value={school._id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Academic Year</Label>
              <Select value={filters.academicYear} onValueChange={(value) => setFilters({ ...filters, academicYear: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {getAcademicYears().map((year) => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={filters.isActive} onValueChange={(value) => setFilters({ ...filters, isActive: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Terms</SelectItem>
                  <SelectItem value="true">Active Only</SelectItem>
                  <SelectItem value="false">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terms Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Academic Terms
          </CardTitle>
          <CardDescription>
            Configure and manage academic terms across all schools
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading academic terms...</div>
          ) : terms.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No Academic Terms</h3>
              <p className="text-muted-foreground mb-4">
                Start by creating your first academic term
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Term
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Term Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Academic Year</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {terms.map((term) => (
                    <TableRow key={term._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{term.name}</span>
                          {term.isCurrent && (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                        {term.description && (
                          <p className="text-sm text-muted-foreground">{term.description}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {term.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{term.academicYear}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDate(term.startDate)}</div>
                          <div className="text-muted-foreground">to {formatDate(term.endDate)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {term.schoolId ? (
                          <div className="flex items-center gap-1">
                            <School className="h-4 w-4" />
                            <span className="text-sm">{term.schoolId.name}</span>
                          </div>
                        ) : (
                          <Badge variant="secondary">Global</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Badge variant={term.isActive ? "default" : "secondary"}>
                            {term.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {term.isCurrent && (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                              Current
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(term)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {!term.isCurrent && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetCurrent(term._id, term.schoolId?._id)}
                              title="Set as current term"
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTerm(term._id, term.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Academic Term</DialogTitle>
            <DialogDescription>
              Update the academic term information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Term Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-type">Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semester">Semester</SelectItem>
                    <SelectItem value="quarter">Quarter</SelectItem>
                    <SelectItem value="trimester">Trimester</SelectItem>
                    <SelectItem value="term">Term</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-academicYear">Academic Year</Label>
                <Select value={formData.academicYear} onValueChange={(value) => setFormData({ ...formData, academicYear: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getAcademicYears().map((year) => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-startDate">Start Date</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-endDate">End Date</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateTerm}>Update Term</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
