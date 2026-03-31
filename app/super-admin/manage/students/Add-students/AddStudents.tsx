"use client"

import { useState, type ChangeEvent, useEffect, useRef } from "react"
import axios from "axios"
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { StudentForm } from "./student-form"
import { addActivity } from "@/lib/actitivityFunctions"
import { activities } from "@/lib/activities"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Eye, EyeOff } from "lucide-react"
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import LoadingSpinner from '@/components/LoadingSpinner'

// Calculate expected graduation year based on student's grade level
const calculateExpectedGraduation = (gradeLevel: string): string => {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1 // JavaScript months are 0-indexed
  
  // Extract the numeric grade from strings like "Grade 1", "Grade 2", etc.
  let grade = 0
  if (gradeLevel.includes('Grade ')) {
    grade = parseInt(gradeLevel.replace('Grade ', ''))
  } else if (gradeLevel.includes('grade-')) {
    grade = parseInt(gradeLevel.replace('grade-', ''))
  } else if (!isNaN(parseInt(gradeLevel))) {
    grade = parseInt(gradeLevel)
  }
  
  // Calculate years remaining until grade 12
  const yearsToGraduation = Math.max(0, 12 - grade)
  
  // Add years to graduation - if it's after June (month 6), student advances next year
  let graduationYear = currentYear + yearsToGraduation
  if (currentMonth <= 6) {
    graduationYear += 1 // Academic year hasn't completed yet
  }
  
  return graduationYear.toString()
}

interface StudentGuardianModalProps {
  isOpen: boolean
  onClose: () => void
  studentData?: any
  handleDone?: any
  schools: Array<{
    _id: string
    name: string
    code: string
  }>
}

// Parent info
interface ParentData {
  _id?: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  password?: string
  gender?: "MALE" | "FEMALE" | "OTHER"
  parentType?: "FATHER" | "MOTHER" | "GUARDIAN"
  isPrimaryContact?: boolean
  hasPickupPermission?: boolean
}

export default function StudentGuardianModal({ isOpen, onClose, studentData, handleDone, schools }: StudentGuardianModalProps) {
  const [currentStep, setCurrentStep] = useState<"student" | "parent">("student")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clubOptions, setClubOptions] = useState<string[]>([])
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const [isFetching, setIsFetching] = useState(false)
  const [schoolName, setSchoolName] = useState<string>("")
  const [existingTranscripts, setExistingTranscripts] = useState<string[]>([])
  const [deletingTranscriptUrl, setDeletingTranscriptUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState<any>({
    studentId: "",
    firstName: "",
    lastName: "",
    class: "",
    section: "",
    gender: "Male",
    dob: "",
    email: "",
    password: "",
    address: "",
    enrollDate: "", // User must explicitly provide enrollment date
    expectedGraduation: calculateExpectedGraduation("Grade 1"),
    profilePhoto: null,
    parents: [], // array of parent IDs
    emergencyContact: { firstName: "", lastName: "", relationship: "", phone: "" },
    transcripts: [],
    iipFlag: false,
    honorRolls: false,
    athletics: false,
    clubs: [],
    lunch: "",
    nationality: "",
    bloodGroup: "",
    medicalConditions: [],
    allergies: [],
    previousSchool: "",
    previousGrade: "",
    transportMode: "",
    busRoute: "",
    religion: "",
    schoolId: "", // Add school selection
  })

  // For "parent step"
  const [parentList, setParentList] = useState<ParentData[]>([])
  const [parentSearch, setParentSearch] = useState("")
  const [selectedParent, setSelectedParent] = useState<ParentData | null>(null)
  const [initialSelectedParent, setInitialSelectedParent] = useState<ParentData | null>(null)
  const [hasUsedSelectedParentOnce, setHasUsedSelectedParentOnce] = useState(false)
  const [parentForm, setParentForm] = useState<ParentData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    gender: undefined,
    parentType: undefined,
    isPrimaryContact: true,
    hasPickupPermission: false,
  })
  const [parentIsNew, setParentIsNew] = useState(true)
  const [parentFormErrors, setParentFormErrors] = useState<any>({})

  const [errors, setErrors] = useState<any>({})
  const [isClient, setIsClient] = useState(false)
  
  // Password visibility states
  const [showParentPassword, setShowParentPassword] = useState(false)

  // For file uploads
  const [studentPhotoPreview, setStudentPhotoPreview] = useState<string | null>(null)
  const [transcriptPreviews, setTranscriptPreviews] = useState<{ name: string; size: number }[]>([])

  // Check if we're on client side for window access
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Fetch club names for selected school
  useEffect(() => {
    const fetchClubs = async () => {
      if (!isOpen) return
      if (!formData.schoolId) {
        setClubOptions([])
        return
      }
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
        const res = await axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs/names`, {
          headers: { 'Authorization': `Bearer ${token}` },
          params: { schoolId: formData.schoolId }
        })
        const data = res?.data?.data ?? []
        setClubOptions(Array.isArray(data) ? data.filter((n: any) => typeof n === 'string' && n.trim()) : [])
      } catch (e) {
        setClubOptions([])
      }
    }
    fetchClubs()
  }, [isOpen, formData.schoolId])

  // Fetch parents for search/autocomplete
  useEffect(() => {
    console.log('👪 parentSearch:', parentSearch)
    if (parentSearch.length < 1) {
      setParentList([])
      return
    }
    const fetchParents = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
        const res = await axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/parents`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        console.log('👪 Parents fetched successfully:', res)

        // Filter by name/email in frontend
        setParentList(
          res.data.data.parents?.filter(
            (p: ParentData) =>
              p.firstName.toLowerCase().includes(parentSearch.toLowerCase()) ||
              p.lastName.toLowerCase().includes(parentSearch.toLowerCase()) ||
              p.email.toLowerCase().includes(parentSearch.toLowerCase())
          )
        )
      } catch (e) {
        setParentList([])
      }
    }
    fetchParents()
  }, [parentSearch])

  useEffect(() => {
    if (studentData) {
      setFormData({
        studentId: studentData.studentId || "",
        firstName: studentData.firstName || "",
        lastName: studentData.lastName || "",
        class: studentData.class || "",
        section: studentData.section || "",
        gender: studentData.gender || "Male",
        dob: studentData.dob ? new Date(studentData.dob).toISOString().split("T")[0] : "",
        email: studentData.email || "",
        address: studentData.address || "",
        enrollDate: studentData.enrollDate
          ? new Date(studentData.enrollDate).toISOString().split("T")[0]
          : "", // User must explicitly provide enrollment date
        expectedGraduation: studentData.expectedGraduation || calculateExpectedGraduation(studentData.class || "Grade 1"),
        profilePhoto: null,
        parents: studentData.parents ? studentData.parents.map((p: any) => p._id) : [],
        emergencyContact: (() => {
          if (!studentData.emergencyContact) return "";
          
          // Handle object format
          if (typeof studentData.emergencyContact === 'object' && studentData.emergencyContact !== null) {
            // Try phone first, then phoneNumber, then contact field
            const phone = studentData.emergencyContact.phone || 
                         studentData.emergencyContact.phoneNumber ||
                         studentData.emergencyContact.contact;
            
            if (phone && phone !== 'No Phone' && phone !== 'N/A' && phone !== 'Not Set') {
              return phone;
            }
            
            // If no valid phone, show the full name with relationship or just the name
            const firstName = studentData.emergencyContact.firstName || '';
            const lastName = studentData.emergencyContact.lastName || '';
            const relationship = studentData.emergencyContact.relationship || '';
            
            if (firstName || lastName) {
              const name = [firstName, lastName].filter(Boolean).join(' ');
              return relationship ? `${name} (${relationship})` : name;
            }
            
            return "Emergency Contact";
          }
          
          // Handle string format - assume it's phone number or name
          return String(studentData.emergencyContact);
        })(),
        transcripts: [],
        iipFlag: studentData.iipFlag || false,
        honorRolls: studentData.honorRolls || false,
        athletics: studentData.athletics || false,
        clubs: studentData.clubs || "",
        lunch: studentData.lunch || "",
        nationality: studentData.nationality || "",
        bloodGroup: studentData.bloodGroup || "",
        medicalConditions: studentData.medicalConditions || "",
        allergies: studentData.allergies || "",
        previousSchool: studentData.previousSchool || "",
        previousGrade: studentData.previousGrade || "",
        transportMode: studentData.transportMode || "",
        busRoute: studentData.busRoute || "",
        religion: studentData.religion || "",
        schoolId: studentData.schoolId?._id || studentData.schoolId || "",
      })
      const preParent = studentData.parents && studentData.parents.length > 0 ? {
        _id: studentData.parents[0]._id,
        firstName: studentData.parents[0].firstName,
        lastName: studentData.parents[0].lastName,
        email: studentData.parents[0].email,
        phone: studentData.parents[0].phone,
        address: studentData.parents[0].address,
      } : null
      setSelectedParent(preParent)
      setInitialSelectedParent(preParent)
      setParentIsNew(false)
    }
  }, [studentData])

  // Fetch full student details on edit to ensure all values are latest and complete (parity with admin)
  useEffect(() => {
    const fetchFullStudent = async (id: string) => {
      setIsFetching(true)
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
        const sid = studentData?.schoolId?._id || (typeof studentData?.schoolId === 'string' ? studentData?.schoolId : undefined) || formData.schoolId
        const [studentRes, schoolRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/students/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
            params: sid ? { schoolId: sid } : undefined
          }),
          sid ? axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/school-info`, {
            headers: { 'Authorization': `Bearer ${token}` },
            params: { schoolId: sid }
          }) : Promise.resolve({ data: {} as any })
        ])
        const full = studentRes.data?.data || studentRes.data
        if (!full) return

        const schoolInfo = schoolRes?.data?.data || schoolRes?.data
        if (schoolInfo?.name) setSchoolName(schoolInfo.name)

        const ec = full.emergencyContact || {}
        const clubsArr = Array.isArray(full.clubs) ? full.clubs : (full.clubs ? String(full.clubs).split(',').map((c:string)=>c.trim()).filter(Boolean) : [])
        const medArr = Array.isArray(full.medicalConditions) ? full.medicalConditions : (full.medicalConditions ? [full.medicalConditions] : [])
        const allArr = Array.isArray(full.allergies) ? full.allergies : (full.allergies ? [full.allergies] : [])

        setFormData((prev:any) => ({
          ...prev,
          studentId: full.studentId || "",
          firstName: full.firstName || "",
          lastName: full.lastName || "",
          class: full.class || full.gradeLevel || "",
          section: full.section || "",
          gender: full.gender || "Male",
          dob: full.dob ? new Date(full.dob).toISOString().split("T")[0] : (full.dateOfBirth ? new Date(full.dateOfBirth).toISOString().split("T")[0] : ""),
          email: full.email || "",
          address: typeof full.address === 'string' ? full.address : (full.address ? JSON.stringify(full.address) : ""),
          enrollDate: full.enrollDate ? new Date(full.enrollDate).toISOString().split("T")[0] : "", // User must explicitly provide enrollment date
          expectedGraduation: typeof full.expectedGraduation === 'string' ? full.expectedGraduation : (full.expectedGraduation ? String(new Date(full.expectedGraduation).getFullYear()) : ""),
          parents: Array.isArray(full.parentIds) ? full.parentIds.map((p:any)=>p._id || p) : (Array.isArray(full.parents) ? full.parents.map((p:any)=>p._id || p) : []),
          emergencyContact: {
            firstName: ec.firstName || "",
            lastName: ec.lastName || "",
            relationship: ec.relationship || "",
            phone: ec.phone || "",
          },
          transcripts: [],
          iipFlag: Boolean(full.iipFlag),
          honorRolls: Boolean(full.honorRolls),
          athletics: Boolean(full.athletics),
          clubs: clubsArr,
          lunch: full.lunch || "",
          nationality: full.nationality || "",
          bloodGroup: full.bloodGroup || "",
          medicalConditions: medArr,
          allergies: allArr,
          previousSchool: full.previousSchool || "",
          previousGrade: full.previousGrade || "",
          transportMode: full.transportMode || "",
          busRoute: full.busRoute || "",
          religion: full.religion || "",
          schoolId: sid || prev.schoolId || (full.schoolId?._id || full.schoolId || ""),
        }))

        // Preselect existing parent like admin
        const parentsFull = full.parentIds || full.parents || []
        if (parentsFull && parentsFull.length > 0) {
          setSelectedParent({
            _id: parentsFull[0]._id || parentsFull[0],
            firstName: parentsFull[0].firstName || '',
            lastName: parentsFull[0].lastName || '',
            email: parentsFull[0].email || '',
            phone: parentsFull[0].phone || '',
            address: parentsFull[0].address || '',
          })
          setParentIsNew(false)
        }

        if (full.profilePicture) {
          setStudentPhotoPreview(full.profilePicture)
        }
        // existing transcripts
        const existing = Array.isArray(full.transcripts) ? full.transcripts : []
        setExistingTranscripts(existing)
      } catch (e) {
        // non-blocking
      } finally {
        setIsFetching(false)
      }
    }
    if (isOpen && studentData?._id) {
      fetchFullStudent(studentData._id)
    }
  }, [isOpen, studentData?._id, formData.schoolId])

  // Fetch school info to display name on edit
  useEffect(() => {
    const fetchSchoolInfo = async (sid: string) => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
        const res = await axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/school-info`, {
          headers: { 'Authorization': `Bearer ${token}` },
          params: { schoolId: sid }
        })
        const data = res?.data?.data || res?.data
        setSchoolName(data?.name || "")
      } catch {
        setSchoolName("")
      }
    }
    if (isOpen && formData.schoolId) {
      fetchSchoolInfo(formData.schoolId)
    }
  }, [isOpen, formData.schoolId])

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setFormData({
        ...formData,
        [parent]: { ...(formData as any)[parent], [child]: value }
      })
    } else {
      setFormData({ ...formData, [name]: value || "" })
    }
    if (errors[name]) setErrors((prev: any) => ({ ...prev, [name]: "" }))
  }

  const handleSelectChange = (name: string, value: string | boolean) => {
    // Reset clubs when school changes
    const base = { ...formData, [name]: value }
    const updatedFormData = name === 'schoolId' ? { ...base, clubs: [] } : base
    
    // Auto-calculate expected graduation when class/grade changes
    if (name === 'class' && typeof value === 'string') {
      updatedFormData.expectedGraduation = calculateExpectedGraduation(value)
    }
    
    setFormData(updatedFormData)
    if (errors[name]) setErrors((prev: any) => ({ ...prev, [name]: "" }))
  }

  const handlePhoneChange = (value: string) => {
    setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, phone: value } })
    if (errors.emergencyContact) setErrors((prev: any) => ({ ...prev, emergencyContact: "" }))
  }

  const generateStudentId = () => {
    if (!formData.firstName?.trim() || !formData.lastName?.trim()) {
      toast.error("Please enter first and last name before generating student ID");
      return;
    }
    
    const firstInitial = formData.firstName.trim().charAt(0).toUpperCase();
    const lastInitial = formData.lastName.trim().charAt(0).toUpperCase();
    const year = formData.enrollDate ? new Date(formData.enrollDate).getFullYear().toString().slice(-2) : new Date().getFullYear().toString().slice(-2);
    const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
    
    const studentId = `${firstInitial}${lastInitial}${year}${randomNum}`;
    setFormData({ ...formData, studentId });
    
    // Clear any previous studentId error
    if (errors.studentId) {
      setErrors((prev: any) => ({ ...prev, studentId: "" }));
    }
    
    toast.success("Student ID generated successfully!");
  }

  const handleStudentPhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setFormData({ ...formData, profilePhoto: file })
      const reader = new FileReader()
      reader.onload = (event) => setStudentPhotoPreview(event.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  // Transcripts
  const handleTranscriptChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setFormData((prev: any) => ({
        ...prev,
        transcripts: [...prev.transcripts, ...newFiles],
      }))
      const newPreviews = newFiles.map((file) => ({ name: file.name, size: file.size }))
      setTranscriptPreviews((prev) => [...prev, ...newPreviews])
    }
  }
  const removeTranscript = (index: number) => {
    setFormData((prev: any) => {
      const updated = [...prev.transcripts]
      updated.splice(index, 1)
      return { ...prev, transcripts: updated }
    })
    setTranscriptPreviews((prev) => {
      const updated = [...prev]
      updated.splice(index, 1)
      return updated
    })
  }

  // ==========================
  // Parent step logic
  // ==========================

  const handleParentSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setParentSearch(e.target.value)
    setParentIsNew(true)
    setSelectedParent(null)
  }

  const selectExistingParent = (parent: ParentData) => {
    setSelectedParent(parent)
    setParentIsNew(false)
    setParentForm({
      ...parent,
      password: "",
      gender: parent.gender,
      parentType: parent.parentType,
      isPrimaryContact: parent.isPrimaryContact ?? true,
      hasPickupPermission: parent.hasPickupPermission ?? false,
    })
    setParentFormErrors({})
  }

  const handleParentFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setParentForm((prev) => ({ ...prev, [name]: value }))
    setParentFormErrors((prev: any) => ({ ...prev, [name]: "" }))
  }

  const handleParentSelectChange = (name: keyof ParentData, value: string) => {
    setParentForm((prev) => ({ ...prev, [name]: value as any }))
    setParentFormErrors((prev: any) => ({ ...prev, [name]: "" }))
  }

  const handleParentToggleChange = (name: keyof ParentData, checked: boolean) => {
    setParentForm((prev) => ({ ...prev, [name]: checked as any }))
  }

  const validateStudentForm = () => {
    const newErrors: any = {}
    const isEditing = !!studentData
    
    // Always required fields (both create and update)
    if (!formData.firstName?.trim()) newErrors.firstName = "First name required"
    if (!formData.lastName?.trim()) newErrors.lastName = "Last name required"
    if (!formData.class?.trim()) newErrors.class = "Class required"
    if (!formData.dob) newErrors.dob = "Date of birth required"
    if (!formData.email?.trim()) newErrors.email = "Email required"
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Valid email required"
    }
    
    // Check if student email is same as parent email
    if (selectedParent && formData.email && selectedParent.email === formData.email) {
      newErrors.email = "Student email must be different from parent email. Please use a unique email for the student."
    }
    
    if (!formData.studentId?.trim()) {
      newErrors.studentId = "Student ID is required. Please generate or enter one."
    }
    if (!formData.schoolId?.trim()) {
      newErrors.schoolId = "School selection is required."
    }
    
    // Fields required only when creating (optional when updating)
    if (!isEditing) {
      if (!formData.section?.trim()) newErrors.section = "Section required"
      if (!formData.address?.trim()) newErrors.address = "Address required"
      if (!formData.enrollDate) newErrors.enrollDate = "Enrollment date required"
      if (!formData.expectedGraduation) newErrors.expectedGraduation = "Expected graduation required"
      if (!formData.nationality?.trim()) newErrors.nationality = "Nationality required"
      // Emergency contact validation - required only when creating
      if (!formData.emergencyContact?.firstName?.trim() ||
          !formData.emergencyContact?.lastName?.trim() ||
          !formData.emergencyContact?.relationship?.trim() ||
          !formData.emergencyContact?.phone?.trim()) {
        newErrors.emergencyContact = "Emergency contact (first name, last name, relationship, phone) required"
      }
    }
    
    // Password validation
    // Password only required when creating new student, not when editing
    if (!isEditing && (!formData.password || formData.password.length < 8)) {
      newErrors.password = "Password (minimum 8 characters) required"
    }
    // When editing, password must be at least 8 characters if provided
    if (isEditing && formData.password && formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }
    
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fill all required student fields correctly")
      return false
    }
    return true
  }

  const validateParentForm = () => {
    const newErrors: any = {}
    if (parentIsNew) {
      if (!parentForm.firstName?.trim()) newErrors.firstName = "First name required"
      if (!parentForm.lastName?.trim()) newErrors.lastName = "Last name required"
      if (!parentForm.email?.trim()) newErrors.email = "Email required"
      if (parentForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentForm.email)) {
        newErrors.email = "Valid email required"
      }
      if (!parentForm.gender) newErrors.gender = "Gender required"
      if (!parentForm.parentType) newErrors.parentType = "Parent type required"
      if (!parentForm.password || parentForm.password.length < 8) {
        newErrors.password = "Password (minimum 8 characters) required"
      }
    } else if (!selectedParent) {
      toast.error("Please select an existing parent or create a new one")
      return false
    }
    
    setParentFormErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fill all required parent fields correctly")
      return false
    }
    return true
  }

  // ==========================
  // Continue / Submit
  // ==========================

  const handleContinueToParent = (skipParent: boolean = false) => {
    if (validateStudentForm()) {
      if (skipParent && studentData) {
        // When editing and skipping parent step, directly submit without parent validation
        handleSubmit(true)
      } else {
        setCurrentStep("parent")
        // Default to Add New Parent tab
        setParentIsNew(true)
        setHasUsedSelectedParentOnce(false)
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
        }
      }
    }
  }

  const handleBackToStudent = () => {
    setCurrentStep("student")
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSubmit = async (skipParentValidation: boolean = false) => {
    if (!skipParentValidation && !validateParentForm()) return
    setIsSubmitting(true)
    try {
      let parentId: string | undefined

      // 1. Create or get parent first (only if not skipping parent validation)
      if (!skipParentValidation && parentIsNew) {
        // Check if a parent with this email already exists
        try {
          const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
          
          // Clean and encode email properly
          console.log('👪 parentForm.email:', parentForm.email)
          const cleanEmail = parentForm.email.trim().toLowerCase();
          const encodedEmail = encodeURIComponent(cleanEmail);

          console.log('👪 encodedEmail:', encodedEmail)
          
          const existingParentRes = await axios.get(
            `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/parents/by-email/${encodedEmail}`, 
            {
              headers: { 'Authorization': `Bearer ${token}` },
            }
          );
          
          // Handle response - check if data exists in response.data or response.data.data
          const parentData = existingParentRes.data?.data || existingParentRes.data;
          console.log('👪 parentData:', parentData)
          
          if (parentData && parentData._id) {
            parentId = parentData._id;
            toast.info("Parent already exists. Using existing parent.");
          } else {
            throw new Error("Parent not found"); // Force creation
          }
        } catch (e) {
          // Parent doesn't exist, create new one
          try {
            const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
            const createParentRes = await axios.post(
              `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/parents`, 
              {
                email: parentForm.email,
                schoolId: formData.schoolId,
                firstName: parentForm.firstName,
                lastName: parentForm.lastName,
                gender: parentForm.gender,
                isPrimaryContact: Boolean(parentForm.isPrimaryContact),
                hasPickupPermission: Boolean(parentForm.hasPickupPermission),
                parentType: parentForm.parentType,
                password: parentForm.password,
                phone: parentForm.phone || "",
                address: parentForm.address || "",
              }, 
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              }
            )

            console.log('👪 Parent created successfully:', createParentRes.data)

            parentId = createParentRes.data.data._id || createParentRes.data.data.userId
            if (!parentId) {
              throw new Error("Failed to get parent ID from response")
            }
          } catch (parentError: any) {
            console.error("Error creating parent:", parentError)
            if (parentError.response?.status === 409) {
              throw new Error("Parent with this email already exists")
            } else if (parentError.response?.data?.message) {
              throw new Error(`Failed to create parent: ${parentError.response.data.message}`)
            } else {
              throw new Error("Failed to create parent")
            }
          }
        }
      } else if (!skipParentValidation && selectedParent && selectedParent._id) {
        parentId = selectedParent._id
      } else if (studentData) {
        // When editing, parent is optional - use existing parent if available
        if (studentData.parents && studentData.parents.length > 0) {
          parentId = studentData.parents[0]._id
        } else if (studentData.parentIds && studentData.parentIds.length > 0) {
          parentId = typeof studentData.parentIds[0] === 'string' 
            ? studentData.parentIds[0] 
            : studentData.parentIds[0]._id
        }
        // If no parent selected and editing, don't require parent (will keep existing or leave empty)
      } else if (!skipParentValidation) {
        // When creating new student, parent is required
        throw new Error("No parent selected. Please select an existing parent or create a new one.")
      }

      // 2. Build multipart form data like Admin flow
      const fd = new FormData()
      fd.append('studentId', formData.studentId.trim())
      fd.append('firstName', formData.firstName.trim())
      fd.append('lastName', formData.lastName.trim())
      fd.append('class', formData.class.trim())
      fd.append('section', formData.section.trim())
      fd.append('gender', formData.gender)
      fd.append('dob', formData.dob)
      fd.append('email', formData.email.trim().toLowerCase())
      fd.append('address', formData.address.trim())
      fd.append('emergencyContact', JSON.stringify({
        firstName: formData.emergencyContact.firstName || '',
        lastName: formData.emergencyContact.lastName || '',
        relationship: formData.emergencyContact.relationship || '',
        phone: formData.emergencyContact.phone || ''
      }))
      fd.append('enrollDate', formData.enrollDate)
      fd.append('expectedGraduation', String(formData.expectedGraduation))
      // Only append parents if parentId is available
      if (parentId) {
        fd.append('parents', JSON.stringify([parentId]))
      }
      fd.append('iipFlag', String(Boolean(formData.iipFlag)))
      fd.append('honorRolls', String(Boolean(formData.honorRolls)))
      fd.append('athletics', String(Boolean(formData.athletics)))
      fd.append('clubs', JSON.stringify(Array.isArray(formData.clubs) ? formData.clubs : (formData.clubs ? [formData.clubs] : [])))
      fd.append('lunch', formData.lunch || '')
      fd.append('nationality', formData.nationality || '')
      fd.append('bloodGroup', formData.bloodGroup || '')
      fd.append('medicalConditions', JSON.stringify(Array.isArray(formData.medicalConditions) ? formData.medicalConditions : (formData.medicalConditions ? [formData.medicalConditions] : [])))
      fd.append('allergies', JSON.stringify(Array.isArray(formData.allergies) ? formData.allergies : (formData.allergies ? [formData.allergies] : [])))
      fd.append('previousSchool', formData.previousSchool || '')
      fd.append('previousGrade', formData.previousGrade || '')
      fd.append('transportMode', formData.transportMode || '')
      fd.append('busRoute', formData.busRoute || '')
      fd.append('religion', formData.religion || '')
      // Include schoolId explicitly in payload as requested
      if (formData.schoolId) {
        fd.append('schoolId', formData.schoolId)
      }
      if (formData.password && formData.password.trim().length > 0) {
        fd.append('password', formData.password)
      } else if (!studentData) {
        throw new Error('Password is required for new students')
      }
      if (formData.profilePhoto instanceof File) {
        fd.append('profilePhoto', formData.profilePhoto)
      }
      if (formData.transcripts && formData.transcripts.length > 0) {
        for (const t of formData.transcripts) {
          if (t instanceof File) fd.append('transcripts', t)
        }
      }

      // 3. Create or update via Admin endpoints with schoolId param
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      if (studentData) {
        // Update existing student - now send multipart/form-data like create
        // Only update parents if a parent was explicitly selected/changed (optional for edits)
        // If parentId exists, send it; if not provided when editing, don't send parents field (keeps existing)
        if (parentId) {
          fd.set('parents', JSON.stringify([parentId]))
        }
        // Note: If editing and parentId is not set, we don't send 'parents' field, 
        // which means existing parent relationships will be preserved
        
        await axios.put(
          `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/students/${studentData._id}?schoolId=${encodeURIComponent(formData.schoolId)}`,
          fd,
          { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
        )
        toast.success("Student updated successfully!")
      } else {
        await axios.post(
          `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/students?schoolId=${encodeURIComponent(formData.schoolId)}`,
          fd,
          { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
        )
        toast.success("Student added successfully!")
      }

      await handleDone?.()
      setCurrentStep("student")
      resetForm()
      onClose()
    } catch (error: any) {
      console.error("Error creating student:", error)
      
      // Handle different types of errors
      if (error.message && error.message.includes("parent")) {
        toast.error(error.message)
      } else if (error.response?.status === 409) {
        toast.error(error.response.data.message || error.response.data.msg || "Student or parent already exists")
      } else if (error.response?.status === 400) {
        const errorMsg = error.response.data.message || error.response.data.msg || "Invalid data provided"
        toast.error(errorMsg)
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message)
      } else if (error.response?.data?.msg) {
        toast.error(error.response.data.msg)
      } else if (error.message) {
        toast.error(error.message)
      } else {
        toast.error("Error saving student. Please check all required fields and try again.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      studentId: "",
      firstName: "",
      lastName: "",
      class: "",
      section: "",
      gender: "Male",
      dob: "",
      email: "",
      password: "",
      address: "",
      enrollDate: "", // User must explicitly provide enrollment date
      expectedGraduation: calculateExpectedGraduation("Grade 1"),
      profilePhoto: null,
      parents: [],
      emergencyContact: "",
      transcripts: [],
      iipFlag: false,
      honorRolls: false,
      athletics: false,
      clubs: "",
      lunch: "",
      nationality: "",
      bloodGroup: "",
      medicalConditions: "",
      allergies: "",
      previousSchool: "",
      previousGrade: "",
      transportMode: "",
      busRoute: "",
      religion: "",
      schoolId: "",
    })
    setSelectedParent(null)
    setParentForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      password: "",
    })
    setParentSearch("")
    setParentIsNew(true)
    setParentFormErrors({})
    setStudentPhotoPreview(null)
    setTranscriptPreviews([])
    setErrors({})
    setCurrentStep("student")
  }

  const handleCloseRequest = (open: boolean) => {
    if (!isSubmitting && !open) {
      onClose()
      resetForm()
    }
  }

  // ==========================
  // Render
  // ==========================

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseRequest}>
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-6xl p-0 max-h-[95vh]">
        <div ref={scrollContainerRef} className="custom-scrollbar max-h-[95vh] overflow-y-auto">
          <DialogHeader className="p-6 pb-4 border-b bg-gray-50">
            <DialogTitle className="text-xl font-semibold">
              {studentData ? "Edit " : "Add "}
              {currentStep === "student" ? "Student Information" : "Guardian Information"}
            </DialogTitle>
          </DialogHeader>

          <div className="relative overflow-hidden">
            {isFetching && (
              <div className="absolute inset-0 z-20 flex justify-center bg-white/70">
                <div className="text-center">
                  <LoadingSpinner message="Loading student details..." />
                </div>
              </div>
            )}
            {/* Mobile: Stack vertically, Desktop: Side by side with transition */}
            <div className="lg:flex lg:transition-transform lg:duration-500 lg:ease-in-out w-full lg:w-[200%]"
              style={{
                transform: currentStep === "student" ? "translateX(0%)" : "translateX(-50%)",
              }}
            >
              {/* Student Form */}
              <div className={`w-full lg:w-1/2 ${currentStep === "parent" ? "hidden lg:block" : ""}`}>
                <StudentForm
                  formData={formData}
                  errors={errors}
                  photoPreview={studentPhotoPreview}
                  clubOptions={clubOptions}
                  schoolName={schoolName}
                  existingTranscripts={existingTranscripts}
                  deletingTranscriptUrl={deletingTranscriptUrl || undefined}
                  onDeleteExistingTranscript={async (url: string) => {
                    if (!studentData?._id) return;
                    try {
                      setDeletingTranscriptUrl(url)
                      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
                      await axios.delete(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/students/${studentData._id}/transcripts`, {
                        params: formData.schoolId ? { url, schoolId: formData.schoolId } : { url },
                        headers: { 'Authorization': `Bearer ${token}` }
                      })
                      setExistingTranscripts(prev => prev.filter(u => u !== url))
                      toast.success('Transcript deleted')
                    } catch (e: any) {
                      toast.error(e?.response?.data?.message || 'Failed to delete transcript')
                    } finally {
                      setDeletingTranscriptUrl(null)
                    }
                  }}
                  onInputChange={handleInputChange}
                  onSelectChange={handleSelectChange}
                  onPhoneChange={handlePhoneChange}
                  onPhotoChange={handleStudentPhotoChange}
                  onContinue={() => handleContinueToParent(false)}
                  onSave={() => handleContinueToParent(true)}
                  onCancel={onClose}
                  disabled={isSubmitting || isFetching}
                  isEditing={!!studentData}
                  transcriptPreviews={transcriptPreviews}
                  onTranscriptChange={handleTranscriptChange}
                  onRemoveTranscript={removeTranscript}
                  onGenerateStudentId={generateStudentId}
                  schools={schools}
                />
              </div>

              {/* Parent Step */}
              <div className={`w-full lg:w-1/2 ${currentStep === "student" ? "hidden lg:block" : ""}`}>
                <div className="p-6">
                  <Card className="h-full border-0 shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-medium text-gray-900">
                        Associate Parent/Guardian
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Parent search section */}
                      <div className="space-y-3">
                        <Label htmlFor="parent-search" className="text-sm font-medium text-gray-700">
                          Search for existing parent (by name or email):
                        </Label>
                        <Input
                          id="parent-search"
                          placeholder="Type to search parents..."
                          value={parentSearch}
                          onChange={handleParentSearchChange}
                          autoComplete="off"
                          className="w-full"
                        />
                        {parentSearch.length > 1 && parentList.length > 0 && (
                          <div className="border rounded-lg bg-white max-h-40 overflow-y-auto shadow-sm">
                            {parentList.map(parent => (
                              <div
                                key={parent._id}
                                className={`p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors ${
                                  selectedParent && selectedParent._id === parent._id ? "bg-blue-50 border-blue-200" : ""
                                }`}
                                onClick={() => selectExistingParent(parent)}
                              >
                                <div className="font-medium text-gray-900">{parent.firstName} {parent.lastName}</div>
                                <div className="text-sm text-gray-600">{parent.email}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Parent selection buttons */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          type="button"
                          variant={parentIsNew ? "default" : "outline"}
                          onClick={() => { setParentIsNew(true); setSelectedParent(null) }}
                          className="flex-1"
                        >
                          Add New Parent
                        </Button>
                        <Button
                          type="button"
                          variant={!parentIsNew ? "default" : "outline"}
                          disabled={isSubmitting || hasUsedSelectedParentOnce}
                          onClick={() => { 
                            setParentIsNew(false);
                            setHasUsedSelectedParentOnce(true);
                          }}
                          className="flex-1"
                        >
                          Use Selected Parent
                        </Button>
                      </div>

                      {/* New parent form */}
                      {parentIsNew && (
                        <div className="space-y-4 p-4 border rounded-lg bg-gray-50/50">
                          <h4 className="font-medium text-sm text-gray-800">New Parent Information</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">First Name *</Label>
                              <Input 
                                name="firstName" 
                                value={parentForm.firstName} 
                                onChange={handleParentFormChange}
                                className={`${parentFormErrors.firstName ? "border-red-500 focus:border-red-500" : "border-gray-300"}`}
                              />
                              {parentFormErrors.firstName && (
                                <div className="text-red-500 text-xs mt-1">{parentFormErrors.firstName}</div>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">Last Name *</Label>
                              <Input 
                                name="lastName" 
                                value={parentForm.lastName} 
                                onChange={handleParentFormChange}
                                className={`${parentFormErrors.lastName ? "border-red-500 focus:border-red-500" : "border-gray-300"}`}
                              />
                              {parentFormErrors.lastName && (
                                <div className="text-red-500 text-xs mt-1">{parentFormErrors.lastName}</div>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">Email *</Label>
                              <Input 
                                name="email" 
                                type="email"
                                value={parentForm.email} 
                                onChange={handleParentFormChange}
                                className={`${parentFormErrors.email ? "border-red-500 focus:border-red-500" : "border-gray-300"}`}
                              />
                              {parentFormErrors.email && (
                                <div className="text-red-500 text-xs mt-1">{parentFormErrors.email}</div>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">Phone</Label>
                              <PhoneInput
                                country={'us'}
                                value={parentForm.phone || ''}
                                onChange={(value) => {
                                  setParentForm({ ...parentForm, phone: value })
                                  setParentFormErrors((prev: any) => ({ ...prev, phone: "" }))
                                }}
                                inputClass="!w-full !border-gray-300"
                                buttonClass="!border-gray-300"
                                placeholder="Phone Number"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">Gender *</Label>
                              <Select
                                value={parentForm.gender || ""}
                                onValueChange={(val) => handleParentSelectChange('gender', val)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="MALE">Male</SelectItem>
                                  <SelectItem value="FEMALE">Female</SelectItem>
                                  <SelectItem value="OTHER">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              {parentFormErrors.gender && (
                                <div className="text-red-500 text-xs mt-1">{parentFormErrors.gender}</div>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">Parent Type *</Label>
                              <Select
                                value={parentForm.parentType || ""}
                                onValueChange={(val) => handleParentSelectChange('parentType', val)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="FATHER">Father</SelectItem>
                                  <SelectItem value="MOTHER">Mother</SelectItem>
                                  <SelectItem value="GUARDIAN">Guardian</SelectItem>
                                </SelectContent>
                              </Select>
                              {parentFormErrors.parentType && (
                                <div className="text-red-500 text-xs mt-1">{parentFormErrors.parentType}</div>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">Primary Contact</Label>
                              <div className="flex items-center gap-3">
                                <Switch
                                  checked={Boolean(parentForm.isPrimaryContact)}
                                  onCheckedChange={(checked) => handleParentToggleChange('isPrimaryContact', checked)}
                                />
                                <span className="text-sm text-gray-700">Is Primary Contact</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">Pickup Permission</Label>
                              <div className="flex items-center gap-3">
                                <Switch
                                  checked={Boolean(parentForm.hasPickupPermission)}
                                  onCheckedChange={(checked) => handleParentToggleChange('hasPickupPermission', checked)}
                                />
                                <span className="text-sm text-gray-700">Has Pickup Permission</span>
                              </div>
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                              <Label className="text-sm font-medium text-gray-700">Address</Label>
                              <Input 
                                name="address" 
                                value={parentForm.address} 
                                onChange={handleParentFormChange}
                                className="border-gray-300"
                              />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                              <Label className="text-sm font-medium text-gray-700">Password *</Label>
                              <div className="relative">
                                <Input 
                                  name="password" 
                                  type={showParentPassword ? "text" : "password"} 
                                  value={parentForm.password} 
                                  onChange={handleParentFormChange}
                                  className={`pr-10 ${parentFormErrors.password ? "border-red-500 focus:border-red-500" : "border-gray-300"}`}
                                  placeholder="Enter a secure password"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowParentPassword(!showParentPassword)}
                                >
                                  {showParentPassword ? (
                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-gray-400" />
                                  )}
                                </Button>
                              </div>
                              {parentFormErrors.password && (
                                <div className="text-red-500 text-xs mt-1">{parentFormErrors.password}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Selected parent display */}
                      {!parentIsNew && selectedParent && (
                        <div className="p-4 border rounded-lg bg-blue-50/50 border-blue-200">
                          <h4 className="font-medium text-sm text-blue-900 mb-3">Selected Parent</h4>
                          <div className="space-y-2 text-sm">
                            <div><span className="font-medium text-gray-700">Name:</span> <span className="text-gray-900">{selectedParent.firstName} {selectedParent.lastName}</span></div>
                            <div><span className="font-medium text-gray-700">Email:</span> <span className="text-gray-900">{selectedParent.email}</span></div>
                            <div><span className="font-medium text-gray-700">Phone:</span> <span className="text-gray-900">{selectedParent.phone}</span></div>
                            <div><span className="font-medium text-gray-700">Address:</span> <span className="text-gray-900">{selectedParent.address}</span></div>
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t border-gray-200">
                        <Button 
                          variant="outline" 
                          onClick={handleBackToStudent} 
                          disabled={isSubmitting}
                          className="sm:w-auto order-2 sm:order-1"
                        >
                          Back to Student
                        </Button>
                        <Button 
                          onClick={handleSubmit} 
                          disabled={isSubmitting}
                          className="bg-gray-800 hover:bg-gray-900 text-white sm:w-auto order-1 sm:order-2"
                        >
                          {isSubmitting ? "Saving..." : studentData ? "Update Student" : "Add Student"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
      <style jsx>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #888 #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #888;
          border-radius: 6px;
          border: 3px solid #f1f1f1;
        }
      `}</style>
    </Dialog>
  )
}
