"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  User,
  Calendar,
  Briefcase,
  Building2,
  School,
  GraduationCap,
  UserCircle,
  Shield,
  Droplet,
  AlertCircle,
  Stethoscope,
  Clock,
  BookOpen,
  Users,
  Home,
  Globe,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";

type StudentObj = {
  _id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  email: string;
  phone?: string;
  dob?: string;
  address?: string | {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  class: string;
  section: string;
  enrollDate?: string;
  expectedGraduation?: string;
  emergencyContact?: string | {
    name?: string;
    relationship?: string;
    phone?: string;
  };
  profilePhoto?: string;
  bloodGroup?: string;
  medicalConditions?: string[];
  allergies?: string[];
  previousSchool?: string;
  gender?: string;
  transportMode?: string;
  busRoute?: string;
  religion?: string;
  // Parent relationship info
  relationship?: string;
  isPrimaryContact?: boolean;
  hasPickupPermission?: boolean;
};

type ParentObj = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  profile?: {
    occupation?: string;
    workplace?: string;
    workPhone?: string;
    alternatePhone?: string;
    dateOfBirth?: string;
    gender?: string;
    emergencyContact?: {
      name?: string;
      relationship?: string;
      phone?: string;
    };
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
  };
};

function InfoItem({ 
  icon: Icon, 
  label, 
  value, 
  className = "" 
}: { 
  icon: React.ElementType; 
  label?: string;
  value: string | undefined | null; 
  className?: string;
}) {
  if (!value || value === 'N/A' || value === '') return null;
  
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <div className="mt-0.5 p-2 rounded-lg bg-primary/10 text-primary">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        {label && <p className="text-xs text-muted-foreground mb-0.5">{label}</p>}
        <p className="text-sm font-medium text-foreground break-words">{value}</p>
      </div>
    </div>
  );
}

function StudentCard({ student, index, parentName }: { student: StudentObj; index: number; parentName: string }) {
  const studentName = `${student.firstName || ''} ${student.lastName || ''}`.trim();
  const studentInitials = `${student.firstName?.[0] || ''}${student.lastName?.[0] || ''}`.toUpperCase();
  
  // Format student address
  const formatStudentAddress = (addr: string | { street?: string; city?: string; state?: string; zipCode?: string; country?: string } | undefined) => {
    if (!addr || addr === 'N/A') return null;
    if (typeof addr === 'string') {
      // Try to parse if it's a JSON string
      try {
        const parsed = JSON.parse(addr);
        if (typeof parsed === 'object') {
          const parts = [
            parsed.street,
            parsed.city,
            parsed.state,
            parsed.zipCode,
            parsed.country
          ].filter(Boolean);
          return parts.length > 0 ? parts.join(', ') : null;
        }
      } catch {
        // If not JSON, return as is if it's a valid address string
        if (addr.trim().length > 0 && addr !== 'N/A') {
          return addr;
        }
      }
      return null;
    }
    if (typeof addr === 'object') {
      const parts = [
        addr.street,
        addr.city,
        addr.state,
        addr.zipCode,
        addr.country
      ].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : null;
    }
    return null;
  };
  
  const formattedStudentAddress = formatStudentAddress(student.address);
  
  // Format emergency contact
  const formatStudentEmergencyContact = (contact: string | { name?: string; relationship?: string; phone?: string } | undefined) => {
    if (!contact || contact === 'N/A') return null;
    if (typeof contact === 'string') {
      // Try to parse if it's a JSON string
      try {
        const parsed = JSON.parse(contact);
        if (typeof parsed === 'object') {
          return parsed;
        }
      } catch {
        // If not JSON, return null
        return null;
      }
    }
    if (typeof contact === 'object') {
      return contact;
    }
    return null;
  };
  
  const formattedEmergencyContact = formatStudentEmergencyContact(student.emergencyContact);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 border-2 hover:border-primary/50">
        <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4 flex-1">
              <Avatar className="w-16 h-16 border-2 border-white shadow-md">
                <AvatarImage
                  src={student.profilePhoto || ""}
                  alt={studentName}
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-lg font-semibold">
                  {studentInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl mb-1 truncate">{studentName}</CardTitle>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    <School className="w-3 h-3 mr-1" />
                    Grade {student.class}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Section {student.section}
                  </Badge>
                  {student.studentId && (
                    <Badge variant="outline" className="text-xs">
                      ID: {student.studentId}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Basic Information */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-primary">
                <UserCircle className="w-4 h-4" />
                Basic Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InfoItem icon={Mail} label="Email" value={student.email} />
                <InfoItem icon={Phone} label="Phone" value={student.phone} />
                <InfoItem icon={Calendar} label="Date of Birth" value={student.dob ? new Date(student.dob).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : undefined} />
                <InfoItem icon={User} label="Gender" value={student.gender} />
                <InfoItem icon={MapPin} label="Address" value={formattedStudentAddress || undefined} />
                <InfoItem icon={Clock} label="Enrollment Date" value={student.enrollDate ? new Date(student.enrollDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : undefined} />
                <InfoItem icon={GraduationCap} label="Expected Graduation" value={student.expectedGraduation} />
              </div>
            </div>

            <Separator />

            {/* Academic Information */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-primary">
                <BookOpen className="w-4 h-4" />
                Academic Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InfoItem icon={School} label="Previous School" value={student.previousSchool} />
                <InfoItem icon={Globe} label="Religion" value={student.religion} />
              </div>
            </div>

            {/* Health Information */}
            {(student.bloodGroup || student.allergies?.length || student.medicalConditions?.length) && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-primary">
                    <Stethoscope className="w-4 h-4" />
                    Health Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <InfoItem icon={Droplet} label="Blood Group" value={student.bloodGroup} />
                    {student.allergies && student.allergies.length > 0 && (
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 p-2 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-1">Allergies</p>
                          <div className="flex flex-wrap gap-1">
                            {student.allergies.map((allergy, idx) => (
                              <Badge key={idx} variant="destructive" className="text-xs">
                                {allergy}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    {student.medicalConditions && student.medicalConditions.length > 0 && (
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
                          <Stethoscope className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-1">Medical Conditions</p>
                          <div className="flex flex-wrap gap-1">
                            {student.medicalConditions.map((condition, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs border-orange-300 text-orange-700 dark:text-orange-400">
                                {condition}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Transport Information */}
            {(student.transportMode || student.busRoute) && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-primary">
                    <Home className="w-4 h-4" />
                    Transport Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <InfoItem icon={MapPin} label="Transport Mode" value={student.transportMode} />
                    <InfoItem icon={MapPin} label="Bus Route" value={student.busRoute} />
                  </div>
                </div>
              </>
            )}

            {/* Parent Relationship Info */}
            {(student.relationship || student.isPrimaryContact !== undefined || student.hasPickupPermission !== undefined) && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-primary">
                    <Users className="w-4 h-4" />
                    Your Relationship
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {student.relationship && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                        <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <div>
                          <p className="text-xs text-muted-foreground">Relationship</p>
                          <p className="text-sm font-medium">{student.relationship}</p>
                        </div>
                      </div>
                    )}
                    {student.isPrimaryContact !== undefined && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                        <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <div>
                          <p className="text-xs text-muted-foreground">Primary Contact</p>
                          <Badge variant={student.isPrimaryContact ? "default" : "secondary"} className="mt-1">
                            {student.isPrimaryContact ? "Yes" : "No"}
                          </Badge>
                        </div>
                      </div>
                    )}
                    {student.hasPickupPermission !== undefined && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                        <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <div>
                          <p className="text-xs text-muted-foreground">Pickup Permission</p>
                          <Badge variant={student.hasPickupPermission ? "default" : "destructive"} className="mt-1">
                            {student.hasPickupPermission ? "Authorized" : "Not Authorized"}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Emergency Contact */}
            {formattedEmergencyContact && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-primary">
                    <Shield className="w-4 h-4" />
                    Emergency Contact
                  </h4>
                  <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                    {formattedEmergencyContact.name && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm font-medium">{formattedEmergencyContact.name}</p>
                      </div>
                    )}
                    {formattedEmergencyContact.relationship && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Relationship: {formattedEmergencyContact.relationship}</p>
                      </div>
                    )}
                    {formattedEmergencyContact.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm">{formattedEmergencyContact.phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function ParentProfile() {
  const parentId = typeof window !== "undefined" ? localStorage.getItem("parentId") || localStorage.getItem("id") : null;
  const authToken = typeof window !== "undefined" ? localStorage.getItem("authToken") || localStorage.getItem("accessToken") || localStorage.getItem("token") : null;
  const [parent, setParent] = useState<ParentObj | null>(null);
  const [children, setChildren] = useState<StudentObj[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchParentAndChildren() {
      if (!authToken) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/auth/parent/profile`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        });
        
        const data = response.data;
        console.log('Parent profile data:', data);
        
        // Set parent data
        setParent({
          _id: data._id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          address: data.address,
          profile: data.profile
        });
        
        // Set children data
        setChildren(data.children || []);
        
      } catch (err: any) {
        console.error('Error fetching parent profile:', err);
        setParent(null);
        setChildren([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchParentAndChildren();
  }, [authToken]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-64 w-full rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-96 rounded-lg" />
            <Skeleton className="h-96 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!parent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Parent not found</h2>
            <p className="text-muted-foreground">Unable to load parent profile. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const parentName = `${parent.firstName || ""} ${parent.lastName || ""}`.trim();
  const parentInitials = `${parent.firstName?.[0] || ''}${parent.lastName?.[0] || ''}`.toUpperCase();
  
  // Format address properly
  const formatAddress = (addr: string | { street?: string; city?: string; state?: string; zipCode?: string; country?: string } | undefined) => {
    if (!addr || addr === 'N/A') return null;
    if (typeof addr === 'string') {
      // If it's already a formatted string, return it
      if (addr.includes(',') || addr.trim().length > 0) {
        return addr;
      }
      return null;
    }
    const parts = [
      addr.street,
      addr.city,
      addr.state,
      addr.zipCode,
      addr.country
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  };

  const formattedAddress = formatAddress(parent.address || parent.profile?.address);
  
  // Format emergency contact
  const formatEmergencyContact = (contact: string | { name?: string; relationship?: string; phone?: string } | undefined) => {
    if (!contact || contact === 'N/A') return null;
    if (typeof contact === 'string') {
      // Try to parse if it's a JSON string
      try {
        const parsed = JSON.parse(contact);
        if (typeof parsed === 'object') {
          const parts = [
            parsed.name,
            parsed.relationship ? `(${parsed.relationship})` : null,
            parsed.phone
          ].filter(Boolean);
          return parts.length > 0 ? parts.join(' - ') : null;
        }
      } catch {
        // If not JSON, return as is
        return contact;
      }
    }
    if (typeof contact === 'object') {
      const parts = [
        contact.name,
        contact.relationship ? `(${contact.relationship})` : null,
        contact.phone
      ].filter(Boolean);
      return parts.length > 0 ? parts.join(' - ') : null;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Parent Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="overflow-hidden border-2 shadow-xl">
            <div className="relative h-48 md:h-64 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
              <div className="absolute inset-0 bg-black/10"></div>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="absolute -bottom-16 md:-bottom-20 left-6 md:left-8"
              >
                <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-white dark:border-gray-800 shadow-2xl">
                  <AvatarImage
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(parentName)}&size=200&background=6366f1&color=fff&bold=true`}
                    alt={parentName}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-3xl md:text-4xl font-bold">
                    {parentInitials}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
            </div>
            <CardContent className="pt-20 md:pt-24 pb-6 px-4 md:px-8">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900 dark:text-white">
                    {parentName}
                  </h1>
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    <Users className="w-3 h-3 mr-1" />
                    Parent
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Parent Information Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="lg:col-span-1"
          >
            <Card className="h-full shadow-lg border-2">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                <CardTitle className="flex items-center gap-2">
                  <UserCircle className="w-5 h-5" />
                  Personal Information
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Your account details
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <InfoItem icon={Mail} label="Email Address" value={parent.email} />
                <InfoItem icon={Phone} label="Phone Number" value={parent.phone} />
                <InfoItem icon={Phone} label="Alternate Phone" value={parent.profile?.alternatePhone} />
                <InfoItem icon={MapPin} label="Address" value={formattedAddress || undefined} />
                
                <InfoItem icon={Calendar} label="Date of Birth" value={parent.profile?.dateOfBirth ? new Date(parent.profile.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : undefined} />
                <InfoItem icon={User} label="Gender" value={parent.profile?.gender} />
                
                <Separator />
                
                <InfoItem icon={Briefcase} label="Occupation" value={parent.profile?.occupation} />
                <InfoItem icon={Building2} label="Workplace" value={parent.profile?.workplace} />
                <InfoItem icon={Phone} label="Work Phone" value={parent.profile?.workPhone} />
                
                {parent.profile?.emergencyContact && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-primary">
                        <Shield className="w-4 h-4" />
                        Emergency Contact
                      </h4>
                      <div className="space-y-2 pl-11">
                        {parent.profile.emergencyContact.name && (
                          <p className="text-sm font-medium">{parent.profile.emergencyContact.name}</p>
                        )}
                        {parent.profile.emergencyContact.relationship && (
                          <p className="text-xs text-muted-foreground">Relationship: {parent.profile.emergencyContact.relationship}</p>
                        )}
                        {parent.profile.emergencyContact.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            <span>{parent.profile.emergencyContact.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Children Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="lg:col-span-2"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                    <School className="w-6 h-6 md:w-7 md:h-7 text-primary" />
                    My Children
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    {children.length} {children.length === 1 ? 'child' : 'children'} enrolled
                  </p>
                </div>
              </div>
              
              {children.length === 0 ? (
                <Card>
                  <CardContent className="pt-12 pb-12 text-center">
                    <School className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No children found</h3>
                    <p className="text-muted-foreground">No children are currently associated with this account.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {children.map((child, index) => (
                    <StudentCard key={child._id || index} student={child} index={index} parentName={parentName} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
