"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Loader2 } from "lucide-react"
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { activities } from "@/lib/activities"
import { addActivity } from "@/lib/actitivityFunctions"

interface Course {
  _id: string
  courseCode: string
  courseName: string
  assigned?: boolean
}

interface Teacher {
  _id: string
  firstName: string
  lastName: string
}

interface AssignCoursesModalProps {
  isOpen: boolean
  onClose: () => void
  teachers: Teacher[]
}

export default function AssignCoursesModal({ isOpen, onClose, teachers }: AssignCoursesModalProps) {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("")
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoadingCourses, setIsLoadingCourses] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)

  useEffect(() => {
    if (selectedTeacherId) {
      fetchAssignedCourses(selectedTeacherId)
    } else {
      setCourses([])
    }
  }, [selectedTeacherId])

  const fetchAssignedCourses = async (teacherId: string) => {
    try {
      setIsLoadingCourses(true)
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/teachers/unassigned-courses?departmentId=${teacherId}`
      )
      setCourses(response.data)
    } catch (error) {
      console.error("Error fetching assigned courses:", error)
      toast.error("Failed to load courses")
    } finally {
      setIsLoadingCourses(false)
    }
  }

  const handleAssignCourse = async () => {
    if (!selectedTeacherId || !selectedCourseId) {
      toast.warning("Please select both teacher and course")
      return
    }

    try {
      setIsAssigning(true)
      await axios.get(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/teachers/assign-course?teacherId=${selectedTeacherId}&courseId=${selectedCourseId}`
      )
      
      toast.success("Course assigned successfully")
      
      const message = "Course assigned to teacher"
      const activity = {
        title: "Assign Course",
        subtitle: message,
        performBy: "Admin",
      }
      await addActivity(activity)
      
      // Refresh the courses list
      fetchAssignedCourses(selectedTeacherId)
      
      // Reset course selection
      setSelectedCourseId("")
    } catch (error) {
      console.error("Error assigning course:", error)
      toast.error("Failed to assign course")
    } finally {
      setIsAssigning(false)
    }
  }

  const handleClose = () => {
    setSelectedTeacherId("")
    setSelectedCourseId("")
    setCourses([])
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Assign Course to Teacher</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right" htmlFor="teacher">
              Teacher
            </Label>
            <div className="col-span-3">
              <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                <SelectTrigger id="teacher">
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher._id} value={teacher._id}>
                      {teacher.firstName} {teacher.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right" htmlFor="course">
              Course
            </Label>
            <div className="col-span-3">
              <Select 
                value={selectedCourseId} 
                onValueChange={setSelectedCourseId}
                disabled={!selectedTeacherId || isLoadingCourses}
              >
                <SelectTrigger id="course">
                  {isLoadingCourses ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading courses...
                    </div>
                  ) : (
                    <SelectValue placeholder="Select course" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {courses.length > 0 ? (
                    courses.map((course) => (
                      <SelectItem key={course._id} value={course._id}>
                        {course.courseCode}: {course.courseName} {course.assigned && ` (Already Assigned)`}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-courses" disabled>
                      {selectedTeacherId ? "No courses available" : "Select a teacher first"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssignCourse} 
            disabled={!selectedTeacherId || !selectedCourseId || isAssigning}
            className="bg-black text-white hover:bg-gray-800"
          >
            {isAssigning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              "Assign Course"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}