"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Heart,
  Stethoscope,
  Pill,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  Activity,
  Loader2,
  Ambulance,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useStudent } from "../context/StudentContext";
import { studentsApi } from '@/lib/api';
import axios from "axios";

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

export default function ParentHealthPage() {
  const { selectedStudent, isLoading: isStudentLoading } = useStudent();
  const [healthRecords, setHealthRecords] = useState<HealthRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedStudent) {
      fetchHealthRecords();
    } else {
      setIsLoading(false);
    }
  }, [selectedStudent]);

  const fetchHealthRecords = async () => {
    if (!selectedStudent) {
      setError("Please select a student to view their health records.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const healthData = await studentsApi.getHealthRecords(selectedStudent._id);
      setHealthRecords(healthData);
    } catch (err: any) {
      console.error('Error fetching health records:', err);
      setError("Failed to load health records. Please try again later.");
      setHealthRecords(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isStudentLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-500" />
          <p className="text-gray-600 dark:text-gray-400">Loading health records...</p>
        </div>
      </div>
    );
  }

  if (!selectedStudent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">Please select a student to view their health records</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !healthRecords) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-950 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchHealthRecords} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto space-y-6"
        >
          {/* Header */}
          <div className="mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Health & Medical Records
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                Viewing health records for <span className="font-semibold">{selectedStudent.firstName} {selectedStudent.lastName}</span>
                {healthRecords?.academicYear && (
                  <> • Academic Year: {healthRecords.academicYear}</>
                )}
              </p>
            </motion.div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {healthRecords ? (
            <>
              {/* Medical Conditions & Allergies */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {healthRecords.medicalConditions && healthRecords.medicalConditions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="shadow-lg border-red-200 dark:border-red-800">
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
                  </motion.div>
                )}

                {healthRecords.allergies && healthRecords.allergies.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card className="shadow-lg border-orange-200 dark:border-orange-800">
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
                  </motion.div>
                )}
              </div>

              {/* Medications */}
              {(healthRecords.medications && healthRecords.medications.length > 0) || 
               (healthRecords.medicationLog && healthRecords.medicationLog.length > 0) ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card className="shadow-lg">
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
                </motion.div>
              ) : null}

              {/* Nurse Visits */}
              {healthRecords.nurseVisits && healthRecords.nurseVisits.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Card className="shadow-lg">
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
                </motion.div>
              )}

              {/* Physical Exams */}
              {healthRecords.physicalExams && healthRecords.physicalExams.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Card className="shadow-lg">
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
                </motion.div>
              )}

              {/* Immunizations */}
              {healthRecords.immunizations && healthRecords.immunizations.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <Card className="shadow-lg">
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
                </motion.div>
              )}

              {/* Emergency Contact & Physician */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(healthRecords.emergencyContactName || healthRecords.emergencyContactPhone) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <Card className="shadow-lg">
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
                  </motion.div>
                )}

                {(healthRecords.physicianName || healthRecords.physicianPhone) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                  >
                    <Card className="shadow-lg">
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
                  </motion.div>
                )}
              </div>

              {/* Health Alerts */}
              {healthRecords.healthAlerts && healthRecords.healthAlerts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                >
                  <Card className="shadow-lg border-yellow-200 dark:border-yellow-800">
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
                </motion.div>
              )}
            </>
          ) : (
            <Card className="shadow-lg">
              <CardContent className="text-center py-12">
                <Ambulance className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">No Health Records Found</h3>
                <p className="text-muted-foreground">
                  Health records will appear here once they are created by the school nurse.
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}
