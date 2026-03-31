export const activities = {
    admin: {
      addCourse: {
        action: " Added a new course",
        description: "New course {courseName} was added to the system"
      },
      deleteCourse: {
        action: "Deleted a course",
        description: "Course {courseName} was removed from the system"
      },
      addStudent: {
        action: "Added a new student",
        description: "New student {studentName} was registered"
      },  
      updateStudent: {
        action: "Updated a student",
        description: "Record for {studentName} was Updated"
      },  
      updatedCourse : { 
         action: "Updated a Course",
        description: "Record for {courseName} was Updated"
      }, 
      updateScheduleClass : { 
           action: "Updated a Class",
        description: "Timing for {className} was Updated"
      },
      addTeacher: {
        action: "Added a new teacher",
        description: "New Teacher {teacherName} was registered"
      }, 
      updateTeacher: {
        action: "Updated a teacher",
        description: "Record for {teacherName} was Updated"
      },
      deleteStudent: {
        action: "Deleted a student record",
        description: "Student record for {studentName} was removed"
      },
      deleteTeacher: {
        action: "Deleted a teacher record",
        description: "Teacher record was removed"
      },
      addDepartment: {
        action: "Added a new department",
        description: "New department {departmentName} was created"
      },
      deleteDepartment: {
        action: "Deleted a department",
        description: "Department {departmentName} was removed"
      },
      updateDepartment: {
        action: "Updated a department",
        description: "Department {departmentName} was updated"
      },
      scheduleClass: {
        action: "Scheduled class timings",
        description: "Class timings for class {className} were Added"
      }, 
    removeScheduleClass: {
        action: "Scheduled class Removed",
        description: "Class timings for {className} were Removed."
      },
      updateSystemSettings: {
        action: "Updated system settings",
        description: "Platform configuration was modified"
      },
      createDisciplinaryAction: {
        action: "Created a disciplinary action",
        description: "Disciplinary action was assigned to {studentName}"
      },
      notifyParentDiscipline: {
        action: "Notified parent about disciplinary action",
        description: "Parent was notified about disciplinary action for {studentName}"
      },
      cancelDisciplinaryAction: {
        action: "Cancelled a disciplinary action",
        description: "Disciplinary action for {studentName} was cancelled"
      }
    },
    student: {
      enrollCourse: {
        action: "You have enrolled in a course",
        description: "Enrolled in '{courseName}' successfully"
      },
      dropCourse: {
        action: "You have dropped a course",
        description: "Dropped from '{courseName}'"
      },
      submitAssignment: {
        action: "You have submitted an assignment",
        description: "Assignment '{assignmentName}' was submitted for grading"
      },
      viewMaterial: {
        action: "You have accessed course material",
        description: "Viewed '{materialName}' from '{courseName}'"
      },
      postForum: {
        action: "You have posted in forum",
        description: "New post in '{courseName}' discussion forum"
      }
    },
    teacher: {
      createCourse: {
        action: "You have created a course",
        description: "New course '{courseName}' was created"
      },
      gradeAssignment: {
        action: "You have graded an assignment",
        description: "Graded '{assignmentName}' for {studentName}"
      },
      uploadMaterial: {
        action: "You have uploaded course material",
        description: "New material '{materialName}' added to '{courseName}'"
      },
      announceGrade: {
        action: "You have announced grades",
        description: "Grades for '{assignmentName}' were published"
      },
      scheduleClass: {
        action: "You have scheduled a class",
        description: "Class '{className}' scheduled for {date} at {time}"
      },
      takeAttendance: {
        action: "You have taken attendance",
        description: "Attendance recorded for {className} on {date}"
      }, 
      gradeUpdate: {
        action: "You have Updated the Grades",
        description: "Grades Updated for {className}"
      }
    }
  };