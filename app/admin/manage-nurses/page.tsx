"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import PhoneInput from "react-phone-input-2"
import "react-phone-input-2/lib/style.css"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar as CalendarIcon, Camera, Upload, User, Search, Plus, Eye, EyeOff, Edit, Trash2, Loader2, X } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { toast } from 'sonner'
import axios from "axios"

const API = process.env.NEXT_PUBLIC_SRS_SERVER

enum EmploymentStatus {
  FULL_TIME = "FULL_TIME",
  PART_TIME = "PART_TIME",
  CONTRACT = "CONTRACT",
  TEMPORARY = "TEMPORARY",
  INTERN = "INTERN",
  VOLUNTEER = "VOLUNTEER",
  RETIRED = "RETIRED",
  TERMINATED = "TERMINATED",
  RESIGNED = "RESIGNED",
}

interface Nurse {
  _id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  address?: string
  profilePicture?: string
  schoolId?: string
  schoolName?: string
  licenseNumber?: string
  dateOfJoining?: string
  createdAt?: string
  qualifications?: string
  experienceYears?: string
  speciality?: string
  employmentType?: EmploymentStatus
  certifications?: string[] | string
}

const debounce = (func: (...args: any[]) => void, wait: number) => {
  let timeout: NodeJS.Timeout
  return (...args: any[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

const formatDate = (value?: string) => {
  if (!value) return "N/A"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "N/A"
  return date.toLocaleDateString()
}

const initialNurseForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phone: "",
  licenseNumber: "",
  qualifications: [] as string[],
  experienceYears: "",
  address: "",
  speciality: "",
  dateOfJoining: "",
  employmentType: EmploymentStatus.FULL_TIME,
  certifications: [] as string[],
  profilePicture: null as File | null,
}

type NurseForm = typeof initialNurseForm

export default function ManageNurses() {
  const router = useRouter()
  const [nurses, setNurses] = useState<Nurse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [schoolFilter, setSchoolFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [totalPages, setTotalPages] = useState(1)
  const [totalNurses, setTotalNurses] = useState(0)

  const [open, setOpen] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isSaving, setIsSaving] = useState(false)

  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [nurseForReset, setNurseForReset] = useState<Nurse | null>(null)
  const [newPassword, setNewPassword] = useState("")

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [nurseToDelete, setNurseToDelete] = useState<Nurse | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewNurse, setViewNurse] = useState<Nurse | null>(null)

  const [form, setForm] = useState<NurseForm>({ ...initialNurseForm })
  const [qualificationInput, setQualificationInput] = useState("")
  const [certificationInput, setCertificationInput] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isPhoneValid, setIsPhoneValid] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [activeNurseId, setActiveNurseId] = useState<string | null>(null)
  const [isFormLoading, setIsFormLoading] = useState(false)

  const fetchNurses = async (page = 1, limit = 5, search = "", schoolId = "all") => {
    try {
      setLoading(true)
      const token = localStorage.getItem("accessToken") || localStorage.getItem("authToken")
      const params: Record<string, any> = { page, limit }
      if (search.trim()) params.search = search.trim()
      if (schoolId !== "all") params.schoolId = schoolId

      const { data } = await axios.get(`${API}/admin/nurses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      })

      const nursesData: Nurse[] = data?.data?.nurses || []
      const pagination = data?.data?.pagination || {}

      setNurses(nursesData)
      setCurrentPage(pagination.currentPage || page)
      setTotalPages(pagination.totalPages || 1)
      setTotalNurses(pagination.totalCount || nursesData.length || 0)
      setPageSize(pagination.limit || limit)
    } catch (error) {
      console.error("Error loading nurses:", error)
      setNurses([])
      setTotalNurses(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNurses()
  }, [])

  const debouncedSearch = useCallback(
    debounce((value: string, school: string) => {
      setCurrentPage(1)
      fetchNurses(1, pageSize, value, school)
    }, 500),
    [pageSize]
  )

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    debouncedSearch(value, schoolFilter)
  }

  const handleSchoolFilterChange = (value: string) => {
    setSchoolFilter(value)
    setCurrentPage(1)
    fetchNurses(1, pageSize, searchTerm, value)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchNurses(page, pageSize, searchTerm, schoolFilter)
  }

  const handlePageSizeChange = (value: number) => {
    setPageSize(value)
    setCurrentPage(1)
    fetchNurses(1, value, searchTerm, schoolFilter)
  }

  const employmentOptions = useMemo(() => Object.values(EmploymentStatus), [])

  const formatEmploymentLabel = (value: string) =>
    value
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")

  const schoolOptions = useMemo(() => {
    const map = new Map<string, string>()
    nurses.forEach((nurse) => {
      if (nurse.schoolId) {
        map.set(nurse.schoolId, nurse.schoolName || "Unnamed School")
      }
    })
    return Array.from(map.entries())
  }, [nurses])

  const viewCertifications = useMemo(() => {
    if (!viewNurse) return []
    if (Array.isArray(viewNurse.certifications)) return viewNurse.certifications
    if (typeof viewNurse.certifications === "string" && viewNurse.certifications) {
      return viewNurse.certifications.split(",").map((cert) => cert.trim()).filter(Boolean)
    }
    return []
  }, [viewNurse])

  const updateField = <K extends keyof NurseForm>(field: K, value: NurseForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field as string]) {
      setErrors((prev) => ({ ...prev, [field as string]: "" }))
    }
  }

  const resetForm = () => {
    setForm({ ...initialNurseForm })
    setQualificationInput("")
    setCertificationInput("")
    setErrors({})
    setPhotoPreview(null)
    setShowPassword(false)
    setIsPhoneValid(true)
    setIsEditing(false)
    setActiveNurseId(null)
    setIsFormLoading(false)
  }

  const addCertification = () => {
    const value = certificationInput.trim()
    if (!value) return
    if (form.certifications.includes(value)) {
      setCertificationInput("")
      return
    }
    setForm((prev) => ({ ...prev, certifications: [...prev.certifications, value] }))
    setCertificationInput("")
  }

  const removeCertification = (index: number) => {
    setForm((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index),
    }))
  }

  const addQualification = () => {
    const value = qualificationInput.trim()
    if (!value) return
    if (form.qualifications.includes(value)) {
      setQualificationInput("")
      return
    }
    setForm((prev) => ({ ...prev, qualifications: [...prev.qualifications, value] }))
    setQualificationInput("")
  }

  const removeQualification = (index: number) => {
    setForm((prev) => ({
      ...prev,
      qualifications: prev.qualifications.filter((_, i) => i !== index),
    }))
  }

  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      updateField("profilePicture", e.target.files[0])
      setPhotoPreview(URL.createObjectURL(e.target.files[0]))
    }
  }

  const handleAddNurseClick = () => {
    resetForm()
    setOpen(true)
  }

  const handleDialogChange = (next: boolean) => {
    if (!next) {
      resetForm()
    }
    setOpen(next)
  }

  const populateFormFromNurse = (nurseData: any) => {
    const certificationList = Array.isArray(nurseData.certifications)
      ? nurseData.certifications
      : typeof nurseData.certifications === "string" && nurseData.certifications
        ? nurseData.certifications.split(",").map((cert: string) => cert.trim()).filter(Boolean)
        : []

    const qualificationList = Array.isArray(nurseData.qualifications)
      ? nurseData.qualifications
      : typeof nurseData.qualifications === "string" && nurseData.qualifications
        ? nurseData.qualifications.split(",").map((item: string) => item.trim()).filter(Boolean)
        : []

    setForm({
      ...initialNurseForm,
      firstName: nurseData.firstName || "",
      lastName: nurseData.lastName || "",
      email: nurseData.email || "",
      password: "",
      phone: nurseData.phone || "",
      licenseNumber: nurseData.licenseNumber || "",
      qualifications: qualificationList,
      experienceYears:
        typeof nurseData.experienceYears === "number"
          ? nurseData.experienceYears.toString()
          : nurseData.experienceYears || "",
      address: nurseData.address || "",
      speciality: nurseData.speciality || "",
      dateOfJoining: nurseData.dateOfJoining ? format(new Date(nurseData.dateOfJoining), "yyyy-MM-dd") : "",
      employmentType: (nurseData.employmentType as EmploymentStatus) || EmploymentStatus.FULL_TIME,
      certifications: certificationList,
      profilePicture: null,
    })
    setPhotoPreview(nurseData.profilePicture || null)
    setQualificationInput("")
    setCertificationInput("")
    setShowPassword(false)
    setIsPhoneValid(true)
    setErrors({})
    setIsFormLoading(false)
  }

  const fetchNurseDetails = async (nurseId: string) => {
    try {
      setIsFormLoading(true)
      const token = localStorage.getItem("accessToken") || localStorage.getItem("authToken")
      const { data } = await axios.get(`${API}/admin/nurses/${nurseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!data?.data) {
        throw new Error("Nurse not found")
      }
      populateFormFromNurse(data.data)
    } catch (error) {
      console.error("Error fetching nurse details:", error)
      toast.error((error as any).response?.data?.message || "Failed to load nurse details. Please try again.")
      setIsFormLoading(false)
      setOpen(false)
      resetForm()
    }
  }

  const saveNurse = async () => {
    const newErrors: Record<string, string> = {}

    if (!form.firstName.trim()) newErrors.firstName = "First name is required"
    if (!form.lastName.trim()) newErrors.lastName = "Last name is required"

    if (!form.email.trim()) newErrors.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) newErrors.email = "Enter a valid email address"

    const trimmedPassword = form.password.trim()
    if (!isEditing) {
      if (!trimmedPassword) newErrors.password = "Password is required"
      else if (trimmedPassword.length < 8) newErrors.password = "Password must be at least 8 characters"
    } else if (trimmedPassword && trimmedPassword.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }

    if (!form.phone.trim()) newErrors.phone = "Phone number is required"
    else if (!isPhoneValid) newErrors.phone = "Enter a valid phone number"

    // License number is optional - removed validation
    if (!form.certifications.length) newErrors.certifications = "At least one certification is required"
    if (!form.qualifications.length) newErrors.qualifications = "At least one qualification is required"

    if (!form.experienceYears.trim()) {
      newErrors.experienceYears = "Experience years are required"
    } else if (!/^\d+(\.\d+)?$/.test(form.experienceYears.trim())) {
      newErrors.experienceYears = "Experience must be a numeric value"
    } else if (Number(form.experienceYears) < 0) {
      newErrors.experienceYears = "Experience must be 0 or greater"
    }

    if (!form.speciality.trim()) newErrors.speciality = "Speciality is required"
    if (!form.address.trim()) newErrors.address = "Home address is required"
    if (!form.dateOfJoining) newErrors.dateOfJoining = "Date of joining is required"
    if (!form.employmentType) newErrors.employmentType = "Employment type is required"

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    if (isEditing && !activeNurseId) {
      toast.error("Unable to update nurse. Please close and reopen the form.")
      return
    }

    try {
      setIsSaving(true)
      const token = localStorage.getItem("accessToken") || localStorage.getItem("authToken")
      const payload = new FormData()
      payload.append("firstName", form.firstName.trim())
      payload.append("lastName", form.lastName.trim())
      payload.append("email", form.email.trim().toLowerCase())
      if (!isEditing || trimmedPassword) {
        payload.append("password", trimmedPassword)
      }
      const normalizedPhone = form.phone
        ? form.phone.startsWith("+")
          ? form.phone
          : `+${form.phone}`
        : ""
      payload.append("phone", normalizedPhone)
      payload.append("licenseNumber", form.licenseNumber.trim())
      payload.append("qualifications", form.qualifications.join(", "))
      payload.append("experienceYears", form.experienceYears.trim())
      payload.append("address", form.address.trim())
      payload.append("speciality", form.speciality.trim())
      payload.append("dateOfJoining", form.dateOfJoining)
      payload.append("employmentType", form.employmentType)
      payload.append("gender", "FEMALE")

      form.certifications.forEach((certification, index) => {
        payload.append(`certifications[${index}]`, certification)
      })

      if (form.profilePicture) {
        payload.append("profilePicture", form.profilePicture)
      }

      const headers = {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      }

      let response: any

      if (isEditing && activeNurseId) {
        response = await axios.put(`${API}/admin/nurses/${activeNurseId}`, payload, { headers })
      } else {
        response = await axios.post(`${API}/admin/nurses`, payload, { headers })
      }

      toast.success(isEditing ? response.data?.message || "Nurse updated successfully" : response.data?.message || "Nurse saved successfully")
      setOpen(false)
      resetForm()
      await fetchNurses(currentPage, pageSize, searchTerm, schoolFilter)
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save nurse")
    } finally {
      setIsSaving(false)
    }
  }

  const openResetDialog = (nurse: Nurse) => {
    setNurseForReset(nurse)
    setResetDialogOpen(true)
    setNewPassword("")
  }

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6 || !nurseForReset) {
      toast.error("Password must be at least 6 characters long")
      return
    }

    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("authToken")
      const response = await axios.post(
        `${API}/admin/nurses/${nurseForReset._id}/reset-password`,
        {
          password: newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      toast.success(response.data?.message || "Password reset successfully!")
      setResetDialogOpen(false)
      setNewPassword("")
      setNurseForReset(null)
    } catch (err: any) {
      console.error("Reset password error:", err)
      toast.error(err.response?.data?.message || "Failed to reset password")
    }
  }

  const handleDeleteClick = (nurse: Nurse) => {
    setNurseToDelete(nurse)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteNurse = async () => {
    if (!nurseToDelete) return
    try {
      setIsDeleting(true)
      const token = localStorage.getItem("accessToken") || localStorage.getItem("authToken")
      const response = await axios.delete(`${API}/admin/nurses/${nurseToDelete._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      toast.success(response.data?.message || "Nurse deleted successfully!")
      setIsDeleteDialogOpen(false)
      setNurseToDelete(null)
      fetchNurses(currentPage, pageSize, searchTerm, schoolFilter)
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete nurse")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleViewNurse = (nurse: Nurse) => {
    router.push(`/admin/manage-nurses/view/${nurse._id}`)
  }

  const handleEditNurse = (nurse: Nurse) => {
    setIsEditing(true)
    setActiveNurseId(nurse._id)
    setErrors({})
    setCertificationInput("")
    setPhotoPreview(null)
    setShowPassword(false)
    setIsPhoneValid(true)
    setOpen(true)
    fetchNurseDetails(nurse._id)
  }

  const renderTableContent = () => {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={10} className="py-12">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-3 text-gray-600">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-black"></div>
                <span>Loading nurses...</span>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )
    }

    if (!nurses.length) {
      return (
        <TableRow>
          <TableCell colSpan={10} className="py-8 text-center text-gray-500">
            No nurses found
          </TableCell>
        </TableRow>
      )
    }

    return nurses.map((nurse) => (
      <TableRow key={nurse._id}>
        <TableCell>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
              {nurse.profilePicture ? (
                <img src={nurse.profilePicture} alt={`${nurse.firstName} ${nurse.lastName}`} className="h-full w-full object-cover" />
              ) : (
                <User className="h-5 w-5 text-gray-500" />
              )}
            </div>
            <div>
              <div className="font-medium">
                {nurse.firstName} {nurse.lastName}
              </div>
              <div className="text-sm text-gray-500 sm:hidden">{nurse.email}</div>
            </div>
          </div>
        </TableCell>
        <TableCell className="hidden sm:table-cell">{nurse.email}</TableCell>
        <TableCell className="hidden md:table-cell">{nurse.phone || "N/A"}</TableCell>
        {/* <TableCell className="hidden lg:table-cell">{nurse.schoolName || "N/A"}</TableCell> */}
        <TableCell className="hidden xl:table-cell">
          {nurse.licenseNumber ? <Badge variant="outline">{nurse.licenseNumber}</Badge> : "N/A"}
        </TableCell>
        <TableCell className="hidden xl:table-cell">{formatDate(nurse.dateOfJoining)}</TableCell>
        {/* <TableCell className="hidden 2xl:table-cell">{nurse.speciality || "N/A"}</TableCell> */}
        {/* <TableCell>
          {nurse.employmentType ? formatEmploymentLabel(nurse.employmentType) : "N/A"}
        </TableCell> */}

        <TableCell>{formatDate(nurse.createdAt)}</TableCell>
              
        {/* <TableCell>
          <Button variant="secondary" size="sm" onClick={() => openResetDialog(nurse)}>
            Reset
          </Button>
        </TableCell> */}
        <TableCell className="text-right">
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="sm" onClick={() => handleViewNurse(nurse)} title="View details">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleEditNurse(nurse)} title="Edit nurse">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(nurse)} title="Delete nurse">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    ))
  }

  return (
    <>
      <div className="space-y-6 p-4 sm:p-6">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Manage Nurses</h1>
            <p className="text-sm sm:text-base text-gray-600">Add, edit, and manage the nursing staff directory</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleAddNurseClick} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Nurse
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search nurses by name, email, or license..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
              autoComplete="off"
            />
          </div>
          {/* <Select value={schoolFilter} onValueChange={handleSchoolFilterChange}>
            <SelectTrigger className="w-full sm:w-60">
              <SelectValue placeholder="Filter by school" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Schools</SelectItem>
              {schoolOptions.map(([id, name]) => (
                <SelectItem key={id} value={id}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select> */}
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold">Nurses ({totalNurses})</CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Badge variant="secondary">Page {currentPage} of {totalPages}</Badge>
              <Badge variant="outline">{pageSize} per page</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">Phone</TableHead>
                  {/* <TableHead className="hidden lg:table-cell">School</TableHead> */}
                  <TableHead className="hidden xl:table-cell">License</TableHead>
                  <TableHead className="hidden xl:table-cell">Joining</TableHead>
                  {/* <TableHead className="hidden 2xl:table-cell">Speciality</TableHead> */}
                  {/* <TableHead className="hidden 2xl:table-cell">Employment</TableHead> */}
                  {/* <TableHead>Reset</TableHead> */}
                  <TableHead>Record Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{renderTableContent()}</TableBody>
            </Table>
          </div>
        </CardContent>

        <div className="flex items-center justify-between px-6 py-4 border-t">
          <div className="flex items-center gap-2 text-sm">
            <span>Show</span>
            <Select value={pageSize.toString()} onValueChange={(value) => handlePageSizeChange(Number(value))}>
              <SelectTrigger className="w-20">
                <SelectValue placeholder={pageSize.toString()} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span>per page</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                let pageNumber
                if (totalPages <= 5) {
                  pageNumber = index + 1
                } else if (currentPage <= 3) {
                  pageNumber = index + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + index
                } else {
                  pageNumber = currentPage - 2 + index
                }
                return (
                  <Button
                    key={pageNumber}
                    variant={currentPage === pageNumber ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNumber)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNumber}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>

          <div className="text-sm text-gray-600">
            Showing {totalNurses === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalNurses)} of {totalNurses} nurses
          </div>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={handleDialogChange}>
        <DialogContent className="2xl:max-w-6xl sm:max-w-xl xl:max-w-4xl lg:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Nurse" : "Add Nurse"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Update the nurse’s information below." : "Provide complete information to create a nurse profile."}
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            {isFormLoading && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80">
                <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                <p className="mt-2 text-sm text-gray-600">Loading nurse information...</p>
              </div>
            )}
            <div className={cn("p-4 space-y-6", isFormLoading ? "pointer-events-none opacity-50" : "")}>
              <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Profile Photo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <div className="flex h-32 w-32 sm:h-40 sm:w-40 items-center justify-center rounded-full bg-gray-100 overflow-hidden">
                        {photoPreview ? (
                          <img src={photoPreview} alt="Nurse preview" className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-16 w-16 sm:h-20 sm:w-20 text-gray-400" />
                        )}
                      </div>
                      <label
                        htmlFor="nurse-photo-upload"
                        className="absolute bottom-0 right-0 rounded-full bg-black p-2 text-white shadow-lg cursor-pointer"
                      >
                        <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                        <input
                          id="nurse-photo-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={onPhotoChange}
                        />
                      </label>
                    </div>
                    <label htmlFor="nurse-photo-upload-btn" className="mt-4">
                      <Button variant="outline" asChild>
                        <span>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Photo
                          <input
                            id="nurse-photo-upload-btn"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={onPhotoChange}
                          />
                        </span>
                      </Button>
                    </label>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle>Nurse Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>
                        First Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={form.firstName}
                        onChange={(e) => updateField("firstName", e.target.value)}
                        placeholder="Sarah"
                      />
                      {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Last Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={form.lastName}
                        onChange={(e) => updateField("lastName", e.target.value)}
                        placeholder="Johnson"
                      />
                      {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        placeholder="nurse@example.com"
                        autoComplete="off"
                        disabled={isEditing}
                        className={cn(
                          "border-gray-200",
                          isEditing ? "bg-gray-100 text-gray-500" : "",
                          errors.email && "border-red-500"
                        )}
                      />
                      {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Password <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={form.password}
                          onChange={(e) => updateField("password", e.target.value)}
                          placeholder="@User123"
                          autoComplete="new-password"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                          onClick={() => setShowPassword((prev) => !prev)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>
                        Phone Number <span className="text-red-500">*</span>
                      </Label>
                      <PhoneInput
                        country={"jm"}
                        enableLongNumbers={true}
                        value={form.phone}
                        onChange={(value) => {
                          updateField("phone", value)
                          const digitsOnly = value.replace(/[^\d]/g, "")
                          setIsPhoneValid(digitsOnly.length >= 10 && digitsOnly.length <= 15)
                        }}
                        disabled={isFormLoading}
                        inputProps={{ name: "phone", required: true }}
                        enableSearch
                        inputClass={`!w-full !h-10 !text-sm !pl-12 !border ${errors.phone ? "!border-red-500" : "!border-gray-300"}`}
                        buttonClass={`!border ${errors.phone ? "!border-red-500" : "!border-gray-300"} !bg-white`}
                        dropdownClass="!z-50"
                        containerClass="w-full"
                      />
                      {errors.phone ? (
                        <p className="text-xs text-red-500">{errors.phone}</p>
                      ) : (
                        !isPhoneValid &&
                        form.phone && <p className="text-xs text-red-500">Enter a valid phone number</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>
                        License Number
                      </Label>
                      <Input
                        value={form.licenseNumber}
                        onChange={(e) => updateField("licenseNumber", e.target.value)}
                        placeholder="RN-12345"
                      />
                      {errors.licenseNumber && <p className="text-xs text-red-500">{errors.licenseNumber}</p>}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>
                        Employment Type <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={form.employmentType}
                        onValueChange={(value) => updateField("employmentType", value as EmploymentStatus)}
                      >
                        <SelectTrigger className={errors.employmentType ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select employment type" />
                        </SelectTrigger>
                        <SelectContent>
                          {employmentOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {formatEmploymentLabel(option)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.employmentType && <p className="text-xs text-red-500">{errors.employmentType}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Date of Joining <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="date"
                        value={form.dateOfJoining}
                        onChange={(e) => updateField("dateOfJoining", e.target.value)}
                        className={cn(
                          errors.dateOfJoining && "border-red-500"
                        )}
                        disabled={isFormLoading}
                      />
                      {/* Hidden Popover for compatibility - using native date input for Safari */}
                      <Popover style={{ display: 'none' }}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !form.dateOfJoining && "text-muted-foreground",
                              errors.dateOfJoining && "border-red-500"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {form.dateOfJoining ? format(new Date(form.dateOfJoining), "PPP") : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={form.dateOfJoining ? new Date(form.dateOfJoining) : undefined}
                            onSelect={(date) => updateField("dateOfJoining", date ? format(date, "yyyy-MM-dd") : "")}
                            initialFocus
                            disabled={(date) => false}
                          />
                        </PopoverContent>
                      </Popover>
                      {errors.dateOfJoining && <p className="text-xs text-red-500">{errors.dateOfJoining}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Qualifications <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={qualificationInput}
                        onChange={(e) => setQualificationInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            addQualification()
                          }
                        }}
                        placeholder="e.g. BSN, RN"
                        disabled={isFormLoading}
                      />
                      <Button type="button" variant="outline" onClick={addQualification} disabled={isFormLoading}>
                        Add
                      </Button>
                    </div>
                    {errors.qualifications && <p className="text-xs text-red-500">{errors.qualifications}</p>}
                    {form.qualifications.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {form.qualifications.map((qual, index) => (
                          <span
                            key={`${qual}-${index}`}
                            className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs border border-gray-200"
                          >
                            {qual}
                            <button type="button" onClick={() => removeQualification(index)}>
                              <X className="h-3 w-3 text-gray-500" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>
                        Experience (Years) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={form.experienceYears}
                        onChange={(e) => updateField("experienceYears", e.target.value)}
                        placeholder="12"
                      />
                      {errors.experienceYears && <p className="text-xs text-red-500">{errors.experienceYears}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Speciality <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={form.speciality}
                        onChange={(e) => updateField("speciality", e.target.value)}
                        placeholder="Pediatric Care"
                      />
                      {errors.speciality && <p className="text-xs text-red-500">{errors.speciality}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Home Address <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      value={form.address}
                      onChange={(e) => updateField("address", e.target.value)}
                      placeholder="123 Health St, Medical City, MC 12345"
                      className="min-h-[80px]"
                    />
                    {errors.address && <p className="text-xs text-red-500">{errors.address}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Certifications <span className="text-red-500">*</span></Label>
                    <div className="flex gap-2">
                      <Input
                        value={certificationInput}
                        onChange={(e) => setCertificationInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            addCertification()
                          }
                        }}
                        placeholder="Type certification and press Enter"
                        disabled={isFormLoading}
                      />
                      <Button type="button" variant="outline" onClick={addCertification} disabled={isFormLoading}>
                        Add
                      </Button>
                    </div>
                    {errors.certifications && <p className="text-xs text-red-500">{errors.certifications}</p>}
                    {form.certifications.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {form.certifications.map((cert, index) => (
                          <span
                            key={`${cert}-${index}`}
                            className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs border border-gray-200"
                          >
                            {cert}
                            <button type="button" onClick={() => removeCertification(index)}>
                              <X className="h-3 w-3 text-gray-500" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => handleDialogChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={saveNurse} disabled={isSaving || isFormLoading}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Nurse"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Reset password for: <strong>{nurseForReset?.firstName} {nurseForReset?.lastName}</strong>
            </p>
            <div className="space-y-2">
              <label htmlFor="newPassword" className="text-sm font-medium">
                New Password
              </label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword}>Reset Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete nurse "{nurseToDelete?.firstName} {nurseToDelete?.lastName}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteNurse} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Nurse"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nurse Details</DialogTitle>
          </DialogHeader>
          {viewNurse && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                  {viewNurse.profilePicture ? (
                    <img src={viewNurse.profilePicture} alt={`${viewNurse.firstName} ${viewNurse.lastName}`} className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-8 w-8 text-gray-500" />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-lg">
                    {viewNurse.firstName} {viewNurse.lastName}
                  </div>
                  <p className="text-sm text-gray-500">{viewNurse.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p className="font-medium">{viewNurse.phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-gray-500">School</p>
                  <p className="font-medium">{viewNurse.schoolName || "N/A"}</p>
                </div>
                <div>
                  <p className="text-gray-500">License</p>
                  <p className="font-medium">{viewNurse.licenseNumber || "N/A"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Employment Type</p>
                  <p className="font-medium">
                    {viewNurse.employmentType ? formatEmploymentLabel(viewNurse.employmentType) : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Date of Joining</p>
                  <p className="font-medium">{formatDate(viewNurse.dateOfJoining)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Speciality</p>
                  <p className="font-medium">{viewNurse.speciality || "N/A"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Qualifications</p>
                  <p className="font-medium">{viewNurse.qualifications || "N/A"}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-gray-500">Address</p>
                  <p className="font-medium">{viewNurse.address || "N/A"}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-gray-500">Certifications</p>
                  {viewCertifications.length ? (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {viewCertifications.map((cert, index) => (
                        <span
                          key={`${cert}-${index}`}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 border border-gray-200"
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="font-medium">N/A</p>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
      <style jsx>{`
        :global(.react-tel-input) {
          width: 100%;
        }
        :global(.react-tel-input .country-list) {
          z-index: 9999;
        }
      `}</style>
    </>
  )
}
