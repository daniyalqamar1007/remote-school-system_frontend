"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, CalendarIcon, FileText, Heart, Plus, Upload, X } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { useToast } from "@/hooks/use-toast"
import {
  getHealthConditions,
  addHealthCondition,
  getMedicalDocuments,
  createMedicalDocument,
  getMedicalDocumentsByType
} from "@/lib/health"

interface HealthManagementDialogProps {
  studentId: string
  studentName: string
  trigger?: React.ReactNode
}

export default function HealthManagementDialog({ 
  studentId, 
  studentName, 
  trigger 
}: HealthManagementDialogProps) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("conditions")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Health Conditions State
  const [healthConditions, setHealthConditions] = useState<{
    allergies: string[]
    medicalConditions: string[]
    healthPlans: any[]
  }>({
    allergies: [],
    medicalConditions: [],
    healthPlans: []
  })
  const [newCondition, setNewCondition] = useState("")

  // Medical Documents State
  const [medicalDocuments, setMedicalDocuments] = useState<any[]>([])
  const [uploadForm, setUploadForm] = useState({
    documentType: "",
    title: "",
    description: "",
    effectiveDate: undefined as Date | undefined,
    expirationDate: undefined as Date | undefined,
    vaccineName: "",
    file: null as File | null
  })

  // Load data when dialog opens
  useEffect(() => {
    if (open) {
      loadHealthData()
    }
  }, [open, studentId])

  const loadHealthData = async () => {
    setLoading(true)
    try {
      // Load health conditions
      const conditionsRes = await getHealthConditions(studentId)
      setHealthConditions(conditionsRes || { allergies: [], medicalConditions: [], healthPlans: [] })

      // Load medical documents
      const documentsRes = await getMedicalDocuments(studentId)
      setMedicalDocuments(documentsRes || [])
    } catch (error) {
      console.error("Failed to load health data:", error)
      toast({
        title: "Error",
        description: "Failed to load health information",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddCondition = async () => {
    if (!newCondition.trim()) return
    
    try {
      await addHealthCondition(studentId, newCondition)
      setNewCondition("")
      loadHealthData() // Refresh data
      toast({
        title: "Success",
        description: "Health condition added successfully"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add health condition",
        variant: "destructive"
      })
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadForm(prev => ({ ...prev, file }))
    }
  }

  const handleDocumentSubmit = async () => {
    if (!uploadForm.documentType || !uploadForm.title || !uploadForm.file) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', uploadForm.file)
      formData.append('studentId', studentId)
      formData.append('documentType', uploadForm.documentType)
      formData.append('title', uploadForm.title)
      formData.append('description', uploadForm.description)
      
      if (uploadForm.effectiveDate) {
        formData.append('effectiveDate', uploadForm.effectiveDate.toISOString())
      }
      if (uploadForm.expirationDate) {
        formData.append('expirationDate', uploadForm.expirationDate.toISOString())
      }
      if (uploadForm.vaccineName) {
        formData.append('vaccineName', uploadForm.vaccineName)
      }

      await createMedicalDocument(formData)
      
      // Reset form
      setUploadForm({
        documentType: "",
        title: "",
        description: "",
        effectiveDate: undefined,
        expirationDate: undefined,
        vaccineName: "",
        file: null
      })
      
      loadHealthData() // Refresh data
      toast({
        title: "Success",
        description: "Medical document uploaded successfully"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload medical document",
        variant: "destructive"
      })
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500'
      case 'pending': return 'bg-yellow-500'
      case 'rejected': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Heart className="w-4 h-4 mr-2" />
            Manage Health Info
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Health Management - {studentName}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="conditions">Health Conditions</TabsTrigger>
            <TabsTrigger value="documents">Medical Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="conditions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Current Health Conditions</CardTitle>
                <CardDescription>
                  View and manage your child's health conditions and allergies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Allergies */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Allergies</h4>
                  <div className="flex flex-wrap gap-2">
                    {healthConditions.allergies?.length > 0 ? (
                      healthConditions.allergies.map((allergy, index) => (
                        <Badge key={index} variant="destructive">
                          {allergy}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No allergies recorded</p>
                    )}
                  </div>
                </div>

                {/* Medical Conditions */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Medical Conditions</h4>
                  <div className="flex flex-wrap gap-2">
                    {healthConditions.medicalConditions?.length > 0 ? (
                      healthConditions.medicalConditions.map((condition, index) => (
                        <Badge key={index} variant="secondary">
                          {condition}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No medical conditions recorded</p>
                    )}
                  </div>
                </div>

                {/* Health Plans */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Health Plans (IEP/504)</h4>
                  <div className="flex flex-wrap gap-2">
                    {healthConditions.healthPlans?.length > 0 ? (
                      healthConditions.healthPlans.map((plan, index) => (
                        <Badge key={index} variant="outline">
                          {plan.title || `Plan ${index + 1}`}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No health plans recorded</p>
                    )}
                  </div>
                </div>

                {/* Add New Condition */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-sm mb-2">Add New Condition</h4>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter new health condition..."
                      value={newCondition}
                      onChange={(e) => setNewCondition(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddCondition()}
                    />
                    <Button onClick={handleAddCondition} size="sm">
                      <Plus className="w-4 h-4" />
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            {/* Upload New Document */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Medical Document</CardTitle>
                <CardDescription>
                  Upload IEP/504 plans, immunization records, or medical excuse notes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="documentType">Document Type *</Label>
                    <Select 
                      value={uploadForm.documentType} 
                      onValueChange={(value) => setUploadForm(prev => ({ ...prev, documentType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="iep_504">IEP/504 Plan</SelectItem>
                        <SelectItem value="immunization">Immunization Record</SelectItem>
                        <SelectItem value="medical_excuse">Medical Excuse Note</SelectItem>
                        <SelectItem value="general">General Medical Document</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="title">Document Title *</Label>
                    <Input
                      id="title"
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter document title"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter document description..."
                    rows={3}
                  />
                </div>

                {/* Conditional fields based on document type */}
                {uploadForm.documentType === 'iep_504' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Effective Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !uploadForm.effectiveDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {uploadForm.effectiveDate ? format(uploadForm.effectiveDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={uploadForm.effectiveDate}
                            onSelect={(date) => setUploadForm(prev => ({ ...prev, effectiveDate: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label>Expiration Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !uploadForm.expirationDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {uploadForm.expirationDate ? format(uploadForm.expirationDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={uploadForm.expirationDate}
                            onSelect={(date) => setUploadForm(prev => ({ ...prev, expirationDate: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}

                {uploadForm.documentType === 'immunization' && (
                  <div>
                    <Label htmlFor="vaccineName">Vaccine Name</Label>
                    <Input
                      id="vaccineName"
                      value={uploadForm.vaccineName}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, vaccineName: e.target.value }))}
                      placeholder="Enter vaccine name"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="file">Upload File *</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      id="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                    <label htmlFor="file" className="cursor-pointer">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        {uploadForm.file ? uploadForm.file.name : "Click to upload or drag and drop"}
                      </p>
                      <p className="text-xs text-gray-500">
                        PDF, DOC, DOCX, JPG, PNG up to 10MB
                      </p>
                    </label>
                  </div>
                </div>

                <Button onClick={handleDocumentSubmit} className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </Button>
              </CardContent>
            </Card>

            {/* Existing Documents */}
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Documents</CardTitle>
                <CardDescription>
                  View previously uploaded medical documents and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {medicalDocuments.length > 0 ? (
                  <div className="space-y-3">
                    {medicalDocuments.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-gray-500" />
                          <div>
                            <p className="font-medium">{doc.title}</p>
                            <p className="text-sm text-gray-500">
                              {doc.documentType.replace('_', '/').toUpperCase()} • 
                              {doc.createdAt && format(new Date(doc.createdAt), "MMM dd, yyyy")}
                            </p>
                          </div>
                        </div>
                        <Badge className={getStatusBadgeColor(doc.approvalStatus)}>
                          {doc.approvalStatus}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    No medical documents uploaded yet
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
