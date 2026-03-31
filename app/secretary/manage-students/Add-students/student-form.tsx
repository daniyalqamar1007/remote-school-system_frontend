"use client"

import React, { useState } from "react"
import type { ChangeEvent } from "react"
import { Camera, Upload, User, X, FileText, Eye, EyeOff, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { CountrySelect } from "@/components/ui/country-select"
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'

interface StudentFormProps {
  formData: {
    studentId: string
    firstName: string
    lastName: string
    class: string
    section: string
    gender: string
    dob: string
    email: string
    password?: string;
    address: string
    enrollDate: string
    expectedGraduation: string
    transcripts: File[]
    iipFlag: boolean // Changed to boolean
    honorRolls: boolean
    athletics: boolean
    clubs: string[]
    lunch: string
    nationality: string
    emergencyContact: { firstName: string; lastName: string; relationship: string; phone: string }
    bloodGroup: string
    medicalConditions: string[]
    allergies: string[]
    previousSchool: string
    previousGrade: string
    transportMode: string
    busRoute: string
    religion: string
    [key: string]: any
  }
  errors: {
    studentId: string
    firstName: string
    lastName: string
    class: string
    section: string
    gender: string
    dob: string
    email: string
    password?: string;
    address: string
    expectedGraduation: string
    iipFlag: string
    clubs: string
    lunch: string
    nationality: string
    emergencyContact: string
    bloodGroup: string
    medicalConditions: string
    allergies: string
    previousSchool: string
    previousGrade: string
    transportMode: string
    busRoute: string
    religion: string
    enrollDate: string
    [key: string]: any
  }
  photoPreview: string | null
  transcriptPreviews?: { name: string; size: number }[]
  existingTranscripts?: string[]
  onDeleteExistingTranscript?: (url: string) => void
  clubOptions?: string[]
  onInputChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onSelectChange: (name: string, value: string | boolean) => void
  onPhoneChange?: (value: string) => void
  onPhotoChange: (e: ChangeEvent<HTMLInputElement>) => void
  onTranscriptChange?: (e: ChangeEvent<HTMLInputElement>) => void
  onRemoveTranscript?: (index: number) => void
  onContinue: () => void
  onCancel: () => void
  onGenerateStudentId?: () => void
  disabled?: boolean
  isEditing?: boolean
}

export function StudentForm({
  formData,
  errors,
  photoPreview,
  transcriptPreviews = [],
  existingTranscripts = [],
  onDeleteExistingTranscript,
  clubOptions = [],
  onInputChange,
  onSelectChange,
  onPhoneChange,
  onPhotoChange,
  onTranscriptChange,
  onRemoveTranscript,
  onContinue,
  onCancel,
  onGenerateStudentId,
  disabled = false,
  isEditing = false,
}: StudentFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [tagInputs, setTagInputs] = useState<{ medicalConditions: string; allergies: string }>({ medicalConditions: '', allergies: '' })

  const addTag = (field: 'medicalConditions' | 'allergies') => {
    const value = tagInputs[field].trim()
    if (!value) return
    const next = Array.from(new Set([...(formData[field] as string[]), value]))
      ; (onSelectChange as any)(field, next)
    setTagInputs(prev => ({ ...prev, [field]: '' }))
  }

  const removeTag = (field: 'medicalConditions' | 'allergies', index: number) => {
    const next = [...(formData[field] as string[])]
    next.splice(index, 1)
      ; (onSelectChange as any)(field, next)
  }

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="grid gap-6 lg:gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-1 border-gray-200 shadow-sm rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Student Photo & Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="flex h-32 w-32 sm:h-40 sm:w-40 items-center justify-center rounded-full bg-gray-100 ring-1 ring-gray-200 overflow-hidden">
                  {photoPreview ? (
                    <img
                      src={photoPreview || "/placeholder.svg"}
                      alt="Student preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-16 w-16 sm:h-20 sm:w-20 text-gray-400" />
                  )}
                </div>
                <label
                  htmlFor="student-photo-upload"
                  className={`absolute bottom-0 right-0 rounded-full bg-black p-2 text-white shadow-lg transition-opacity ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-90"}`}
                >
                  <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                  <input
                    id="student-photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onPhotoChange}
                    disabled={disabled}
                  />
                </label>
              </div>
              <label htmlFor="student-photo-upload-btn" className="mt-4">
                <Button variant="outline" className="border-gray-300" asChild disabled={disabled}>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Photo
                    <input
                      id="student-photo-upload-btn"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onPhotoChange}
                      disabled={disabled}
                    />
                  </span>
                </Button>
              </label>
            </div>

            {/* Transcripts Section */}
            <div className="mt-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-900">Transcripts</h3>
                <label htmlFor="transcript-upload" className="inline-flex">
                  <Button variant="outline" className="border-gray-300" size="sm" asChild disabled={disabled}>
                    <span>
                      <FileText className="mr-1 h-3 w-3" />
                      Add Files
                      <input
                        id="transcript-upload"
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx"
                        className="hidden"
                        onChange={onTranscriptChange}
                        disabled={disabled}
                      />
                    </span>
                  </Button>
                </label>
              </div>

              {isEditing && existingTranscripts && existingTranscripts.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-xs font-medium text-gray-700 mb-1">Already Existing Transcripts</h4>
                  <div className="space-y-2 max-h-[180px] overflow-y-auto border border-gray-200 rounded-md p-2 bg-white">
                    {existingTranscripts.map((url, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-gray-50 rounded p-2 text-xs">
                        <a href={url} target="_blank" rel="noreferrer" className="text-blue-600 truncate hover:underline mr-2">{url.split('/').pop()}</a>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => onDeleteExistingTranscript && onDeleteExistingTranscript(url)}
                          disabled={disabled}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {transcriptPreviews.length > 0 ? (
                <div className="max-h-[300px] h-auto w-full overflow-x-auto rounded-lg border border-gray-200 p-2">
                  <div className="space-y-2">
                    {transcriptPreviews.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center w-full overflow-x-auto bg-gray-50 justify-between rounded-md p-2 text-sm"
                      >
                        <div className="flex items-center space-x-2 w-full truncate">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="truncate">{file.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => onRemoveTranscript && onRemoveTranscript(index)}
                          disabled={disabled}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex h-[120px] w-full items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white">
                  <div className="flex flex-col items-center space-y-2 text-center">
                    <FileText className="h-8 w-8 text-gray-400" />
                    <div className="text-xs text-gray-500">No transcripts uploaded</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Student Details */}
        <Card className="lg:col-span-2 border-gray-200 shadow-sm rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Student Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="Enter first name"
                  className={`border-gray-200 ${errors.firstName ? "border-red-500" : ""}`}
                  value={formData.firstName}
                  onChange={onInputChange}
                  disabled={disabled}
                />
                {errors.firstName && <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Enter last name"
                  className={`border-gray-200 ${errors.lastName ? "border-red-500" : ""}`}
                  value={formData.lastName}
                  onChange={onInputChange}
                  disabled={disabled}
                />
                {errors.lastName && <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Gender *</Label>
              <RadioGroup
                value={formData.gender}
                className="flex space-x-4"
                onValueChange={(value) => onSelectChange("gender", value)}
                disabled={disabled}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Male" id="male" />
                  <Label htmlFor="male">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Female" id="female" />
                  <Label htmlFor="female">Female</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth *</Label>
                <Input
                  id="dob"
                  name="dob"
                  type="date"
                  className={`border-gray-200 ${errors.dob ? "border-red-500" : ""}`}
                  value={formData.dob}
                  onChange={onInputChange}
                  disabled={disabled}
                />
                {errors.dob && <p className="text-sm text-red-500 mt-1">{errors.dob}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="studentId">Student ID *</Label>
                <div className="flex gap-2">
                  <Input
                    id="studentId"
                    name="studentId"
                    placeholder="Enter Student ID"
                    className={`flex-1 border-gray-200 ${errors.studentId ? "border-red-500" : ""} ${isEditing ? "bg-gray-100 cursor-not-allowed" : ""}`}
                    value={formData.studentId}
                    onChange={onInputChange}
                    disabled={disabled || isEditing}
                  />
                  {!isEditing && typeof onGenerateStudentId === "function" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onGenerateStudentId}
                      disabled={disabled}
                      className="shrink-0"
                      title="Generate Student ID"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Generate ID
                    </Button>
                  )}
                </div>
                {errors.studentId && <p className="text-sm text-red-500 mt-1">{errors.studentId}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="class">Grade Level *</Label>
                <Select
                  value={formData.class}
                  onValueChange={(value) => onSelectChange("class", value)}
                  disabled={disabled}
                >
                  <SelectTrigger id="class" className={errors.class ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kindergarten">Kindergarten</SelectItem>
                    <SelectItem value="Grade 1">Grade 1</SelectItem>
                    <SelectItem value="Grade 2">Grade 2</SelectItem>
                    <SelectItem value="Grade 3">Grade 3</SelectItem>
                    <SelectItem value="Grade 4">Grade 4</SelectItem>
                    <SelectItem value="Grade 5">Grade 5</SelectItem>
                    <SelectItem value="Grade 6">Grade 6</SelectItem>
                    <SelectItem value="Grade 7">Grade 7</SelectItem>
                    <SelectItem value="Grade 8">Grade 8</SelectItem>
                    <SelectItem value="Grade 9">Grade 9</SelectItem>
                    <SelectItem value="Grade 10">Grade 10</SelectItem>
                    <SelectItem value="Grade 11">Grade 11</SelectItem>
                    <SelectItem value="Grade 12">Grade 12</SelectItem>
                  </SelectContent>
                </Select>
                {errors.class && <p className="text-sm text-red-500 mt-1">{errors.class}</p>}
              </div>
              <br />
            </div>

            <div className="grid gap-6 md:grid-cols-1">
              <div className="space-y-2">
                <Label>Emergency Contact *</Label>
                <div className="grid gap-3 md:grid-cols-2 w-full">
                  <Input
                    name="emergencyContact.firstName"
                    placeholder="First name"
                    className={`border-gray-200 w-full`}
                    value={formData.emergencyContact.firstName}
                    onChange={onInputChange}
                    disabled={disabled}
                  />
                  <Input
                    name="emergencyContact.lastName"
                    placeholder="Last name"
                    className={`border-gray-200 w-full`}
                    value={formData.emergencyContact.lastName}
                    onChange={onInputChange}
                    disabled={disabled}
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    name="emergencyContact.relationship"
                    placeholder="Relationship (e.g., Father)"
                    className={`border-gray-200 w-full`}
                    value={formData.emergencyContact.relationship}
                    onChange={onInputChange}
                    disabled={disabled}
                  />
                  {onPhoneChange ? (
                    <PhoneInput
                      country={'us'}
                      value={formData.emergencyContact.phone || ''}
                      onChange={(value) => onPhoneChange(value)}
                      disabled={disabled}
                      containerClass="w-full border border-gray-200 rounded-md relative"
                      inputClass="!w-full !h-10 !border-0 !shadow-none !pl-12"
                      buttonClass="!border-0 !bg-white !h-10 !rounded-none !border-r !border-gray-200"
                      placeholder="Emergency phone"
                    />
                  ) : (
                    <Input
                      name="emergencyContact.phone"
                      placeholder="Emergency phone"
                      className={`border-gray-200 w-full`}
                      value={formData.emergencyContact.phone}
                      onChange={onInputChange}
                      disabled={disabled}
                    />
                  )}
                </div>
                {errors.emergencyContact && <p className="text-sm text-red-500 mt-1">{errors.emergencyContact}</p>}
              </div>

            </div>


            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="section">Section *</Label>
                <Select
                  value={formData.section}
                  onValueChange={(value) => onSelectChange("section", value)}
                  disabled={disabled}
                >
                  <SelectTrigger id="section" className={errors.section ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map((section) => (
                      <SelectItem key={section} value={section}>
                        Section {section}
                      </SelectItem>
                    ))}
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
                {errors.section && <p className="text-sm text-red-500 mt-1">{errors.section}</p>}
              </div>
              {/* <div className="space-y-2">
                <Label htmlFor="enrollDate">Enrollment Date</Label>
                <Input
                  id="enrollDate"
                  name="enrollDate"
                  type="date"
                  className="border-gray-200"
                  value={formData.enrollDate}
                  onChange={onInputChange}
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedGraduation">Expected Graduation Year</Label>
                <Select
                  value={formData.expectedGraduation}
                  onValueChange={(value) => onSelectChange("expectedGraduation", value)}
                  disabled={disabled}
                >
                  <SelectTrigger id="expectedGraduation" className={errors.expectedGraduation ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 16 }, (_, i) => new Date().getFullYear() + i).map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.expectedGraduation && <p className="text-sm text-red-500 mt-1">{errors.expectedGraduation}</p>}
              </div> */}

              <div className="space-y-2">
                <Label htmlFor="enrollDate">Enrollment Date *</Label>
                <Input
                  id="enrollDate"
                  name="enrollDate"
                  type="date"
                  className={`border-gray-200 ${isEditing ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  value={formData.enrollDate}
                  onChange={onInputChange}
                  disabled={disabled || isEditing} // Add isEditing to disabled condition
                />
                {errors.enrollDate && <p className="text-sm text-red-500 mt-1">{errors.enrollDate}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedGraduation">Expected Graduation Year *</Label>
                <Select
                  value={formData.expectedGraduation}
                  onValueChange={(value) => onSelectChange("expectedGraduation", value)}
                  disabled={disabled}
                >
                  <SelectTrigger id="expectedGraduation" className={errors.expectedGraduation ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 20 }, (_, i) => new Date().getFullYear() + i).map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.expectedGraduation && <p className="text-sm text-red-500 mt-1">{errors.expectedGraduation}</p>}
              </div>

            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Student Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter unique email for student (e.g., john.doe@example.com)"
                  className={`border-gray-200 ${errors.email ? "border-red-500" : ""} ${isEditing ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  value={formData.email}
                  onChange={onInputChange}
                  disabled={disabled || isEditing}
                />
                <p className="text-xs text-gray-500">
                  This email must be unique and different from parent/guardian emails. The student will use this to log in.
                </p>
                {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password {isEditing ? "(leave blank to keep current password)" : "*"}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={isEditing ? "Enter new password (optional)" : "Set student password *"}
                    className={`border-gray-200 pr-10 ${errors.password ? "border-red-500" : ""}`}
                    value={formData.password || ""}
                    onChange={onInputChange}
                    disabled={disabled}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={disabled}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="sr-only">
                      {showPassword ? "Hide password" : "Show password"}
                    </span>
                  </Button>
                </div>
                {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                name="address"
                placeholder="Enter address"
                className={`border-gray-200 min-h-[80px] ${errors.address ? "border-red-500" : ""}`}
                value={formData.address}
                onChange={onInputChange}
                disabled={disabled}
              />
              {errors.address && <p className="text-sm text-red-500 mt-1">{errors.address}</p>}
            </div>

            {/* <Separator /> */}

            {/* Medical Information */}
            <h3 className="text-base font-semibold text-gray-900">Medical Information</h3>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="bloodGroup">Blood Group</Label>
                <Select
                  value={formData.bloodGroup}
                  onValueChange={(value) => onSelectChange("bloodGroup", value)}
                  disabled={disabled}
                >
                  <SelectTrigger id="bloodGroup">
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Medical Conditions</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Type and press Enter"
                    value={tagInputs.medicalConditions}
                    onChange={(e) => setTagInputs(prev => ({ ...prev, medicalConditions: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag('medicalConditions') } }}
                    disabled={disabled}
                  />
                  <Button type="button" variant="outline" className="border-gray-300" onClick={() => addTag('medicalConditions')} disabled={disabled}>Add</Button>
                </div>
                {Array.isArray(formData.medicalConditions) && formData.medicalConditions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.medicalConditions.map((tag, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs border border-gray-200">
                        {tag}
                        <button type="button" onClick={() => removeTag('medicalConditions', idx)} className="text-gray-500 hover:text-gray-700">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Allergies</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Type and press Enter"
                    value={tagInputs.allergies}
                    onChange={(e) => setTagInputs(prev => ({ ...prev, allergies: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag('allergies') } }}
                    disabled={disabled}
                  />
                  <Button type="button" variant="outline" className="border-gray-300" onClick={() => addTag('allergies')} disabled={disabled}>Add</Button>
                </div>
                {Array.isArray(formData.allergies) && formData.allergies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.allergies.map((tag, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs border border-gray-200">
                        {tag}
                        <button type="button" onClick={() => removeTag('allergies', idx)} className="text-gray-500 hover:text-gray-700">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* <Separator /> */}

            {/* Previous Education */}
            <h3 className="text-base font-semibold text-gray-900">Previous Education</h3>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="previousSchool">Previous School</Label>
                <Input
                  id="previousSchool"
                  name="previousSchool"
                  placeholder="Name of previous school"
                  className="border-gray-200"
                  value={formData.previousSchool}
                  onChange={onInputChange}
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="previousGrade">Previous Grade</Label>
                <Select
                  value={formData.previousGrade}
                  onValueChange={(value) => onSelectChange("previousGrade", value)}
                  disabled={disabled}
                >
                  <SelectTrigger id="previousGrade">
                    <SelectValue placeholder="Select previous grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Grade 1">Grade 1</SelectItem>
                    <SelectItem value="Grade 2">Grade 2</SelectItem>
                    <SelectItem value="Grade 3">Grade 3</SelectItem>
                    <SelectItem value="Grade 4">Grade 4</SelectItem>
                    <SelectItem value="Grade 5">Grade 5</SelectItem>
                    <SelectItem value="Grade 6">Grade 6</SelectItem>
                    <SelectItem value="Grade 7">Grade 7</SelectItem>
                    <SelectItem value="Grade 8">Grade 8</SelectItem>
                    <SelectItem value="Grade 9">Grade 9</SelectItem>
                    <SelectItem value="Grade 10">Grade 10</SelectItem>
                    <SelectItem value="Grade 11">Grade 11</SelectItem>
                    <SelectItem value="Grade 12">Grade 12</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* <Separator /> */}

            {/* Transportation & Other */}
            <h3 className="text-base font-semibold text-gray-900">Transportation & Additional Information</h3>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="transportMode">Transportation Mode</Label>
                <Select
                  value={formData.transportMode}
                  onValueChange={(value) => onSelectChange("transportMode", value)}
                  disabled={disabled}
                >
                  <SelectTrigger id="transportMode">
                    <SelectValue placeholder="Select transport mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="School Bus">School Bus</SelectItem>
                    <SelectItem value="Parent Drop-off">Parent Drop-off</SelectItem>
                    <SelectItem value="Walking">Walking</SelectItem>
                    <SelectItem value="Public Transport">Public Transport</SelectItem>
                    <SelectItem value="Carpool">Carpool</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="busRoute">Bus Route</Label>
                <Input
                  id="busRoute"
                  name="busRoute"
                  placeholder="Bus route number/name"
                  className="border-gray-200"
                  value={formData.busRoute}
                  onChange={onInputChange}
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="religion">Religion</Label>
                <Input
                  id="religion"
                  name="religion"
                  placeholder="Student's religion (optional)"
                  className="border-gray-200"
                  value={formData.religion}
                  onChange={onInputChange}
                  disabled={disabled}
                />
              </div>
            </div>

            {/* Add these new fields after the address field and before the Separator */}

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="iipFlag" className="cursor-pointer">
                    IIP Flag
                  </Label>
                  <Switch
                    id="iipFlag"
                    checked={formData.iipFlag}
                    onCheckedChange={(checked) => onSelectChange("iipFlag", checked)}
                    disabled={disabled}
                  />
                </div>
                {errors.iipFlag && <p className="text-sm text-red-500 mt-1">{errors.iipFlag}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationality">Nationality *</Label>
                <CountrySelect
                  id="nationality"
                  value={formData.nationality}
                  onValueChange={(value) => onSelectChange("nationality", value)}
                  disabled={disabled}
                  placeholder="Select country"
                  error={!!errors.nationality}
                />
                {errors.nationality && <p className="text-sm text-red-500 mt-1">{errors.nationality}</p>}
              </div>
            </div>

            {/* <Separator /> */}

            {/* Guardian Information */}
            {/* <h3 className="text-lg font-medium">Guardian Information</h3> */}

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="clubs">Clubs</Label>
                <Select
                  value={(Array.isArray(formData.clubs) && formData.clubs[0]) || ''}
                  onValueChange={(value) => onSelectChange('clubs', value)}
                  disabled={disabled || clubOptions.length === 0}
                >
                  <SelectTrigger id="clubs">
                    <SelectValue placeholder={clubOptions.length === 0 ? "No club found" : "Select a club"} />
                  </SelectTrigger>
                  <SelectContent>
                    {clubOptions.map((name) => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lunch">Lunch Preference</Label>
                <Select
                  value={formData.lunch}
                  onValueChange={(value) => onSelectChange("lunch", value)}
                  disabled={disabled}
                >
                  <SelectTrigger id="lunch" className={errors.lunch ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select lunch preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vegetarian">Vegetarian</SelectItem>
                    <SelectItem value="non-vegetarian">Non-Vegetarian</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
                {errors.lunch && <p className="text-sm text-red-500 mt-1">{errors.lunch}</p>}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="honorRolls" className="cursor-pointer">
                    Honor Rolls
                  </Label>
                  <Switch
                    id="honorRolls"
                    checked={formData.honorRolls}
                    onCheckedChange={(checked) => onSelectChange("honorRolls", checked)}
                    disabled={disabled}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="athletics" className="cursor-pointer">
                    Athletics
                  </Label>
                  <Switch
                    id="athletics"
                    checked={formData.athletics}
                    onCheckedChange={(checked) => onSelectChange("athletics", checked)}
                    disabled={disabled}
                  />
                </div>
              </div>
            </div>

            {/* <Separator /> */}

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <Button variant="outline" className="border-gray-300" onClick={onCancel} disabled={disabled}>
                Cancel
              </Button>
              <Button className="bg-black text-white hover:bg-gray-800" onClick={onContinue} disabled={disabled}>
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

