"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { format } from "date-fns"
import { ArrowLeft, Calendar, CheckCircle, Mail, MapPin, Phone, Shield, User, Briefcase, Award, Building2, Layers, Loader2 } from "lucide-react"
import { toast } from 'sonner'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface SchoolInfo {
    _id: string
    name: string
    code?: string
    type?: string
    phone?: string
    address?: {
        street?: string
        city?: string
        state?: string
        zipCode?: string
        country?: string
    }
}

interface CreatedByInfo {
    _id: string
    email: string
    firstName: string
    lastName: string
    role: string
}

interface NurseDetail {
    _id: string
    email: string
    firstName: string
    lastName: string
    phone?: string
    address?: string
    gender?: string
    profilePicture?: string
    schoolId?: SchoolInfo
    createdBy?: CreatedByInfo
    createdAt?: string
    updatedAt?: string
    userId?: string
    qualifications?: string
    speciality?: string
    licenseNumber?: string
    dateOfJoining?: string
    certifications?: string[]
    employmentType?: string
    employmentStatus?: string
    experienceYears?: string
}

function formatDisplayDate(value?: string) {
    if (!value) return "Not specified"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "Not specified"
    return format(date, "MMMM dd, yyyy")
}

function formatLabel(value?: string) {
    if (!value) return "Not specified"
    return value
        .toLowerCase()
        .split(/[\s_]+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
}

export default function NurseDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const [nurse, setNurse] = useState<NurseDetail | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchNurse = async () => {
            try {
                setLoading(true)
                const token = localStorage.getItem("accessToken") || localStorage.getItem("authToken")
                const { data } = await axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/nurses/${params.id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })

                if (!data?.success || !data?.data) {
                    throw new Error("Failed to load nurse")
                }

                setNurse(data.data)
            } catch (error) {
                console.error("Error fetching nurse:", error)
                toast.error((error as any).response?.data?.message || "Failed to fetch nurse details")
                router.back()
            } finally {
                setLoading(false)
            }
        }

        fetchNurse()
    }, [params.id, router])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-gray-500" />
                    <p className="text-gray-600">Loading nurse profile...</p>
                </div>
            </div>
        )
    }

    if (!nurse) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <p className="text-gray-500">Nurse not found.</p>
                <Button onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go Back
                </Button>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-6xl space-y-6 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={() => router.back()} className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Nurse Profile</h1>
                        <p className="text-gray-600">Complete information for {nurse.firstName} {nurse.lastName}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {nurse.employmentType && (
                        <Badge variant="outline">
                            {formatLabel(nurse.employmentType)}
                        </Badge>
                    )}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-1">
                    <CardHeader className="text-center">
                        <div className="flex justify-center">
                            <Avatar className="h-28 w-28">
                                <AvatarImage src={nurse.profilePicture} alt={`${nurse.firstName} ${nurse.lastName}`} />
                                <AvatarFallback className="text-2xl">
                                    {nurse.firstName?.charAt(0)}
                                    {nurse.lastName?.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                        <CardTitle className="text-xl">
                            {nurse.firstName} {nurse.lastName}
                        </CardTitle>
                        <p className="text-sm text-gray-500">{nurse.speciality || "Speciality not specified"}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3 text-sm text-gray-700">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span>{nurse.email}</span>
                        </div>
                        {nurse.phone && (
                            <div className="flex items-center gap-3 text-sm text-gray-700">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <span>{nurse.phone}</span>
                            </div>
                        )}
                        {nurse.gender && (
                            <div className="flex items-center gap-3 text-sm text-gray-700">
                                <User className="h-4 w-4 text-gray-400" />
                                <span>{formatLabel(nurse.gender)}</span>
                            </div>
                        )}
                        {nurse.address && (
                            <div className="flex items-start gap-3 text-sm text-gray-700">
                                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                                <span>{nurse.address}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-3 text-sm text-gray-700">
                            <Shield className="h-4 w-4 text-gray-400" />
                            <span>License: {nurse.licenseNumber || "Not specified"}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-700">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>Joined: {formatDisplayDate(nurse.dateOfJoining)}</span>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6 lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Briefcase className="h-5 w-5" />
                                Professional Overview
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Speciality</p>
                                <p className="text-base text-gray-900">{nurse.speciality || "Not specified"}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Qualifications</p>
                                <p className="text-base text-gray-900">{nurse.qualifications?.trim() || "Not specified"}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Employment Type</p>
                                <p className="text-base text-gray-900">{formatLabel(nurse.employmentType)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Experience Years</p>
                                <p className="text-base text-gray-900">{nurse.experienceYears}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Building2 className="h-5 w-5" />
                                School Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">School Name</p>
                                    <p className="text-base text-gray-900">{nurse.schoolId?.name || "Not assigned"}</p>
                                </div>
                                {nurse.schoolId?.code && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">School Code</p>
                                        <p className="text-base text-gray-900">{nurse.schoolId.code}</p>
                                    </div>
                                )}
                            </div>
                            {nurse.schoolId?.type && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Type</p>
                                    <p className="text-base text-gray-900">{formatLabel(nurse.schoolId.type)}</p>
                                </div>
                            )}
                            {nurse.schoolId?.address && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Address</p>
                                    <p className="text-base text-gray-900">
                                        {[nurse.schoolId.address.street, nurse.schoolId.address.city, nurse.schoolId.address.state, nurse.schoolId.address.zipCode, nurse.schoolId.address.country]
                                            .filter(Boolean)
                                            .join(", ")}
                                    </p>
                                </div>
                            )}
                            {nurse.schoolId?.phone && (
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <span>{nurse.schoolId.phone}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Award className="h-5 w-5" />
                                Certifications
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {nurse.certifications && nurse.certifications.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {nurse.certifications.map((cert, index) => (
                                        <Badge key={`${cert}-${index}`} variant="secondary" className="flex items-center gap-1">
                                            <CheckCircle className="h-3 w-3" />
                                            {cert}
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No certifications listed.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Layers className="h-5 w-5" />
                                System & Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Created At</p>
                                <p className="text-base text-gray-900">{formatDisplayDate(nurse.createdAt)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Last Updated</p>
                                <p className="text-base text-gray-900">{formatDisplayDate(nurse.updatedAt)}</p>
                            </div>
                            {nurse.createdBy && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Created By</p>
                                    <p className="text-base text-gray-900">
                                        {nurse.createdBy.firstName} {nurse.createdBy.lastName}
                                    </p>
                                    <p className="text-sm text-gray-500">{nurse.createdBy.email}</p>
                                    <p className="text-xs text-gray-400 uppercase">{nurse.createdBy.role}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
