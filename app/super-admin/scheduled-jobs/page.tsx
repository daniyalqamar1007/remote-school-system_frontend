"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Clock, 
  Plus, 
  Edit, 
  Play, 
  Pause,
  Trash2,
  Save,
  RefreshCw,
  Calendar,
  Database,
  Mail
} from "lucide-react"
import { toast } from 'sonner'
import { scheduledJobsApi } from '@/lib/api'

interface ScheduledJob {
  _id: string
  id: string
  name: string
  type: string
  description: string
  cronExpression: string
  isActive: boolean
  lastRun?: string
  nextRun?: string
  status: 'running' | 'stopped' | 'failed' | 'success'
  parameters?: any
  createdAt: string
  updatedAt: string
}

const jobTypes = [
  { value: "backup", label: "Database Backup", icon: Database },
  { value: "data_sync", label: "Data Synchronization", icon: RefreshCw },
  { value: "email_digest", label: "Email Digest", icon: Mail },
  { value: "attendance_report", label: "Attendance Report", icon: Calendar },
  { value: "grade_calculation", label: "Grade Calculation", icon: Calendar },
  { value: "data_cleanup", label: "Data Cleanup", icon: Trash2 },
  { value: "honor_roll", label: "Honor Roll Calculation", icon: Calendar },
  { value: "report_generation", label: "Report Generation", icon: Calendar }
]

const cronPresets = [
  { label: "Every Hour", value: "0 0 * * * *" },
  { label: "Daily at 2 AM", value: "0 0 2 * * *" },
  { label: "Weekly (Sunday 2 AM)", value: "0 0 2 * * 0" },
  { label: "Monthly (1st day 2 AM)", value: "0 0 2 1 * *" },
  { label: "Every 30 minutes", value: "0 */30 * * * *" },
  { label: "Weekdays at 6 AM", value: "0 0 6 * * 1-5" }
]

export default function ScheduledJobsPage() {
  const [jobs, setJobs] = useState<ScheduledJob[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingJob, setEditingJob] = useState<ScheduledJob | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    type: "",
    description: "",
    cronExpression: "",
    isActive: true,
    parameters: "{}"
  })

  useEffect(() => {
    fetchJobs()
  }, [])

  const normalizeJob = (j: any): ScheduledJob => ({
    ...j,
    _id: j._id || j.id,
    id: j._id || j.id,
    cronExpression: j.cronExpression || j.schedule,
    isActive: j.isActive !== undefined ? j.isActive : j.enabled,
    status: (j.status === 'active' ? 'running' : j.status === 'inactive' ? 'stopped' : j.status) || 'stopped',
  })

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const data = await scheduledJobsApi.getAll(1, 50)
      const payload = data?.data ?? data
      const list = payload?.jobs ?? (Array.isArray(data) ? data : [])
      setJobs((Array.isArray(list) ? list : []).map(normalizeJob))
    } catch (error: any) {
      console.error("Error fetching jobs:", error)
      toast.error(error?.message ?? "Failed to fetch scheduled jobs")
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const payload = {
        name: formData.name,
        type: formData.type,
        description: formData.description,
        cronExpression: formData.cronExpression,
        isActive: formData.isActive,
        parameters: formData.parameters ? (() => { try { return JSON.parse(formData.parameters) } catch { return {} } })() : {},
      }
      if (editingJob) {
        await scheduledJobsApi.update(editingJob._id, payload)
        toast.success("Job updated successfully")
      } else {
        await scheduledJobsApi.create(payload)
        toast.success("Job created successfully")
      }
      setIsDialogOpen(false)
      resetForm()
      fetchJobs()
    } catch (error: any) {
      console.error("Error saving job:", error)
      toast.error(error?.message ?? "Error saving job")
    } finally {
      setSaving(false)
    }
  }

  const handleToggleJob = async (id: string, isActive: boolean) => {
    try {
      await scheduledJobsApi.toggle(id, !isActive)
      toast.success(`Job ${!isActive ? 'enabled' : 'disabled'} successfully`)
      fetchJobs()
    } catch (error: any) {
      console.error("Error toggling job:", error)
      toast.error(error?.message ?? "Failed to toggle job")
    }
  }

  const handleRunJob = async (id: string) => {
    try {
      await scheduledJobsApi.run(id)
      toast.success("Job started successfully")
      fetchJobs()
    } catch (error: any) {
      console.error("Error running job:", error)
      toast.error(error?.message ?? "Failed to run job")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return
    try {
      await scheduledJobsApi.delete(id)
      toast.success("Job deleted successfully")
      fetchJobs()
    } catch (error: any) {
      console.error("Error deleting job:", error)
      toast.error(error?.message ?? "Failed to delete job")
    }
  }

  const handleEdit = (job: ScheduledJob) => {
    setEditingJob(job)
    setFormData({
      name: job.name,
      type: job.type,
      description: job.description,
      cronExpression: job.cronExpression,
      isActive: job.isActive,
      parameters: JSON.stringify(job.parameters || {}, null, 2)
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      type: "",
      description: "",
      cronExpression: "",
      isActive: true,
      parameters: "{}"
    })
    setEditingJob(null)
  }

  const openCreateDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      running: { variant: "default" as const, color: "blue" },
      stopped: { variant: "secondary" as const, color: "gray" },
      failed: { variant: "destructive" as const, color: "red" },
      success: { variant: "default" as const, color: "green" }
    }
    
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.stopped
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading scheduled jobs...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Scheduled Jobs</h2>
          <p className="text-muted-foreground">
            Manage and monitor automated system tasks and background jobs
          </p>
        </div>
        <Button onClick={openCreateDialog} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Create Job
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Jobs</CardTitle>
          <CardDescription>
            View, edit, and schedule automated tasks such as backups, reports, and data synchronization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Next Run</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Clock className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No scheduled jobs found</p>
                        <Button variant="outline" onClick={openCreateDialog}>
                          Create your first job
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  jobs.map((job) => (
                    <TableRow key={job._id}>
                      <TableCell className="font-medium">{job.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {jobTypes.find(t => t.value === job.type)?.label || job.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{job.cronExpression}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(job.status).variant}>
                          {job.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {job.lastRun ? new Date(job.lastRun).toLocaleString() : "Never"}
                      </TableCell>
                      <TableCell>
                        {job.nextRun ? new Date(job.nextRun).toLocaleString() : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRunJob(job._id)}
                            disabled={job.status === 'running'}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleJob(job._id, job.isActive)}
                          >
                            {job.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(job)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(job._id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingJob ? "Edit Job" : "Create Job"}
            </DialogTitle>
            <DialogDescription>
              {editingJob ? "Update the scheduled job" : "Create a new scheduled job"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Job Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Daily Backup"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Job Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this job does..."
                rows={3}
                className="w-full resize-none"
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cronExpression">Cron Expression *</Label>
                <Input
                  id="cronExpression"
                  value={formData.cronExpression}
                  onChange={(e) => setFormData(prev => ({ ...prev, cronExpression: e.target.value }))}
                  placeholder="0 0 2 * * *"
                  className="w-full font-mono"
                />
              </div>
              
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Common patterns:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {cronPresets.map((preset) => (
                    <Button
                      key={preset.value}
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, cronExpression: preset.value }))}
                      className="text-xs justify-start h-auto py-2 px-3"
                      type="button"
                    >
                      <div className="text-left">
                        <div className="font-medium">{preset.label}</div>
                        <div className="text-xs text-muted-foreground font-mono">{preset.value}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="parameters">Parameters (JSON)</Label>
              <Textarea
                id="parameters"
                value={formData.parameters}
                onChange={(e) => setFormData(prev => ({ ...prev, parameters: e.target.value }))}
                placeholder='{"key": "value", "retries": 3}'
                rows={4}
                className="w-full font-mono text-sm resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Optional JSON configuration for the job. Leave empty if not needed.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isActive" className="text-sm font-medium">
                  Enable job immediately
                </Label>
              </div>
              
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    resetForm()
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !formData.name || !formData.cronExpression || !formData.type}
                  className="min-w-[100px]"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingJob ? "Update" : "Create"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
