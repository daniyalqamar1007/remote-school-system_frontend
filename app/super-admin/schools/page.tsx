"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { CountrySelect } from "@/components/ui/country-select"
import { Plus, Search, Edit, Trash2, Building, Users, Loader2, X, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react"
import { toast } from 'sonner'

import PhoneInput from "react-phone-input-2"
import "react-phone-input-2/lib/style.css"

interface School {
  _id: string;
  name: string;
  code?: string;
  type?: string;
  status?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  phone?: string;
  email?: string;
  website?: string;
  adminId?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  establishedYear?: number;
  studentCapacity?: number;
  currentStudentCount?: number;
  staffCount?: number;
  gradelevels?: string[];
  academicYearStart?: string;
  academicYearEnd?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  settings?: {
    allowParentRegistration?: boolean;
    requireEmailVerification?: boolean;
    maxStudentsPerClass?: number;
    attendanceGracePeriod?: number;
  };
  maxUsers?: number;
  currentUserCount?: number;
}

interface CreateSchoolForm {
  name: string
  code: string
  type: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  phone: string
  email: string
  website: string
  adminId: string
  establishedYear: number
  studentCapacity: number | ""
  gradelevels: string[]
  academicYearStart: string
  academicYearEnd: string
  isActive: boolean
  maxStudentsPerClass: number | ""
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const isValidUrl = (value: string) => {
  if (!value) return true
  try {
    const normalized = value.startsWith("http://") || value.startsWith("https://") ? value : `https://${value}`
    const url = new URL(normalized)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch (error) {
    return false
  }
}

const createDefaultSchoolForm = (): CreateSchoolForm => ({
  name: "",
  code: "",
  type: "PUBLIC",
  address: {
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: ""
  },
  phone: "",
  email: "",
  website: "",
  adminId: "",
  establishedYear: new Date().getFullYear(),
  studentCapacity: "", // Empty by default, optional field
  gradelevels: [],
  academicYearStart: "",
  academicYearEnd: "",
  isActive: true,
  maxStudentsPerClass: "" // Empty by default, required field (will show error if empty on save)
})

const createDefaultAdminForm = () => ({
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: ""
})

const deriveIsoCountryCode = (value?: string) => {
  if (!value) return "us"
  const trimmed = value.trim()
  if (!trimmed) return "us"
  const lowered = trimmed.toLowerCase()
  if (lowered.length === 2) return lowered
  if (lowered === "usa" || lowered === "united states" || lowered === "united states of america") return "us"
  if (lowered === "uk" || lowered === "united kingdom" || lowered === "england" || lowered === "great britain") return "gb"
  if (lowered.length >= 2) return lowered.slice(0, 2)
  return "us"
}

const validateSchoolFields = (
  form: CreateSchoolForm,
  phoneValid: boolean,
  setErrorsFn: (errors: Record<string, string>) => void,
  currentYear: number
) => {
  const errors: Record<string, string> = {}
  if (!form.name.trim()) {
    errors.name = "School name is required"
  }
  if (!form.address.street.trim()) {
    errors.street = "Street address is required"
  }
  if (!form.address.city.trim()) {
    errors.city = "City is required"
  }
  if (!form.address.state.trim()) {
    errors.state = "State is required"
  }
  // ZIP code is optional
  if (!form.address.country.trim()) {
    errors.country = "Country is required"
  }

  if (!form.establishedYear) {
    errors.establishedYear = "Established year is required"
  } else if (form.establishedYear > currentYear) {
    errors.establishedYear = `Establishment year cannot be in the future (max ${currentYear})`
  }

  if (!form.phone.trim()) {
    errors.phone = "Phone number is required"
  } else if (!phoneValid) {
    errors.phone = "Enter a valid phone number"
  }

  if (!form.email.trim()) {
    errors.email = "Email is required"
  } else if (!emailRegex.test(form.email)) {
    errors.email = "Enter a valid email address"
  }

  if (form.website && !isValidUrl(form.website)) {
    errors.website = "Enter a valid website URL"
  }

  if (form.academicYearStart && form.academicYearEnd && form.academicYearEnd < form.academicYearStart) {
    errors.academicYearEnd = "Academic year end cannot be before the start date"
  }

  // if (!form.gradelevels || form.gradelevels.length === 0) {
  //   errors.gradelevels = "At least one grade level is required"
  // }

  // Student Capacity: Optional, but if provided, must be at least 100
  if (form.studentCapacity !== "" && form.studentCapacity !== undefined && form.studentCapacity !== null) {
    const capacity = typeof form.studentCapacity === 'number' ? form.studentCapacity : Number(form.studentCapacity)
    if (isNaN(capacity) || capacity < 100) {
      errors.studentCapacity = "Student capacity must be at least 100"
    }
  }

  // Max Students Per Class: Required, must be at least 1
  if (form.maxStudentsPerClass === "" || form.maxStudentsPerClass === undefined || form.maxStudentsPerClass === null) {
    errors.maxStudentsPerClass = "Max students per class is required and must be at least 1"
  } else {
    const maxStudents = typeof form.maxStudentsPerClass === 'number' ? form.maxStudentsPerClass : Number(form.maxStudentsPerClass)
    if (isNaN(maxStudents) || maxStudents < 1) {
      errors.maxStudentsPerClass = "Max students per class is required and must be at least 1"
    } else {
      // If student capacity is set, max students per class must be <= capacity
      if (form.studentCapacity !== "" && form.studentCapacity !== undefined && form.studentCapacity !== null) {
        const capacity = typeof form.studentCapacity === 'number' ? form.studentCapacity : Number(form.studentCapacity)
        if (!isNaN(capacity) && maxStudents > capacity) {
          errors.maxStudentsPerClass = `Max students per class cannot exceed student capacity (${capacity})`
        }
      }
    }
  }

  setErrorsFn(errors)
  return Object.keys(errors).length === 0
}

const buildSchoolPayload = (form: CreateSchoolForm, adminId?: string) => {
  const payload: Record<string, any> = {
    name: form.name.trim(),
    type: form.type,
    address: {
      street: form.address.street.trim(),
      city: form.address.city.trim(),
      state: form.address.state.trim(),
      zipCode: form.address.zipCode.trim(),
      country: form.address.country.trim(),
    },
    isActive: form.isActive,
  }

  const resolvedAdminId = adminId || form.adminId?.trim()
  if (form.code?.trim()) payload.code = form.code.trim()
  if (resolvedAdminId) payload.adminId = resolvedAdminId
  if (form.phone?.trim()) payload.phone = form.phone.trim()
  if (form.email?.trim()) payload.email = form.email.trim()
  if (form.website?.trim()) payload.website = form.website.trim()
  if (form.establishedYear && form.establishedYear > 0) payload.establishedYear = form.establishedYear
  // Only include studentCapacity if it's a valid number > 0
  if (form.studentCapacity !== "" && form.studentCapacity !== undefined && form.studentCapacity !== null) {
    const capacity = typeof form.studentCapacity === 'number' ? form.studentCapacity : Number(form.studentCapacity)
    if (!isNaN(capacity) && capacity > 0) {
      payload.studentCapacity = capacity
    }
  }
  if (form.gradelevels && form.gradelevels.length > 0) {
    payload.gradelevels = form.gradelevels
  } else {
    payload.gradelevels = []
  }
  if (form.academicYearStart?.trim()) payload.academicYearStart = form.academicYearStart.trim()
  if (form.academicYearEnd?.trim()) payload.academicYearEnd = form.academicYearEnd.trim()
  // Max Students Per Class is required, so it should always be included if it's a valid number
  if (form.maxStudentsPerClass !== "" && form.maxStudentsPerClass !== undefined && form.maxStudentsPerClass !== null) {
    const maxStudents = typeof form.maxStudentsPerClass === 'number' ? form.maxStudentsPerClass : Number(form.maxStudentsPerClass)
    if (!isNaN(maxStudents) && maxStudents > 0) {
      payload.maxStudentsPerClass = maxStudents
    }
  }

  return payload
}

export default function SchoolManagement() {
  const router = useRouter()
  const [schools, setSchools] = useState<School[]>([])
  const [admins, setAdmins] = useState<Array<{_id: string, firstName: string, lastName: string, email: string}>>([])
  
  // Filter admins to exclude those already assigned to schools (reactive filtering)
  const availableAdmins = useMemo(() => {
    if (admins.length === 0) return []
    
    // Get admin IDs that are already assigned to schools
    const assignedAdminIds = new Set<string>()
    schools.forEach((school) => {
      if (school.adminId) {
        const adminId = typeof school.adminId === 'object' && school.adminId !== null
          ? (school.adminId as any)._id || (school.adminId as any).id || school.adminId
          : school.adminId
        if (adminId) {
          assignedAdminIds.add(String(adminId))
        }
      }
    })
    
    // Filter out assigned admins
    return admins.filter((admin) => {
      if (!admin || !admin._id) return false
      return !assignedAdminIds.has(String(admin._id))
    })
  }, [admins, schools])
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [schoolToDelete, setSchoolToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null)

  // Available admins for edit (includes current admin if editing)
  const availableAdminsForEdit = useMemo(() => {
    if (!selectedSchool || !selectedSchool.adminId) return availableAdmins
    
    // Include current admin in the list
    const currentAdminId = typeof selectedSchool.adminId === 'object' && selectedSchool.adminId !== null
      ? (selectedSchool.adminId as any)._id || (selectedSchool.adminId as any).id || selectedSchool.adminId
      : selectedSchool.adminId
    
    const currentAdmin = {
      _id: String(currentAdminId),
      firstName: (selectedSchool.adminId as any).firstName || '',
      lastName: (selectedSchool.adminId as any).lastName || '',
      email: (selectedSchool.adminId as any).email || ''
    }
    
    // Check if current admin is already in availableAdmins
    const isInAvailable = availableAdmins.some(a => String(a._id) === String(currentAdminId))
    
    if (isInAvailable) {
      return availableAdmins
    }
    
    // Add current admin to the list
    return [currentAdmin, ...availableAdmins]
  }, [availableAdmins, selectedSchool])
  const [searchTerm, setSearchTerm] = useState("")
  const [schoolsLoading, setSchoolsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalSchools, setTotalSchools] = useState(0)
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [stats, setStats] = useState<{ totalSchools: number; activeSchools: number; inactiveSchools: number; totalStudentCapacity: number } | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState<1 | 2>(1)
  const [adminMode, setAdminMode] = useState<"existing" | "new">("existing")
  const [selectedAdminId, setSelectedAdminId] = useState("")
  const [resolvedAdminId, setResolvedAdminId] = useState("")
  const [resolvedAdminDetails, setResolvedAdminDetails] = useState<{ _id: string; firstName: string; lastName: string; email: string } | null>(null)
  const [adminForm, setAdminForm] = useState(createDefaultAdminForm)
  const [adminErrors, setAdminErrors] = useState<Record<string, string>>({})
  const [adminPhoneCountry, setAdminPhoneCountry] = useState("us")
  const [isAdminPhoneValid, setIsAdminPhoneValid] = useState(false)
  const [isAdminSubmitting, setIsAdminSubmitting] = useState(false)
  const [areAdminsLoading, setAreAdminsLoading] = useState(false)
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({})
  const [gradeTagInput, setGradeTagInput] = useState("")
  const [isCreateSubmitting, setIsCreateSubmitting] = useState(false)
  const [schoolPhoneCountry, setSchoolPhoneCountry] = useState("us")
  const [isSchoolPhoneValid, setIsSchoolPhoneValid] = useState(false)
  const [showAdminPassword, setShowAdminPassword] = useState(false)
  const [showAdminConfirmPassword, setShowAdminConfirmPassword] = useState(false)
  const currentYear = useMemo(() => new Date().getFullYear(), [])
  const [editForm, setEditForm] = useState<CreateSchoolForm | null>(null)
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  const [editGradeTagInput, setEditGradeTagInput] = useState("")
  const [isEditSubmitting, setIsEditSubmitting] = useState(false)
  const [editPhoneCountry, setEditPhoneCountry] = useState("us")
  const [isEditPhoneValid, setIsEditPhoneValid] = useState(false)
  const [editAdminMode, setEditAdminMode] = useState<"existing" | "new">("existing")
  const [editSelectedAdminId, setEditSelectedAdminId] = useState("")
  const [editResolvedAdminId, setEditResolvedAdminId] = useState("")
  const [editResolvedAdminDetails, setEditResolvedAdminDetails] = useState<{ _id: string; firstName: string; lastName: string; email: string } | null>(null)
  const [editAdminForm, setEditAdminForm] = useState(createDefaultAdminForm)
  const [editAdminErrors, setEditAdminErrors] = useState<Record<string, string>>({})
  const [editAdminPhoneCountry, setEditAdminPhoneCountry] = useState("us")
  const [isEditAdminPhoneValid, setIsEditAdminPhoneValid] = useState(false)
  const [isEditAdminSubmitting, setIsEditAdminSubmitting] = useState(false)
  const [showEditAdminPassword, setShowEditAdminPassword] = useState(false)
  const [showEditAdminConfirmPassword, setShowEditAdminConfirmPassword] = useState(false)

  const [createForm, setCreateForm] = useState<CreateSchoolForm>(() => createDefaultSchoolForm());

  const fetchSchools = useCallback(async (page = 1, limit = 10, search = "") => {
    try {
      setSchoolsLoading(true)

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token") || localStorage.getItem("accessToken") || localStorage.getItem("authToken")
          : null

      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("limit", String(limit))
      if (search.trim()) {
        params.set("search", search.trim())
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/schools?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const payload = data?.data || data || {}
      const list = Array.isArray(payload?.schools) ? payload.schools : Array.isArray(data?.schools) ? data.schools : []
      const pagination = payload?.pagination || data?.pagination || {}

      setSchools(list)
      setCurrentPage(pagination.currentPage || page)
      setTotalPages(pagination.totalPages || 1)
      setTotalSchools(pagination.totalCount ?? list.length)
      setPageSize(pagination.limit || limit)
    } catch (error) {
      console.error("Error fetching schools:", error)
      toast.error("Failed to fetch schools")
      setSchools([])
      setTotalSchools(0)
      setTotalPages(1)
    } finally {
      setSchoolsLoading(false)
    }
  }, [])

  const fetchAdmins = async () => {
    try {
      setAreAdminsLoading(true)
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token") || localStorage.getItem("accessToken") || localStorage.getItem("authToken")
          : null

      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/users/admins/active`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      const list = Array.isArray(data?.data?.admins)
        ? data.data.admins
        : Array.isArray(data?.admins)
          ? data.admins
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.users)
              ? data.users
              : Array.isArray(data)
                ? data
                : []
      
      // Get admin IDs that are already assigned to schools (frontend safety filter)
      const assignedAdminIds = new Set<string>()
      schools.forEach((school) => {
        if (school.adminId) {
          const adminId = typeof school.adminId === 'object' && school.adminId !== null
            ? (school.adminId as any)._id || (school.adminId as any).id || school.adminId
            : school.adminId
          if (adminId) {
            assignedAdminIds.add(String(adminId))
          }
        }
      })
      
      // Filter out admins who are already assigned to schools
      const unassignedAdmins = list.filter((admin: any) => {
        if (!admin || !admin._id) return false
        const adminId = String(admin._id)
        return !assignedAdminIds.has(adminId)
      })
      
      console.log(`📊 Filtered admins: ${unassignedAdmins.length} unassigned out of ${list.length} total (${assignedAdminIds.size} already assigned)`)
      setAdmins(unassignedAdmins)
    } catch (error) {
      console.error("Error fetching admins:", error)
      setAdmins([])
    } finally {
      setAreAdminsLoading(false)
    }
  }

  const fetchSchoolStats = useCallback(async () => {
    try {
      setStatsLoading(true)
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token") || localStorage.getItem("accessToken") || localStorage.getItem("authToken")
          : null

      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/stats/schools`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const payload = data?.data || data || {}

      setStats({
        totalSchools: payload.totalSchools ?? 0,
        activeSchools: payload.activeSchools ?? 0,
        inactiveSchools: payload.inactiveSchools ?? 0,
        totalStudentCapacity: payload.totalStudentCapacity ?? payload.totalCapacity ?? 0,
      })
    } catch (error) {
      console.error("Error fetching school stats:", error)
      setStats({
        totalSchools: 0,
        activeSchools: 0,
        inactiveSchools: 0,
        totalStudentCapacity: 0,
      })
    } finally {
      setStatsLoading(false)
    }
  }, [])


  useEffect(() => {
    fetchSchoolStats()
  }, [fetchSchoolStats])

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 500)
    return () => clearTimeout(handler)
  }, [searchTerm])

  useEffect(() => {
    fetchSchools(currentPage, pageSize, debouncedSearch)
  }, [currentPage, pageSize, debouncedSearch, fetchSchools])

  useEffect(() => {
    if (!resolvedAdminId) {
      return
    }
    const found = admins.find((admin) => admin._id === resolvedAdminId)
    if (found) {
      setResolvedAdminDetails(found)
    }
  }, [admins, resolvedAdminId])

  useEffect(() => {
    if (!isCreateDialogOpen) {
      setCurrentStep(1)
      setAdminMode("existing")
      setSelectedAdminId("")
      setResolvedAdminId("")
      setResolvedAdminDetails(null)
      resetAdminFormState()
      setCreateForm(createDefaultSchoolForm())
      setCreateErrors({})
      setGradeTagInput("")
      setIsSchoolPhoneValid(false)
      setSchoolPhoneCountry("us")
    } else {
      fetchAdmins()
    }
  }, [isCreateDialogOpen])

  useEffect(() => {
    if (!isEditDialogOpen) {
      setEditAdminMode("existing")
      setEditSelectedAdminId("")
      setEditResolvedAdminId("")
      setEditResolvedAdminDetails(null)
      setEditAdminForm(createDefaultAdminForm())
      setEditAdminErrors({})
      setIsEditAdminPhoneValid(false)
      setEditAdminPhoneCountry("us")
      setShowEditAdminPassword(false)
      setShowEditAdminConfirmPassword(false)
    } else {
      fetchAdmins()
      // Set current admin as selected if exists
      if (selectedSchool?.adminId) {
        const currentAdminId = typeof selectedSchool.adminId === 'object' && selectedSchool.adminId !== null
          ? (selectedSchool.adminId as any)._id || (selectedSchool.adminId as any).id || selectedSchool.adminId
          : selectedSchool.adminId
        setEditSelectedAdminId(String(currentAdminId))
        setEditResolvedAdminId(String(currentAdminId))
        setEditResolvedAdminDetails({
          _id: String(currentAdminId),
          firstName: (selectedSchool.adminId as any).firstName || '',
          lastName: (selectedSchool.adminId as any).lastName || '',
          email: (selectedSchool.adminId as any).email || ''
        })
      }
    }
  }, [isEditDialogOpen, selectedSchool])

  const handleCreateSchool = async () => {
    if (!validateSchoolFields(createForm, isSchoolPhoneValid, setCreateErrors, currentYear)) {
      return
    }

    try {
      setIsCreateSubmitting(true)

      const adminIdToSubmit = resolvedAdminId || createForm.adminId?.trim()

      const schoolData = buildSchoolPayload(createForm, adminIdToSubmit)

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token") || localStorage.getItem("accessToken") || localStorage.getItem("authToken")
          : null

      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/schools`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(schoolData),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success("School created successfully")
        setIsCreateDialogOpen(false)
        setCreateForm(createDefaultSchoolForm())
        setCreateErrors({})
        setGradeTagInput("")
        setResolvedAdminId("")
        setResolvedAdminDetails(null)
        setSelectedAdminId("")
        setAdminMode("existing")
        setAdminForm(createDefaultAdminForm())
        setAdminErrors({})
        setIsAdminPhoneValid(false)
        setIsSchoolPhoneValid(false)
        setAdminPhoneCountry("us")
        setSchoolPhoneCountry("us")
        setCurrentStep(1)
        fetchSchools(currentPage, pageSize, debouncedSearch)
        fetchSchoolStats()
      } else {
        toast.error(result?.message || "Failed to create school")
      }
    } catch (error) {
      console.error("Error creating school:", error)
      toast.error("Failed to create school")
    } finally {
      setIsCreateSubmitting(false)
    }
  }

  const resetAdminFormState = () => {
    setAdminForm(createDefaultAdminForm())
    setAdminErrors({})
    setIsAdminPhoneValid(false)
    setAdminPhoneCountry("us")
    setShowAdminPassword(false)
    setShowAdminConfirmPassword(false)
  }

  const clearAdminError = (key: string) => {
    setAdminErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const clearCreateError = (key: string) => {
    setCreateErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const handleAdminModeChange = (mode: "existing" | "new") => {
    setAdminMode(mode)
    setAdminErrors({})
    if (mode === "existing") {
      resetAdminFormState()
      setSelectedAdminId(resolvedAdminId || "")
    } else {
      setSelectedAdminId("")
      setResolvedAdminId("")
      setResolvedAdminDetails(null)
      setCreateForm((prev) => ({ ...prev, adminId: "" }))
    }
  }

  const validateExistingAdminSelection = () => {
    if (!selectedAdminId) {
      setAdminErrors({ selectedAdminId: "Please choose an admin" })
      return false
    }
    setAdminErrors({})
    return true
  }

  const validateNewAdminForm = () => {
    const errors: Record<string, string> = {}
    if (!adminForm.firstName.trim()) errors.firstName = "First name is required"
    if (!adminForm.lastName.trim()) errors.lastName = "Last name is required"
    if (!adminForm.email.trim()) errors.email = "Email is required"
    else if (!emailRegex.test(adminForm.email.trim())) errors.email = "Enter a valid email"

    if (!adminForm.password.trim()) errors.password = "Temporary password is required"
    else {
      if (adminForm.password.length < 8) errors.password = "Password must be at least 8 characters"
      const hasUpper = /[A-Z]/.test(adminForm.password)
      const hasLower = /[a-z]/.test(adminForm.password)
      const hasNumber = /\d/.test(adminForm.password)
      if (!hasUpper || !hasLower || !hasNumber) {
        errors.password = "Password must include upper, lower case letters and a number"
      }
    }

    if (!adminForm.confirmPassword.trim()) {
      errors.confirmPassword = "Confirm the password"
    } else if (adminForm.password !== adminForm.confirmPassword) {
      errors.confirmPassword = "Passwords do not match"
    }

    if (!adminForm.phone.trim()) {
      errors.phone = "Phone number is required"
    } else if (!isAdminPhoneValid) {
      errors.phone = "Enter a valid phone number"
    }

    setAdminErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAdminStepContinue = async (e?: React.MouseEvent) => {
    // Prevent any default form submission
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    console.log("=== handleAdminStepContinue START ===")
    console.log("adminMode:", adminMode)
    console.log("selectedAdminId:", selectedAdminId)
    console.log("currentStep:", currentStep)
    
    if (adminMode === "existing") {
      console.log("✓ Existing admin mode detected")
      
      // Validate first
      const isValid = validateExistingAdminSelection()
      console.log("Validation result:", isValid)
      
      if (!isValid) {
        console.log("✗ Validation failed - stopping")
        return
      }
      
      console.log("✓ Validation passed, setting loading state")
      
      // Set loading state immediately after validation passes
      setIsAdminSubmitting(true)
      
      // Clear any previous errors
      setAdminErrors({})
      
      // Check if the selected admin is already assigned to a school
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("token") || localStorage.getItem("accessToken") || localStorage.getItem("authToken")
            : null

        if (!token) {
          console.error("✗ No token found")
          toast.error("Authentication token not found. Please login again.")
          setIsAdminSubmitting(false)
          return
        }

        if (!selectedAdminId || selectedAdminId.trim() === "") {
          console.error("✗ No admin ID selected")
          toast.error("Please select an admin")
          setIsAdminSubmitting(false)
          return
        }

        const apiUrl = `${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/users/${selectedAdminId}`
        console.log("=== STARTING API CALL ===")
        console.log("API URL:", apiUrl)
        console.log("Admin ID:", selectedAdminId)
        
        // Fetch the admin details to check if they have a schoolId
        const adminResponse = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        console.log("=== API CALL COMPLETED ===")
        console.log("Response status:", adminResponse.status)
        console.log("Response ok:", adminResponse.ok)

        if (!adminResponse.ok) {
          const errorData = await adminResponse.json().catch(() => ({}))
          const errorMessage = errorData.message || errorData.error || "Failed to fetch admin details"
          toast.error(errorMessage)
          setAdminErrors({ selectedAdminId: errorMessage })
          setIsAdminSubmitting(false)
          return
        }

        const adminData = await adminResponse.json()
        console.log("Admin data received:", adminData)
        const admin = adminData?.data || adminData

        if (!admin) {
          toast.error("Admin not found")
          setAdminErrors({ selectedAdminId: "Admin not found" })
          setIsAdminSubmitting(false)
          return
        }

        // Check if admin has a schoolId assigned (can be string ID or populated object)
        const adminSchoolId = typeof admin.schoolId === 'object' && admin.schoolId?._id 
          ? admin.schoolId._id 
          : admin.schoolId

        console.log("Admin schoolId:", adminSchoolId)

        if (adminSchoolId) {
          // Admin is already assigned, get school name
          let schoolName = "a school"
          if (typeof admin.schoolId === 'object' && admin.schoolId?.name) {
            // schoolId is populated with name
            schoolName = admin.schoolId.name
          } else {
            // Need to fetch school name
            try {
              const schoolResponse = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/schools/${adminSchoolId}`, {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              })
              if (schoolResponse.ok) {
                const schoolData = await schoolResponse.json()
                schoolName = schoolData?.data?.name || schoolData?.name || "a school"
              }
            } catch (err) {
              console.error("Error fetching school name:", err)
            }
          }

          toast.error(`This admin is already assigned to ${schoolName}. An admin can only be assigned to one school.`)
          setAdminErrors({ selectedAdminId: "This admin is already assigned to a school" })
          setIsAdminSubmitting(false)
          return
        }

        // Also verify by checking schools endpoint to ensure no school has this adminId
        const checkResponse = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/schools?page=1&limit=1000`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        if (checkResponse.ok) {
          const checkData = await checkResponse.json()
          const payload = checkData?.data || checkData || {}
          const schoolsList = Array.isArray(payload?.schools) 
            ? payload.schools 
            : Array.isArray(checkData?.schools) 
              ? checkData.schools 
              : Array.isArray(checkData?.data) 
                ? checkData.data 
                : []

          // Check if any school has this admin assigned
          const assignedSchool = schoolsList.find((school: School) => {
            if (!school.adminId) return false
            if (typeof school.adminId === 'string') {
              return school.adminId === selectedAdminId
            }
            if (typeof school.adminId === 'object' && school.adminId._id) {
              return school.adminId._id === selectedAdminId
            }
            return false
          })

          if (assignedSchool) {
            const schoolName = assignedSchool.name || "another school"
            toast.error(`This admin is already assigned to ${schoolName}. An admin can only be assigned to one school.`)
            setAdminErrors({ selectedAdminId: "This admin is already assigned to a school" })
            setIsAdminSubmitting(false)
            return
          }
        } else {
          console.warn("Failed to verify schools list, but admin.schoolId check passed")
        }

        // Admin is not assigned, show success message and proceed to step 2
        console.log("Admin is not assigned, proceeding to step 2")
        toast.success("This admin can be assigned to the school. Proceeding to school details.")
        setResolvedAdminId(selectedAdminId)
        const found = admins.find((admin) => admin._id === selectedAdminId)
        setResolvedAdminDetails(found || null)
        setCreateForm((prev) => ({ ...prev, adminId: selectedAdminId }))
        setIsAdminSubmitting(false)
        setCurrentStep(2)
      } catch (error: any) {
        console.error("Error checking admin assignment:", error)
        console.error("Error stack:", error?.stack)
        const errorMessage = error?.message || "Failed to verify admin assignment. Please try again."
        toast.error(errorMessage)
        setAdminErrors({ selectedAdminId: errorMessage })
        setIsAdminSubmitting(false)
      }
      return
    }

    if (!validateNewAdminForm()) return

    try {
      setIsAdminSubmitting(true)
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token") || localStorage.getItem("accessToken") || localStorage.getItem("authToken")
          : null

      const payload: Record<string, any> = {
        firstName: adminForm.firstName.trim(),
        lastName: adminForm.lastName.trim(),
        email: adminForm.email.trim().toLowerCase(),
        password: adminForm.password,
        role: "ADMIN",
        isActive: true,
      }

      if (adminForm.phone.trim()) {
        payload.phone = adminForm.phone.trim()
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        const message = result?.message || "Failed to create admin"
        setAdminErrors((prev) => ({ ...prev, api: message }))
        toast.error(message)
        return
      }

      const createdAdminId = result?._id || result?.data?._id
      if (!createdAdminId) {
        toast.error("Could not determine newly created admin ID")
        return
      }

      const adminDetails = {
        _id: createdAdminId,
        firstName: result?.firstName || adminForm.firstName.trim(),
        lastName: result?.lastName || adminForm.lastName.trim(),
        email: result?.email || adminForm.email.trim().toLowerCase(),
      }

      toast.success("Admin created successfully")
      setResolvedAdminId(createdAdminId)
      setResolvedAdminDetails(adminDetails)
      setSelectedAdminId(createdAdminId)
      setCreateForm((prev) => ({ ...prev, adminId: createdAdminId }))
      resetAdminFormState()
      fetchAdmins()
      setCurrentStep(2)
    } catch (error) {
      console.error("Error creating admin:", error)
      toast.error("Failed to create admin")
    } finally {
      setIsAdminSubmitting(false)
    }
  }

  const handleAdminStepBack = () => {
    setCurrentStep(1)
    setAdminMode("existing")
    setAdminErrors({})
    setSelectedAdminId(resolvedAdminId)
  }

  const addGradeLevelTag = () => {
    const value = gradeTagInput.trim()
    if (!value) return
    const formatted = value.toUpperCase()
    setCreateForm((prev) => ({
      ...prev,
      gradelevels: Array.from(new Set([...(prev.gradelevels || []), formatted])),
    }))
    setGradeTagInput("")
    setCreateErrors((prev) => {
      if (!prev.gradelevels) return prev
      const next = { ...prev }
      delete next.gradelevels
      return next
    })
  }

  const removeGradeLevelTag = (index: number) => {
    setCreateForm((prev) => {
      const nextLevels = [...(prev.gradelevels || [])]
      nextLevels.splice(index, 1)
      return { ...prev, gradelevels: nextLevels }
    })
    setCreateErrors((prev) => {
      if (!prev.gradelevels) return prev
      const next = { ...prev }
      delete next.gradelevels
      return next
    })
  }

  const mapSchoolToForm = (school: School): CreateSchoolForm => ({
    name: school.name || "",
    code: school.code || "",
    type: school.type || "PUBLIC",
    address: {
      street: school.address?.street || "",
      city: school.address?.city || "",
      state: school.address?.state || "",
      zipCode: school.address?.zipCode || "",
      country: school.address?.country || "",
    },
    phone: school.phone || "",
    email: school.email || "",
    website: school.website || "",
    adminId: school.adminId?._id || "",
    establishedYear: school.establishedYear || currentYear,
    studentCapacity: school.studentCapacity && school.studentCapacity > 0 ? school.studentCapacity : "",
    gradelevels: Array.isArray(school.gradelevels) ? school.gradelevels : [],
    academicYearStart: school.academicYearStart ? school.academicYearStart.slice(0, 10) : "",
    academicYearEnd: school.academicYearEnd ? school.academicYearEnd.slice(0, 10) : "",
    isActive: Boolean(school.isActive),
    maxStudentsPerClass: (school as any).maxStudentsPerClass || school.settings?.maxStudentsPerClass || "",
  })

  const clearEditError = (key: string) => {
    setEditErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const clearEditAdminError = (key: string) => {
    setEditAdminErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const handleEditAdminModeChange = (mode: "existing" | "new") => {
    setEditAdminMode(mode)
    setEditAdminErrors({})
    if (mode === "existing") {
      setEditAdminForm(createDefaultAdminForm())
      // Keep current selection if exists, otherwise use resolved admin
      setEditSelectedAdminId(editSelectedAdminId || editResolvedAdminId || "")
    } else {
      setEditSelectedAdminId("")
      setEditResolvedAdminId("")
      setEditResolvedAdminDetails(null)
      setEditForm((prev) => (prev ? { ...prev, adminId: "" } : prev))
    }
  }

  const validateEditExistingAdminSelection = () => {
    if (!editSelectedAdminId) {
      setEditAdminErrors({ selectedAdminId: "Please choose an admin" })
      return false
    }
    setEditAdminErrors({})
    return true
  }

  const validateEditNewAdminForm = () => {
    const errors: Record<string, string> = {}
    if (!editAdminForm.firstName.trim()) errors.firstName = "First name is required"
    if (!editAdminForm.lastName.trim()) errors.lastName = "Last name is required"
    if (!editAdminForm.email.trim()) errors.email = "Email is required"
    else if (!emailRegex.test(editAdminForm.email.trim())) errors.email = "Enter a valid email"

    if (!editAdminForm.password.trim()) errors.password = "Temporary password is required"
    else {
      if (editAdminForm.password.length < 8) errors.password = "Password must be at least 8 characters"
      const hasUpper = /[A-Z]/.test(editAdminForm.password)
      const hasLower = /[a-z]/.test(editAdminForm.password)
      const hasNumber = /\d/.test(editAdminForm.password)
      if (!hasUpper || !hasLower || !hasNumber) {
        errors.password = "Password must include upper, lower case letters and a number"
      }
    }

    if (!editAdminForm.confirmPassword.trim()) {
      errors.confirmPassword = "Confirm the password"
    } else if (editAdminForm.password !== editAdminForm.confirmPassword) {
      errors.confirmPassword = "Passwords do not match"
    }

    if (!editAdminForm.phone.trim()) {
      errors.phone = "Phone number is required"
    } else if (!isEditAdminPhoneValid) {
      errors.phone = "Enter a valid phone number"
    }

    setEditAdminErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleEditAdminContinue = async () => {
    if (editAdminMode === "existing") {
      if (!validateEditExistingAdminSelection()) {
        return
      }

      setIsEditAdminSubmitting(true)
      setEditAdminErrors({})

      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("token") || localStorage.getItem("accessToken") || localStorage.getItem("authToken")
            : null

        if (!token) {
          toast.error("Authentication token not found. Please login again.")
          setIsEditAdminSubmitting(false)
          return
        }

        // For edit, we allow selecting the current admin or an unassigned admin
        // Check if admin is assigned to a different school
        const adminResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/users/${editSelectedAdminId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (!adminResponse.ok) {
          const errorData = await adminResponse.json().catch(() => ({}))
          const errorMessage = errorData.message || errorData.error || "Failed to fetch admin details"
          toast.error(errorMessage)
          setEditAdminErrors({ selectedAdminId: errorMessage })
          setIsEditAdminSubmitting(false)
          return
        }

        const adminData = await adminResponse.json()
        const admin = adminData?.data || adminData

        if (!admin) {
          toast.error("Admin not found")
          setEditAdminErrors({ selectedAdminId: "Admin not found" })
          setIsEditAdminSubmitting(false)
          return
        }

        // Check if admin is assigned to a different school
        const adminSchoolId = typeof admin.schoolId === 'object' && admin.schoolId?._id 
          ? admin.schoolId._id 
          : admin.schoolId

        const currentSchoolId = selectedSchool?._id

        if (adminSchoolId && String(adminSchoolId) !== String(currentSchoolId)) {
          let schoolName = "another school"
          if (typeof admin.schoolId === 'object' && admin.schoolId?.name) {
            schoolName = admin.schoolId.name
          } else {
            try {
              const schoolResponse = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/schools/${adminSchoolId}`, {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              })
              if (schoolResponse.ok) {
                const schoolData = await schoolResponse.json()
                schoolName = schoolData?.data?.name || schoolData?.name || "another school"
              }
            } catch (err) {
              console.error("Error fetching school name:", err)
            }
          }

          toast.error(`This admin is already assigned to ${schoolName}. An admin can only be assigned to one school.`)
          setEditAdminErrors({ selectedAdminId: "This admin is already assigned to another school" })
          setIsEditAdminSubmitting(false)
          return
        }

        // Admin is valid (either current admin or unassigned)
        setEditResolvedAdminId(editSelectedAdminId)
        const found = availableAdminsForEdit.find((admin) => admin._id === editSelectedAdminId)
        setEditResolvedAdminDetails(found || {
          _id: editSelectedAdminId,
          firstName: admin.firstName || '',
          lastName: admin.lastName || '',
          email: admin.email || ''
        })
        setEditForm((prev) => (prev ? { ...prev, adminId: editSelectedAdminId } : prev))
        setIsEditAdminSubmitting(false)
        toast.success("Admin selected successfully")
      } catch (error: any) {
        console.error("Error checking admin assignment:", error)
        const errorMessage = error?.message || "Failed to verify admin assignment. Please try again."
        toast.error(errorMessage)
        setEditAdminErrors({ selectedAdminId: errorMessage })
        setIsEditAdminSubmitting(false)
      }
      return
    }

    if (!validateEditNewAdminForm()) {
      setIsEditAdminSubmitting(false)
      return
    }

    try {
      setIsEditAdminSubmitting(true)
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token") || localStorage.getItem("accessToken") || localStorage.getItem("authToken")
          : null

      const payload: Record<string, any> = {
        firstName: editAdminForm.firstName.trim(),
        lastName: editAdminForm.lastName.trim(),
        email: editAdminForm.email.trim().toLowerCase(),
        password: editAdminForm.password,
        role: "ADMIN",
        isActive: true,
      }

      if (editAdminForm.phone.trim()) {
        payload.phone = editAdminForm.phone.trim()
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        const message = result?.message || "Failed to create admin"
        setEditAdminErrors((prev) => ({ ...prev, api: message }))
        toast.error(message)
        setIsEditAdminSubmitting(false)
        return
      }

      const createdAdminId = result?._id || result?.data?._id
      if (!createdAdminId) {
        toast.error("Could not determine newly created admin ID")
        return
      }

      const adminDetails = {
        _id: createdAdminId,
        firstName: result?.firstName || editAdminForm.firstName.trim(),
        lastName: result?.lastName || editAdminForm.lastName.trim(),
        email: result?.email || editAdminForm.email.trim().toLowerCase(),
      }

      toast.success("Admin created successfully")
      setEditResolvedAdminId(createdAdminId)
      setEditResolvedAdminDetails(adminDetails)
      setEditSelectedAdminId(createdAdminId)
      setEditForm((prev) => (prev ? { ...prev, adminId: createdAdminId } : prev))
      setEditAdminForm(createDefaultAdminForm())
      setEditAdminErrors({})
      setIsEditAdminPhoneValid(false)
      setEditAdminPhoneCountry("us")
      setShowEditAdminPassword(false)
      setShowEditAdminConfirmPassword(false)
      fetchAdmins()
    } catch (error) {
      console.error("Error creating admin:", error)
      toast.error("Failed to create admin")
    } finally {
      setIsEditAdminSubmitting(false)
    }
  }

  const addEditGradeLevelTag = () => {
    const value = editGradeTagInput.trim()
    if (!value || !editForm) return
    const formatted = value.toUpperCase()
    setEditForm((prev) => {
      if (!prev) return prev
      const updated = Array.from(new Set([...(prev.gradelevels || []), formatted]))
      return { ...prev, gradelevels: updated }
    })
    setEditGradeTagInput("")
    clearEditError("gradelevels")
  }

  const removeEditGradeLevelTag = (index: number) => {
    setEditForm((prev) => {
      if (!prev) return prev
      const nextLevels = [...(prev.gradelevels || [])]
      nextLevels.splice(index, 1)
      return { ...prev, gradelevels: nextLevels }
    })
    clearEditError("gradelevels")
  }

  const openEditDialog = (school: School) => {
    const safeSchool: School = {
      ...school,
      address: school.address || {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
      },
      gradelevels: Array.isArray(school.gradelevels) ? school.gradelevels : [],
    }

    setSelectedSchool(safeSchool)
    const form = mapSchoolToForm(safeSchool)
    setEditForm(form)
    setEditErrors({})
    setEditGradeTagInput("")
    const digitsOnly = (form.phone || "").replace(/[^\d]/g, "")
    setIsEditPhoneValid(digitsOnly.length >= 10 && digitsOnly.length <= 15)
    setEditPhoneCountry(deriveIsoCountryCode(safeSchool.address?.country))
    setIsEditSubmitting(false)
    setIsEditDialogOpen(true)
  }

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return
    setCurrentPage(page)
  }

  const handlePageSizeChange = (value: number) => {
    if (value === pageSize) return
    setPageSize(value)
    setCurrentPage(1)
  }

  const handleUpdateSchool = async () => {
    if (!selectedSchool || !editForm) return

    if (!validateSchoolFields(editForm, isEditPhoneValid, setEditErrors, currentYear)) {
      return
    }

    // Only use resolved admin ID - if admin is not resolved, keep the existing admin
    // This makes admin update optional - user must click "Update Admin" or "Save New Admin" button first
    const adminIdToSubmit = editResolvedAdminId || editForm.adminId?.trim() || (selectedSchool.adminId ? (typeof selectedSchool.adminId === 'object' ? (selectedSchool.adminId as any)._id : selectedSchool.adminId) : null)
    
    try {
      setIsEditSubmitting(true)
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token") || localStorage.getItem("accessToken") || localStorage.getItem("authToken")
          : null

      const payload = buildSchoolPayload(editForm, adminIdToSubmit)
      
      // Ensure adminId is always included if we have one
      if (adminIdToSubmit && !payload.adminId) {
        payload.adminId = adminIdToSubmit
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/schools/${selectedSchool._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(result?.message || "School updated successfully")
        setIsEditDialogOpen(false)
        fetchSchools(currentPage, pageSize, debouncedSearch)
        fetchSchoolStats()
      } else {
        toast.error(result?.message || "Failed to update school")
      }
    } catch (error) {
      console.error("Error updating school:", error)
      toast.error("Failed to update school")
    } finally {
      setIsEditSubmitting(false)
    }
  }

  const handleDeleteSchool = async (schoolId: string) => {
    setSchoolToDelete(schoolId)
    setIsDeleteDialogOpen(true)
    setIsDeleting(false)
  }

  const confirmDeleteSchool = async () => {
    if (!schoolToDelete) return

    try {
      setIsDeleting(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/schools/${schoolToDelete}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("School deleted successfully")
        const shouldMovePrev = schools.length <= 1 && currentPage > 1
        const targetPage = shouldMovePrev ? currentPage - 1 : currentPage
        if (shouldMovePrev) {
          setCurrentPage(targetPage)
        } else {
          fetchSchools(targetPage, pageSize, debouncedSearch)
        }
        fetchSchoolStats()
        setIsDeleteDialogOpen(false)
        setSchoolToDelete(null)
      } else {
        toast.error("Failed to delete school")
      }
    } catch (error) {
      console.error("Error deleting school:", error)
      toast.error("Failed to delete school")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">School Management</h2>
          <p className="text-muted-foreground">
            Manage educational institutions in the system
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add School
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{currentStep === 1 ? "Assign School Admin" : "Create New School"}</DialogTitle>
              <DialogDescription>
                {currentStep === 1
                  ? "Choose an existing admin or create a new admin for this school."
                  : "Provide the school details. Required fields display inline errors in red."}
              </DialogDescription>
            </DialogHeader>

            {currentStep === 1 ? (
              <div className="space-y-6 py-4">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant={adminMode === "existing" ? "default" : "outline"}
                    onClick={() => handleAdminModeChange("existing")}
                    className="w-full sm:w-auto"
                  >
                    Use Existing Admin
                  </Button>
                  <Button
                    variant={adminMode === "new" ? "default" : "outline"}
                    onClick={() => handleAdminModeChange("new")}
                    className="w-full sm:w-auto"
                  >
                    Create New Admin
                  </Button>
                </div>

                {adminMode === "existing" ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="existing-admin">Select Admin *</Label>
                      <Select
                        value={selectedAdminId}
                        onValueChange={(value) => {
                          setSelectedAdminId(value)
                          clearAdminError("selectedAdminId")
                        }}
                        disabled={areAdminsLoading || availableAdmins.length === 0}
                      >
                        <SelectTrigger id="existing-admin" className={adminErrors.selectedAdminId ? "border-red-500" : ""}>
                          <SelectValue placeholder={areAdminsLoading ? "Loading admins..." : availableAdmins.length ? "Choose an admin" : "No admins available"} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableAdmins.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-muted-foreground">
                              {areAdminsLoading ? "Loading admins..." : "No unassigned admins available"}
                            </div>
                          ) : (
                            availableAdmins.map((admin) => (
                              <SelectItem key={admin._id} value={admin._id}>
                                {admin.firstName} {admin.lastName} ({admin.email})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {adminErrors.selectedAdminId && (
                        <p className="text-sm text-red-500">{adminErrors.selectedAdminId}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      {areAdminsLoading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Loading admins...
                        </span>
                      ) : (
                        <span>
                          {availableAdmins.length
                            ? `${availableAdmins.length} admin${availableAdmins.length === 1 ? "" : "s"} available`
                            : "No unassigned admins found"}
                        </span>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={fetchAdmins}
                        disabled={areAdminsLoading}
                      >
                        {areAdminsLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Refreshing
                          </>
                        ) : (
                          "Refresh list"
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="admin-first-name">First Name *</Label>
                        <Input
                          id="admin-first-name"
                          value={adminForm.firstName}
                          onChange={(e) => {
                            setAdminForm((prev) => ({ ...prev, firstName: e.target.value }))
                            clearAdminError("firstName")
                          }}
                          placeholder="Jane"
                          className={adminErrors.firstName ? "border-red-500" : ""}
                        />
                        {adminErrors.firstName && (
                          <p className="text-sm text-red-500">{adminErrors.firstName}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admin-last-name">Last Name *</Label>
                        <Input
                          id="admin-last-name"
                          value={adminForm.lastName}
                          onChange={(e) => {
                            setAdminForm((prev) => ({ ...prev, lastName: e.target.value }))
                            clearAdminError("lastName")
                          }}
                          placeholder="Doe"
                          className={adminErrors.lastName ? "border-red-500" : ""}
                        />
                        {adminErrors.lastName && (
                          <p className="text-sm text-red-500">{adminErrors.lastName}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="admin-email">Email *</Label>
                      <Input
                        id="admin-email"
                        type="email"
                        value={adminForm.email}
                        onChange={(e) => {
                          setAdminForm((prev) => ({ ...prev, email: e.target.value }))
                          clearAdminError("email")
                        }}
                        placeholder="admin@example.com"
                        className={adminErrors.email ? "border-red-500" : ""}
                      />
                      {adminErrors.email && (
                        <p className="text-sm text-red-500">{adminErrors.email}</p>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="admin-password">Temporary Password *</Label>
                        <div className="relative">
                          <Input
                            id="admin-password"
                            type={showAdminPassword ? "text" : "password"}
                            value={adminForm.password}
                            onChange={(e) => {
                              setAdminForm((prev) => ({ ...prev, password: e.target.value }))
                              clearAdminError("password")
                            }}
                            placeholder="Temporary password"
                            className={`pr-10 ${adminErrors.password ? "border-red-500" : ""}`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowAdminPassword((prev) => !prev)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                          >
                            {showAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {adminErrors.password && (
                          <p className="text-sm text-red-500">{adminErrors.password}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admin-confirm-password">Confirm Password *</Label>
                        <div className="relative">
                          <Input
                            id="admin-confirm-password"
                            type={showAdminConfirmPassword ? "text" : "password"}
                            value={adminForm.confirmPassword}
                            onChange={(e) => {
                              setAdminForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                              clearAdminError("confirmPassword")
                            }}
                            placeholder="Re-enter password"
                            className={`pr-10 ${adminErrors.confirmPassword ? "border-red-500" : ""}`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowAdminConfirmPassword((prev) => !prev)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                          >
                            {showAdminConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {adminErrors.confirmPassword && (
                          <p className="text-sm text-red-500">{adminErrors.confirmPassword}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Phone Number *</Label>
                      <div className={`rounded-md ${adminErrors.phone ? "border border-red-500" : ""}`}>
                        <PhoneInput
                          country={adminPhoneCountry as any}
                          value={adminForm.phone}
                          onChange={(phone) => {
                            setAdminForm((prev) => ({ ...prev, phone }))
                            const digitsOnly = phone.replace(/[^\d]/g, "")
                            const isValid = digitsOnly.length >= 10 && digitsOnly.length <= 15
                            setIsAdminPhoneValid(isValid)
                            if (isValid) {
                              clearAdminError("phone")
                            }
                          }}
                          inputClass={`w-full !h-10 !text-sm !pl-12 ${adminErrors.phone ? "!border-red-500" : ""}`}
                          buttonClass={adminErrors.phone ? "!border-red-500" : ""}
                          dropdownClass="!z-50"
                          containerClass="phone-input-container w-full"
                          specialLabel=""
                          enableSearch
                          disableSearchIcon={false}
                          countryCodeEditable={false}
                        />
                      </div>
                      {adminErrors.phone && (
                        <p className="text-sm text-red-500">{adminErrors.phone}</p>
                      )}
                    </div>

                    {adminErrors.api && (
                      <p className="text-sm text-red-500">{adminErrors.api}</p>
                    )}
                  </div>
                )}

                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isAdminSubmitting}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={async (e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      await handleAdminStepContinue(e)
                    }}
                    disabled={isAdminSubmitting || (adminMode === "existing" && areAdminsLoading)}
                    className="min-w-[120px]"
                  >
                    {isAdminSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Continue"
                    )}
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-6 py-4">
                {resolvedAdminDetails && (
                  <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                    Assigning admin: <span className="font-semibold">{resolvedAdminDetails.firstName} {resolvedAdminDetails.lastName}</span> ({resolvedAdminDetails.email})
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="school-name">School Name *</Label>
                    <Input
                      id="school-name"
                      value={createForm.name}
                      onChange={(e) => {
                        setCreateForm((prev) => ({ ...prev, name: e.target.value }))
                        clearCreateError("name")
                      }}
                      placeholder="Greenwood High School"
                      className={createErrors.name ? "border-red-500" : ""}
                    />
                    {createErrors.name && <p className="text-sm text-red-500">{createErrors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="school-code">School Code (optional)</Label>
                    <Input
                      id="school-code"
                      value={createForm.code}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, code: e.target.value }))}
                      placeholder="Auto-generated if left empty"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="school-type">School Type</Label>
                    <select
                      id="school-type"
                      value={createForm.type}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, type: e.target.value }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="PUBLIC">Public</option>
                      <option value="PRIVATE">Private</option>
                      <option value="CHARTER">Charter</option>
                      <option value="INTERNATIONAL">International</option>
                      <option value="TRADE_SCHOOL">Trade School</option>
                      <option value="VOCATIONAL">Vocational</option>
                      <option value="TECHNICAL">Technical</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="established-year">Established Year *</Label>
                    <Input
                      id="established-year"
                      type="number"
                      min="1800"
                      max={currentYear}
                      value={createForm.establishedYear}
                      onChange={(e) => {
                        const value = e.target.value
                        const numeric = value ? Number(value) : 0
                        setCreateForm((prev) => ({ ...prev, establishedYear: numeric }))
                        clearCreateError("establishedYear")
                      }}
                      placeholder={`e.g., ${currentYear}`}
                      className={createErrors.establishedYear ? "border-red-500" : ""}
                    />
                    {createErrors.establishedYear && (
                      <p className="text-sm text-red-500">{createErrors.establishedYear}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Address *</Label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Input
                        placeholder="Street Address"
                        value={createForm.address.street}
                        onChange={(e) => {
                          const value = e.target.value
                          setCreateForm((prev) => ({
                            ...prev,
                            address: { ...prev.address, street: value },
                          }))
                          clearCreateError("street")
                        }}
                        className={createErrors.street ? "border-red-500" : ""}
                      />
                      {createErrors.street && <p className="text-sm text-red-500">{createErrors.street}</p>}
                    </div>
                    <div className="space-y-2">
                      <Input
                        placeholder="City"
                        value={createForm.address.city}
                        onChange={(e) => {
                          const value = e.target.value
                          setCreateForm((prev) => ({
                            ...prev,
                            address: { ...prev.address, city: value },
                          }))
                          clearCreateError("city")
                        }}
                        className={createErrors.city ? "border-red-500" : ""}
                      />
                      {createErrors.city && <p className="text-sm text-red-500">{createErrors.city}</p>}
                    </div>
                    <div className="space-y-2">
                      <Input
                        placeholder="State"
                        value={createForm.address.state}
                        onChange={(e) => {
                          const value = e.target.value
                          setCreateForm((prev) => ({
                            ...prev,
                            address: { ...prev.address, state: value },
                          }))
                          clearCreateError("state")
                        }}
                        className={createErrors.state ? "border-red-500" : ""}
                      />
                      {createErrors.state && <p className="text-sm text-red-500">{createErrors.state}</p>}
                    </div>
                    <div className="space-y-2">
                      <Input
                        placeholder="ZIP Code"
                        value={createForm.address.zipCode}
                        onChange={(e) => {
                          const value = e.target.value
                          setCreateForm((prev) => ({
                            ...prev,
                            address: { ...prev.address, zipCode: value },
                          }))
                          clearCreateError("zipCode")
                        }}
                        className={createErrors.zipCode ? "border-red-500" : ""}
                      />
                      {createErrors.zipCode && <p className="text-sm text-red-500">{createErrors.zipCode}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country <span className="text-red-500">*</span></Label>
                    <CountrySelect
                      id="country"
                      value={createForm.address.country}
                      onValueChange={(value) => {
                        setCreateForm((prev) => ({
                          ...prev,
                          address: { ...prev.address, country: value },
                        }))
                        clearCreateError("country")
                      }}
                      placeholder="Select Country"
                      error={!!createErrors.country}
                      className={createErrors.country ? "border-red-500" : ""}
                    />
                    {createErrors.country && <p className="text-sm text-red-500">{createErrors.country}</p>}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Phone Number *</Label>
                    <div className={`rounded-md ${createErrors.phone ? "border border-red-500" : ""}`}>
                      <PhoneInput
                        country={schoolPhoneCountry as any}
                        value={createForm.phone}
                        onChange={(phone) => {
                          setCreateForm((prev) => ({ ...prev, phone }))
                          const digitsOnly = phone.replace(/[^\d]/g, "")
                          const isValid = digitsOnly.length >= 10 && digitsOnly.length <= 15
                          setIsSchoolPhoneValid(isValid)
                          if (isValid) {
                            clearCreateError("phone")
                          }
                        }}
                        inputClass={`w-full !h-10 !text-sm !pl-12 ${createErrors.phone ? "!border-red-500" : ""}`}
                        buttonClass={createErrors.phone ? "!border-red-500" : ""}
                        dropdownClass="!z-50"
                        containerClass="phone-input-container w-full"
                        specialLabel=""
                        enableSearch
                        disableSearchIcon={false}
                        countryCodeEditable={false}
                      />
                    </div>
                    {createErrors.phone && <p className="text-sm text-red-500">{createErrors.phone}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="school-email">Email <span className="text-red-500">*</span></Label>
                    <Input
                      id="school-email"
                      type="email"
                      value={createForm.email}
                      onChange={(e) => {
                        setCreateForm((prev) => ({ ...prev, email: e.target.value }))
                        clearCreateError("email")
                      }}
                      placeholder="contact@school.edu"
                      className={createErrors.email ? "border-red-500" : ""}
                    />
                    {createErrors.email && <p className="text-sm text-red-500">{createErrors.email}</p>}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="school-website">Website (optional)</Label>
                    <Input
                      id="school-website"
                      value={createForm.website}
                      onChange={(e) => {
                        setCreateForm((prev) => ({ ...prev, website: e.target.value }))
                        clearCreateError("website")
                      }}
                      placeholder="https://www.school.edu"
                      className={createErrors.website ? "border-red-500" : ""}
                    />
                    {createErrors.website && <p className="text-sm text-red-500">{createErrors.website}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="school-capacity">Student Capacity (optional)</Label>
                    <Input
                      id="school-capacity"
                      type="number"
                      min="100"
                      value={createForm.studentCapacity === "" ? "" : createForm.studentCapacity}
                      onChange={(e) => {
                        const value = e.target.value
                        // Keep empty string if empty, otherwise convert to number
                        const numeric = value === "" ? "" : (value ? Number(value) : "")
                        setCreateForm((prev) => ({ ...prev, studentCapacity: numeric as number | "" }))
                        if (createErrors.studentCapacity) {
                          setCreateErrors((prev) => {
                            const next = { ...prev }
                            delete next.studentCapacity
                            return next
                          })
                        }
                        // Also validate maxStudentsPerClass if capacity is set
                        if (numeric !== "" && typeof numeric === 'number' && 
                            createForm.maxStudentsPerClass !== "" && 
                            typeof createForm.maxStudentsPerClass === 'number' && 
                            createForm.maxStudentsPerClass > numeric) {
                          // Auto-adjust maxStudentsPerClass if it exceeds capacity
                          setCreateForm((prev) => ({ ...prev, maxStudentsPerClass: numeric }))
                        }
                      }}
                      placeholder="1000"
                      className={createErrors.studentCapacity ? "border-red-500" : ""}
                    />
                    {createErrors.studentCapacity && (
                      <p className="text-sm text-red-500">{createErrors.studentCapacity}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-students-per-class">Max Students Per Class <span className="text-red-500">*</span></Label>
                    <Input
                      id="max-students-per-class"
                      type="number"
                      min="1"
                      max={createForm.studentCapacity !== "" && typeof createForm.studentCapacity === 'number' ? createForm.studentCapacity : undefined}
                      value={createForm.maxStudentsPerClass === "" ? "" : createForm.maxStudentsPerClass}
                      onChange={(e) => {
                        const value = e.target.value
                        // Keep empty string if empty, otherwise convert to number
                        const numeric = value === "" ? "" : (value ? Number(value) : "")
                        setCreateForm((prev) => ({ ...prev, maxStudentsPerClass: numeric as number | "" }))
                        if (createErrors.maxStudentsPerClass) {
                          setCreateErrors((prev) => {
                            const next = { ...prev }
                            delete next.maxStudentsPerClass
                            return next
                          })
                        }
                      }}
                      placeholder="50"
                      className={createErrors.maxStudentsPerClass ? "border-red-500" : ""}
                    />
                    {createErrors.maxStudentsPerClass && (
                      <p className="text-sm text-red-500">{createErrors.maxStudentsPerClass}</p>
                    )}
                    {createForm.studentCapacity !== "" && typeof createForm.studentCapacity === 'number' && (
                      <p className="text-xs text-muted-foreground">
                        Maximum: {createForm.studentCapacity} (based on student capacity)
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="academic-year-start">Academic Year Start</Label>
                    <Input
                      id="academic-year-start"
                      type="date"
                      value={createForm.academicYearStart}
                      onChange={(e) => {
                        setCreateForm((prev) => ({ ...prev, academicYearStart: e.target.value }))
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="academic-year-end">Academic Year End</Label>
                    <Input
                      id="academic-year-end"
                      type="date"
                      value={createForm.academicYearEnd}
                      onChange={(e) => {
                        setCreateForm((prev) => ({ ...prev, academicYearEnd: e.target.value }))
                        clearCreateError("academicYearEnd")
                      }}
                      className={createErrors.academicYearEnd ? "border-red-500" : ""}
                    />
                    {createErrors.academicYearEnd && (
                      <p className="text-sm text-red-500">{createErrors.academicYearEnd}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="school-active"
                    checked={createForm.isActive}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="school-active" className="text-sm">
                    Active School
                  </Label>
                </div>

                {/* <div className="space-y-2">
                  <Label>Grade Levels <span className="text-red-500">*</span></Label>
                  <div className="space-y-2">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Input
                        value={gradeTagInput}
                        onChange={(e) => setGradeTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            addGradeLevelTag()
                          }
                        }}
                        placeholder="Grade 1, Grade 2"
                        className={`sm:flex-1 ${createErrors.gradelevels ? 'border-red-500' : ''}`}
                      />
                      <Button type="button" variant="outline" onClick={addGradeLevelTag} className="sm:w-auto">
                        Add grade
                      </Button>
                    </div>
                    {createErrors.gradelevels && (
                      <p className="text-sm text-red-600">{createErrors.gradelevels}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {createForm.gradelevels.length > 0 ? (
                        createForm.gradelevels.map((grade, index) => (
                          <span
                            key={`${grade}-${index}`}
                            className="flex items-center gap-1 rounded-full bg-gray-200 px-3 py-1 text-sm"
                          >
                            {grade}
                            <button
                              type="button"
                              onClick={() => removeGradeLevelTag(index)}
                              className="text-gray-600 transition hover:text-gray-800"
                              aria-label={`Remove ${grade}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">No grades added yet.</span>
                      )}
                    </div>
                  </div>
                </div> */}

                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={handleAdminStepBack} disabled={isCreateSubmitting}>
                    Back
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isCreateSubmitting}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateSchool} disabled={isCreateSubmitting} className="min-w-[140px]">
                    {isCreateSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create School"
                    )}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* School Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : (stats?.totalSchools ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">Schools across the district</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Schools</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : (stats?.activeSchools ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">Currently operating schools</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Schools</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : (stats?.inactiveSchools ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">Schools currently inactive</p>
          </CardContent>
        </Card>
        {/* <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Student Capacity</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : (stats?.totalStudentCapacity ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">Seats available across schools</p>
          </CardContent>
        </Card> */}
      </div>

      {/* Schools Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Schools</CardTitle>
              <CardDescription>
                Manage and monitor all educational institutions
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search schools..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>School Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Admin</TableHead>
                {/* <TableHead>Students</TableHead>/ */}
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schoolsLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-12">
                    <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Loading schools...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : schools.length > 0 ? (
                schools.map((school) => (
                  <TableRow key={school._id}>
                    <TableCell className="font-medium">{school.name || "—"}</TableCell>
                    <TableCell>{school.code || "—"}</TableCell>
                    <TableCell className="capitalize">{(school.type || "—").replace(/_/g, " ")}</TableCell>
                    <TableCell>
                      {school.address
                        ? [school.address.street, school.address.city, school.address.state, school.address.country]
                            .filter(Boolean)
                            .join(", ")
                        : "No address provided"}
                    </TableCell>
                    <TableCell>{school.phone || "—"}</TableCell>
                    <TableCell>
                      {school.adminId ? (
                        <div className="flex flex-col">
                          <span>{`${school.adminId.firstName || ""} ${school.adminId.lastName || ""}`.trim() || "—"}</span>
                          <span className="text-xs text-muted-foreground">{school.adminId.email}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not assigned</span>
                      )}
                    </TableCell>
                      {/* <TableCell>
                        {school.studentCapacity
                          ? `${school.currentStudentCount || 0} / ${school.studentCapacity}`
                          : school.currentStudentCount || 0}
                    </TableCell> */}
                    <TableCell>
                      <Badge variant={school.isActive ? "default" : "secondary"}>
                        {school.status ? school.status.toUpperCase() : school.isActive ? "ACTIVE" : "INACTIVE"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/super-admin/schools/view/${school._id}`)}
                          title="View Details"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(school)}
                          title="Edit"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSchool(school._id)}
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                    No schools found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows per page</span>
              <Select value={String(pageSize)} onValueChange={(value) => handlePageSizeChange(Number(value))}>
                <SelectTrigger className="h-9 w-[90px]">
                  <SelectValue placeholder={pageSize} />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 20, 50].map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || schoolsLoading}
              >
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
                      className="h-8 w-8 p-0"
                      disabled={schoolsLoading}
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
                disabled={currentPage === totalPages || schoolsLoading}
              >
                Next
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              {totalSchools === 0
                ? "No records to display"
                : `Showing ${((currentPage - 1) * pageSize) + 1} to ${Math.min(currentPage * pageSize, totalSchools)} of ${totalSchools} schools`}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit School Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open)
          if (!open) {
            setSelectedSchool(null)
            setEditForm(null)
            setEditErrors({})
            setEditGradeTagInput("")
            setIsEditPhoneValid(false)
            setIsEditSubmitting(false)
            setEditAdminMode("existing")
            setEditSelectedAdminId("")
            setEditResolvedAdminId("")
            setEditResolvedAdminDetails(null)
            setEditAdminForm(createDefaultAdminForm())
            setEditAdminErrors({})
            setIsEditAdminPhoneValid(false)
            setEditAdminPhoneCountry("us")
            setShowEditAdminPassword(false)
            setShowEditAdminConfirmPassword(false)
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit School</DialogTitle>
            <DialogDescription>
              Update school information. You can change the assigned admin if needed.
            </DialogDescription>
          </DialogHeader>
          {editForm ? (
            <div className="grid gap-4 py-4">
              {/* Admin Selection Section */}
              <div className="space-y-4 rounded-md border p-4">
                <Label className="text-sm font-medium">School Administrator</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant={editAdminMode === "existing" ? "default" : "outline"}
                    onClick={() => handleEditAdminModeChange("existing")}
                    className="w-full sm:w-auto"
                    disabled={isEditSubmitting || isEditAdminSubmitting}
                  >
                    Use Existing Admin
                  </Button>
                  <Button
                    variant={editAdminMode === "new" ? "default" : "outline"}
                    onClick={() => handleEditAdminModeChange("new")}
                    className="w-full sm:w-auto"
                    disabled={isEditSubmitting || isEditAdminSubmitting}
                  >
                    Create New Admin
                  </Button>
                </div>

                {editAdminMode === "existing" ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-existing-admin">Select Admin *</Label>
                      <Select
                        value={editSelectedAdminId}
                        onValueChange={(value) => {
                          setEditSelectedAdminId(value)
                          // Clear resolved admin ID when selection changes, so it gets resolved again on Save
                          if (value !== editResolvedAdminId) {
                            setEditResolvedAdminId("")
                            setEditResolvedAdminDetails(null)
                          }
                          clearEditAdminError("selectedAdminId")
                        }}
                        disabled={areAdminsLoading || availableAdminsForEdit.length === 0 || isEditSubmitting || isEditAdminSubmitting}
                      >
                        <SelectTrigger id="edit-existing-admin" className={editAdminErrors.selectedAdminId ? "border-red-500" : ""}>
                          <SelectValue placeholder={areAdminsLoading ? "Loading admins..." : availableAdminsForEdit.length ? "Choose an admin" : "No admins available"} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableAdminsForEdit.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-muted-foreground">
                              {areAdminsLoading ? "Loading admins..." : "No admins available"}
                            </div>
                          ) : (
                            availableAdminsForEdit.map((admin) => (
                              <SelectItem key={admin._id} value={admin._id}>
                                {admin.firstName} {admin.lastName} ({admin.email})
                                {selectedSchool?.adminId && String((selectedSchool.adminId as any)._id || selectedSchool.adminId) === String(admin._id) && " (Current)"}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {editAdminErrors.selectedAdminId && (
                        <p className="text-sm text-red-500">{editAdminErrors.selectedAdminId}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      {areAdminsLoading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Loading admins...
                        </span>
                      ) : (
                        <span>
                          {availableAdminsForEdit.length
                            ? `${availableAdminsForEdit.length} admin${availableAdminsForEdit.length === 1 ? "" : "s"} available` + 
                              (selectedSchool?.adminId ? " (including current)" : "")
                            : "No admins found"}
                        </span>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={fetchAdmins}
                        disabled={areAdminsLoading || isEditSubmitting || isEditAdminSubmitting}
                      >
                        {areAdminsLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Refreshing
                          </>
                        ) : (
                          "Refresh list"
                        )}
                      </Button>
                    </div>
                    {editResolvedAdminDetails && (
                      <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                        Selected admin: <span className="font-semibold">{editResolvedAdminDetails.firstName} {editResolvedAdminDetails.lastName}</span> ({editResolvedAdminDetails.email})
                      </div>
                    )}
                    
                    {/* Update Admin Button for Existing Admin - Only show when admin is selected but not resolved */}
                    {editSelectedAdminId && !editResolvedAdminId && (
                      <div className="flex justify-end pt-2">
                        <Button
                          type="button"
                          onClick={handleEditAdminContinue}
                          disabled={isEditSubmitting || isEditAdminSubmitting || areAdminsLoading}
                          className="min-w-[160px]"
                        >
                          {isEditAdminSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            "Update Admin"
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="edit-admin-first-name">First Name *</Label>
                        <Input
                          id="edit-admin-first-name"
                          value={editAdminForm.firstName}
                          onChange={(e) => {
                            setEditAdminForm((prev) => ({ ...prev, firstName: e.target.value }))
                            clearEditAdminError("firstName")
                          }}
                          placeholder="Jane"
                          className={editAdminErrors.firstName ? "border-red-500" : ""}
                          disabled={isEditSubmitting || isEditAdminSubmitting}
                        />
                        {editAdminErrors.firstName && (
                          <p className="text-sm text-red-500">{editAdminErrors.firstName}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-admin-last-name">Last Name *</Label>
                        <Input
                          id="edit-admin-last-name"
                          value={editAdminForm.lastName}
                          onChange={(e) => {
                            setEditAdminForm((prev) => ({ ...prev, lastName: e.target.value }))
                            clearEditAdminError("lastName")
                          }}
                          placeholder="Doe"
                          className={editAdminErrors.lastName ? "border-red-500" : ""}
                          disabled={isEditSubmitting || isEditAdminSubmitting}
                        />
                        {editAdminErrors.lastName && (
                          <p className="text-sm text-red-500">{editAdminErrors.lastName}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-admin-email">Email *</Label>
                      <Input
                        id="edit-admin-email"
                        type="email"
                        value={editAdminForm.email}
                        onChange={(e) => {
                          setEditAdminForm((prev) => ({ ...prev, email: e.target.value }))
                          clearEditAdminError("email")
                        }}
                        placeholder="admin@example.com"
                        className={editAdminErrors.email ? "border-red-500" : ""}
                        disabled={isEditSubmitting || isEditAdminSubmitting}
                      />
                      {editAdminErrors.email && (
                        <p className="text-sm text-red-500">{editAdminErrors.email}</p>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="edit-admin-password">Temporary Password *</Label>
                        <div className="relative">
                          <Input
                            id="edit-admin-password"
                            type={showEditAdminPassword ? "text" : "password"}
                            value={editAdminForm.password}
                            onChange={(e) => {
                              setEditAdminForm((prev) => ({ ...prev, password: e.target.value }))
                              clearEditAdminError("password")
                            }}
                            placeholder="Temporary password"
                            className={`pr-10 ${editAdminErrors.password ? "border-red-500" : ""}`}
                            disabled={isEditSubmitting || isEditAdminSubmitting}
                          />
                          <button
                            type="button"
                            onClick={() => setShowEditAdminPassword((prev) => !prev)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                          >
                            {showEditAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {editAdminErrors.password && (
                          <p className="text-sm text-red-500">{editAdminErrors.password}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-admin-confirm-password">Confirm Password *</Label>
                        <div className="relative">
                          <Input
                            id="edit-admin-confirm-password"
                            type={showEditAdminConfirmPassword ? "text" : "password"}
                            value={editAdminForm.confirmPassword}
                            onChange={(e) => {
                              setEditAdminForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                              clearEditAdminError("confirmPassword")
                            }}
                            placeholder="Re-enter password"
                            className={`pr-10 ${editAdminErrors.confirmPassword ? "border-red-500" : ""}`}
                            disabled={isEditSubmitting || isEditAdminSubmitting}
                          />
                          <button
                            type="button"
                            onClick={() => setShowEditAdminConfirmPassword((prev) => !prev)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                          >
                            {showEditAdminConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {editAdminErrors.confirmPassword && (
                          <p className="text-sm text-red-500">{editAdminErrors.confirmPassword}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Phone Number *</Label>
                      <div className={`rounded-md ${editAdminErrors.phone ? "border border-red-500" : ""}`}>
                        <PhoneInput
                          country={editAdminPhoneCountry as any}
                          value={editAdminForm.phone}
                          onChange={(phone) => {
                            setEditAdminForm((prev) => ({ ...prev, phone }))
                            const digitsOnly = phone.replace(/[^\d]/g, "")
                            const isValid = digitsOnly.length >= 10 && digitsOnly.length <= 15
                            setIsEditAdminPhoneValid(isValid)
                            if (isValid) {
                              clearEditAdminError("phone")
                            }
                          }}
                          inputClass={`w-full !h-10 !text-sm !pl-12 ${editAdminErrors.phone ? "!border-red-500" : ""}`}
                          buttonClass={editAdminErrors.phone ? "!border-red-500" : ""}
                          dropdownClass="!z-50"
                          containerClass="phone-input-container w-full"
                          specialLabel=""
                          enableSearch
                          disableSearchIcon={false}
                          countryCodeEditable={false}
                        />
                      </div>
                      {editAdminErrors.phone && (
                        <p className="text-sm text-red-500">{editAdminErrors.phone}</p>
                      )}
                    </div>

                    {editAdminErrors.api && (
                      <p className="text-sm text-red-500">{editAdminErrors.api}</p>
                    )}

                    {/* Save New Admin Button - Only show when form has changes */}
                    {(editAdminForm.firstName || editAdminForm.lastName || editAdminForm.email || editAdminForm.password || editAdminForm.phone) && (
                      <div className="flex justify-end pt-2">
                        <Button
                          type="button"
                          onClick={handleEditAdminContinue}
                          disabled={isEditSubmitting || isEditAdminSubmitting || areAdminsLoading}
                          className="min-w-[160px]"
                        >
                          {isEditAdminSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            "Save New Admin"
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">School Name *</Label>
                  <Input
                    id="edit-name"
                    value={editForm.name}
                    onChange={(e) => {
                      const value = e.target.value
                      setEditForm((prev) => (prev ? { ...prev, name: value } : prev))
                      clearEditError("name")
                    }}
                    placeholder="Greenwood High School"
                    className={editErrors.name ? "border-red-500" : ""}
                    disabled={isEditSubmitting}
                  />
                  {editErrors.name && <p className="text-sm text-red-500">{editErrors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-code">School Code</Label>
                  <Input
                    id="edit-code"
                    value={editForm.code}
                    onChange={(e) => setEditForm((prev) => (prev ? { ...prev, code: e.target.value } : prev))}
                    placeholder="Optional code"
                    disabled={isEditSubmitting}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-type">School Type</Label>
                  <select
                    id="edit-type"
                    value={editForm.type}
                    onChange={(e) => setEditForm((prev) => (prev ? { ...prev, type: e.target.value } : prev))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    disabled={isEditSubmitting}
                  >
                    <option value="PUBLIC">Public</option>
                    <option value="PRIVATE">Private</option>
                    <option value="CHARTER">Charter</option>
                    <option value="INTERNATIONAL">International</option>
                    <option value="TRADE_SCHOOL">Trade School</option>
                    <option value="VOCATIONAL">Vocational</option>
                    <option value="TECHNICAL">Technical</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-established">Established Year *</Label>
                  <Input
                    id="edit-established"
                    type="number"
                    min="1800"
                    max={currentYear}
                    value={editForm.establishedYear}
                    onChange={(e) => {
                      const numeric = e.target.value ? Number(e.target.value) : 0
                      setEditForm((prev) => (prev ? { ...prev, establishedYear: numeric } : prev))
                      clearEditError("establishedYear")
                    }}
                    onBlur={(e) => {
                      const numeric = Number(e.target.value)
                      if (numeric > currentYear) {
                        setEditForm((prev) => (prev ? { ...prev, establishedYear: currentYear } : prev))
                      }
                    }}
                    placeholder={`e.g., ${currentYear}`}
                    className={editErrors.establishedYear ? "border-red-500" : ""}
                    disabled={isEditSubmitting}
                  />
                  {editErrors.establishedYear && <p className="text-sm text-red-500">{editErrors.establishedYear}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Address *</Label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Input
                      placeholder="Street Address"
                      value={editForm.address.street}
                      onChange={(e) => {
                        const value = e.target.value
                        setEditForm((prev) => (prev ? { ...prev, address: { ...prev.address, street: value } } : prev))
                        clearEditError("street")
                      }}
                      className={editErrors.street ? "border-red-500" : ""}
                      disabled={isEditSubmitting}
                    />
                    {editErrors.street && <p className="text-sm text-red-500">{editErrors.street}</p>}
                  </div>
                  <div className="space-y-2">
                    <Input
                      placeholder="City"
                      value={editForm.address.city}
                      onChange={(e) => {
                        const value = e.target.value
                        setEditForm((prev) => (prev ? { ...prev, address: { ...prev.address, city: value } } : prev))
                        clearEditError("city")
                      }}
                      className={editErrors.city ? "border-red-500" : ""}
                      disabled={isEditSubmitting}
                    />
                    {editErrors.city && <p className="text-sm text-red-500">{editErrors.city}</p>}
                  </div>
                  <div className="space-y-2">
                    <Input
                      placeholder="State"
                      value={editForm.address.state}
                      onChange={(e) => {
                        const value = e.target.value
                        setEditForm((prev) => (prev ? { ...prev, address: { ...prev.address, state: value } } : prev))
                        clearEditError("state")
                      }}
                      className={editErrors.state ? "border-red-500" : ""}
                      disabled={isEditSubmitting}
                    />
                    {editErrors.state && <p className="text-sm text-red-500">{editErrors.state}</p>}
                  </div>
                  <div className="space-y-2">
                    <Input
                      placeholder="ZIP Code"
                      value={editForm.address.zipCode}
                      onChange={(e) => {
                        const value = e.target.value
                        setEditForm((prev) => (prev ? { ...prev, address: { ...prev.address, zipCode: value } } : prev))
                        clearEditError("zipCode")
                      }}
                      className={editErrors.zipCode ? "border-red-500" : ""}
                      disabled={isEditSubmitting}
                    />
                    {editErrors.zipCode && <p className="text-sm text-red-500">{editErrors.zipCode}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-country">Country <span className="text-red-500">*</span></Label>
                    <CountrySelect
                      id="edit-country"
                      value={editForm.address.country}
                      onValueChange={(value) => {
                        setEditForm((prev) => (prev ? { ...prev, address: { ...prev.address, country: value } } : prev))
                        clearEditError("country")
                      }}
                      placeholder="Select Country"
                      error={!!editErrors.country}
                      disabled={isEditSubmitting}
                      className={editErrors.country ? "border-red-500" : ""}
                    />
                    {editErrors.country && <p className="text-sm text-red-500">{editErrors.country}</p>}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Phone Number *</Label>
                  <div className={`rounded-md ${editErrors.phone ? "border border-red-500" : ""}`}>
                    <PhoneInput
                      country={editPhoneCountry as any}
                      value={editForm.phone}
                      onChange={(phone) => {
                        setEditForm((prev) => (prev ? { ...prev, phone } : prev))
                        const digitsOnly = phone.replace(/[^\d]/g, "")
                        const isValid = digitsOnly.length >= 10 && digitsOnly.length <= 15
                        setIsEditPhoneValid(isValid)
                        if (isValid) {
                          clearEditError("phone")
                        }
                      }}
                      inputClass={`w-full !h-10 !text-sm !pl-12 ${editErrors.phone ? "!border-red-500" : ""}`}
                      buttonClass={editErrors.phone ? "!border-red-500" : ""}
                      dropdownClass="!z-50"
                      containerClass="phone-input-container w-full"
                      specialLabel=""
                      enableSearch
                      disableSearchIcon={false}
                      countryCodeEditable={false}
                      disabled={isEditSubmitting}
                    />
                  </div>
                  {editErrors.phone && <p className="text-sm text-red-500">{editErrors.phone}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Contact Email (read-only)</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editForm.email}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-website">Website (optional)</Label>
                  <Input
                    id="edit-website"
                    value={editForm.website}
                    onChange={(e) => {
                      setEditForm((prev) => (prev ? { ...prev, website: e.target.value } : prev))
                      clearEditError("website")
                    }}
                    placeholder="https://www.school.edu"
                    className={editErrors.website ? "border-red-500" : ""}
                    disabled={isEditSubmitting}
                  />
                  {editErrors.website && <p className="text-sm text-red-500">{editErrors.website}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-capacity">Student Capacity (optional)</Label>
                  <Input
                    id="edit-capacity"
                    type="number"
                    min="100"
                    value={editForm.studentCapacity === "" ? "" : editForm.studentCapacity}
                    onChange={(e) => {
                      const value = e.target.value
                      // Keep empty string if empty, otherwise convert to number
                      const numeric = value === "" ? "" : (value ? Number(value) : "")
                      setEditForm((prev) => (prev ? { ...prev, studentCapacity: numeric as number | "" } : prev))
                      clearEditError("studentCapacity")
                      // Also validate maxStudentsPerClass if capacity is set
                      if (numeric !== "" && typeof numeric === 'number' && 
                          editForm && 
                          editForm.maxStudentsPerClass !== "" && 
                          typeof editForm.maxStudentsPerClass === 'number' && 
                          editForm.maxStudentsPerClass > numeric) {
                        // Auto-adjust maxStudentsPerClass if it exceeds capacity
                        setEditForm((prev) => (prev ? { ...prev, maxStudentsPerClass: numeric } : prev))
                      }
                    }}
                    placeholder="1000"
                    className={editErrors.studentCapacity ? "border-red-500" : ""}
                    disabled={isEditSubmitting}
                  />
                  {editErrors.studentCapacity && (
                    <p className="text-sm text-red-500">{editErrors.studentCapacity}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-max-students-per-class">Max Students Per Class <span className="text-red-500">*</span></Label>
                  <Input
                    id="edit-max-students-per-class"
                    type="number"
                    min="1"
                    max={editForm && editForm.studentCapacity !== "" && typeof editForm.studentCapacity === 'number' ? editForm.studentCapacity : undefined}
                    value={editForm.maxStudentsPerClass === "" ? "" : editForm.maxStudentsPerClass}
                    onChange={(e) => {
                      const value = e.target.value
                      // Keep empty string if empty, otherwise convert to number
                      const numeric = value === "" ? "" : (value ? Number(value) : "")
                      setEditForm((prev) => (prev ? { ...prev, maxStudentsPerClass: numeric as number | "" } : prev))
                      clearEditError("maxStudentsPerClass")
                    }}
                    placeholder="50"
                    className={editErrors.maxStudentsPerClass ? "border-red-500" : ""}
                    disabled={isEditSubmitting}
                  />
                  {editErrors.maxStudentsPerClass && (
                    <p className="text-sm text-red-500">{editErrors.maxStudentsPerClass}</p>
                  )}
                  {editForm && editForm.studentCapacity !== "" && typeof editForm.studentCapacity === 'number' && (
                    <p className="text-xs text-muted-foreground">
                      Maximum: {editForm.studentCapacity} (based on student capacity)
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-academic-start">Academic Year Start</Label>
                  <Input
                    id="edit-academic-start"
                    type="date"
                    value={editForm.academicYearStart}
                    onChange={(e) => setEditForm((prev) => (prev ? { ...prev, academicYearStart: e.target.value } : prev))}
                    disabled={isEditSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-academic-end">Academic Year End</Label>
                  <Input
                    id="edit-academic-end"
                    type="date"
                    value={editForm.academicYearEnd}
                    onChange={(e) => {
                      const value = e.target.value
                      setEditForm((prev) => (prev ? { ...prev, academicYearEnd: value } : prev))
                      clearEditError("academicYearEnd")
                    }}
                    className={editErrors.academicYearEnd ? "border-red-500" : ""}
                    disabled={isEditSubmitting}
                  />
                  {editErrors.academicYearEnd && <p className="text-sm text-red-500">{editErrors.academicYearEnd}</p>}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-is-active"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm((prev) => (prev ? { ...prev, isActive: e.target.checked } : prev))}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={isEditSubmitting}
                />
                <Label htmlFor="edit-is-active" className="text-sm">Active School</Label>
              </div>

              {/* <div className="space-y-2">
                <Label>Grade Levels <span className="text-red-500">*</span></Label>
                <div className="space-y-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      value={editGradeTagInput}
                      onChange={(e) => setEditGradeTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addEditGradeLevelTag()
                        }
                      }}
                      placeholder="Grade 1, Grade 2"
                      className={`sm:flex-1 ${editErrors.gradelevels ? 'border-red-500' : ''}`}
                      disabled={isEditSubmitting}
                    />
                    <Button type="button" variant="outline" onClick={addEditGradeLevelTag} className="sm:w-auto" disabled={isEditSubmitting}>
                      Add grade
                    </Button>
                  </div>
                  {editErrors.gradelevels && (
                    <p className="text-sm text-red-600">{editErrors.gradelevels}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {editForm.gradelevels && editForm.gradelevels.length > 0 ? (
                      editForm.gradelevels.map((grade, index) => (
                        <span key={`${grade}-${index}`} className="flex items-center gap-1 rounded-full bg-gray-200 px-3 py-1 text-sm">
                          {grade}
                          <button
                            type="button"
                            onClick={() => removeEditGradeLevelTag(index)}
                            className="text-gray-600 transition hover:text-gray-800"
                            aria-label={`Remove ${grade}`}
                            disabled={isEditSubmitting}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">No grade levels added yet.</span>
                    )}
                  </div>
                </div>
              </div> */}

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isEditSubmitting || isEditAdminSubmitting}>
                  Cancel
                </Button>
                {/* Save Changes button - always enabled, admin update is optional */}
                <Button 
                  onClick={handleUpdateSchool} 
                  disabled={isEditSubmitting || isEditAdminSubmitting} 
                  className="min-w-[140px]"
                >
                  {isEditSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="py-10 text-center text-muted-foreground">Select a school to edit.</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete School
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this school? This action cannot be undone.
              All associated data including students, teachers, and courses will be affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setSchoolToDelete(null)
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteSchool}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete School"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
