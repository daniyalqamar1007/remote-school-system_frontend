"use client"

import type { ChangeEvent } from "react"
import { Camera, Loader2, Upload, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

interface GuardianFormProps {
  isEditing: any
  formData: {
    guardianName: string
    guardianEmail: string
    guardianPhone: string
    guardianRelation: string
    guardianProfession: string
    [key: string]: any
  }
  errors: {
    guardianName: any
    guardianEmail: string
    guardianPhone: string
    guardianRelation: string
    guardianProfession: string
    [key: string]: any
  }
  photoPreview: string | null
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void
  onPhotoChange: (e: ChangeEvent<HTMLInputElement>) => void
  onSubmit: () => void
  onBack: () => void
  isSubmitting?: boolean
  disabled?: boolean
}

export function GuardianForm({
  isEditing,
  formData,
  errors,
  photoPreview,
  onInputChange,
  onPhotoChange,
  onSubmit,
  onBack,
  isSubmitting = false,
  disabled = false,
}: GuardianFormProps) {
  return (
    <div className="p-6 space-y-8">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Photo Upload */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Guardian Photo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="flex h-32 w-32 sm:h-40 sm:w-40 items-center justify-center rounded-full bg-gray-100 overflow-hidden">
                  {photoPreview ? (
                    <img
                      src={photoPreview || "/placeholder.svg"}
                      alt="Guardian preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-16 w-16 sm:h-20 sm:w-20 text-gray-400" />
                  )}
                </div>
                <label
                  htmlFor="guardian-photo-upload"
                  className={`absolute bottom-0 right-0 rounded-full bg-black p-2 text-white shadow-lg ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                  <input
                    id="guardian-photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onPhotoChange}
                    disabled={disabled}
                  />
                </label>
              </div>
              <label htmlFor="guardian-photo-upload-btn" className="mt-4">
                <Button variant="outline" asChild disabled={disabled}>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Photo
                    <input
                      id="guardian-photo-upload-btn"
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
          </CardContent>
        </Card>

        {/* Guardian Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Guardian Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="guardianName">Full Name</Label>
              <Input
                id="guardianName"
                name="guardianName"
                placeholder="Enter guardian's full name"
                className={`border-gray-200 ${errors.guardianName ? "border-red-500" : ""}`}
                value={formData.guardianName}
                onChange={onInputChange}
                disabled={disabled}
              />
              {errors.guardianName && <p className="text-sm text-red-500 mt-1">{errors.guardianName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="guardianEmail">Email Address</Label>
              <Input
                id="guardianEmail"
                name="guardianEmail"
                type="email"
                placeholder="Enter guardian's email address"
                className={`border-gray-200 ${errors.guardianEmail ? "border-red-500" : ""} ${isEditing ? "bg-gray-100 cursor-not-allowed" : ""}`}
                value={formData.guardianEmail}
                onChange={onInputChange}
                disabled={disabled || isEditing}
              />
              {errors.guardianEmail && <p className="text-sm text-red-500 mt-1">{errors.guardianEmail}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="guardianPhone">Phone Number</Label>
              <Input
                id="guardianPhone"
                name="guardianPhone"
                placeholder="Enter guardian's phone number"
                className={`border-gray-200 ${errors.guardianPhone ? "border-red-500" : ""}`}
                value={formData.guardianPhone}
                onChange={onInputChange}
                disabled={disabled}
              />
              {errors.guardianPhone && <p className="text-sm text-red-500 mt-1">{errors.guardianPhone}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="relation">Relation</Label>
              <Input
                id="guardianRelation"
                name="guardianRelation"
                type="text"
                placeholder="Enter guardian's Relation"
                className={`border-gray-200 ${errors.guardianRelation ? "border-red-500" : ""}`}
                value={formData.guardianRelation}
                onChange={onInputChange}
                disabled={disabled}
              />
              {errors.guardianRelation && <p className="text-sm text-red-500 mt-1">{errors.guardianRelation}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="guardianProfession">Profession</Label>
              <Input
                id="guardianProfession"
                name="guardianProfession"
                type="text"
                placeholder="Enter guardian's profession"
                className={`border-gray-200 ${errors.guardianProfession ? "border-red-500" : ""}`}
                value={formData.guardianProfession}
                onChange={onInputChange}
                disabled={disabled}
              />
              {errors.guardianProfession && <p className="text-sm text-red-500 mt-1">{errors.guardianProfession}</p>}
            </div>

            <Separator />

            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={onBack} disabled={disabled}>
                Back
              </Button>
              <Button className="bg-black text-white hover:bg-gray-800" onClick={onSubmit} disabled={disabled}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Updating..." : "Submitting..."}
                  </>
                ) : isEditing ? (
                  "Update"
                ) : (
                  "Submit"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

