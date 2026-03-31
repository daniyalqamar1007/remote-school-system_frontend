"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { 
  RotateCw, 
  Plus, 
  Edit, 
  Play, 
  Eye,
  CheckCircle,
  AlertTriangle,
  School,
} from "lucide-react"
import { toast } from 'sonner'

interface RolloverRule {
  _id: string
  name: string
  fromGrade: string
  toGrade: string
  condition: string
  isActive?: boolean
}

interface RolloverConfig {
  _id?: string
  schoolId?: string
  schoolName?: string
  academicYear: string
  fromYear?: string
  toYear?: string
  status: string
  rolloverRules: RolloverRule[]
  archiveSettings: {
    archiveOldData: boolean
    retentionPeriod: number
    includeGrades: boolean
    includeAttendance: boolean
    includeBehavior: boolean
  }
  promotionSettings: {
    autoPromotion: boolean
    requireApproval: boolean
  }
  studentsProcessed?: number
  studentsPromoted?: number
  studentsRetained?: number
  executedAt?: string
  createdAt?: string
  updatedAt?: string
}

type SchoolOption = { _id: string; name: string; code?: string }

const gradeOptions = [
  "Pre-K", "Kindergarten", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5",
  "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12", "Graduate"
]

const CONDITION_OPTIONS = [
  { value: 'automatic', label: 'Automatic (all students)' },
  { value: 'passing_grades', label: 'Passing grades only' },
  { value: 'manual_review', label: 'Manual review (retain)' },
]

function mapBackendToFrontend(c: any): RolloverConfig {
  const rules = (c.promotionRules || []).map((r: any, i: number) => ({
    _id: r._id?.toString() || `rule-${i}`,
    name: r.name || `${r.fromGrade || ''} → ${r.toGrade || ''}`,
    fromGrade: r.fromGrade || PLACEHOLDER_GRADE,
    toGrade: r.toGrade || PLACEHOLDER_GRADE,
    condition: r.condition || 'automatic',
    isActive: true,
  }))
  const archive = c.archiveSettings || {}
  return {
    _id: c._id,
    schoolId: c.schoolId,
    schoolName: c.schoolName,
    academicYear: c.toYear || c.academicYear || '',
    fromYear: c.fromYear,
    toYear: c.toYear,
    status: c.status || 'draft',
    rolloverRules: rules,
    archiveSettings: {
      archiveOldData: archive.archiveGrades ?? true,
      retentionPeriod: archive.retentionPeriod ?? 7,
      includeGrades: archive.archiveGrades ?? archive.includeGrades ?? true,
      includeAttendance: archive.archiveAttendance ?? archive.includeAttendance ?? true,
      includeBehavior: archive.archiveBehavior ?? archive.includeBehavior ?? true,
    },
    promotionSettings: {
      autoPromotion: false,
      requireApproval: true,
    },
    studentsProcessed: c.studentsProcessed,
    studentsPromoted: c.studentsPromoted,
    studentsRetained: c.studentsRetained,
    executedAt: c.executedAt,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }
}

const PLACEHOLDER_GRADE = '__select__'

function mapFrontendToBackend(formData: RolloverConfig, schoolId?: string) {
  let fy = formData.fromYear || ''
  let ty = formData.toYear || ''
  const yr = (formData.academicYear || '').trim()
  const parts = yr.split('-').map(s => s.trim())
  if (parts.length >= 2) {
    const a = parseInt(parts[0], 10)
    const b = parseInt(parts[1], 10)
    if (!isNaN(a) && !isNaN(b)) {
      fy = `${a - 1}-${a}`
      ty = `${b - 1}-${b}`
    }
  }
  const rules = (formData.rolloverRules || [])
    .map(r => ({
      fromGrade: r.fromGrade && r.fromGrade !== PLACEHOLDER_GRADE ? r.fromGrade : '',
      toGrade: r.toGrade && r.toGrade !== PLACEHOLDER_GRADE ? r.toGrade : '',
      condition: r.condition || 'automatic',
    }))
    .filter(r => r.fromGrade && r.toGrade)
  return {
    name: formData.academicYear ? `Rollover ${fy} → ${ty}` : 'Rollover',
    fromYear: fy || undefined,
    toYear: ty || undefined,
    academicYear: formData.academicYear,
    schoolId: schoolId || formData.schoolId,
    promotionRules: rules,
    archiveSettings: {
      archiveGrades: formData.archiveSettings?.includeGrades ?? true,
      archiveAttendance: formData.archiveSettings?.includeAttendance ?? true,
      archiveBehavior: formData.archiveSettings?.includeBehavior ?? true,
      retentionPeriod: formData.archiveSettings?.retentionPeriod ?? 7,
    },
  }
}

export default function RolloverConfigPage() {
  const defaultConfig: RolloverConfig = {
    academicYear: "",
    status: 'draft',
    rolloverRules: [],
    archiveSettings: {
      archiveOldData: true,
      retentionPeriod: 7,
      includeGrades: true,
      includeAttendance: true,
      includeBehavior: true
    },
    promotionSettings: {
      autoPromotion: false,
      requireApproval: true,
    }
  }

  const [configs, setConfigs] = useState<RolloverConfig[]>([])
  const [schools, setSchools] = useState<SchoolOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [executing, setExecuting] = useState<string | null>(null)
  const [editingConfig, setEditingConfig] = useState<RolloverConfig | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [schoolFilter, setSchoolFilter] = useState<string>("")
  const [previewConfig, setPreviewConfig] = useState<RolloverConfig | null>(null)
  const [previewData, setPreviewData] = useState<{
    studentsToPromote: number
    studentsToRetain: number
    promotionBreakdown: Array<{ fromGrade: string; toGrade: string; count: number }>
    totalStudents: number
  } | null>(null)
  const [formData, setFormData] = useState<RolloverConfig>(defaultConfig)

  useEffect(() => {
    fetchSchools()
  }, [])

  useEffect(() => {
    fetchConfigs()
  }, [schoolFilter])

  const fetchSchools = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/schools?limit=500`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (res.ok) {
        const data = await res.json()
        const list = data?.data?.schools || data?.data || data?.schools || data || []
        setSchools(Array.isArray(list) ? list : [])
      }
    } catch {
      setSchools([])
    }
  }

  const fetchConfigs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (schoolFilter) params.set('schoolId', schoolFilter)
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/rollover-configs?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setConfigs((data.configs || []).map(mapBackendToFrontend))
      } else {
        toast.error("Failed to fetch rollover configurations")
      }
    } catch (error) {
      console.error("Error fetching configs:", error)
      toast.error("Error fetching rollover configurations")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    const sid = formData.schoolId
    if (!editingConfig && !sid) {
      toast.error("Please select a school")
      return
    }
    const validRules = (formData.rolloverRules || []).filter(
      r => r.fromGrade && r.fromGrade !== PLACEHOLDER_GRADE && r.toGrade && r.toGrade !== PLACEHOLDER_GRADE
    )
    if (validRules.length === 0) {
      toast.error("Add at least one promotion rule with From and To grades selected")
      return
    }
    if (!formData.academicYear?.trim()) {
      toast.error("Enter academic year (e.g. 2024-2025)")
      return
    }
    try {
      setSaving(true)
      const payload = mapFrontendToBackend(formData, sid)
      if (!payload.schoolId) {
        toast.error("School is required")
        return
      }
      const url = editingConfig 
        ? `${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/rollover-configs/${editingConfig._id}`
        : `${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/rollover-configs`
      
      const response = await fetch(url, {
        method: editingConfig ? "PUT" : "POST",
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()
      if (response.ok) {
        toast.success(`Configuration ${editingConfig ? 'updated' : 'created'} successfully`)
        setIsDialogOpen(false)
        resetForm()
        fetchConfigs()
      } else {
        toast.error(result.message || "Failed to save configuration")
      }
    } catch (error) {
      console.error("Error saving config:", error)
      toast.error("Error saving configuration")
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = async (config: RolloverConfig) => {
    if (!config._id) return
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/rollover-configs/${config._id}/preview`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      )
      if (response.ok) {
        const data = await response.json()
        setPreviewConfig(config)
        setPreviewData(data)
      } else {
        toast.error("Failed to load preview")
      }
    } catch {
      toast.error("Failed to load preview")
    }
  }

  const handleExecuteRollover = async (id: string) => {
    if (!confirm(
      "This will promote students to the next grade, save their previous grade on their profile, and cannot be undone. Continue?"
    )) return
    try {
      setExecuting(id)
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/rollover-configs/${id}/execute`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      const data = await response.json()
      if (response.ok && data.success) {
        toast.success(`Rollover complete: ${data.studentsPromoted ?? 0} promoted, ${data.studentsRetained ?? 0} retained`)
        fetchConfigs()
      } else {
        toast.error(data.message || "Rollover failed")
      }
    } catch (error) {
      console.error("Error executing rollover:", error)
      toast.error("Error executing rollover")
    } finally {
      setExecuting(null)
    }
  }

  const handleEdit = (config: RolloverConfig) => {
    setEditingConfig(config)
    setFormData({ ...defaultConfig, ...config })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setFormData(defaultConfig)
    setEditingConfig(null)
  }

  const openCreateDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const addPromotionRule = () => {
    const newRule: RolloverRule = {
      _id: Date.now().toString(),
      name: "",
      fromGrade: PLACEHOLDER_GRADE,
      toGrade: PLACEHOLDER_GRADE,
      condition: "automatic",
    }
    setFormData(prev => ({
      ...prev,
      rolloverRules: [...(prev.rolloverRules || []), newRule]
    }))
  }

  const addDefaultRules = () => {
    const defaults: RolloverRule[] = [
      { _id: '1', name: '', fromGrade: 'Kindergarten', toGrade: 'Grade 1', condition: 'automatic' },
      { _id: '2', name: '', fromGrade: 'Grade 1', toGrade: 'Grade 2', condition: 'automatic' },
      { _id: '3', name: '', fromGrade: 'Grade 2', toGrade: 'Grade 3', condition: 'automatic' },
      { _id: '4', name: '', fromGrade: 'Grade 3', toGrade: 'Grade 4', condition: 'automatic' },
      { _id: '5', name: '', fromGrade: 'Grade 4', toGrade: 'Grade 5', condition: 'automatic' },
      { _id: '6', name: '', fromGrade: 'Grade 5', toGrade: 'Grade 6', condition: 'automatic' },
      { _id: '7', name: '', fromGrade: 'Grade 6', toGrade: 'Grade 7', condition: 'automatic' },
      { _id: '8', name: '', fromGrade: 'Grade 7', toGrade: 'Grade 8', condition: 'automatic' },
      { _id: '9', name: '', fromGrade: 'Grade 8', toGrade: 'Grade 9', condition: 'automatic' },
      { _id: '10', name: '', fromGrade: 'Grade 9', toGrade: 'Grade 10', condition: 'automatic' },
      { _id: '11', name: '', fromGrade: 'Grade 10', toGrade: 'Grade 11', condition: 'automatic' },
      { _id: '12', name: '', fromGrade: 'Grade 11', toGrade: 'Grade 12', condition: 'automatic' },
      { _id: '13', name: '', fromGrade: 'Grade 12', toGrade: 'Graduate', condition: 'automatic' },
    ]
    setFormData(prev => ({
      ...prev,
      rolloverRules: defaults
    }))
  }

  const updatePromotionRule = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      rolloverRules: (prev.rolloverRules || []).map((rule, i) => 
        i === index ? { ...rule, [field]: value } : rule
      )
    }))
  }

  const removePromotionRule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rolloverRules: (prev.rolloverRules || []).filter((_, i) => i !== index)
    }))
  }

  const getStatusBadge = (status: string) => {
    const map: Record<string, { variant: "secondary" | "default" | "destructive"; label: string }> = {
      draft: { variant: "secondary", label: "Draft" },
      ready: { variant: "default", label: "Ready" },
      "in-progress": { variant: "default", label: "In Progress" },
      completed: { variant: "default", label: "Completed" },
      failed: { variant: "destructive", label: "Failed" },
      pending: { variant: "secondary", label: "Pending" },
      in_progress: { variant: "default", label: "In Progress" },
    }
    return map[status] || { variant: "secondary" as const, label: status }
  }

  if (loading && configs.length === 0) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading rollover configurations...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Academic Year Rollover</h2>
          <p className="text-muted-foreground">
            Promote students to the next grade. Previous grade is saved on each student profile.
          </p>
        </div>
        <Button onClick={openCreateDialog} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Create Configuration
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Rollover Configurations</CardTitle>
              <CardDescription>
                Configure per-school rollover. Students move to the next grade; their previous grade is stored in their profile.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <School className="h-4 w-4 text-muted-foreground" />
              <Select value={schoolFilter || "all"} onValueChange={(v) => setSchoolFilter(v === "all" ? "" : v)}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="All schools" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All schools</SelectItem>
                  {schools.map((s) => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.name}{s.code ? ` (${s.code})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School</TableHead>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rules</TableHead>
                  <TableHead>Results</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <RotateCw className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No rollover configurations</p>
                        <p className="text-sm text-muted-foreground">Create one to roll students to the next grade.</p>
                        <Button variant="outline" onClick={openCreateDialog}>
                          Create configuration
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  configs.map((config) => {
                    const statusInfo = getStatusBadge(config.status)
                    const canExecute = config.status === 'draft' || config.status === 'ready'
                    return (
                      <TableRow key={config._id}>
                        <TableCell className="font-medium">
                          {config.schoolName || schools.find(s => s._id === config.schoolId)?.name || config.schoolId || '—'}
                        </TableCell>
                        <TableCell>{config.academicYear || `${config.fromYear} → ${config.toYear}`}</TableCell>
                        <TableCell>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </TableCell>
                        <TableCell>{config.rolloverRules?.length || 0} rules</TableCell>
                        <TableCell>
                          {config.status === 'completed' && (
                            <span className="text-sm">
                              {config.studentsPromoted ?? 0} promoted, {config.studentsRetained ?? 0} retained
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {canExecute && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePreview(config)}
                                title="Preview"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            {canExecute && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleExecuteRollover(config._id!)}
                                disabled={!!executing || (config.rolloverRules?.length || 0) === 0}
                                title="Execute rollover"
                              >
                                {executing === config._id ? (
                                  <RotateCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            {config.status !== 'completed' && config.status !== 'in-progress' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(config)}
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
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
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingConfig ? "Edit Rollover Configuration" : "Create Rollover Configuration"}
            </DialogTitle>
            <DialogDescription>
              Rollover promotes students per school. Each student&apos;s previous grade is saved on their profile.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="promotion">Promotion Rules</TabsTrigger>
              <TabsTrigger value="archive">Archive</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="school">School</Label>
                  <Select
                    value={formData.schoolId || ""}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, schoolId: v }))}
                    disabled={!!editingConfig}
                  >
                    <SelectTrigger id="school">
                      <SelectValue placeholder="Select school" />
                    </SelectTrigger>
                    <SelectContent>
                      {schools.map((s) => (
                        <SelectItem key={s._id} value={s._id}>
                          {s.name}{s.code ? ` (${s.code})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="academicYear">Academic Year (e.g. 2024-2025)</Label>
                  <Input
                    id="academicYear"
                    value={formData.academicYear}
                    onChange={(e) => setFormData(prev => ({ ...prev, academicYear: e.target.value }))}
                    placeholder="2024-2025"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="promotion" className="space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div>
                  <h4 className="text-lg font-medium">Promotion Rules</h4>
                  <p className="text-sm text-muted-foreground">Define how students move from one grade to the next.</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={addDefaultRules}>
                    Add All Grades (K→12)
                  </Button>
                  <Button variant="outline" onClick={addPromotionRule}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Rule
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {(formData.rolloverRules || []).map((rule, index) => (
                  <Card key={rule._id}>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>From Grade</Label>
                          <Select
                            value={rule.fromGrade || PLACEHOLDER_GRADE}
                            onValueChange={(v) => updatePromotionRule(index, 'fromGrade', v === PLACEHOLDER_GRADE ? '' : v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select from grade" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={PLACEHOLDER_GRADE}>Select grade</SelectItem>
                              {gradeOptions.filter(g => g !== 'Graduate').map((grade) => (
                                <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>To Grade</Label>
                          <Select
                            value={rule.toGrade || PLACEHOLDER_GRADE}
                            onValueChange={(v) => updatePromotionRule(index, 'toGrade', v === PLACEHOLDER_GRADE ? '' : v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select to grade" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={PLACEHOLDER_GRADE}>Select grade</SelectItem>
                              {gradeOptions.map((grade) => (
                                <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Condition</Label>
                          <Select
                            value={rule.condition || 'automatic'}
                            onValueChange={(v) => updatePromotionRule(index, 'condition', v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CONDITION_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-end justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removePromotionRule(index)}
                            className="text-destructive"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {(!formData.rolloverRules || formData.rolloverRules.length === 0) && (
                <p className="text-sm text-muted-foreground">Add at least one rule (e.g. Grade 5 → Grade 6).</p>
              )}
            </TabsContent>

            <TabsContent value="archive" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="archiveOldData"
                    checked={formData.archiveSettings?.archiveOldData ?? true}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      archiveSettings: { ...prev.archiveSettings, archiveOldData: e.target.checked }
                    }))}
                    className="rounded"
                  />
                  <Label htmlFor="archiveOldData">Archive old academic year data</Label>
                </div>
                {formData.archiveSettings?.archiveOldData && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="retentionPeriod">Retention Period (years)</Label>
                      <Input
                        id="retentionPeriod"
                        type="number"
                        value={formData.archiveSettings?.retentionPeriod ?? 7}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          archiveSettings: { ...prev.archiveSettings, retentionPeriod: parseInt(e.target.value) || 7 }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="includeGrades"
                          checked={formData.archiveSettings?.includeGrades ?? true}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            archiveSettings: { ...prev.archiveSettings, includeGrades: e.target.checked }
                          }))}
                          className="rounded"
                        />
                        <Label htmlFor="includeGrades">Grades and report cards</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="includeAttendance"
                          checked={formData.archiveSettings?.includeAttendance ?? true}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            archiveSettings: { ...prev.archiveSettings, includeAttendance: e.target.checked }
                          }))}
                          className="rounded"
                        />
                        <Label htmlFor="includeAttendance">Attendance</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="includeBehavior"
                          checked={formData.archiveSettings?.includeBehavior ?? true}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            archiveSettings: { ...prev.archiveSettings, includeBehavior: e.target.checked }
                          }))}
                          className="rounded"
                        />
                        <Label htmlFor="includeBehavior">Behavior</Label>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <RotateCw className="mr-2 h-4 w-4 animate-spin" />}
              {editingConfig ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewData} onOpenChange={(open) => !open && setPreviewData(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rollover Preview</DialogTitle>
            <DialogDescription>
              {previewConfig?.schoolName} — {previewConfig?.academicYear}
            </DialogDescription>
          </DialogHeader>
          {previewData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-green-600">{previewData.studentsToPromote}</div>
                    <div className="text-sm text-muted-foreground">Students to promote</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">{previewData.studentsToRetain}</div>
                    <div className="text-sm text-muted-foreground">Students retained (no matching rule)</div>
                  </CardContent>
                </Card>
              </div>
              {previewData.promotionBreakdown?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">By rule</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>From</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.promotionBreakdown.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell>{row.fromGrade}</TableCell>
                          <TableCell>{row.toGrade}</TableCell>
                          <TableCell className="text-right">{row.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
