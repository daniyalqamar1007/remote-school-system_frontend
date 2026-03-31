"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { FileUp, Calendar, Clock, CheckCircle, AlertCircle, Loader2, CalendarX } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStudent } from "../context/StudentContext";
import Image from "next/image";
import axios from "axios";

interface Absence {
  _id?: string;
  student: string;
  date: string;
  type: "full" | "partial" | "late";
  reason: string;
  status: "pending" | "approved" | "rejected";
  startTime?: string;
  endTime?: string;
  documentName?: string;
  documentUrl?: string;
  submittedAt: string;
}

export default function SubmitAbsence() {
  const { selectedStudent, isLoading: studentLoading } = useStudent();
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [date, setDate] = useState<Date>();
  const [absenceType, setAbsenceType] = useState<"full" | "partial" | "late">("full");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch absences from backend
  useEffect(() => {
    if (!selectedStudent) return;
    setSubmitError(null);
    setSubmitSuccess(false);
    setDate(undefined);
    setAbsenceType("full");
    setStartTime("");
    setEndTime("");
    setReason("");
    setDocumentName("");
    setIsSubmitting(false);

    // Fetch from backend
    axios
      .get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/absence/student?studentId=${selectedStudent._id}`)
      .then((res) => setAbsences(res.data))
      .catch(() => setAbsences([]));
  }, [selectedStudent?._id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocumentName(file.name);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    if (!date) {
      setSubmitError("Please select an absence date");
      return;
    }
    if (absenceType === "partial" && (!startTime || !endTime)) {
      setSubmitError("Please provide both start and end times for partial day absence");
      return;
    }
    if (absenceType === "late" && !startTime) {
      setSubmitError("Please provide the expected arrival time");
      return;
    }
    if (!reason.trim()) {
      setSubmitError("Please provide a reason for the absence");
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Optionally implement file upload logic here. For now, skip.
      const absenceData = {
        student: selectedStudent._id,
        date: date.toISOString(),
        type: absenceType,
        reason,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        documentName: documentName || undefined,
      };

      await axios.post(`${process.env.NEXT_PUBLIC_SRS_SERVER}/absence/submit`, absenceData);
      setSubmitSuccess(true);
      setDate(undefined);
      setAbsenceType("full");
      setStartTime("");
      setEndTime("");
      setReason("");
      setDocumentName("");
      // Reload absences
      const res = await axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/absence/student?studentId=${selectedStudent._id}`);
      setAbsences(res.data);
      setTimeout(() => setSubmitSuccess(false), 3500);
    } catch (error) {
      setSubmitError("Failed to submit absence. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (studentLoading || !selectedStudent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-semibold">Loading student data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl mx-auto"
      >
        {/* Selected Student Card */}
        <Card className="mb-8">
          <CardContent className="flex flex-col sm:flex-row items-center gap-6 py-6">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-blue-400 shrink-0">
              {selectedStudent.profilePhoto ? (
                <Image
                  src={selectedStudent.profilePhoto}
                  alt={selectedStudent.firstName}
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="96px"
                  className="rounded-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-4xl rounded-full">
                  {selectedStudent.firstName[0]}
                </div>
              )}
            </div>
            <div>
              <div className="text-lg font-semibold">{selectedStudent.firstName} {selectedStudent.lastName}</div>
              <div className="text-gray-500 dark:text-gray-400">{selectedStudent.class}-{selectedStudent.section}</div>
              <div className="text-sm text-gray-400">{selectedStudent.email}</div>
            </div>
          </CardContent>
        </Card>
        <h1 className="text-4xl font-bold mb-2 text-center text-gray-800 dark:text-white">Submit Absence</h1>
        <p className="text-center text-muted-foreground mb-8">Report a student absence or late arrival</p>
        <Tabs defaultValue="submit" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="submit">Submit New</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          <TabsContent value="submit">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl">
                  <CalendarX className="mr-2 h-6 w-6 text-red-500" />
                  Report an Absence
                </CardTitle>
                <CardDescription>
                  Please provide details about the student's absence
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6">
                  {submitSuccess && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <Alert variant="default" className="bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        <AlertTitle>Success</AlertTitle>
                        <AlertDescription>
                          Absence notification has been submitted successfully.
                        </AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                  {submitError && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                          {submitError}
                        </AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="date">Absence Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left" disabled={isSubmitting}>
                            <Calendar className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP") : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="absenceType">Type of Absence</Label>
                      <RadioGroup
                        value={absenceType}
                        onValueChange={(value) => setAbsenceType(value as "full" | "partial" | "late")}
                        className="flex flex-col space-y-2"
                        disabled={isSubmitting}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="full" id="full" />
                          <Label htmlFor="full" className="cursor-pointer">Full Day Absence</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="partial" id="partial" />
                          <Label htmlFor="partial" className="cursor-pointer">Partial Day Absence</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="late" id="late" />
                          <Label htmlFor="late" className="cursor-pointer">Late Arrival</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                  {(absenceType === "partial" || absenceType === "late") && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="startTime">
                          {absenceType === "partial" ? "Departure Time" : "Expected Arrival Time"}
                        </Label>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                          <Input
                            id="startTime"
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                      {absenceType === "partial" && (
                        <div className="space-y-2">
                          <Label htmlFor="endTime">Return Time</Label>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                            <Input
                              id="endTime"
                              type="time"
                              value={endTime}
                              onChange={(e) => setEndTime(e.target.value)}
                              disabled={isSubmitting}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason for Absence</Label>
                    <Textarea
                      id="reason"
                      placeholder="Please provide a reason for the absence..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="min-h-[120px]"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Supporting Document (Optional)</Label>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        disabled={isSubmitting}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={triggerFileInput}
                        className="flex-1"
                        disabled={isSubmitting}
                      >
                        <FileUp className="mr-2 h-4 w-4" />
                        {documentName ? "Change Document" : "Upload Document"}
                      </Button>
                      {documentName && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setDocumentName("")}
                          size="sm"
                          disabled={isSubmitting}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    {documentName && (
                      <p className="text-sm text-muted-foreground">
                        Uploaded: {documentName}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Accepted file types: PDF, Word documents, or images (JPG, PNG)
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Absence Report"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-2xl">
                  <CalendarX className="mr-2 h-6 w-6 text-red-500" />
                  Absence History
                </CardTitle>
                <CardDescription>
                  Previously submitted absence reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                {absences.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CalendarX className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-lg mb-2">No absence reports</p>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      You haven't submitted any absence reports yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {absences.map((absence, index) => (
                      <motion.div
                        key={absence._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="overflow-hidden hover:shadow-md transition-shadow">
                          <CardContent className="p-0">
                            <div
                              className={`h-2 ${
                                absence.status === "approved"
                                  ? "bg-green-500"
                                  : absence.status === "rejected"
                                  ? "bg-red-500"
                                  : "bg-amber-500"
                              }`}
                            />
                            <div className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-lg font-semibold">{selectedStudent.firstName} {selectedStudent.lastName}</h3>
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                        absence.status === "approved"
                                          ? "bg-green-100 text-green-800"
                                          : absence.status === "rejected"
                                          ? "bg-red-100 text-red-800"
                                          : "bg-amber-100 text-amber-800"
                                      }`}
                                    >
                                      {absence.status.charAt(0).toUpperCase() + absence.status.slice(1)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {absence.type === "full"
                                      ? "Full Day Absence"
                                      : absence.type === "partial"
                                      ? "Partial Day Absence"
                                      : "Late Arrival"}
                                  </p>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Submitted: {format(absence.submittedAt, "MMM d, yyyy")}
                                </p>
                              </div>
                              <div className="space-y-1 text-sm">
                                <div className="flex items-center text-muted-foreground">
                                  <Calendar className="mr-2 h-4 w-4" />
                                  {format(absence.date, "EEEE, MMMM d, yyyy")}
                                </div>
                                {(absence.type === "partial" || absence.type === "late") && absence.startTime && (
                                  <div className="flex items-center text-muted-foreground">
                                    <Clock className="mr-2 h-4 w-4" />
                                    {absence.type === "partial"
                                      ? `Departure: ${absence.startTime} - Return: ${absence.endTime}`
                                      : `Expected arrival: ${absence.startTime}`}
                                  </div>
                                )}
                                <div className="mt-2">
                                  <p className="text-sm text-gray-700 dark:text-gray-300">
                                    <span className="font-medium">Reason: </span>
                                    {absence.reason}
                                  </p>
                                </div>
                                {absence.documentName && (
                                  <div className="mt-1 flex items-center">
                                    <FileUp className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">
                                      Document: {absence.documentName}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}