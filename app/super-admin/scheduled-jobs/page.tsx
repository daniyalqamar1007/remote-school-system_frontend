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

type ScheduleType = "hourly" | "daily" | "weekly" | "monthly" | "custom"

const weekDays = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
]

const defaultScheduleTime = "02:00"

function padNumber(value: string | number) {
  return String(value).padStart(2, "0")
}

function formatTimeLabel(timeValue: string) {
  const [hourText = "0", minuteText = "0"] = timeValue.split(":")
  const hour = Number(hourText)
  const minute = Number(minuteText)
  const isPm = hour >= 12
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  return `${displayHour}:${padNumber(minute)} ${isPm ? "PM" : "AM"}`
}

function buildCronExpression(formData: {
  scheduleType: ScheduleType
  scheduleTime: string
  scheduleMinute: string
  scheduleDayOfWeek: string
  scheduleDayOfMonth: string
  cronExpression: string
}) {
  switch (formData.scheduleType) {
    case "hourly":
      return `0 ${Math.min(59, Math.max(0, Number(formData.scheduleMinute) || 0))} * * * *`
    case "daily": {
      const [hourText = "0", minuteText = "0"] = formData.scheduleTime.split(":")
      const hour = Math.min(23, Math.max(0, Number(hourText) || 0))
      const minute = Math.min(59, Math.max(0, Number(minuteText) || 0))
      return `0 ${minute} ${hour} * * *`
    }
    case "weekly": {
      const [hourText = "0", minuteText = "0"] = formData.scheduleTime.split(":")
      const hour = Math.min(23, Math.max(0, Number(hourText) || 0))
      const minute = Math.min(59, Math.max(0, Number(minuteText) || 0))
      const dayOfWeek = Math.min(6, Math.max(0, Number(formData.scheduleDayOfWeek) || 0))
      return `0 ${minute} ${hour} * * ${dayOfWeek}`
    }
    case "monthly": {
      const [hourText = "0", minuteText = "0"] = formData.scheduleTime.split(":")
      const hour = Math.min(23, Math.max(0, Number(hourText) || 0))
      const minute = Math.min(59, Math.max(0, Number(minuteText) || 0))
      const dayOfMonth = Math.min(31, Math.max(1, Number(formData.scheduleDayOfMonth) || 1))
      return `0 ${minute} ${hour} ${dayOfMonth} * *`
    }
    case "custom":
      return formData.cronExpression.trim()
    default:
      return ""
  }
}

function formatScheduleSummary(formData: {
  scheduleType: ScheduleType
  scheduleTime: string
  scheduleMinute: string
  scheduleDayOfWeek: string
  scheduleDayOfMonth: string
}) {
  switch (formData.scheduleType) {
    case "hourly":
      return `Every hour at minute ${padNumber(Math.min(59, Math.max(0, Number(formData.scheduleMinute) || 0)))}`
    case "daily":
      return `Daily at ${formatTimeLabel(formData.scheduleTime)}`
    case "weekly": {
      const day = weekDays.find((item) => item.value === formData.scheduleDayOfWeek)?.label || "Sunday"
      return `Weekly on ${day} at ${formatTimeLabel(formData.scheduleTime)}`
    }
    case "monthly":
      return `Monthly on day ${Math.min(31, Math.max(1, Number(formData.scheduleDayOfMonth) || 1))} at ${formatTimeLabel(formData.scheduleTime)}`
    case "custom":
      return "Custom cron expression"
    default:
      return ""
  }
}

function inferScheduleFromCron(cronExpression: string) {
  const trimmed = cronExpression.trim()

  const hourlyMatch = trimmed.match(/^0\s+(\d{1,2})\s+\*\s+\*\s+\*\s+\*$/)
  if (hourlyMatch) {
    return {
      scheduleType: "hourly" as ScheduleType,
      scheduleTime: defaultScheduleTime,
      scheduleMinute: padNumber(Math.min(59, Math.max(0, Number(hourlyMatch[1]) || 0))),
      scheduleDayOfWeek: "0",
      scheduleDayOfMonth: "1",
      cronExpression: "",
    }
  }

  const dailyMatch = trimmed.match(/^0\s+(\d{1,2})\s+(\d{1,2})\s+\*\s+\*\s+\*$/)
  if (dailyMatch) {
    return {
      scheduleType: "daily" as ScheduleType,
      scheduleTime: `${padNumber(Math.min(23, Math.max(0, Number(dailyMatch[2]) || 0)))}:${padNumber(Math.min(59, Math.max(0, Number(dailyMatch[1]) || 0)))}`,
      scheduleMinute: "0",
      scheduleDayOfWeek: "0",
      scheduleDayOfMonth: "1",
      cronExpression: "",
    }
  }

  const weeklyMatch = trimmed.match(/^0\s+(\d{1,2})\s+(\d{1,2})\s+\*\s+\*\s+([0-6])$/)
  if (weeklyMatch) {
    return {
      scheduleType: "weekly" as ScheduleType,
      scheduleTime: `${padNumber(Math.min(23, Math.max(0, Number(weeklyMatch[2]) || 0)))}:${padNumber(Math.min(59, Math.max(0, Number(weeklyMatch[1]) || 0)))}`,
      scheduleMinute: "0",
      scheduleDayOfWeek: weeklyMatch[3],
      scheduleDayOfMonth: "1",
      cronExpression: "",
    }
  }

  const monthlyMatch = trimmed.match(/^0\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\s+\*\s+\*$/)
  if (monthlyMatch) {
    return {
      scheduleType: "monthly" as ScheduleType,
      scheduleTime: `${padNumber(Math.min(23, Math.max(0, Number(monthlyMatch[2]) || 0)))}:${padNumber(Math.min(59, Math.max(0, Number(monthlyMatch[1]) || 0)))}`,
      scheduleMinute: "0",
      scheduleDayOfWeek: "0",
      scheduleDayOfMonth: String(Math.min(31, Math.max(1, Number(monthlyMatch[3]) || 1))),
      cronExpression: "",
    }
  }

  return {
    scheduleType: "custom" as ScheduleType,
    scheduleTime: defaultScheduleTime,
    scheduleMinute: "0",
    scheduleDayOfWeek: "0",
    scheduleDayOfMonth: "1",
    cronExpression: trimmed,
  }
}

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
    scheduleType: "daily" as ScheduleType,
    scheduleTime: defaultScheduleTime,
    scheduleMinute: "0",
    scheduleDayOfWeek: "0",
    scheduleDayOfMonth: "1",
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
      const cronExpression = buildCronExpression(formData)
      const payload = {
        name: formData.name,
        type: formData.type,
        description: formData.description,
        cronExpression,
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
    const inferredSchedule = inferScheduleFromCron(job.cronExpression)
    setEditingJob(job)
    setFormData({
      name: job.name,
      type: job.type,
      description: job.description,
      ...inferredSchedule,
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
      scheduleType: "daily",
      scheduleTime: defaultScheduleTime,
      scheduleMinute: "0",
      scheduleDayOfWeek: "0",
      scheduleDayOfMonth: "1",
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

  const generatedCronExpression = buildCronExpression(formData)
  const scheduleSummary = formatScheduleSummary(formData)

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
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">{formatScheduleSummary(inferScheduleFromCron(job.cronExpression))}</div>
                          <div className="font-mono text-xs text-muted-foreground">{job.cronExpression}</div>
                        </div>
                      </TableCell>
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

            <div className="space-y-4 rounded-lg border p-4">
              <div className="space-y-2">
                <Label htmlFor="scheduleType">Schedule Frequency *</Label>
                <Select
                  value={formData.scheduleType}
                  onValueChange={(value: ScheduleType) => setFormData(prev => ({
                    ...prev,
                    scheduleType: value,
                    cronExpression: value === "custom" ? prev.cronExpression : ""
                  }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.scheduleType === "hourly" && (
                <div className="space-y-2">
                  <Label htmlFor="scheduleMinute">Run at minute *</Label>
                  <Input
                    id="scheduleMinute"
                    type="number"
                    min={0}
                    max={59}
                    value={formData.scheduleMinute}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduleMinute: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              )}

              {formData.scheduleType === "daily" && (
                <div className="space-y-2">
                  <Label htmlFor="scheduleTime">Run time *</Label>
                  <Input
                    id="scheduleTime"
                    type="time"
                    value={formData.scheduleTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduleTime: e.target.value }))}
                  />
                </div>
              )}

              {formData.scheduleType === "weekly" && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="scheduleDayOfWeek">Day of week *</Label>
                    <Select
                      value={formData.scheduleDayOfWeek}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, scheduleDayOfWeek: value }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a day" />
                      </SelectTrigger>
                      <SelectContent>
                        {weekDays.map((day) => (
                          <SelectItem key={day.value} value={day.value}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weeklyTime">Run time *</Label>
                    <Input
                      id="weeklyTime"
                      type="time"
                      value={formData.scheduleTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, scheduleTime: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {formData.scheduleType === "monthly" && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="scheduleDayOfMonth">Day of month *</Label>
                    <Input
                      id="scheduleDayOfMonth"
                      type="number"
                      min={1}
                      max={31}
                      value={formData.scheduleDayOfMonth}
                      onChange={(e) => setFormData(prev => ({ ...prev, scheduleDayOfMonth: e.target.value }))}
                      placeholder="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthlyTime">Run time *</Label>
                    <Input
                      id="monthlyTime"
                      type="time"
                      value={formData.scheduleTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, scheduleTime: e.target.value }))}
                    />
                  </div>
                </div>
              )}

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
                  disabled={saving || !formData.name || !formData.type || !generatedCronExpression}
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
