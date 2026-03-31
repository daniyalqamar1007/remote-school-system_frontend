"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import { Plus, Edit, Trash2, Key, Eye, EyeOff, Loader2, X } from 'lucide-react'
import axios from 'axios'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'

interface Secretary {
  _id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  address?: string
  createdAt?: string
}

const API = process.env.NEXT_PUBLIC_SRS_SERVER

export default function SecretaryPage() {
  const [secretary, setSecretary] = useState<Secretary | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false)
  
  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  
  // Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    address: ''
  })
  
  // Password change form
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showAddPassword, setShowAddPassword] = useState(false)

  useEffect(() => {
    fetchSecretary()
  }, [])

  const fetchSecretary = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')

      const response = await axios.get(`${API}/admin/secretaries`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.data.success && response.data.data) {
        // Handle different response formats
        let secretaries = []
        
        // Check if data is an array (old format) or object with secretaries property (new format)
        if (Array.isArray(response.data.data)) {
          secretaries = response.data.data
        } else if (response.data.data.secretaries && Array.isArray(response.data.data.secretaries)) {
          secretaries = response.data.data.secretaries
        } else if (Array.isArray(response.data.data.data)) {
          secretaries = response.data.data.data
        }
        
        if (secretaries && secretaries.length > 0) {
          setSecretary(secretaries[0])
        } else {
          setSecretary(null)
        }
      } else {
        setSecretary(null)
      }
    } catch (error: any) {
      console.error('Error fetching secretary:', error)
      setSecretary(null)
      if (error.response?.status !== 404) {
        toast.error("Failed to fetch secretary")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAddSecretary = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      address: ''
    })
    setIsAddModalOpen(true)
  }

  const handleEditSecretary = () => {
    if (secretary) {
      setFormData({
        firstName: secretary.firstName || '',
        lastName: secretary.lastName || '',
        email: secretary.email || '',
        password: '', // Don't pre-fill password
        phone: secretary.phone || '',
        address: secretary.address || ''
      })
      setIsEditModalOpen(true)
    }
  }

  const handleDeleteSecretary = () => {
    setIsDeleteDialogOpen(true)
  }

  const handleChangePassword = () => {
    setPasswordData({
      password: '',
      confirmPassword: ''
    })
    setIsChangePasswordModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Set loading state immediately to prevent multiple clicks
    if (isSubmitting) {
      return // Already submitting, ignore additional clicks
    }
    setIsSubmitting(true)
    
    try {
      if (!formData.firstName || !formData.lastName || !formData.email) {
        toast.error("Please fill in all required fields")
        setIsSubmitting(false)
        return
      }

      if (isAddModalOpen && !formData.password) {
        toast.error("Password is required")
        setIsSubmitting(false)
        return
      }

      if (isAddModalOpen && formData.password.length < 8) {
        toast.error("Password must be at least 8 characters long")
        setIsSubmitting(false)
        return
      }
      const token = localStorage.getItem('accessToken')

      if (isAddModalOpen) {
        const response = await axios.post(
          `${API}/admin/secretaries`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (response.data.success) {
          toast.success("Secretary created successfully")
          setIsAddModalOpen(false)
          fetchSecretary()
        } else {
          toast.error(response.data.message || "Failed to create secretary")
        }
      } else {
        // Edit - don't send email or password
        const updateData: any = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          address: formData.address
        }

        if (!secretary) return

        const response = await axios.put(
          `${API}/admin/secretaries/${secretary._id}`,
          updateData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (response.data.success) {
          toast.success("Secretary updated successfully")
          setIsEditModalOpen(false)
          fetchSecretary()
        } else {
          toast.error(response.data.message || "Failed to update secretary")
        }
      }
    } catch (error: any) {
      console.error('Error submitting secretary:', error)
      const errorMessage = error.response?.data?.message || "An error occurred"
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!secretary) return

    try {
      setIsDeleting(true)
      const token = localStorage.getItem('accessToken')

      const response = await axios.delete(
        `${API}/admin/secretaries/${secretary._id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (response.data.success) {
        toast.success("Secretary deleted successfully")
        setIsDeleteDialogOpen(false)
        setSecretary(null)
        fetchSecretary()
      } else {
        toast.error(response.data.message || "Failed to delete secretary")
      }
    } catch (error: any) {
      console.error('Error deleting secretary:', error)
      const errorMessage = error.response?.data?.message || "Failed to delete secretary"
      toast.error(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!passwordData.password || !passwordData.confirmPassword) {
      toast.error("Please fill in both password fields")
      return
    }

    if (passwordData.password.length < 8) {
      toast.error("Password must be at least 8 characters long")
      return
    }

    if (passwordData.password !== passwordData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (!secretary) return

    try {
      setIsChangingPassword(true)
      const token = localStorage.getItem('accessToken')

      const response = await axios.put(
        `${API}/admin/secretaries/${secretary._id}/change-password`,
        {
          password: passwordData.password,
          confirmPassword: passwordData.confirmPassword
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.data.success) {
        toast.success("Password changed successfully")
        setIsChangePasswordModalOpen(false)
        setPasswordData({ password: '', confirmPassword: '' })
      } else {
        toast.error(response.data.message || "Failed to change password")
      }
    } catch (error: any) {
      console.error('Error changing password:', error)
      const errorMessage = error.response?.data?.message || "Failed to change password"
      toast.error(errorMessage)
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Secretary Management</h1>
          <p className="text-gray-600 mt-1">Manage your school secretary (one per school)</p>
        </div>
        {!secretary && (
          <Button onClick={handleAddSecretary} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Secretary
          </Button>
        )}
      </div>

      {secretary ? (
        <Card>
          <CardHeader>
            <CardTitle>Secretary Information</CardTitle>
            <CardDescription>Current secretary assigned to your school</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">
                    {secretary.firstName} {secretary.lastName}
                  </TableCell>
                  <TableCell>{secretary.email}</TableCell>
                  <TableCell>{secretary.phone || 'N/A'}</TableCell>
                  <TableCell>{secretary.address || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEditSecretary}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleChangePassword}
                      >
                        <Key className="h-4 w-4 mr-1" />
                        Change Password
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteSecretary}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-500 mb-4">No secretary assigned to your school</p>
            <Button onClick={handleAddSecretary} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Secretary
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => {
        if (!isSubmitting) {
          setIsAddModalOpen(open && isAddModalOpen)
          setIsEditModalOpen(open && isEditModalOpen)
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isAddModalOpen ? 'Add Secretary' : 'Edit Secretary'}</DialogTitle>
            <DialogDescription>
              {isAddModalOpen 
                ? 'Create a new secretary for your school. Only one secretary can be assigned per school.'
                : 'Update secretary information'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isEditModalOpen}
                />
              </div>
              {isAddModalOpen && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password * (Minimum 8 characters)</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showAddPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength={8}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowAddPassword(!showAddPassword)}
                    >
                      {showAddPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <PhoneInput
                  country={'us'}
                  value={formData.phone || ''}
                  onChange={(value) => setFormData({ ...formData, phone: value })}
                  containerClass="w-full border border-gray-200 rounded-md relative"
                  inputClass="!w-full !h-10 !border-0 !shadow-none !pl-12"
                  buttonClass="!border-0 !bg-white !h-10 !rounded-none !border-r !border-gray-200"
                  placeholder="Phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddModalOpen(false)
                  setIsEditModalOpen(false)
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isAddModalOpen ? 'Create' : 'Update'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Password Modal */}
      <Dialog open={isChangePasswordModalOpen} onOpenChange={(open) => {
        if (!isChangingPassword) {
          setIsChangePasswordModalOpen(open)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Set a new password for the secretary. Password must be at least 8 characters long.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePasswordSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password * (Minimum 8 characters)</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={passwordData.password}
                    onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                    required
                    minLength={8}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required
                    minLength={8}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsChangePasswordModalOpen(false)}
                disabled={isChangingPassword}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isChangingPassword}>
                {isChangingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Change Password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Secretary</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this secretary? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}

