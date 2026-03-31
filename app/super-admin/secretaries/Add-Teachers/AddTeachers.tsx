"use client"

import type React from "react"

import { useState, useEffect } from "react"
import axios from "axios"
import { CheckIcon, Loader2, Eye, EyeOff, Camera, User, X } from "lucide-react"
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CountrySelect } from "@/components/ui/country-select"
import { toast } from 'sonner'
import { activities } from "@/lib/activities"
import { addActivity } from "@/lib/actitivityFunctions"
import { uploadImageToAWS } from "@/lib/awsUpload"

interface Department {
  _id: string
  departmentName: string
  code?: string
}

interface School {
  _id: string
  name: string
  schoolCode?: string
}

interface Teacher {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  gender: string
  address: string
  qualification?: string
  subjects?: string[]
  employeeId?: string
  dateOfJoining?: string
  nationality?: string
  designation?: string
  departmentIds?: Array<string | { _id: string }>
  qualifications?: string[]
  certifications?: string[]
  totalExperience?: number
  schoolId?: { _id: string; name: string }
  profilePicture?: string
}

interface AddTeacherModalProps {
  isOpen: boolean
  onClose: () => void
  teacherData?: Teacher | null
  onSuccess: () => void
}

export default function AddTeacherModal({ isOpen, onClose, teacherData, onSuccess }: AddTeacherModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isDepartmentsLoading, setIsDepartmentsLoading] = useState(false)
  const [isSchoolsLoading, setIsSchoolsLoading] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [schools, setSchools] = useState<School[]>([])

  const [formData, setFormData] = useState({
    email: "",
    employeeId: "",
    firstName: "",
    lastName: "",
    dateOfJoining: "",
    nationality: "",
    designation: "",
    address: "",
    gender: "MALE",
    phone: "",
    password: "",
    departmentIds: [] as string[],
    qualifications: [] as string[],
    certifications: [] as string[],
    totalExperience: "",
    schoolId: "",
  })

  const [qualificationInput, setQualificationInput] = useState("")
  const [certificationInput, setCertificationInput] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ [k: string]: string }>({})
  const [isValidPhone, setIsValidPhone] = useState(true)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // Fetch departments by school
  const fetchDepartments = async (schoolId?: string) => {
    try {
      setIsDepartmentsLoading(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      const response = await axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/departments/names`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        params: schoolId ? { schoolId } : undefined,
      })
      const names = response.data?.data?.departments || []
      setDepartments(Array.isArray(names) ? names : [])
    } catch (error) {
      console.error("Error fetching departments:", error)
    } finally {
      setIsDepartmentsLoading(false)
    }
  }

  // Fetch schools
  const fetchSchools = async () => {
    try {
      setIsSchoolsLoading(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      const response = await axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/schools`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const list = response.data?.data?.schools || response.data?.data || []
      setSchools(Array.isArray(list) ? list : [])
    } catch (error) {
      console.error("Error fetching schools:", error)
    } finally {
      setIsSchoolsLoading(false)
    }
  }

  useEffect(() => {
    if (!isOpen) return
    fetchSchools()
    if (teacherData) {
      const mappedDeptIds = Array.isArray(teacherData.departmentIds)
        ? teacherData.departmentIds.map((d: any) => (typeof d === 'string' ? d : d?._id)).filter(Boolean)
        : []
      const schoolId = teacherData.schoolId?._id || teacherData.schoolId || ""
      setFormData({
        email: teacherData.email || "",
        employeeId: teacherData.employeeId || "",
        firstName: teacherData.firstName || "",
        lastName: teacherData.lastName || "",
        dateOfJoining: teacherData.dateOfJoining ? new Date(teacherData.dateOfJoining).toISOString().slice(0,10) : "",
        nationality: teacherData.nationality || "",
        designation: teacherData.designation || "",
        address: teacherData.address || "",
        gender: teacherData.gender || "MALE",
        phone: teacherData.phone || "",
        password: "",
        departmentIds: mappedDeptIds,
        qualifications: teacherData.qualifications || [],
        certifications: teacherData.certifications || [],
        totalExperience: (teacherData.totalExperience as any)?.toString?.() || "",
        schoolId: typeof schoolId === 'string' ? schoolId : (schoolId?._id || ""),
      })
      // Fetch departments for the teacher's school
      if (typeof schoolId === 'string' && schoolId) {
        fetchDepartments(schoolId)
      }
    } else {
      setFormData({
        email: "",
        employeeId: "",
        firstName: "",
        lastName: "",
        dateOfJoining: "",
        nationality: "",
        designation: "",
        address: "",
        gender: "MALE",
        phone: "",
        password: "",
        departmentIds: [],
        qualifications: [],
        certifications: [],
        totalExperience: "",
        schoolId: "",
      })
      setDepartments([])
    }
    setQualificationInput("")
    setCertificationInput("")
    setIsValidPhone(true)
    setErrors({})
    setPhotoPreview(teacherData?.profilePicture || null)
    setPhotoFile(null)
  }, [isOpen, teacherData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
    if (errors[id]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    }
  }

  const handleSelectChange = (value: string, field: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const toggleDepartment = (deptId: string) => {
    setFormData((prev) => {
      const exists = prev.departmentIds.includes(deptId)
      const next = exists
        ? prev.departmentIds.filter((id) => id !== deptId)
        : [...prev.departmentIds, deptId]
      return { ...prev, departmentIds: next }
    })
    if (errors.departmentIds) {
      setErrors((prev) => {
        const next = { ...prev }
        if ((formData.departmentIds?.length || 0) + 1 > 0) delete next.departmentIds
        return next
      })
    }
  }

  const addQualification = () => {
    if (qualificationInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        qualifications: [...prev.qualifications, qualificationInput.trim()],
      }))
      setQualificationInput("")
      if (errors.qualifications) {
        setErrors((prev) => {
          const next = { ...prev }
          delete next.qualifications
          return next
        })
      }
    }
  }

  const removeQualification = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      qualifications: prev.qualifications.filter((_, i) => i !== index),
    }))
  }

  const addCertification = () => {
    if (certificationInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        certifications: [...prev.certifications, certificationInput.trim()],
      }))
      setCertificationInput("")
    }
  }

  const removeCertification = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index),
    }))
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    setPhotoFile(file)
    
    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    const newErrors: any = {}
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    if (!teacherData && !formData.password) newErrors.password = 'Password is required'
    if (formData.password && formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    // Employee ID is optional - will be auto-generated if not provided
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required'
    else if (!isValidPhone) newErrors.phone = 'Please enter a valid phone number'
    if (!formData.address.trim()) newErrors.address = 'Address is required'
    if (!formData.dateOfJoining) newErrors.dateOfJoining = 'Date of Joining is required'
    if (!formData.designation.trim()) newErrors.designation = 'Designation is required'
    if (!formData.nationality) newErrors.nationality = 'Nationality is required'
    if (!formData.gender) newErrors.gender = 'Gender is required'
    if (!formData.schoolId) newErrors.schoolId = 'School is required'
    if (!formData.departmentIds || formData.departmentIds.length === 0) newErrors.departmentIds = 'Select at least one department'
    if (!formData.qualifications || formData.qualifications.length === 0) newErrors.qualifications = 'Add at least one qualification'
    setErrors(newErrors)
    if (Object.keys(newErrors).length) {
      toast.error('Please fix the errors below')
      return
    }

    try {
      setIsLoading(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')

      // Upload photo if a new one was selected
      let profilePictureUrl = photoPreview || null
      if (photoFile) {
        setUploadingPhoto(true)
        try {
          const uploadResult = await uploadImageToAWS(photoFile)
          profilePictureUrl = uploadResult.awsUrl
          toast.success('Photo uploaded successfully')
        } catch (error: any) {
          toast.error(error.message || 'Failed to upload photo')
          setUploadingPhoto(false)
          setIsLoading(false)
          return
        }
        setUploadingPhoto(false)
      }

      const payload = {
        email: formData.email.trim(),
        employeeId: formData.employeeId.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        dateOfJoining: formData.dateOfJoining.trim(),
        nationality: formData.nationality.trim(),
        designation: formData.designation.trim(),
        address: formData.address.trim(),
        gender: formData.gender,
        phone: formData.phone.trim(),
        password: formData.password,
        departmentIds: formData.departmentIds,
        qualifications: formData.qualifications,
        certifications: formData.certifications,
        totalExperience: Number(formData.totalExperience) || 0,
        schoolId: formData.schoolId,
        profilePicture: profilePictureUrl,
      }

      if (teacherData?._id) {
        // Update existing teacher
        await axios.put(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/teachers/${teacherData._id}`, payload, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        toast.success("Teacher updated successfully!")
        const message = activities.admin.updateTeacher.description.replace("{teacherName}", formData.firstName)
        const activity = {
          title: activities.admin.updateTeacher.action,
          subtitle: message,
          performBy: "Admin",
        }
        await addActivity(activity)
      } else {
        // Create new teacher
        await axios.post(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/teachers`, payload, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        toast.success("Teacher added successfully!")
        const message = activities.admin.addTeacher.description.replace("{teacherName}", formData.firstName)
        const activity = {
          title: activities.admin.addTeacher.action,
          subtitle: message,
          performBy: "Admin",
        }
        await addActivity(activity)
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error("Error saving teacher:", error)
      if (error.response?.status === 409) {
        toast.error(error.response?.data?.message || "This email is already registered")
      } else {
        toast.error(teacherData ? error.response?.data?.message || "Failed to update teacher" : error.response?.data?.message || "Failed to add teacher")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{teacherData ? "Edit Teacher" : "Add New Teacher"}</DialogTitle>
          <DialogDescription>
            {teacherData
              ? "Update the teacher's information below."
              : "Enter the teacher's information to add them to the system."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {(isDepartmentsLoading || isSchoolsLoading) && (
            <div className="grid gap-6 py-12 place-items-center">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
              <span className="text-sm text-gray-500">Loading form...</span>
            </div>
          )}
          <div className="grid gap-6 py-4">
            {/* School Selection */}
            <div className="space-y-2">
              <Label className="font-medium">
                School <span className="text-red-500">*</span>
              </Label>
              {isSchoolsLoading ? (
                <div className="flex items-center space-x-2 h-10 px-3 border rounded-md border-gray-300">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                  <span className="text-sm text-gray-500">Loading schools...</span>
                </div>
              ) : teacherData ? (
                <Input
                  value={teacherData.schoolId?.name || ""}
                  disabled
                  className="border-gray-300 bg-gray-50"
                />
              ) : (
                <Select
                  value={formData.schoolId || ""}
                  onValueChange={async (value) => {
                    setFormData((prev) => ({ ...prev, schoolId: value, departmentIds: [] }))
                    await fetchDepartments(value)
                  }}
                >
                  <SelectTrigger className={`border-gray-300 focus:border-black focus:ring-black ${errors.schoolId ? 'border-red-600' : ''}`}>
                    <SelectValue placeholder="Choose a school" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((school) => (
                      <SelectItem key={school._id} value={school._id}>
                        {school.name}{school.schoolCode ? ` (${school.schoolCode})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.schoolId && <p className="text-sm text-red-600">{errors.schoolId}</p>}
            </div>

            {/* Teacher Photo */}
            <div className="flex flex-col items-center space-y-4 pb-4 border-b">
              <div className="relative">
                <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gray-100 ring-1 ring-gray-200 overflow-hidden">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Teacher preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-16 w-16 text-gray-400" />
                  )}
                </div>
                {photoPreview && (
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white shadow-lg hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <label
                  htmlFor="teacher-photo-upload"
                  className={`absolute bottom-0 right-0 rounded-full bg-black p-2 text-white shadow-lg transition-opacity cursor-pointer hover:opacity-90`}
                >
                  <Camera className="h-4 w-4" />
                  <input
                    id="teacher-photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </label>
              </div>
              <div className="text-center">
                <label htmlFor="teacher-photo-upload-btn" className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                  {photoPreview ? 'Change Photo' : 'Upload Teacher Photo'}
                </label>
                <input
                  id="teacher-photo-upload-btn"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                <p className="text-xs text-gray-500 mt-1">JPG, PNG or WEBP (max. 5MB)</p>
              </div>
            </div>

            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="font-medium">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`border-gray-300 focus:border-black focus:ring-black ${errors.firstName ? 'border-red-600' : ''}`}
                />
              {errors.firstName && <p className="text-sm text-red-600">{errors.firstName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="font-medium">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`border-gray-300 focus:border-black focus:ring-black ${errors.lastName ? 'border-red-600' : ''}`}
                />
              {errors.lastName && <p className="text-sm text-red-600">{errors.lastName}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-medium">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!!teacherData}
                  className={`border-gray-300 focus:border-black focus:ring-black ${errors.email ? 'border-red-600' : ''}`}
                />
              {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="employeeId" className="font-medium">
                  Employee ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="employeeId"
                  placeholder="1000"
                  value={formData.employeeId}
                  onChange={handleChange}
                  className={`border-gray-300 focus:border-black focus:ring-black ${errors.employeeId ? 'border-red-600' : ''}`}
                />
              {errors.employeeId && <p className="text-sm text-red-600">{errors.employeeId}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="font-medium">
                  Phone <span className="text-red-500">*</span>
                </Label>
              <PhoneInput
                value={formData.phone}
                onChange={(value) => {
                  setFormData(prev => ({ ...prev, phone: value }))
                  const digitsOnly = value.replace(/[^\d]/g, '')
                  const isValid = digitsOnly.length >= 10 && digitsOnly.length <= 15
                  setIsValidPhone(isValid)
                  if (errors.phone && isValid) {
                    setErrors(prev => {
                      const newErrors = { ...prev }
                      delete newErrors.phone
                      return newErrors
                    })
                  }
                }}
                inputProps={{ name: 'phone', required: true }}
                placeholder="Phone Number"
                country={'us'}
                inputClass={`!w-full !h-10 !text-sm !border !rounded-md focus:!border-black ${errors.phone ? '!border-red-500' : '!border-gray-300'}`}
                buttonClass={`!h-10 ${errors.phone ? '!border-red-500' : '!border-gray-300'}`}
                enableSearch={true}
                specialLabel=""
              />
              {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender" className="font-medium">
                  Gender <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.gender} onValueChange={(value) => handleSelectChange(value, "gender")}>
                  <SelectTrigger className="border-gray-300 focus:border-black focus:ring-black">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              {errors.gender && <p className="text-sm text-red-600">{errors.gender}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="font-medium">
                Address <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="address"
                placeholder="Enter full address"
                value={formData.address}
                onChange={handleChange}
                className={`min-h-[80px] border-gray-300 focus:border-black focus:ring-black ${errors.address ? 'border-red-600' : ''}`}
              />
            {errors.address && <p className="text-sm text-red-600">{errors.address}</p>}
            </div>

            {/* Professional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfJoining" className="font-medium">
                  Date of Joining <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="dateOfJoining"
                  type="date"
                  value={formData.dateOfJoining}
                  onChange={handleChange}
                  className={`border-gray-300 focus:border-black focus:ring-black ${errors.dateOfJoining ? 'border-red-600' : ''}`}
                />
              {errors.dateOfJoining && <p className="text-sm text-red-600">{errors.dateOfJoining}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="designation" className="font-medium">
                  Designation <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="designation"
                  placeholder="e.g., Senior Teacher"
                  value={formData.designation}
                  onChange={handleChange}
                  className={`border-gray-300 focus:border-black focus:ring-black ${errors.designation ? 'border-red-600' : ''}`}
                />
              {errors.designation && <p className="text-sm text-red-600">{errors.designation}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
              <Label htmlFor="nationality" className="font-medium">Nationality <span className="text-red-500">*</span></Label>
              <CountrySelect
                id="nationality"
                value={formData.nationality}
                onValueChange={(v) => setFormData(prev => ({ ...prev, nationality: v }))}
                placeholder="Select country"
                error={!!errors.nationality}
              />
              {errors.nationality && <p className="text-sm text-red-600">{errors.nationality}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalExperience" className="font-medium">
                Total Experience (years)
              </Label>
              <Input
                id="totalExperience"
                type="number"
                placeholder="10"
                value={formData.totalExperience}
                onChange={handleChange}
                className="border-gray-300 focus:border-black focus:ring-black"
              />
            </div>

            {/* Departments */}
            <div className="space-y-2">
              <Label className="font-medium">
                Departments <span className="text-red-500">*</span>
              </Label>
              {isDepartmentsLoading ? (
                <div className="flex items-center space-x-2 h-10 px-3 border rounded-md border-gray-300">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                  <span className="text-sm text-gray-500">Loading departments...</span>
                </div>
              ) : (
                <div className="border rounded-md border-gray-300 p-2 max-h-56 overflow-auto">
                  {departments.length === 0 ? (
                    <div className="text-sm text-gray-500 px-1 py-2">No departments found</div>
                  ) : (
                    departments.map((dept) => (
                      <label key={dept._id} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={formData.departmentIds.includes(dept._id)}
                          onChange={() => toggleDepartment(dept._id)}
                        />
                        <span className="text-sm text-gray-700">
                          {dept.departmentName}{dept.code ? ` (${dept.code})` : ""}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              )}
              {errors.departmentIds && <p className="text-sm text-red-600">{errors.departmentIds}</p>}
              {formData.departmentIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.departmentIds.map((id) => {
                    const d = departments.find((x) => x._id === id)
                    return (
                      <span key={id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 border">
                        {d ? `${d.departmentName}${d.code ? ` (${d.code})` : ''}` : id}
                      </span>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Qualifications */}
            <div className="space-y-2">
              <Label className="font-medium">Qualifications</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., BSCS, MSC"
                  value={qualificationInput}
                  onChange={(e) => setQualificationInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addQualification()
                    }
                  }}
                  className="border-gray-300 focus:border-black focus:ring-black"
                />
                <Button type="button" variant="outline" onClick={addQualification}>
                  Add
                </Button>
              </div>
              {errors.qualifications && <p className="text-sm text-red-600">{errors.qualifications}</p>}
              {formData.qualifications.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.qualifications.map((qual, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 border">
                      {qual}
                      <button
                        type="button"
                        onClick={() => removeQualification(index)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Certifications */}
            <div className="space-y-2">
              <Label className="font-medium">Certifications</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Teaching Certificate"
                  value={certificationInput}
                  onChange={(e) => setCertificationInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addCertification()
                    }
                  }}
                  className="border-gray-300 focus:border-black focus:ring-black"
                />
                <Button type="button" variant="outline" onClick={addCertification}>
                  Add
                </Button>
              </div>
              {formData.certifications.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.certifications.map((cert, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 border">
                      {cert}
                      <button
                        type="button"
                        onClick={() => removeCertification(index)}
                        className="ml-1 text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="font-medium">
                {teacherData ? "New Password (optional)" : "Password"} <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={teacherData ? "Leave blank to keep current password" : "Enter password"}
                  value={formData.password}
                  onChange={handleChange}
                  className={`border-gray-300 focus:border-black focus:ring-black ${errors.password ? 'border-red-600' : ''}`}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-black text-white hover:bg-black/90" disabled={isLoading || uploadingPhoto}>
              {isLoading || uploadingPhoto ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploadingPhoto ? "Uploading Photo..." : teacherData ? "Updating..." : "Adding..."}
                </>
              ) : (
                <>
                  <CheckIcon className="mr-2 h-4 w-4" />
                  {teacherData ? "Update Teacher" : "Add Teacher"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
