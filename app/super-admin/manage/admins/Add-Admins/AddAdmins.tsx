"use client"

import type React from "react"

import { useEffect, useState } from "react"
import axios from "axios"
import { CheckIcon, Eye, EyeOff, Loader2 } from "lucide-react"
import PhoneInput from "react-phone-input-2"
import "react-phone-input-2/lib/style.css"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from 'sonner'

type Gender = "MALE" | "FEMALE" | "OTHER"

interface School {
  _id: string
  name: string
  schoolCode?: string
}

interface Admin {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  gender: Gender
}

interface AddAdminModalProps {
  isOpen: boolean
  onClose: () => void
  adminData?: Admin | null
  onSuccess: () => void
}

interface FormState {
  firstName: string
  lastName: string
  email: string
  phone: string
  gender: Gender
  password: string
}

const EMPTY_FORM: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  gender: "MALE",
  password: "",
}

const MIN_PASSWORD_LENGTH = 8
const PHONE_MIN_DIGITS = 10
const PHONE_MAX_DIGITS = 15

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("accessToken") ||
  localStorage.getItem("authToken")
const isPhoneValid = (value: string) => {
  const digits = value.replace(/[^\d]/g, "")
  return digits.length >= PHONE_MIN_DIGITS && digits.length <= PHONE_MAX_DIGITS
}

export default function AddAdminModal({ isOpen, onClose, adminData, onSuccess }: AddAdminModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [isValidPhone, setIsValidPhone] = useState(true)

  useEffect(() => {
    if (!isOpen) return
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    if (adminData) {
      setFormData({
        firstName: adminData.firstName || "",
        lastName: adminData.lastName || "",
        email: adminData.email || "",
        phone: adminData.phone || "",
        gender: adminData.gender || "MALE",
        password: "",
      })
      setIsValidPhone(isPhoneValid(adminData.phone || ""))
    } else {
      setFormData(EMPTY_FORM)
      setIsValidPhone(true)
    }

    setErrors({})
    setShowPassword(false)
  }, [isOpen, adminData])

  const updateFormField = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) nextErrors.firstName = "First name is required"
    if (!formData.lastName.trim()) nextErrors.lastName = "Last name is required"
    if (!formData.email.trim()) nextErrors.email = "Email is required"
    if (!formData.phone.trim()) nextErrors.phone = "Phone number is required"
    else if (!isValidPhone) nextErrors.phone = "Please enter a valid phone number"
    if (!formData.gender) nextErrors.gender = "Gender is required"
    if (!adminData && !formData.password.trim()) nextErrors.password = "Password is required"
    if (formData.password.trim() && formData.password.trim().length < MIN_PASSWORD_LENGTH) {
      nextErrors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please fix the errors below")
      return
    }

    try {
      setIsLoading(true)
      const token = getToken()
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      }
      const baseUrl = process.env.NEXT_PUBLIC_SRS_SERVER

      if (adminData?._id) {
        const updatePayload: Record<string, string> = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          gender: formData.gender,
        }

        const response = await axios.put(
          `${baseUrl}/super-admin/admins/${adminData._id}`,
          updatePayload,
          { headers }
        )
        toast.success(response.data?.message || "Admin updated successfully")

        const trimmedPassword = formData.password.trim()
        if (trimmedPassword) {
          try {
            await axios.post(
              `${baseUrl}/super-admin/users/${adminData._id}/reset-password`,
              { newPassword: trimmedPassword, mustChangePassword: false },
              { headers }
            )
            toast.success("Password updated successfully")
          } catch (passwordError: any) {
            console.error("Failed to update password:", passwordError)
            toast.error(
              passwordError?.response?.data?.message || "Password update failed"
            )
            setIsLoading(false)
            return
          }
        }
      } else {
        const createPayload: Record<string, string> = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          gender: formData.gender,
          password: formData.password.trim(),
        }

        const response = await axios.post(
          `${baseUrl}/super-admin/admins`,
          createPayload,
          { headers }
        )
        toast.success(response.data?.message || "Admin created successfully")
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error("Error saving admin:", error)
      if (error?.response?.status === 409) {
        toast.error(error.response?.data?.message || "Email already in use")
      } else {
        toast.error(
          error?.response?.data?.message ||
          (adminData ? "Failed to update admin" : "Failed to create admin")
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{adminData ? "Edit Admin" : "Add New Admin"}</DialogTitle>
          <DialogDescription>
            {adminData
              ? "Update the admin’s details below."
              : "Fill in the details to add a new admin."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(event) => updateFormField("firstName", event.target.value)}
                  className={`border-gray-300 focus:border-black focus:ring-black ${errors.firstName ? "border-red-600" : ""
                    }`}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(event) => updateFormField("lastName", event.target.value)}
                  className={`border-gray-300 focus:border-black focus:ring-black ${errors.lastName ? "border-red-600" : ""
                    }`}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(event) => updateFormField("email", event.target.value)}
                  disabled={!!adminData}
                  className={`border-gray-300 focus:border-black focus:ring-black ${errors.email ? "border-red-600" : ""
                    }`}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">
                  Gender <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value: Gender) => updateFormField("gender", value)}
                >
                  <SelectTrigger
                    className={`border-gray-300 focus:border-black focus:ring-black ${errors.gender ? "border-red-600" : ""
                      }`}
                  >
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && (
                  <p className="text-sm text-red-600">{errors.gender}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone <span className="text-red-500">*</span>
                </Label>
                <PhoneInput
                  value={formData.phone}
                  onChange={(value) => {
                    updateFormField("phone", value)
                    setIsValidPhone(isPhoneValid(value))
                  }}
                  inputProps={{ name: "phone", required: true }}
                  country="us"
                  placeholder="Phone number"
                  inputClass={`!w-full !h-10 !text-sm !border !rounded-md focus:!border-black ${errors.phone ? "!border-red-500" : "!border-gray-300"
                    }`}
                  buttonClass={`!h-10 ${errors.phone ? "!border-red-500" : "!border-gray-300"
                    }`}
                  enableSearch
                  specialLabel=""
                />
                {errors.phone && (
                  <p className="text-sm text-red-600">{errors.phone}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  {adminData ? "New Password (optional)" : "Password"}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={
                      adminData
                        ? "Leave blank to keep current password"
                        : "Enter password"
                    }
                    value={formData.password}
                    onChange={(event) => updateFormField("password", event.target.value)}
                    className={`border-gray-300 focus:border-black focus:ring-black ${errors.password ? "border-red-600" : ""
                      }`}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600"
                    onClick={() => setShowPassword((previous) => !previous)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password}</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-black text-white hover:bg-black/90" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {adminData ? "Saving..." : "Adding..."}
                </>
              ) : (
                <>
                  {/* <CheckIcon className="mr-2 h-4 w-4" /> */}
                  {adminData ? "Update Admin" : "Add Admin"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
