"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { 
  Key, 
  Shield, 
  Users, 
  Lock, 
  Unlock,
  Eye,
  EyeOff,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreVertical
} from "lucide-react"
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface User {
  _id: string
  firstName: string
  lastName: string
  email: string
  role: string
  lastLogin?: string
  failedLoginAttempts?: number
  mfaEnabled?: boolean
  isActive: boolean
  schoolId?: {
    _id: string
    name: string
    code?: string
  } | string
  schoolName?: string
  accountLocked?: boolean
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function PasswordManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resetForm, setResetForm] = useState({
    newPassword: "",
    confirmPassword: "",
    showPassword: false,
    showConfirmPassword: false
  })
  const [formErrors, setFormErrors] = useState({
    newPassword: "",
    confirmPassword: ""
  })

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [debouncedSearchTerm, roleFilter])

  // Fetch users when filters or pagination changes
  useEffect(() => {
    console.log('🔄 Frontend: useEffect triggered with:', { 
      page: pagination.page, 
      limit: pagination.limit, 
      search: debouncedSearchTerm, 
      role: roleFilter 
    })
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, debouncedSearchTerm, roleFilter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })
      
      // Add search parameter if provided
      if (debouncedSearchTerm && debouncedSearchTerm.trim()) {
        params.append('search', debouncedSearchTerm.trim())
        console.log('🔍 Frontend: Adding search param:', debouncedSearchTerm.trim())
      }
      
      // Add role parameter if not 'all'
      if (roleFilter && roleFilter !== 'all') {
        params.append('role', roleFilter)
        console.log('🔍 Frontend: Adding role param:', roleFilter)
      }
      
      const url = `${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/users?${params.toString()}`
      console.log('🔍 Frontend: Fetching users from URL:', url)
      
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const result = await response.json()
        
        // Handle the response structure: { success, statusCode, message, data: { users, pagination } }
        if (result.success && result.data) {
          const usersData = result.data.users || []
          const paginationData = result.data.pagination || {}
          
          setUsers(usersData)
          
          // Update pagination state with correct values
          // Handle both naming conventions: page/currentPage, total/totalCount
          setPagination(prev => ({
            ...prev,
            total: paginationData.total || paginationData.totalCount || 0,
            totalPages: paginationData.totalPages || 0,
            page: paginationData.page || paginationData.currentPage || prev.page,
            limit: paginationData.limit || prev.limit,
          }))
        } else {
          // Fallback for different response structure
          const usersData = result.users || result.data?.users || []
          const paginationData = result.pagination || result.data?.pagination || {}
          
          setUsers(usersData)
          if (paginationData && (paginationData.total !== undefined || paginationData.totalCount !== undefined || paginationData.totalPages !== undefined)) {
            setPagination(prev => ({
              ...prev,
              total: paginationData.total || paginationData.totalCount || 0,
              totalPages: paginationData.totalPages || 0,
              page: paginationData.page || paginationData.currentPage || prev.page,
              limit: paginationData.limit || prev.limit,
            }))
          }
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.message || "Failed to fetch users")
        setUsers([])
        setPagination(prev => ({ ...prev, total: 0, totalPages: 0 }))
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      toast.error("Error fetching users")
      setUsers([])
      setPagination(prev => ({ ...prev, total: 0, totalPages: 0 }))
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (!selectedUser) return

    // Reset errors
    setFormErrors({
      newPassword: "",
      confirmPassword: ""
    })

    // Validate fields
    let hasErrors = false
    const errors = {
      newPassword: "",
      confirmPassword: ""
    }

    if (!resetForm.newPassword.trim()) {
      errors.newPassword = "is required"
      hasErrors = true
    } else if (resetForm.newPassword.length < 8) {
      errors.newPassword = "must be at least 8 characters"
      hasErrors = true
    }

    if (!resetForm.confirmPassword.trim()) {
      errors.confirmPassword = "is required"
      hasErrors = true
    }

    if (hasErrors) {
      setFormErrors(errors)
      return
    }

    if (resetForm.newPassword !== resetForm.confirmPassword) {
      setFormErrors({
        newPassword: "",
        confirmPassword: "passwords do not match"
      })
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/users/${selectedUser._id}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          newPassword: resetForm.newPassword
        }),
      })

      if (response.ok) {
        toast.success("Password updated successfully")
        setIsResetDialogOpen(false)
        setResetForm({
          newPassword: "",
          confirmPassword: "",
          showPassword: false,
          showConfirmPassword: false
        })
        setFormErrors({
          newPassword: "",
          confirmPassword: ""
        })
        fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to update password")
      }
    } catch (error) {
      console.error("Error updating password:", error)
      toast.error("Error updating password")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handlePageSizeChange = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }))
  }

  const openResetDialog = (user: User) => {
    setSelectedUser(user)
    setResetForm({
      newPassword: "",
      confirmPassword: "",
      showPassword: false,
      showConfirmPassword: false
    })
    setFormErrors({
      newPassword: "",
      confirmPassword: ""
    })
    setIsResetDialogOpen(true)
  }

  const getSchoolName = (user: User) => {
    if (!user.schoolId) return "No School"
    if (typeof user.schoolId === 'object' && user.schoolId.name) {
      return user.schoolId.name
    }
    return user.schoolName || "No School"
  }

  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    { value: 'SUPER_ADMIN', label: 'Super Admin' },
    { value: 'ADMIN', label: 'Admin' },
    { value: 'TEACHER', label: 'Teacher' },
    { value: 'STUDENT', label: 'Student' },
    { value: 'PARENT', label: 'Parent' },
    { value: 'NURSE', label: 'Nurse' },
    { value: 'SECRETARY', label: 'Secretary' }
  ]

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Password Management</h2>
          <p className="text-muted-foreground">
            Manage user passwords, security policies, and multi-factor authentication
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="w-full md:w-48">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Records ({pagination.total})</CardTitle>
          <CardDescription>
            Manage user passwords and security settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No users found</h3>
              <p className="text-gray-600 dark:text-gray-400">No users match your search criteria.</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Failed Attempts</TableHead>
                      <TableHead>MFA</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell className="font-medium">
                          {user.firstName} {user.lastName}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.role}</Badge>
                        </TableCell>
                        <TableCell>{getSchoolName(user)}</TableCell>
                        <TableCell>
                          {user.lastLogin 
                            ? new Date(user.lastLogin).toLocaleDateString()
                            : 'Never'
                          }
                        </TableCell>
                        <TableCell>
                          <span className={user.failedLoginAttempts && user.failedLoginAttempts > 0 ? "text-red-600 font-medium" : ""}>
                            {user.failedLoginAttempts || 0}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {user.mfaEnabled ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-green-600">Enabled</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-400">Disabled</span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openResetDialog(user)}>
                                <Key className="h-4 w-4 mr-2" />
                                Update Password
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 0 && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Show</span>
                    <Select
                      value={pagination.limit.toString()}
                      onValueChange={(value) => handlePageSizeChange(Number(value))}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-gray-600 dark:text-gray-400">per page</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {pagination.totalPages > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1 || loading}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                    )}

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum: number
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1
                        } else if (pagination.page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i
                        } else {
                          pageNum = pagination.page - 2 + i
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={pagination.page === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>

                    {pagination.totalPages > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages || loading}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Update Password Dialog */}
      <Dialog open={isResetDialogOpen} onOpenChange={(open) => {
        setIsResetDialogOpen(open)
        if (!open) {
          setFormErrors({
            newPassword: "",
            confirmPassword: ""
          })
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Password</DialogTitle>
            <DialogDescription>
              Update password for {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={resetForm.showPassword ? "text" : "password"}
                  value={resetForm.newPassword}
                  onChange={(e) => {
                    setResetForm(prev => ({ ...prev, newPassword: e.target.value }))
                    if (formErrors.newPassword) {
                      setFormErrors(prev => ({ ...prev, newPassword: "" }))
                    }
                  }}
                  placeholder="Enter new password"
                  className={`pr-10 ${formErrors.newPassword ? "border-red-500" : ""}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setResetForm(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                >
                  {resetForm.showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {formErrors.newPassword && (
                <p className="text-sm text-red-500">{formErrors.newPassword}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={resetForm.showConfirmPassword ? "text" : "password"}
                  value={resetForm.confirmPassword}
                  onChange={(e) => {
                    setResetForm(prev => ({ ...prev, confirmPassword: e.target.value }))
                    if (formErrors.confirmPassword) {
                      setFormErrors(prev => ({ ...prev, confirmPassword: "" }))
                    }
                  }}
                  placeholder="Confirm new password"
                  className={`pr-10 ${formErrors.confirmPassword ? "border-red-500" : ""}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setResetForm(prev => ({ ...prev, showConfirmPassword: !prev.showConfirmPassword }))}
                >
                  {resetForm.showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {formErrors.confirmPassword && (
                <p className="text-sm text-red-500">{formErrors.confirmPassword}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePassword} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
