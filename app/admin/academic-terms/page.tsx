"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Calendar, Plus, Edit, Trash2, Star, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface AcademicTerm {
  _id: string
  name: string
  type: string
  academicYear: string
  startDate: string
  endDate: string
  isActive: boolean
  isCurrent: boolean
  description?: string
  sortOrder: number
}

export default function AdminAcademicTermsPage() {
  const [terms, setTerms] = useState<AcademicTerm[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedTerm, setSelectedTerm] = useState<AcademicTerm | null>(null)
  const [filters, setFilters] = useState({ academicYear: "all", isActive: "all" })
  const [formData, setFormData] = useState({
    name: "",
    type: "semester",
    academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    startDate: "",
    endDate: "",
    description: "",
    sortOrder: 1,
  })

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token") || localStorage.getItem("accessToken")
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
  }

  const getAcademicYears = () => {
    const currentYear = new Date().getFullYear()
    const years: string[] = []
    for (let i = currentYear - 2; i <= currentYear + 5; i++) {
      years.push(`${i}-${i + 1}`)
    }
    return years
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const fetchTerms = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.academicYear !== "all") params.append("academicYear", filters.academicYear)
      if (filters.isActive !== "all") params.append("isActive", filters.isActive)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/academic-terms?${params}`,
        { headers: getAuthHeaders() }
      )
      if (response.ok) {
        const data = await response.json()
        setTerms(data.terms || [])
      } else {
        toast.error("Failed to fetch academic terms")
      }
    } catch (error) {
      console.error("Error fetching terms:", error)
      toast.error("Error fetching academic terms")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTerms()
  }, [filters])

  const resetForm = () => {
    setFormData({
      name: "",
      type: "semester",
      academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      startDate: "",
      endDate: "",
      description: "",
      sortOrder: 1,
    })
  }

  const handleCreateTerm = async () => {
    try {
      const payload = {
        ...formData,
        sortOrder: Number(formData.sortOrder),
      }
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/academic-terms`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        }
      )
      if (response.ok) {
        toast.success("Academic term created successfully")
        setIsCreateDialogOpen(false)
        resetForm()
        fetchTerms()
      } else {
        const err = await response.json().catch(() => ({}))
        toast.error(err?.message || "Failed to create academic term")
      }
    } catch (error) {
      console.error("Error creating term:", error)
      toast.error("Error creating academic term")
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
        sortOrder: Number(formData.sortOrder),
      }
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/academic-terms/${selectedTerm._id}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        }
      )
      if (response.ok) {
        toast.success("Academic term updated successfully")
        setIsEditDialogOpen(false)
        setSelectedTerm(null)
        fetchTerms()
      } else {
        const err = await response.json().catch(() => ({}))
        toast.error(err?.message || "Failed to update academic term")
      }
    } catch (error) {
      console.error("Error updating term:", error)
      toast.error("Error updating academic term")
    }
  }

  const handleDeleteTerm = async (id: string, name: string) => {
    if (!confirm(`Delete term "${name}"?`)) return
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/academic-terms/${id}`,
        { method: "DELETE", headers: getAuthHeaders() }
      )
      if (response.ok) {
        toast.success("Academic term deleted successfully")
        fetchTerms()
      } else {
        toast.error("Failed to delete academic term")
      }
    } catch (error) {
      console.error("Error deleting term:", error)
      toast.error("Error deleting academic term")
    }
  }

  const handleSetCurrent = async (id: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/academic-terms/${id}/set-current`,
        { method: "PUT", headers: getAuthHeaders() }
      )
      if (response.ok) {
        toast.success("Current term updated")
        fetchTerms()
      } else {
        toast.error("Failed to set current term")
      }
    } catch (error) {
      console.error("Error setting current term:", error)
      toast.error("Error setting current term")
    }
  }

  const openEditDialog = (term: AcademicTerm) => {
    setSelectedTerm(term)
    setFormData({
      name: term.name,
      type: term.type,
      academicYear: term.academicYear,
      startDate: term.startDate?.split("T")[0] || "",
      endDate: term.endDate?.split("T")[0] || "",
      description: term.description || "",
      sortOrder: term.sortOrder ?? 1,
    })
    setIsEditDialogOpen(true)
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Academic Terms</h2>
          <p className="text-muted-foreground">
            Add and manage academic terms and years for your school
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchTerms}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Term
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Academic Term</DialogTitle>
                <DialogDescription>
                  Create a new term or semester for your school
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
                    <Label>Type</Label>
                    <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="semester">Semester</SelectItem>
                        <SelectItem value="quarter">Quarter</SelectItem>
                        <SelectItem value="trimester">Trimester</SelectItem>
                        <SelectItem value="term">Term</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Academic Year</Label>
                    <Select value={formData.academicYear} onValueChange={(v) => setFormData({ ...formData, academicYear: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {getAcademicYears().map((y) => (
                          <SelectItem key={y} value={y}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Description (Optional)</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Term description"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateTerm}>Create Term</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Academic Year</Label>
              <Select value={filters.academicYear} onValueChange={(v) => setFilters({ ...filters, academicYear: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {getAcademicYears().map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={filters.isActive} onValueChange={(v) => setFilters({ ...filters, isActive: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your School&apos;s Terms</CardTitle>
          <CardDescription>Terms apply only to your school</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : terms.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No Academic Terms</h3>
              <p className="text-muted-foreground mb-4">Add a term to get started</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Term
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {terms.map((term) => (
                  <TableRow key={term._id}>
                    <TableCell className="font-medium">{term.name}</TableCell>
                    <TableCell>{term.type}</TableCell>
                    <TableCell>{term.academicYear}</TableCell>
                    <TableCell>
                      {formatDate(term.startDate)} – {formatDate(term.endDate)}
                    </TableCell>
                    <TableCell>
                      {term.isCurrent ? (
                        <span className="text-primary font-medium">Current</span>
                      ) : term.isActive ? (
                        "Active"
                      ) : (
                        "Inactive"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(term)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!term.isCurrent && (
                          <Button variant="ghost" size="sm" onClick={() => handleSetCurrent(term._id)} title="Set as current">
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteTerm(term._id, term.name)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Academic Term</DialogTitle>
            <DialogDescription>Update the term details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Term Name</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semester">Semester</SelectItem>
                    <SelectItem value="quarter">Quarter</SelectItem>
                    <SelectItem value="trimester">Trimester</SelectItem>
                    <SelectItem value="term">Term</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Academic Year</Label>
                <Select value={formData.academicYear} onValueChange={(v) => setFormData({ ...formData, academicYear: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {getAcademicYears().map((y) => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Description (Optional)</Label>
              <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateTerm}>Update Term</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
