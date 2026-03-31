"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Heart,
  Ambulance,
  GraduationCap,
  School,
  Clock,
  FileText,
  Activity,
  Shield,
  Stethoscope,
  Pill,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Building,
  BookOpen,
  Award,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/AuthContext';
import { studentsApi } from '@/lib/api';
import axios from "axios";

type ParentInfo = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
};

type HealthRecord = {
  _id?: string;
  academicYear?: string;
  medicalConditions?: string[];
  allergies?: string[];
  medications?: string[];
  medicationLog?: Array<{
    medicationName: string;
    dosage: string;
    frequency: string;
    startDate: Date;
    endDate?: Date;
    prescribedBy: string;
    isActive: boolean;
  }>;
  nurseVisits?: Array<{
    visitDate: Date;
    visitTime?: string;
    reason: string;
    symptoms?: string[];
    actionTaken?: string[];
    medicationGiven?: string;
    nurseNotes?: string;
    treatment?: string;
    temperature?: number;
    bloodPressure?: string;
    heartRate?: number;
    priority?: string;
    status?: string;
    disposition?: string;
    parentContacted?: boolean;
  }>;
  physicalExams?: Array<{
    examDate: Date;
    examType: string;
    performedBy: string;
    findings?: string;
    cleared: boolean;
    clearanceDate?: Date;
    expiryDate?: Date;
    restrictions?: string[];
  }>;
  immunizations?: Array<{
    vaccineName: string;
    dateAdministered: Date;
    administratorName?: string;
    batchNumber?: string;
    nextDueDate?: Date;
  }>;
  healthAlerts?: Array<{
    description: string;
    alertType: string;
    severity: string;
    createdDate?: Date;
    isActive?: boolean;
  }>;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  physicianName?: string;
  physicianPhone?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
};

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  if (!value || value === 'N/A' || value === '') return null;
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
        <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</div>
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words">{String(value)}</div>
      </div>
    </div>
  );
}

export default function StudentProfile() {
  const { user } = useAuth();
  const [student, setStudent] = useState<any>(null);
  const [parents, setParents] = useState<ParentInfo[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('authToken');
        
        if (!token) {
          console.warn('No auth token found for student profile');
          setStudent(null);
          return;
        }
        
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_SRS_SERVER}/auth/profile`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        const userData = response.data?.user;
        if (userData && userData.role === 'STUDENT') {
          setStudent(userData);
          
          if (userData._id) {
            try {
              const healthData = await studentsApi.getHealthRecords(userData._id);
              setHealthRecords(healthData);
            } catch (healthError) {
              console.error('Error fetching health records:', healthError);
              setHealthRecords(null);
            }
          }
        } else {
          setStudent(null);
        }
      } catch (error) {
        console.error("Error fetching student data:", error);
        setStudent(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudentData();
  }, [user]);

  useEffect(() => {
    async function fetchParents() {
      if (!student) {
        setParents([]);
        return;
      }

      if (student.parentIds && Array.isArray(student.parentIds) && student.parentIds.length > 0) {
        try {
          const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('authToken');
          
          if (!token) {
            setParents([]);
            return;
          }
          
          const parentRequests = student.parentIds.map((parentId: string) =>
            axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/auth/user/${parentId}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }).then(res => res.data).catch(err => {
              console.error('Error fetching parent:', parentId, err);
              return null;
            })
          );
          const parentDetails = await Promise.all(parentRequests);
          setParents(parentDetails.filter(p => p !== null));
        } catch (err) {
          console.error('Error fetching parent details:', err);
          setParents([]);
        }
      } else if (student.guardianName) {
        setParents([{
          _id: 'guardian',
          firstName: student.guardianName.split(' ')[0] || '',
          lastName: student.guardianName.split(' ')[1] || '',
          email: student.guardianEmail || '',
          phone: student.guardianPhone || '',
          address: student.address || ''
        }]);
      } else {
        setParents([]);
      }
    }
    fetchParents();
  }, [student]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-950">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-500" />
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user && !localStorage.getItem('accessToken')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-950">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">Please log in to view your profile</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-950">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">Student profile not found</p>
        </div>
      </div>
    );
  }

  const studentInfo = {
    name: `${student.firstName ?? ""} ${student.lastName ?? ""}`.trim(),
    studentId: student.studentId ?? student._id ?? "N/A",
    email: student.email ?? "",
    phone: student.phone ?? student.phoneNumber ?? "",
    dob: student.dateOfBirth 
      ? new Date(student.dateOfBirth).toLocaleDateString() 
      : student.dob 
        ? new Date(student.dob).toLocaleDateString() 
        : "N/A",
    address: typeof student.address === 'object' 
      ? `${student.address?.street || ''} ${student.address?.city || ''} ${student.address?.state || ''} ${student.address?.zipCode || ''}`.trim() || "N/A"
      : student.address ?? "N/A",
    year: student.class ?? student.gradeLevel ?? "N/A",
    profilePhoto: student.profilePicture ?? student.profilePhoto ?? "",
    section: student.section ?? "N/A",
    gender: student.gender ?? "N/A",
    bloodGroup: student.bloodGroup ?? "N/A",
    nationality: student.nationality ?? "N/A",
    religion: student.religion ?? "N/A",
    enrollmentDate: student.admissionDate
      ? new Date(student.admissionDate).toLocaleDateString()
      : student.enrollDate 
        ? new Date(student.enrollDate).toLocaleDateString() 
        : "N/A",
    expectedGraduation: student.expectedGraduation 
      ? (student.expectedGraduation.length === 4 ? student.expectedGraduation : new Date(student.expectedGraduation).toLocaleDateString())
      : "N/A",
    transportMode: student.transportMode ?? "N/A",
    busRoute: student.busRoute ?? "N/A",
    schoolName: student.schoolId?.name ?? student.schoolName ?? "N/A",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto space-y-6"
        >
          {/* Profile Header Card */}
          <Card className="overflow-hidden shadow-lg border-0 bg-white dark:bg-gray-800">
            <div className="relative h-48 sm:h-64 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
              <div className="absolute inset-0 bg-black/10"></div>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="absolute -bottom-16 sm:-bottom-20 left-4 sm:left-8"
              >
                <Avatar className="w-32 h-32 sm:w-40 sm:h-40 border-4 border-white dark:border-gray-800 shadow-xl">
                  <AvatarImage src={studentInfo.profilePhoto} alt={studentInfo.name} />
                  <AvatarFallback className="text-2xl sm:text-3xl bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300">
                    {studentInfo.name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
            </div>
            <CardContent className="pt-20 sm:pt-24 pb-6 sm:pb-8 px-4 sm:px-8">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-gray-900 dark:text-white">
                    {studentInfo.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      <School className="w-3 h-3 mr-1" />
                      Class {studentInfo.year}-{studentInfo.section}
                    </Badge>
                    {studentInfo.studentId !== "N/A" && (
                      <Badge variant="outline" className="text-sm px-3 py-1">
                        ID: {studentInfo.studentId}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-gray-800 shadow-sm">
              <TabsTrigger value="profile" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
                Profile
              </TabsTrigger>
              <TabsTrigger value="academic" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
                Academic Period
              </TabsTrigger>
              <TabsTrigger value="health" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
                Health Records
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Personal Information */}
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <InfoItem icon={User} label="Student ID" value={studentInfo.studentId} />
                    <InfoItem icon={Mail} label="Email" value={studentInfo.email} />
                    <InfoItem icon={Phone} label="Phone" value={studentInfo.phone} />
                    <InfoItem icon={Calendar} label="Date of Birth" value={studentInfo.dob} />
                    <InfoItem icon={User} label="Gender" value={studentInfo.gender} />
                    <InfoItem icon={Heart} label="Blood Group" value={studentInfo.bloodGroup} />
                    <InfoItem icon={User} label="Nationality" value={studentInfo.nationality} />
                    <InfoItem icon={User} label="Religion" value={studentInfo.religion} />
                    <InfoItem icon={MapPin} label="Address" value={studentInfo.address} />
                  </CardContent>
                </Card>

                {/* Academic & Contact Information */}
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      Academic & Contact
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <InfoItem icon={School} label="Class" value={`${studentInfo.year}-${studentInfo.section}`} />
                    <InfoItem icon={Building} label="School" value={studentInfo.schoolName} />
                    <InfoItem icon={Calendar} label="Enrollment Date" value={studentInfo.enrollmentDate} />
                    <InfoItem icon={Clock} label="Expected Graduation" value={studentInfo.expectedGraduation} />
                    <InfoItem icon={Activity} label="Transport Mode" value={studentInfo.transportMode} />
                    {studentInfo.busRoute !== "N/A" && (
                      <InfoItem icon={Activity} label="Bus Route" value={studentInfo.busRoute} />
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Parent/Guardian Information */}
              {parents.length > 0 && (
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-500" />
                      Parent/Guardian Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {parents.map((p, idx: number) => (
                        <div key={p.email + idx} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                          <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">
                            {`${p.firstName ?? ""} ${p.lastName ?? ""}`.trim()}
                          </h3>
                          <div className="space-y-2">
                            <InfoItem icon={Mail} label="Email" value={p.email ?? ""} />
                            <InfoItem icon={Phone} label="Phone" value={p.phone ?? ""} />
                            <InfoItem icon={MapPin} label="Address" value={p.address ?? ""} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Academic Period Tab */}
            <TabsContent value="academic" className="space-y-6">
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Academic Period Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                          <School className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Class</div>
                          <div className="text-xl font-bold text-gray-900 dark:text-white">
                            {studentInfo.year}-{studentInfo.section}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                          <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Enrollment Date</div>
                          <div className="text-xl font-bold text-gray-900 dark:text-white">
                            {studentInfo.enrollmentDate}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                          <Award className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Expected Graduation</div>
                          <div className="text-xl font-bold text-gray-900 dark:text-white">
                            {studentInfo.expectedGraduation}
                          </div>
                        </div>
                      </div>
                    </div>

                    {healthRecords?.academicYear && (
                      <div className="p-4 rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-800">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                            <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Academic Year</div>
                            <div className="text-xl font-bold text-gray-900 dark:text-white">
                              {healthRecords.academicYear}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Health Records Tab */}
            <TabsContent value="health" className="space-y-6">
              {healthRecords ? (
                <>
                  {/* Medical Conditions & Allergies */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {healthRecords.medicalConditions && healthRecords.medicalConditions.length > 0 && (
                      <Card className="shadow-md border-red-200 dark:border-red-800">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                            <AlertCircle className="w-5 h-5" />
                            Medical Conditions
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {healthRecords.medicalConditions.map((condition, idx) => (
                              <Badge key={idx} variant="destructive" className="text-sm px-3 py-1">
                                {condition}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {healthRecords.allergies && healthRecords.allergies.length > 0 && (
                      <Card className="shadow-md border-orange-200 dark:border-orange-800">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                            <AlertCircle className="w-5 h-5" />
                            Allergies
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {healthRecords.allergies.map((allergy, idx) => (
                              <Badge key={idx} className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 text-sm px-3 py-1">
                                {allergy}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Medications */}
                  {(healthRecords.medications && healthRecords.medications.length > 0) || 
                   (healthRecords.medicationLog && healthRecords.medicationLog.length > 0) ? (
                    <Card className="shadow-md">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Pill className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                          Medications
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {healthRecords.medicationLog && healthRecords.medicationLog.length > 0 ? (
                            healthRecords.medicationLog
                              .filter(med => med.isActive)
                              .map((med, idx) => (
                                <div key={idx} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="font-semibold text-gray-900 dark:text-white">{med.medicationName}</div>
                                    <Badge variant={med.isActive ? "default" : "outline"} className="text-xs">
                                      {med.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <div>Dosage: {med.dosage}</div>
                                    <div>Frequency: {med.frequency}</div>
                                    {med.prescribedBy && <div>Prescribed by: {med.prescribedBy}</div>}
                                    {med.startDate && (
                                      <div>Start: {new Date(med.startDate).toLocaleDateString()}</div>
                                    )}
                                  </div>
                                </div>
                              ))
                          ) : (
                            healthRecords.medications?.map((med, idx) => (
                              <Badge key={idx} variant="outline" className="text-sm px-3 py-1">
                                {med}
                              </Badge>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ) : null}

                  {/* Nurse Visits */}
                  {healthRecords.nurseVisits && healthRecords.nurseVisits.length > 0 && (
                    <Card className="shadow-md">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Stethoscope className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                          Nurse Visits ({healthRecords.nurseVisits.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {[...healthRecords.nurseVisits]
                            .sort((a, b) => {
                              const dateA = new Date(a.visitDate).getTime();
                              const dateB = new Date(b.visitDate).getTime();
                              return dateB - dateA;
                            })
                            .map((visit, idx) => (
                              <div key={idx} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <div className="font-semibold text-gray-900 dark:text-white mb-1">
                                      {new Date(visit.visitDate).toLocaleDateString()}
                                      {visit.visitTime && ` at ${visit.visitTime}`}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                      Reason: {visit.reason}
                                    </div>
                                  </div>
                                  {visit.priority && (
                                    <Badge 
                                      variant={
                                        visit.priority === 'emergency' ? 'destructive' :
                                        visit.priority === 'high' ? 'destructive' :
                                        visit.priority === 'medium' ? 'default' : 'secondary'
                                      }
                                      className="text-xs"
                                    >
                                      {visit.priority}
                                    </Badge>
                                  )}
                                </div>
                                {visit.symptoms && visit.symptoms.length > 0 && (
                                  <div className="mb-2">
                                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Symptoms:</div>
                                    <div className="flex flex-wrap gap-1">
                                      {visit.symptoms.map((symptom, sIdx) => (
                                        <Badge key={sIdx} variant="outline" className="text-xs">
                                          {symptom}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {visit.treatment && (
                                  <div className="mb-2 text-sm text-gray-700 dark:text-gray-300">
                                    <span className="font-medium">Treatment: </span>
                                    {visit.treatment}
                                  </div>
                                )}
                                {visit.nurseNotes && (
                                  <div className="mb-2 text-sm text-gray-700 dark:text-gray-300">
                                    <span className="font-medium">Notes: </span>
                                    {visit.nurseNotes}
                                  </div>
                                )}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs text-gray-600 dark:text-gray-400">
                                  {visit.temperature && <div>Temp: {visit.temperature}°F</div>}
                                  {visit.bloodPressure && <div>BP: {visit.bloodPressure}</div>}
                                  {visit.heartRate && <div>HR: {visit.heartRate} bpm</div>}
                                  {visit.disposition && <div>Disposition: {visit.disposition}</div>}
                                </div>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Physical Exams */}
                  {healthRecords.physicalExams && healthRecords.physicalExams.length > 0 && (
                    <Card className="shadow-md">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                          Physical Examinations ({healthRecords.physicalExams.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {[...healthRecords.physicalExams]
                            .sort((a, b) => {
                              const dateA = new Date(a.examDate).getTime();
                              const dateB = new Date(b.examDate).getTime();
                              return dateB - dateA;
                            })
                            .map((exam, idx) => (
                              <div key={idx} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <div className="font-semibold text-gray-900 dark:text-white">
                                      {new Date(exam.examDate).toLocaleDateString()}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                      Type: {exam.examType} | By: {exam.performedBy}
                                    </div>
                                  </div>
                                  {exam.cleared ? (
                                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Cleared
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline">
                                      <XCircle className="w-3 h-3 mr-1" />
                                      Not Cleared
                                    </Badge>
                                  )}
                                </div>
                                {exam.findings && (
                                  <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                    <span className="font-medium">Findings: </span>
                                    {exam.findings}
                                  </div>
                                )}
                                {exam.restrictions && exam.restrictions.length > 0 && (
                                  <div className="mb-2">
                                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Restrictions:</div>
                                    <div className="flex flex-wrap gap-1">
                                      {exam.restrictions.map((restriction, rIdx) => (
                                        <Badge key={rIdx} variant="outline" className="text-xs">
                                          {restriction}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {exam.expiryDate && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Expires: {new Date(exam.expiryDate).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Immunizations */}
                  {healthRecords.immunizations && healthRecords.immunizations.length > 0 && (
                    <Card className="shadow-md">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                          Immunizations ({healthRecords.immunizations.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {[...healthRecords.immunizations]
                            .sort((a, b) => {
                              const dateA = new Date(a.dateAdministered).getTime();
                              const dateB = new Date(b.dateAdministered).getTime();
                              return dateB - dateA;
                            })
                            .map((immunization, idx) => (
                              <div key={idx} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <div className="font-semibold text-gray-900 dark:text-white">
                                      {immunization.vaccineName}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                      Administered: {new Date(immunization.dateAdministered).toLocaleDateString()}
                                      {immunization.administratorName && ` by ${immunization.administratorName}`}
                                    </div>
                                  </div>
                                  {immunization.nextDueDate && new Date(immunization.nextDueDate) > new Date() && (
                                    <Badge variant="outline" className="text-xs">
                                      Next: {new Date(immunization.nextDueDate).toLocaleDateString()}
                                    </Badge>
                                  )}
                                </div>
                                {immunization.batchNumber && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Batch: {immunization.batchNumber}
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Emergency Contact & Physician */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(healthRecords.emergencyContactName || healthRecords.emergencyContactPhone) && (
                      <Card className="shadow-md">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Phone className="w-5 h-5 text-red-500" />
                            Emergency Contact
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <InfoItem icon={User} label="Name" value={healthRecords.emergencyContactName || ""} />
                          <InfoItem icon={Phone} label="Phone" value={healthRecords.emergencyContactPhone || ""} />
                          <InfoItem icon={Heart} label="Relation" value={healthRecords.emergencyContactRelation || ""} />
                        </CardContent>
                      </Card>
                    )}

                    {(healthRecords.physicianName || healthRecords.physicianPhone) && (
                      <Card className="shadow-md">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Stethoscope className="w-5 h-5 text-blue-500" />
                            Physician Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <InfoItem icon={User} label="Name" value={healthRecords.physicianName || ""} />
                          <InfoItem icon={Phone} label="Phone" value={healthRecords.physicianPhone || ""} />
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Health Alerts */}
                  {healthRecords.healthAlerts && healthRecords.healthAlerts.length > 0 && (
                    <Card className="shadow-md border-yellow-200 dark:border-yellow-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                          <AlertCircle className="w-5 h-5" />
                          Health Alerts
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {[...healthRecords.healthAlerts]
                            .filter(alert => alert.isActive !== false)
                            .sort((a: any, b: any) => {
                              const dateA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
                              const dateB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
                              return dateB - dateA;
                            })
                            .map((alert: any, idx: number) => (
                              <div key={idx} className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                                <div className="font-medium text-gray-900 dark:text-white mb-1">
                                  {alert.description}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  Type: {alert.alertType} | Severity: {alert.severity}
                                </div>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card className="shadow-md">
                  <CardContent className="text-center py-12">
                    <Ambulance className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">No Health Records Found</h3>
                    <p className="text-muted-foreground">
                      Health records will appear here once they are created by the school nurse.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
