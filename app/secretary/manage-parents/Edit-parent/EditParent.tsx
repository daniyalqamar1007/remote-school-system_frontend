"use client"

import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import LoadingSpinner from '@/components/LoadingSpinner'

interface EditParentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  parentId: string | null
}

interface ParentFormData {
  email: string
  firstName: string
  lastName: string
  gender: string
  isPrimaryContact: boolean
  hasPickupPermission: boolean
  parentType: string
  password: string
  phone: string
  address: string
}

export default function EditParentModal({ isOpen, onClose, onSuccess, parentId }: EditParentModalProps) {
  const [formData, setFormData] = useState<ParentFormData>({
    email: "",
    firstName: "",
    lastName: "",
    gender: "",
    isPrimaryContact: true,
    hasPickupPermission: false,
    parentType: "",
    password: "",
    phone: "",
    address: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [phoneCountry, setPhoneCountry] = useState('us')
  const [isValidPhone, setIsValidPhone] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  // Fetch parent data when modal opens
  useEffect(() => {
    if (isOpen && parentId) {
      fetchParentData()
    } else if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        email: "",
        firstName: "",
        lastName: "",
        gender: "",
        isPrimaryContact: true,
        hasPickupPermission: false,
        parentType: "",
        password: "",
        phone: "",
        address: "",
      })
      setErrors({})
      setShowPassword(false)
      setPhoneCountry('us')
      setIsValidPhone(true)
    } else {
      // Scroll to top when modal opens
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }, [isOpen, parentId])

  const fetchParentData = async () => {
    if (!parentId) return

    setIsFetching(true)
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
      
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/parents/${parentId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (response.data.success && response.data.data?.parent) {
        const parent = response.data.data.parent
        
        // Extract country code from phone if it starts with +
        let phoneValue = parent.phone || ""
        let countryCode = 'us'
        
        if (phoneValue.startsWith('+')) {
          // Remove + and get first 1-3 digits as country code
          const withoutPlus = phoneValue.replace('+', '')
          if (withoutPlus.startsWith('92')) {
            countryCode = 'pk'
          } else if (withoutPlus.startsWith('1')) {
            countryCode = 'us'
          }
        }
        
        setPhoneCountry(countryCode)
        
        setFormData({
          email: parent.email || "",
          firstName: parent.firstName || "",
          lastName: parent.lastName || "",
          gender: parent.gender || "",
          isPrimaryContact: parent.isPrimaryContact ?? true,
          hasPickupPermission: parent.hasPickupPermission ?? false,
          parentType: parent.parentType || "",
          password: "", // Don't pre-fill password
          phone: phoneValue.replace(/[^\d]/g, ''), // Extract digits only for PhoneInput
          address: parent.address || "",
        })
        setIsValidPhone(true)
      } else {
        toast.error("Failed to fetch parent data")
        onClose()
      }
    } catch (error: any) {
      console.error("Error fetching parent data:", error)
      toast.error(error.response?.data?.message || "Failed to fetch parent data")
      onClose()
    } finally {
      setIsFetching(false)
    }
  }

  const handleInputChange = (field: keyof ParentFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName?.trim()) {
      newErrors.firstName = "First name is required"
    }

    if (!formData.lastName?.trim()) {
      newErrors.lastName = "Last name is required"
    }

    if (!formData.email?.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!formData.gender) {
      newErrors.gender = "Gender is required"
    }

    if (!formData.parentType) {
      newErrors.parentType = "Parent type is required"
    }

    // Password is optional for update, but if provided, must be at least 8 characters
    if (formData.password && formData.password.length > 0 && formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }

    if (!formData.phone?.trim()) {
      newErrors.phone = "Phone number is required"
    } else if (!isValidPhone) {
      newErrors.phone = "Please enter a valid phone number"
    }

    if (!formData.address?.trim()) {
      newErrors.address = "Address is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Please fill all required fields correctly")
      return
    }

    if (!parentId) {
      toast.error("Parent ID is missing")
      return
    }

    setIsSubmitting(true)

    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token')

      const payload: any = {
        email: formData.email.trim().toLowerCase(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        gender: formData.gender,
        isPrimaryContact: formData.isPrimaryContact,
        hasPickupPermission: formData.hasPickupPermission,
        parentType: formData.parentType,
        phone: formData.phone.startsWith('+') ? formData.phone.trim() : `+${formData.phone.trim()}`,
        address: formData.address.trim(),
      }

      // Only include password if it's provided
      if (formData.password && formData.password.trim().length > 0) {
        payload.password = formData.password
      }

      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/parents/${parentId}`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.data.success) {
        toast.success(response.data.message || "Parent updated successfully")
        onClose()
        if (onSuccess) {
          onSuccess()
        }
      } else {
        toast.error(response.data.message || "Failed to update parent")
      }
    } catch (error: any) {
      console.error("Error updating parent:", error)
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to update parent. Please try again."
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold">Edit Parent</DialogTitle>
        </DialogHeader>

        {isFetching ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <LoadingSpinner />
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-4"
            style={{ maxHeight: 'calc(90vh - 120px)' }}
          >
            <form onSubmit={handleSubmit} className="space-y-6 py-2">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Personal Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div className="space-y-2 w-full min-w-0">
                    <Label htmlFor="firstName" className="text-sm font-medium">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="Enter first name"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      className={`w-full ${errors.firstName ? "border-red-500" : ""}`}
                    />
                    {errors.firstName && (
                      <p className="text-sm text-red-500">{errors.firstName}</p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div className="space-y-2 w-full min-w-0">
                    <Label htmlFor="lastName" className="text-sm font-medium">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Enter last name"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      className={`w-full ${errors.lastName ? "border-red-500" : ""}`}
                    />
                    {errors.lastName && (
                      <p className="text-sm text-red-500">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email - Disabled */}
                  <div className="space-y-2 w-full min-w-0">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email address"
                      value={formData.email}
                      disabled
                      className="w-full bg-gray-50 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500">Email cannot be changed</p>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2 w-full min-w-0">
                    <Label htmlFor="phone" className="text-sm font-medium">
                      Phone Number <span className="text-red-500">*</span>
                    </Label>
                    <div className={`w-full min-w-0 ${errors.phone ? "border border-red-500 rounded-md" : ""}`}>
                      <PhoneInput
                        country={phoneCountry}
                        value={formData.phone}
                        onChange={(phone) => {
                          handleInputChange("phone", phone)
                          
                          // Use react-phone-input-2's built-in validation
                          // The library automatically validates based on country format
                          // Check if phone has enough digits (not just country code)
                          const digitsOnly = phone.replace(/[^\d]/g, '')
                          // Minimum requirement: country code (1-3 digits) + national number (at least 7 digits)
                          const isValid = digitsOnly.length >= 10 && digitsOnly.length <= 15
                          setIsValidPhone(isValid)
                          
                          // Clear error when user starts typing valid number
                          if (errors.phone && isValid) {
                            setErrors((prev) => {
                              const newErrors = { ...prev }
                              delete newErrors.phone
                              return newErrors
                            })
                          }
                        }}
                        onCountryChange={(country) => {
                          setPhoneCountry(country.dialCode ? country.countryCode || 'us' : 'us')
                        }}
                        inputClass={`w-full !h-10 !text-sm !pl-12 !max-w-full ${errors.phone ? "!border-red-500" : ""}`}
                        buttonClass={`${errors.phone ? "!border-red-500" : ""}`}
                        dropdownClass="!z-50"
                        containerClass="phone-input-container w-full"
                        specialLabel=""
                        enableSearch={true}
                        disableSearchIcon={false}
                        countryCodeEditable={false}
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Gender */}
                  <div className="space-y-2 w-full min-w-0">
                    <Label htmlFor="gender" className="text-sm font-medium">
                      Gender <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => handleInputChange("gender", value)}
                    >
                      <SelectTrigger className={`w-full ${errors.gender ? "border-red-500" : ""}`}>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.gender && (
                      <p className="text-sm text-red-500">{errors.gender}</p>
                    )}
                  </div>

                  {/* Parent Type */}
                  <div className="space-y-2 w-full min-w-0">
                    <Label htmlFor="parentType" className="text-sm font-medium">
                      Parent Type <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.parentType}
                      onValueChange={(value) => handleInputChange("parentType", value)}
                    >
                      <SelectTrigger className={`w-full ${errors.parentType ? "border-red-500" : ""}`}>
                        <SelectValue placeholder="Select parent type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FATHER">Father</SelectItem>
                        <SelectItem value="MOTHER">Mother</SelectItem>
                        <SelectItem value="GUARDIAN">Guardian</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.parentType && (
                      <p className="text-sm text-red-500">{errors.parentType}</p>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2 w-full min-w-0">
                  <Label htmlFor="address" className="text-sm font-medium">
                    Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="address"
                    type="text"
                    placeholder="Enter full address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    className={`w-full ${errors.address ? "border-red-500" : ""}`}
                  />
                  {errors.address && (
                    <p className="text-sm text-red-500">{errors.address}</p>
                  )}
                </div>

                {/* Password - Optional */}
                <div className="space-y-2 w-full min-w-0">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password (Leave blank to keep current password)
                  </Label>
                  <div className="relative w-full">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password (min 8 characters)"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className={`w-full ${errors.password ? "border-red-500 pr-10" : "pr-10"}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Leave blank to keep the current password. If provided, must be at least 8 characters.
                  </p>
                </div>
              </div>

              {/* Additional Options */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Additional Options
                </h3>

                <div className="space-y-3">
                  {/* Primary Contact */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <Label htmlFor="isPrimaryContact" className="text-sm font-medium cursor-pointer">
                        Primary Contact
                      </Label>
                      <p className="text-xs text-gray-500">
                        Mark this parent as the primary contact for their children
                      </p>
                    </div>
                    <input
                      id="isPrimaryContact"
                      type="checkbox"
                      checked={formData.isPrimaryContact}
                      onChange={(e) => handleInputChange("isPrimaryContact", e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </div>

                  {/* Pickup Permission */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <Label htmlFor="hasPickupPermission" className="text-sm font-medium cursor-pointer">
                        Pickup Permission
                      </Label>
                      <p className="text-xs text-gray-500">
                        Allow this parent to pick up their children from school
                      </p>
                    </div>
                    <input
                      id="hasPickupPermission"
                      type="checkbox"
                      checked={formData.hasPickupPermission}
                      onChange={(e) => handleInputChange("hasPickupPermission", e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto sm:min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Parent"
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Phone Input Styling */}
        <style jsx>{`
          /* Prevent horizontal overflow */
          .phone-input-container {
            width: 100% !important;
            max-width: 100% !important;
          }
          
          /* Increase height of country dropdown in phone inputs within this modal */
          :global(.react-phone-input-2) {
            position: relative;
            overflow: visible !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          :global(.react-phone-input-2 .flag-dropdown) {
            z-index: 10000;
          }
          :global(.react-phone-input-2 .country-list) {
            position: absolute;
            top: 100% !important;
            left: 0;
            max-height: 360px !important;
            overflow-y: auto !important;
            z-index: 9999;
            width: 100% !important;
            max-width: 100% !important;
          }
          :global(.react-phone-input-2 .country-list .country) {
            padding: 6px 10px;
          }
          :global(.react-phone-input-2 .country-list .country:hover) {
            background-color: #f0f0f0;
          }
          :global(.react-phone-input-2 input) {
            width: 100% !important;
            max-width: 100% !important;
          }
        `}</style>
      </DialogContent>
    </Dialog>
  )
}

