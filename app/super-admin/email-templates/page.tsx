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
import { Plus, Edit, Trash2, Mail } from "lucide-react"
import { toast } from "sonner"
import { emailTemplatesApi } from "@/lib/api"

interface EmailTemplate {
  id: string
  _id?: string
  name: string
  subject: string
  body: string
  type: string
  status: string
  variables?: string[]
  createdAt?: string
  lastModified?: string
}

const templateTypes = [
  { value: "welcome", label: "Welcome" },
  { value: "password-reset", label: "Password Reset" },
  { value: "notification", label: "Notification" },
  { value: "reminder", label: "Reminder" },
  { value: "other", label: "Other" },
]

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    body: "",
    type: "welcome",
    status: "active",
    variables: "" as string,
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const data = await emailTemplatesApi.getAll(1, 100)
      const list = data?.templates ?? data?.data?.templates ?? (Array.isArray(data) ? data : [])
      setTemplates(Array.isArray(list) ? list : [])
    } catch (error: any) {
      console.error("Error fetching templates:", error)
      toast.error(error?.message || "Failed to fetch email templates")
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      subject: "",
      body: "",
      type: "welcome",
      status: "active",
      variables: "",
    })
    setEditingTemplate(null)
  }

  const handleSave = async () => {
    if (!formData.name?.trim() || !formData.subject?.trim()) {
      toast.error("Name and subject are required")
      return
    }
    try {
      setSaving(true)
      const payload = {
        name: formData.name.trim(),
        subject: formData.subject.trim(),
        body: formData.body.trim(),
        type: formData.type,
        status: formData.status,
        variables: formData.variables
          ? formData.variables.split(",").map((v) => v.trim()).filter(Boolean)
          : [],
      }
      if (editingTemplate) {
        const id = editingTemplate._id || editingTemplate.id
        await emailTemplatesApi.update(id, payload)
        toast.success("Template updated successfully")
      } else {
        await emailTemplatesApi.create(payload)
        toast.success("Template created successfully")
      }
      setIsDialogOpen(false)
      resetForm()
      fetchTemplates()
    } catch (error: any) {
      console.error("Error saving template:", error)
      toast.error(error?.message || "Failed to save template")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (template: EmailTemplate) => {
    if (!confirm("Delete this template?")) return
    try {
      const id = template._id || template.id
      await emailTemplatesApi.delete(id)
      toast.success("Template deleted")
      fetchTemplates()
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete template")
    }
  }

  const openEdit = (template: EmailTemplate) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      subject: template.subject,
      body: template.body || "",
      type: template.type || "welcome",
      status: template.status || "active",
      variables: Array.isArray(template.variables) ? template.variables.join(", ") : "",
    })
    setIsDialogOpen(true)
  }

  const openCreate = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Email Templates</h2>
          <p className="text-muted-foreground">
            Manage global email templates for notifications and system emails
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? "Edit Template" : "Create Email Template"}</DialogTitle>
              <DialogDescription>
                {editingTemplate ? "Update the email template." : "Add a new global email template."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Welcome Email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                  placeholder="Subject line (use {{variable}} for placeholders)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="body">Body</Label>
                <Textarea
                  id="body"
                  value={formData.body}
                  onChange={(e) => setFormData((prev) => ({ ...prev, body: e.target.value }))}
                  placeholder="Email body. Use {{firstName}}, {{schoolName}}, etc."
                  rows={6}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData((prev) => ({ ...prev, type: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {templateTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData((prev) => ({ ...prev, status: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="variables">Variables (comma-separated)</Label>
                <Input
                  id="variables"
                  value={formData.variables}
                  onChange={(e) => setFormData((prev) => ({ ...prev, variables: e.target.value }))}
                  placeholder="firstName, lastName, schoolName"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Templates ({templates.length})
          </CardTitle>
          <CardDescription>List of global email templates</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground py-8 text-center">Loading...</p>
          ) : templates.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No templates yet. Create one above.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((t) => (
                  <TableRow key={t.id || t._id || t.name}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{t.subject}</TableCell>
                    <TableCell><Badge variant="outline">{t.type}</Badge></TableCell>
                    <TableCell><Badge className={t.status === "active" ? "bg-green-100 text-green-800" : ""}>{t.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(t)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(t)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
