"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
  DialogFooter,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Lock, Unlock, MoreVertical } from "lucide-react"
import { toast } from 'sonner'
import { activities } from "@/lib/activities"
import { addActivity } from "@/lib/actitivityFunctions"

interface User {
  _id: string
  firstName: string
  lastName: string
  email: string
  role: string
  isActive: boolean
  mustChangePassword: boolean
  schoolId?: {
    _id: string
    name: string
    schoolCode: string
  }
  lastLogin?: string
  createdAt: string
}

interface School {
  _id: string
  name: string
  schoolCode: string
}

interface CreateUserForm {
  firstName: string
  lastName: string
  email: string
  password: string
  role: string
  schoolId: string
  isActive: boolean
  // Student-specific fields
  studentId?: string
  dateOfBirth?: string
  gender?: string
  gradeLevel?: string
  section?: string
  parentIds?: string[]
  // Parent-specific fields
  occupation?: string
  workplace?: string
  studentRelationships?: {
    studentId: string
    relationship: string
    isPrimaryContact: boolean
    hasPickupPermission: boolean
  }[]
  // Teacher-specific fields
  employeeId?: string
  department?: string
  subjects?: string[]
  // Admin-specific fields
  isSchoolAdmin?: boolean
  // Common fields
  phone?: string
  address?: {
    street?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
  }
}

interface Student {
  id: string
  studentId: string
  name: string
  gradeLevel: string
  section: string
  fullName: string
}

interface Parent {
  id: string
  name: string
  phone: string
  fullName: string
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [parents, setParents] = useState<Parent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [schoolFilter, setSchoolFilter] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isPasswordResetDialogOpen, setIsPasswordResetDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showCreatePassword, setShowCreatePassword] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [resetPasswordForm, setResetPasswordForm] = useState({
    newPassword: "",
    mustChangePassword: true
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)

  const [createForm, setCreateForm] = useState<CreateUserForm>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "",
    schoolId: "",
    isActive: true,
    parentIds: [],
    studentRelationships: [],
    subjects: []
  })

  // const roles = ["SUPER_ADMIN", "ADMIN", "TEACHER", "STUDENT", "PARENT", "NURSE", "SECRETARY"]
  const roles = ["SUPER_ADMIN", "ADMIN", "NURSE", "SECRETARY"]

  useEffect(() => {
    fetchUsers()
    fetchSchools()
  }, [currentPage, searchTerm, roleFilter, schoolFilter])

  // Fetch students and parents when school is selected for relationship creation
  useEffect(() => {
    if (createForm.schoolId && (createForm.role === "Parent" || createForm.role === "Student")) {
      if (createForm.role === "Parent") {
        fetchStudentsForSelection(createForm.schoolId)
      } else if (createForm.role === "Student") {
        fetchParentsForSelection(createForm.schoolId)
      }
    }
  }, [createForm.schoolId, createForm.role])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter !== "all" && { role: roleFilter }),
        ...(schoolFilter !== "all" && { schoolId: schoolFilter })
      })

      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/users?${queryParams}`)
      if (!response.ok) {
        toast.error("Failed to fetch users")
        setUsers([])
        setTotalPages(1)
        setTotalUsers(0)
        return
      }

      const data = await response.json()
      const payload = data?.data || data || {}
      const list = Array.isArray(payload?.users)
        ? payload.users
        : Array.isArray(data?.users)
          ? data.users
          : []
      const pagination = payload?.pagination || data?.pagination || {}

      setUsers(list)
      setTotalPages(pagination.totalPages || data?.totalPages || 1)
      setTotalUsers(pagination.totalCount || data?.totalUsers || list.length)
    } catch (error) {
      console.error("Error fetching users:", error)
      toast.error("Error fetching users")
      setUsers([])
      setTotalPages(1)
      setTotalUsers(0)
    } finally {
      setLoading(false)
    }
  }

  const fetchSchools = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/schools`)
      if (response.ok) {
        const data = await response.json()
        const payload = data?.data || data || {}
        const list = Array.isArray(payload?.schools)
          ? payload.schools
          : Array.isArray(data?.schools)
            ? data.schools
            : []
        setSchools(list)
      } else {
        setSchools([])
      }
    } catch (error) {
      console.error("Error fetching schools:", error)
      setSchools([])
    }
  }

  const fetchStudentsForSelection = async (schoolId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/students/for-parent-selection?schoolId=${schoolId}`)
      if (response.ok) {
        const data = await response.json()
        setStudents(data)
      }
    } catch (error) {
      console.error("Error fetching students:", error)
    }
  }

  const fetchParentsForSelection = async (schoolId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/parents/for-student-selection?schoolId=${schoolId}`)
      if (response.ok) {
        const data = await response.json()
        setParents(data)
      }
    } catch (error) {
      console.error("Error fetching parents:", error)
    }
  }

  // Helper functions for managing relationships
  const addStudentRelationship = () => {
    setCreateForm(prev => ({
      ...prev,
      studentRelationships: [
        ...(prev.studentRelationships || []),
        {
          studentId: "",
          relationship: "Guardian",
          isPrimaryContact: false,
          hasPickupPermission: true
        }
      ]
    }))
  }

  const removeStudentRelationship = (index: number) => {
    setCreateForm(prev => ({
      ...prev,
      studentRelationships: prev.studentRelationships?.filter((_, i) => i !== index) || []
    }))
  }

  const updateStudentRelationship = (index: number, field: string, value: any) => {
    setCreateForm(prev => ({
      ...prev,
      studentRelationships: prev.studentRelationships?.map((rel, i) => 
        i === index ? { ...rel, [field]: value } : rel
      ) || []
    }))
  }

  const toggleParentSelection = (parentId: string) => {
    setCreateForm(prev => ({
      ...prev,
      parentIds: prev.parentIds?.includes(parentId)
        ? prev.parentIds.filter(id => id !== parentId)
        : [...(prev.parentIds || []), parentId]
    }))
  }

  const resetCreateForm = () => {
    setCreateForm({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "",
      schoolId: "",
      isActive: true,
      parentIds: [],
      studentRelationships: [],
      subjects: []
    })
  }

  const handleCreateUser = async () => {
    // Validate required fields
    if (!createForm.firstName.trim() || !createForm.lastName.trim() || !createForm.email.trim() || !createForm.role || !createForm.password.trim()) {
      toast.error("Please fill in all required fields (Name, Email, Role, Password)")
      return
    }

    // Validate password strength
    if (createForm.password.length < 8) {
      toast.error("Password must be at least 8 characters long")
      return
    }

    // Additional password validation
    const hasUpperCase = /[A-Z]/.test(createForm.password)
    const hasLowerCase = /[a-z]/.test(createForm.password)
    const hasNumbers = /\d/.test(createForm.password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(createForm.password)

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      toast.error("Password must contain at least one uppercase letter, one lowercase letter, and one number")
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(createForm.email)) {
      toast.error("Please enter a valid email address")
      return
    }

    // For non-SuperAdmin roles, school is required
    if (createForm.role !== "SUPER_ADMIN" && (!createForm.schoolId || createForm.schoolId.trim() === "")) {
      toast.error("Please select a school for this user")
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createForm),
      })

      if (response.ok) {
        toast.success("User created successfully")
        setIsCreateDialogOpen(false)
        resetCreateForm()
        fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to create user")
      }
    } catch (error) {
      console.error("Error creating user:", error)
      toast.error("Error creating user")
    }
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    try {
      const updateData = {
        firstName: selectedUser.firstName,
        lastName: selectedUser.lastName,
        email: selectedUser.email,
        role: selectedUser.role,
        schoolId: selectedUser.schoolId?._id,
        isActive: selectedUser.isActive
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/users/${selectedUser._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        toast.success("User updated successfully")
        setIsEditDialogOpen(false)
        setSelectedUser(null)
        fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to update user")
      }
    } catch (error) {
      console.error("Error updating user:", error)
      toast.error("Error updating user")
    }
  }

  const handleDeleteUser = async (user: User) => {
    setUserToDelete(user)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteUser = async () => {
    if (!userToDelete) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/users/${userToDelete._id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("User deleted successfully")
        
        // Backend already logs the activity, no need to log here
        fetchUsers()
        setIsDeleteDialogOpen(false)
        setUserToDelete(null)
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to delete user")
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      toast.error("Error deleting user")
    }
  }

  const handleResetPassword = async (userId: string) => {
    // Validate password strength
    if (resetPasswordForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long")
      return
    }

    // Additional password validation
    const hasUpperCase = /[A-Z]/.test(resetPasswordForm.newPassword)
    const hasLowerCase = /[a-z]/.test(resetPasswordForm.newPassword)
    const hasNumbers = /\d/.test(resetPasswordForm.newPassword)

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      toast.error("Password must contain at least one uppercase letter, one lowercase letter, and one number")
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/users/${userId}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(resetPasswordForm),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Password reset successfully`)
        setIsPasswordResetDialogOpen(false)
        setResetPasswordForm({ newPassword: "", mustChangePassword: true })
        fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to reset password")
      }
    } catch (error) {
      console.error("Error resetting password:", error)
      toast.error("Error resetting password")
    }
  }

  const openPasswordResetDialog = (user: User) => {
    setSelectedUser(user)
    setIsPasswordResetDialogOpen(true)
  }

  const getRoleBadgeColor = (role: string) => {
    const colors: { [key: string]: string } = {
      SuperAdmin: "bg-red-100 text-red-800",
      Admin: "bg-purple-100 text-purple-800",
      // Teacher: "bg-blue-100 text-blue-800",
      // Student: "bg-green-100 text-green-800",
      // Parent: "bg-orange-100 text-orange-800",
      Nurse: "bg-pink-100 text-pink-800",
      Secretary: "bg-gray-100 text-gray-800"
    }
    return colors[role] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Create and manage user accounts across all schools
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to the system. They will receive login credentials via email.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={createForm.firstName}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john.doe@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Temporary Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showCreatePassword ? "text" : "password"}
                    value={createForm.password}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Temporary password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showCreatePassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={createForm.role}
                  onValueChange={(value) => setCreateForm(prev => ({ 
                    ...prev, 
                    role: value,
                    // Clear schoolId if SuperAdmin is selected
                    schoolId: value === "SUPER_ADMIN" ? "" : prev.schoolId
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* School selection - only show for non-SuperAdmin roles */}
              {createForm.role !== "SUPER_ADMIN" && (
                <div className="space-y-2">
                  <Label htmlFor="school">School *</Label>
                  <Select
                    value={createForm.schoolId}
                    onValueChange={(value) => setCreateForm(prev => ({ ...prev, schoolId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a school" />
                    </SelectTrigger>
                    <SelectContent>
                      {schools.map((school) => (
                        <SelectItem key={school._id} value={school._id}>
                          {school.name} ({school.schoolCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Role-specific fields */}
              {createForm.role === "Student" && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-semibold text-sm">Student Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="studentId">Student ID (Optional)</Label>
                      <Input
                        id="studentId"
                        value={createForm.studentId || ""}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, studentId: e.target.value }))}
                        placeholder="Auto-generated if empty"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={createForm.dateOfBirth || ""}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select
                        value={createForm.gender || ""}
                        onValueChange={(value) => setCreateForm(prev => ({ ...prev, gender: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gradeLevel">Grade Level</Label>
                      <Input
                        id="gradeLevel"
                        value={createForm.gradeLevel || ""}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, gradeLevel: e.target.value }))}
                        placeholder="e.g., 9th"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="section">Section</Label>
                      <Input
                        id="section"
                        value={createForm.section || ""}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, section: e.target.value }))}
                        placeholder="e.g., A"
                      />
                    </div>
                  </div>
                  
                  {/* Parent Selection */}
                  {parents.length > 0 && (
                    <div className="space-y-2">
                      <Label>Select Parents/Guardians</Label>
                      <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2">
                        {parents.map((parent) => (
                          <div key={parent.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`parent-${parent.id}`}
                              checked={createForm.parentIds?.includes(parent.id) || false}
                              onChange={() => toggleParentSelection(parent.id)}
                              className="rounded"
                            />
                            <label htmlFor={`parent-${parent.id}`} className="text-sm cursor-pointer">
                              {parent.fullName}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {createForm.role === "Parent" && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-semibold text-sm">Parent Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="occupation">Occupation</Label>
                      <Input
                        id="occupation"
                        value={createForm.occupation || ""}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, occupation: e.target.value }))}
                        placeholder="e.g., Engineer"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workplace">Workplace</Label>
                      <Input
                        id="workplace"
                        value={createForm.workplace || ""}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, workplace: e.target.value }))}
                        placeholder="e.g., ABC Company"
                      />
                    </div>
                  </div>
                  
                  {/* Student Relationships */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Student Relationships</Label>
                      <Button type="button" size="sm" onClick={addStudentRelationship}>
                        Add Student
                      </Button>
                    </div>
                    {createForm.studentRelationships?.map((relationship, index) => (
                      <div key={index} className="border rounded p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-sm">Student {index + 1}</h5>
                          <Button 
                            type="button" 
                            size="sm" 
                            variant="destructive"
                            onClick={() => removeStudentRelationship(index)}
                          >
                            Remove
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Student</Label>
                            <Select
                              value={relationship.studentId}
                              onValueChange={(value) => updateStudentRelationship(index, "studentId", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select student" />
                              </SelectTrigger>
                              <SelectContent>
                                {students.map((student) => (
                                  <SelectItem key={student.id} value={student.id}>
                                    {student.fullName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Relationship</Label>
                            <Select
                              value={relationship.relationship}
                              onValueChange={(value) => updateStudentRelationship(index, "relationship", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select relationship" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Father">Father</SelectItem>
                                <SelectItem value="Mother">Mother</SelectItem>
                                <SelectItem value="Guardian">Guardian</SelectItem>
                                <SelectItem value="Grandparent">Grandparent</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex space-x-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`primary-${index}`}
                              checked={relationship.isPrimaryContact}
                              onChange={(e) => updateStudentRelationship(index, "isPrimaryContact", e.target.checked)}
                              className="rounded"
                            />
                            <label htmlFor={`primary-${index}`} className="text-sm">
                              Primary Contact
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`pickup-${index}`}
                              checked={relationship.hasPickupPermission}
                              onChange={(e) => updateStudentRelationship(index, "hasPickupPermission", e.target.checked)}
                              className="rounded"
                            />
                            <label htmlFor={`pickup-${index}`} className="text-sm">
                              Pickup Permission
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* {createForm.role === "Teacher" && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-semibold text-sm">Teacher Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="employeeId">Employee ID (Optional)</Label>
                      <Input
                        id="employeeId"
                        value={createForm.employeeId || ""}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, employeeId: e.target.value }))}
                        placeholder="Auto-generated if empty"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={createForm.department || ""}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, department: e.target.value }))}
                        placeholder="e.g., Mathematics"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subjects">Subjects (comma-separated)</Label>
                    <Input
                      id="subjects"
                      value={createForm.subjects?.join(", ") || ""}
                      onChange={(e) => setCreateForm(prev => ({ 
                        ...prev, 
                        subjects: e.target.value.split(",").map(s => s.trim()).filter(s => s)
                      }))}
                      placeholder="e.g., Algebra, Geometry, Calculus"
                    />
                  </div>
                </div>
              )} */}

              {/* Common fields for all roles */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={createForm.phone || ""}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleCreateUser}>
                Create User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter users by various criteria</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <Label htmlFor="roleFilter">Role</Label>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-48">
            <Label htmlFor="schoolFilter">School</Label>
            <Select value={schoolFilter} onValueChange={setSchoolFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Schools</SelectItem>
                {schools.map((school) => (
                  <SelectItem key={school._id} value={school._id}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({totalUsers})</CardTitle>
          <CardDescription>
            All registered users in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">Loading users...</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="hidden md:table-cell">School</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {users && users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{user.firstName} {user.lastName}</div>
                        <div className="text-xs text-muted-foreground sm:hidden">
                          {user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{user.email}</TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role?.replace(/_/g, ' ') || user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div>
                        <div>{user.schoolId?.name || "No School"}</div>
                        <div className="text-xs text-muted-foreground">
                          {user.schoolId?.schoolCode || ""}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="hidden sm:inline">{user.isActive ? 'Active' : 'Inactive'}</span>
                        {user.mustChangePassword && (
                          <Badge variant="outline" className="text-xs">
                            Must Change Password
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {user.lastLogin 
                        ? new Intl.DateTimeFormat('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }).format(new Date(user.lastLogin))
                        : "Never logged in"
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {/* Desktop view - all buttons visible */}
                        <div className="hidden sm:flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openPasswordResetDialog(user)}
                          >
                            <Lock className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Mobile view - dropdown menu */}
                        <div className="sm:hidden">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user)
                                  setIsEditDialogOpen(true)
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openPasswordResetDialog(user)}>
                                <Lock className="h-4 w-4 mr-2" />
                                Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteUser(user)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              Showing {(users || []).length} of {totalUsers} users
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and settings.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editFirstName">First Name</Label>
                  <Input
                    id="editFirstName"
                    value={selectedUser.firstName}
                    onChange={(e) => setSelectedUser(prev => prev ? { ...prev, firstName: e.target.value } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editLastName">Last Name</Label>
                  <Input
                    id="editLastName"
                    value={selectedUser.lastName}
                    onChange={(e) => setSelectedUser(prev => prev ? { ...prev, lastName: e.target.value } : null)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEmail">Email</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={selectedUser.email}
                  onChange={(e) => setSelectedUser(prev => prev ? { ...prev, email: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editRole">Role</Label>
                <Select
                  value={selectedUser.role}
                  onValueChange={(value) => setSelectedUser(prev => prev ? { ...prev, role: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editSchool">School</Label>
                <Select
                  value={selectedUser.schoolId?._id || ""}
                  onValueChange={(value) => {
                    const school = schools.find(s => s._id === value)
                    setSelectedUser(prev => prev ? { 
                      ...prev, 
                      schoolId: school ? { _id: school._id, name: school.name, schoolCode: school.schoolCode } : undefined 
                    } : null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {schools && schools.map((school) => (
                      <SelectItem key={school._id} value={school._id}>
                        {school.name} ({school.schoolCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="editActive"
                  checked={selectedUser.isActive}
                  onChange={(e) => setSelectedUser(prev => prev ? { ...prev, isActive: e.target.checked } : null)}
                />
                <Label htmlFor="editActive">Active User</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="submit" onClick={handleUpdateUser}>
              Update User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={isPasswordResetDialogOpen} onOpenChange={setIsPasswordResetDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Reset password for {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showResetPassword ? "text" : "password"}
                  value={resetPasswordForm.newPassword}
                  onChange={(e) => setResetPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Enter new password (min 8 characters)"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowResetPassword(!showResetPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showResetPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="mustChangePassword"
                checked={resetPasswordForm.mustChangePassword}
                onChange={(e) => setResetPasswordForm(prev => ({ ...prev, mustChangePassword: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="mustChangePassword">User must change password on next login</Label>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsPasswordResetDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={() => selectedUser && handleResetPassword(selectedUser._id)}
              disabled={!resetPasswordForm.newPassword || resetPasswordForm.newPassword.length < 8}
            >
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
              All associated data and access will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setUserToDelete(null)
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteUser}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
