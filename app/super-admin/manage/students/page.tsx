"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { BulkImportErrorModal } from "@/components/BulkImportErrorModal"
import { Search, Plus, Edit, Trash2, Download, Upload, Eye, EyeOff, MoreHorizontal, Loader2 } from 'lucide-react'
import axios from 'axios'
import AddStudentModal from './Add-students/AddStudents'
import { activities } from '@/lib/activities'
import { addActivity } from '@/lib/actitivityFunctions'
import { downloadTemplate } from '@/lib/downloadTemplate'
import * as XLSX from 'xlsx'

// Simple debounce function
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

interface Student {
  _id: string
  studentId: string
  firstName: string
  lastName: string
  email: string
  phoneNumber?: string
  class: string // Changed from 'grade' to match backend User schema
  guardianInfo?: {
    firstName: string
    lastName: string
    relationship: string
  }
  emergencyContact?: {
    firstName: string
    lastName: string
    relationship: string
    phone: string
    phoneNumber?: string
    contact?: string
  }
  status: 'active' | 'inactive'
  address?: string | { street?: string; city?: string; state?: string; zipCode?: string }
  phone?: string
  gender?: string
  dob?: string
  section?: string
  enrollDate?: string
  expectedGraduation?: string
  previousSchool?: string
  previousGrade?: string
  bloodGroup?: string
  allergies?: string[] | string
  medicalConditions?: string[] | string
  transportMode?: string
  busRoute?: string
  nationality?: string
  religion?: string
  clubs?: string[] | string
  lunch?: string
  iipFlag?: boolean
  honorRolls?: boolean
  athletics?: boolean
  parents?: Array<{ firstName?: string; lastName?: string; email?: string; phone?: string; address?: string }>
  schoolId?: {
    _id: string
    name: string
  }
  createdAt?: string
  updatedAt?: string
}

const grades = ['Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']

type School = { _id: string; name: string; code: string }

const normalizeSearchText = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').trim()

const matchesStudentSearch = (student: Student, query: string) => {
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery) return true

  const searchableText = normalizeSearchText([
    student.studentId || '',
    student.firstName || '',
    student.lastName || '',
    student.email || '',
    student.phone || '',
    student.schoolId?.name || ''
  ].join(' '))

  return normalizedQuery.split(' ').every((term) => searchableText.includes(term))
}

export default function ManageStudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [gradeFilter, setGradeFilter] = useState('all')
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("")
  const [schools, setSchools] = useState<School[]>([])
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importSchoolId, setImportSchoolId] = useState<string>("")
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [importResults, setImportResults] = useState<{
    insertedCount: number
    skippedCount: number
    errors: string[] | null
  } | null>(null)
  const [importFileName, setImportFileName] = useState<string>("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [totalPages, setTotalPages] = useState(1)
  const [totalStudents, setTotalStudents] = useState(0)
  
  // Loading states
  const [isDeleting, setIsDeleting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchStudents()
    fetchSchools()
  }, [])

  const fetchSchools = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      const response = await axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/schools`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      console.log('response.data 1', response.data)
      console.log('response.data 2', response.data?.data)
      console.log('response.data 3', response.data?.data?.schools)
      const list = response.data?.data?.schools || response.data?.data || []
      setSchools(Array.isArray(list) ? list : [])
    } catch (error) {
      setSchools([])
    }
  }

  const fetchStudents = async (page = 1, limit = 5, search = '', grade = 'all', schoolId = '') => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      const normalizedSearch = normalizeSearchText(search)
      const hasMultiWordSearch = normalizedSearch.includes(' ')
      // Use first token for backend search and apply full tokenized matching in frontend.
      const apiSearchQuery = hasMultiWordSearch ? normalizedSearch.split(' ')[0] : normalizedSearch

      console.log('token for students', token)
      
      const params: any = {
        page,
        limit
      };
      
      if (apiSearchQuery) {
        params.search = apiSearchQuery;
      }
      
      if (grade && grade !== 'all') {
        params.grade = grade;
      }
      
      if (schoolId && schoolId.trim()) {
        params.schoolId = schoolId.trim();
      }
      
      const response = await axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/students`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        params
      })
      
      // Handle new API response structure
      if (response.data.success && response.data.data) {
        console.log('response.data.data', response.data.data)
        const { students, pagination } = response.data.data;

        console.log('students', students)
        
        // Process students data to ensure proper field parsing
        const processedStudents = (students || []).map((student: any) => {
          // Map parent information to guardianInfo for compatibility
          if (student.parentIds && student.parentIds.length > 0) {
            const primaryParent = student.parentIds[0];
            student.guardianInfo = {
              firstName: primaryParent.firstName || '',
              lastName: primaryParent.lastName || '',
              relationship: primaryParent.relationship || ''
            };
          }

          console.log('student ', student)
          
          // Add status field based on isActive
          student.status = student.isActive ? 'active' : 'inactive';
          student.schoolId = student.schoolId ? student.schoolId : "";
          
          return student;
        });

        console.log('processedStudents', processedStudents)
        
        const filteredStudents = normalizedSearch
          ? processedStudents.filter((student: Student) => matchesStudentSearch(student, normalizedSearch))
          : processedStudents;

        setStudents(filteredStudents);
        
        // Update pagination state
        if (hasMultiWordSearch) {
          setCurrentPage(1);
          setTotalPages(1);
          setTotalStudents(filteredStudents.length);
        } else {
          setCurrentPage(pagination.currentPage || page);
          setTotalPages(pagination.totalPages || 1);
          setTotalStudents(pagination.totalCount || 0);
        }
        setPageSize(pagination.limit || limit);
      } else {
        setStudents([]);
        setTotalStudents(0);
        setTotalPages(1);
      }
    } catch (error) {
      // Silently log error - no toast
      console.log('Error fetching students:', error)
      setStudents([])
      setTotalStudents(0);
      setTotalPages(1);
    } finally {
      setLoading(false)
    }
  }

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchStudents(newPage, pageSize, searchTerm, gradeFilter, selectedSchoolId);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    fetchStudents(1, newSize, searchTerm, gradeFilter, selectedSchoolId);
  };

  // Handle search with debounce
  const debouncedSearch = useCallback(
    debounce((search: string, grade: string, schoolId: string) => {
      setCurrentPage(1);
      fetchStudents(1, pageSize, search, grade, schoolId);
    }, 500),
    [pageSize]
  );

  // Handle search change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    debouncedSearch(value, gradeFilter, selectedSchoolId);
  };

  // Handle grade filter change
  const handleGradeFilterChange = (value: string) => {
    setGradeFilter(value);
    setCurrentPage(1);
    fetchStudents(1, pageSize, searchTerm, value, selectedSchoolId);
  };

  // Handle school filter change
  const handleSchoolFilterChange = (schoolId: string) => {
    const next = schoolId === "all" ? "" : schoolId
    setSelectedSchoolId(next)
    setCurrentPage(1)
    fetchStudents(1, pageSize, searchTerm, gradeFilter, next)
  }

  const handleAddStudent = () => {
    setSelectedStudent(null)
    setIsAddStudentModalOpen(true)
  }

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student)
    setIsAddStudentModalOpen(true)
  }

  const handleViewStudent = (student: Student) => {
    const sid = (student as any)?.schoolId?._id || ''
    router.push(`/super-admin/manage/students/view/${student._id}${sid ? `?schoolId=${sid}` : ''}`)
  }

  const handleDeleteStudent = (student: Student) => {
    console.log('student', student)
    setStudentToDelete(student)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return

    setIsDeleting(true)
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      console.log('studentToDelete', studentToDelete)
      const sid = (studentToDelete as any)?.schoolId || ''
      if (!sid) {
        toast({ title: 'Error', description: 'Missing schoolId for this student record.', variant: 'destructive' })
        setIsDeleting(false)
        return
      }
      await axios.delete(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/students/${studentToDelete._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        params: { schoolId: sid }
      })

      toast({
        title: "Success",
        description: "Student deleted successfully",
      })

      // Log the activity with actual student name
      const message = activities.admin.deleteStudent.description.replace("{studentName}", `${studentToDelete.firstName} ${studentToDelete.lastName}`)
      const activity = {
        title: activities.admin.deleteStudent.action,
        subtitle: message,
        performBy: "Admin",
      }
      await addActivity(activity)

      setIsDeleteDialogOpen(false)
      setStudentToDelete(null)
      fetchStudents(currentPage, pageSize, searchTerm, gradeFilter, selectedSchoolId)
    } catch (error) {
      console.error('Error deleting student:', error)
      toast({
        title: "Error",
        description: "Failed to delete student",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const [isExporting, setIsExporting] = useState(false)

  const exportStudents = async () => {
    setIsExporting(true)
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      const response = await axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/students/export`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        responseType: 'blob',
      })

      // Extract filename from Content-Disposition header if available
      const contentDisposition = response.headers['content-disposition']
      let filename = 'students.csv'
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i)
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1]
        }
      }

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast({
        title: "Success",
        description: "Students exported successfully",
      })
    } catch (error: any) {
      console.error("Error exporting students:", error)
      const errorMsg = error?.response?.data?.message || error?.message || "Failed to export students"
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const validateAndFilterExcelFile = async (file: File): Promise<{ 
    filteredFile: File | null; 
    errors: string[]; 
    validRowCount: number;
    invalidRowCount: number;
  }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          if (jsonData.length === 0) {
            resolve({ filteredFile: null, errors: ['Excel file is empty'], validRowCount: 0, invalidRowCount: 0 });
            return;
          }
          
          // Find header row (first row with data)
          const headerRow = jsonData[0] || [];
          
          // Find Student ID column
          const studentIdIndex = headerRow.findIndex((cell: any) => {
            if (!cell) return false;
            const normalized = String(cell).toLowerCase().replace(/\s+/g, '').replace(/_/g, '');
            return normalized.includes('studentid') || 
                   normalized === 'studentid' ||
                   normalized.includes('student_id') ||
                   normalized.includes('id');
          });
          
          // Find Student Password column
          const studentPasswordIndex = headerRow.findIndex((cell: any) => {
            if (!cell) return false;
            const normalized = String(cell).toLowerCase().replace(/\s+/g, '').replace(/_/g, '');
            return normalized.includes('studentpassword') || 
                   normalized === 'studentpassword' ||
                   normalized.includes('student_password') ||
                   (normalized.includes('password') && normalized.includes('student')) ||
                   (normalized === 'password' && studentIdIndex !== -1); // Fallback: if only one password column
          });
          
          // Find Parent Password column
          const parentPasswordIndex = headerRow.findIndex((cell: any) => {
            if (!cell) return false;
            const normalized = String(cell).toLowerCase().replace(/\s+/g, '').replace(/_/g, '');
            return normalized.includes('parentpassword') || 
                   normalized === 'parentpassword' ||
                   normalized.includes('parent_password') ||
                   (normalized.includes('password') && normalized.includes('parent')) ||
                   (normalized.includes('guardianpassword')) ||
                   (normalized.includes('guardian_password'));
          });
          
          // Check for required columns
          const missingColumns: string[] = [];
          if (studentIdIndex === -1) {
            missingColumns.push('Student ID');
          }
          if (studentPasswordIndex === -1) {
            missingColumns.push('Student Password');
          }
          if (parentPasswordIndex === -1) {
            missingColumns.push('Parent Password');
          }
          
          if (missingColumns.length > 0) {
            resolve({ 
              filteredFile: null, 
              errors: [`Required columns not found in Excel file: ${missingColumns.join(', ')}. Please ensure your file has all required columns.`], 
              validRowCount: 0, 
              invalidRowCount: 0 
            });
            return;
          }
          
          const errors: string[] = [];
          const validRows: any[][] = [headerRow]; // Start with header row
          let validCount = 0;
          let invalidCount = 0;
          
          // Check each data row (skip header row)
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            const studentId = row[studentIdIndex];
            const studentPassword = row[studentPasswordIndex];
            const parentPassword = row[parentPasswordIndex];
            
            const rowErrors: string[] = [];
            
            // Check if Student ID is missing or empty
            if (!studentId || String(studentId).trim() === '') {
              rowErrors.push('Student ID is required');
            }
            
            // Check if Student Password is missing or empty
            if (!studentPassword || String(studentPassword).trim() === '') {
              rowErrors.push('Student Password is required');
            } else if (String(studentPassword).trim().length < 8) {
              rowErrors.push('Student Password must be at least 8 characters');
            }
            
            // Check if Parent Password is missing or empty
            if (!parentPassword || String(parentPassword).trim() === '') {
              rowErrors.push('Parent Password is required');
            } else if (String(parentPassword).trim().length < 8) {
              rowErrors.push('Parent Password must be at least 8 characters');
            }
            
            if (rowErrors.length > 0) {
              errors.push(`Row ${i + 1}: ${rowErrors.join(', ')}`);
              invalidCount++;
            } else {
              // Valid row - add to validRows
              validRows.push(row);
              validCount++;
            }
          }
          
          // If all rows are invalid, return error
          if (validCount === 0 && invalidCount > 0) {
            resolve({ 
              filteredFile: null, 
              errors, 
              validRowCount: 0, 
              invalidRowCount: invalidCount 
            });
            return;
          }
          
          // Create new workbook with only valid rows
          const newWorkbook = XLSX.utils.book_new();
          const newWorksheet = XLSX.utils.aoa_to_sheet(validRows);
          XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, firstSheetName);
          
          // Convert workbook to blob
          const wbout = XLSX.write(newWorkbook, { type: 'array', bookType: 'xlsx' });
          const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          
          // Create new File object with filtered data
          const filteredFile = new File([blob], file.name, { type: file.type });
          
          resolve({ 
            filteredFile: invalidCount > 0 ? filteredFile : file, // Use original if no invalid rows
            errors, 
            validRowCount: validCount, 
            invalidRowCount: invalidCount 
          });
        } catch (error) {
          resolve({ 
            filteredFile: null, 
            errors: ['Error reading Excel file: ' + (error as Error).message], 
            validRowCount: 0, 
            invalidRowCount: 0 
          });
        }
      };
      
      reader.onerror = () => {
        resolve({ filteredFile: null, errors: ['Error reading file'], validRowCount: 0, invalidRowCount: 0 });
      };
      
      reader.readAsArrayBuffer(file);
    });
  };

  const handleExcelUpload = (schoolId: string) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.xlsx,.xls,.csv'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      setImportFileName(file.name)
      
      // Validate and filter Excel file - remove rows with missing Student ID
      const validation = await validateAndFilterExcelFile(file);
      const frontendErrors = validation.errors || [];
      const validRowCount = validation.validRowCount || 0;
      const invalidRowCount = validation.invalidRowCount || 0;
      
      // If no valid rows, show error and stop
      if (!validation.filteredFile || validRowCount === 0) {
        if (frontendErrors.length > 0) {
          setImportResults({
            insertedCount: 0,
            skippedCount: invalidRowCount,
            errors: frontendErrors,
          });
          setShowErrorModal(true);
          toast({
            title: "Import Failed",
            description: 'No valid records to import. All records have missing Student ID.',
            variant: "destructive",
          });
        }
        return;
      }
      
      const formData = new FormData()
      formData.append('file', validation.filteredFile) // Use filtered file (only valid rows)

      try {
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/students/import`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
            params: { schoolId }
          }
        )

        // Handle response
        if (response.data && response.data.data) {
          const { insertedCount, skippedCount, errors: backendErrors, hasConflicts, message } = response.data.data;
          
          // Combine frontend validation errors with backend errors
          const allErrors: string[] = [];
          
          // Add frontend validation errors (Student ID missing)
          if (frontendErrors.length > 0) {
            allErrors.push(...frontendErrors);
          }
          
          // Add backend errors
          if (backendErrors) {
            if (Array.isArray(backendErrors)) {
              allErrors.push(...backendErrors);
            } else if (typeof backendErrors === 'string' && backendErrors.trim() !== '') {
              allErrors.push(backendErrors);
            }
          }
          
          // Calculate total skipped (frontend errors + backend skipped)
          const totalSkipped = frontendErrors.length + (skippedCount || 0);
          const hasErrors = allErrors.length > 0 || totalSkipped > 0;
          
          // Store results for error modal
          const results = {
            insertedCount: insertedCount || 0,
            skippedCount: totalSkipped,
            errors: allErrors.length > 0 ? allErrors : null,
          };
          setImportResults(results);
          
          // Always show error modal if there are any errors (frontend or backend)
          if (hasErrors) {
            setShowErrorModal(true);
          }
          
          // Show success message
          if (insertedCount > 0) {
            if (totalSkipped > 0) {
              // Partial success with errors
              toast({
                title: "Partial Success",
                description: `Successfully uploaded ${insertedCount} student(s). ${totalSkipped} record(s) skipped with errors.`,
                variant: "default",
              });
            } else {
              // Complete success
              toast({
                title: "Success",
                description: `Successfully uploaded ${insertedCount} student(s).`,
              });
              setIsImportModalOpen(false);
            }
          } else {
            // No records inserted
            if (totalSkipped > 0) {
              toast({
                title: "Import Failed",
                description: `No students were uploaded. ${totalSkipped} record(s) had errors.`,
                variant: "destructive",
              });
            } else {
              toast({
                title: "Warning",
                description: 'No students were uploaded. Please check your file for errors.',
                variant: "destructive",
              });
            }
          }
          
          // Refresh the students list if any records were inserted
          if (insertedCount > 0) {
            fetchStudents(currentPage, pageSize, searchTerm, gradeFilter, selectedSchoolId);
          }
          
          // Don't close import modal if there are errors - let user review them
          if (!hasErrors && insertedCount > 0) {
            setIsImportModalOpen(false);
          }
        } else {
          // Show frontend errors even if backend doesn't return structured response
          if (frontendErrors.length > 0) {
            setImportResults({
              insertedCount: 0,
              skippedCount: frontendErrors.length,
              errors: frontendErrors,
            });
            setShowErrorModal(true);
          }
          // Fallback: treat as success if no data structure
          toast({
            title: "Success",
            description: response.data.message || "Students imported successfully",
          });
          fetchStudents(currentPage, pageSize, searchTerm, gradeFilter, selectedSchoolId);
          setIsImportModalOpen(false);
        }
      } catch (error: any) {
        console.error("Error importing students:", error)
        
        // Handle detailed error response
        if (error.response?.data?.data) {
          const errorData = error.response.data.data;
          const insertedCount = errorData.insertedCount || 0;
          const skippedCount = errorData.skippedCount || 0;
          const backendErrors = errorData.errors;
          
          // Combine frontend and backend errors
          const allErrors: string[] = [];
          if (frontendErrors.length > 0) {
            allErrors.push(...frontendErrors);
          }
          if (backendErrors) {
            if (Array.isArray(backendErrors)) {
              allErrors.push(...backendErrors);
            } else if (typeof backendErrors === 'string' && backendErrors.trim() !== '') {
              allErrors.push(backendErrors);
            }
          }
          
          const totalSkipped = frontendErrors.length + skippedCount;
          const hasErrors = allErrors.length > 0 || totalSkipped > 0;
          
          // Store results for error modal
          setImportResults({
            insertedCount,
            skippedCount: totalSkipped,
            errors: hasErrors 
              ? (allErrors.length > 0 ? allErrors : [`${totalSkipped} record(s) were skipped but no detailed error messages are available.`])
              : null,
          });
          
          // Always show error modal if there are any errors
          if (hasErrors) {
            setShowErrorModal(true);
          }
          
          // Show toast notification
          if (insertedCount > 0) {
            toast({
              title: "Partial Success",
              description: `${insertedCount} student(s) imported, but ${totalSkipped} record(s) had errors.`,
              variant: "default",
            });
          } else {
            toast({
              title: "Import Failed",
              description: `${totalSkipped} record(s) had errors.`,
              variant: "destructive",
            });
          }
        } else {
          // Show frontend errors even if backend doesn't return structured errors
          if (frontendErrors.length > 0) {
            setImportResults({
              insertedCount: 0,
              skippedCount: frontendErrors.length,
              errors: frontendErrors,
            });
            setShowErrorModal(true);
          }
          // Generic error without structured data
          toast({
            title: "Error",
            description: error.response?.data?.message || "Failed to import students",
            variant: "destructive",
          });
        }
      }
    }
    input.click()
  }

  // Remove full-page loading – we'll show a table-level loader instead

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Manage Students
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Add, edit, and manage student information across your school
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={() => setIsImportModalOpen(true)} 
              variant="outline" 
              className="w-full sm:w-auto"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Students
            </Button>
            <Button 
              onClick={exportStudents} 
              variant="outline"
              className="w-full sm:w-auto"
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </>
              )}
            </Button>
            <Button 
              onClick={handleAddStudent}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search students by name, email, or student ID (supports spaces)..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              name="student-search"
              id="student-search"
            />
          </div>
          <div className="min-w-[200px]">
            <Select
              value={selectedSchoolId || "all"}
              onValueChange={handleSchoolFilterChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Schools" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Schools</SelectItem>
                {schools.map((school) => {
                  console.log("school", school)
                  return (
                    <SelectItem key={school._id} value={school._id}>
                        {school.name}{school.code ? ` (${school.code})` : ""}
                      </SelectItem>
                    )
                  })
                }
              </SelectContent>
            </Select>
          </div>
          <Select value={gradeFilter} onValueChange={handleGradeFilterChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              {grades.map((grade) => (
                <SelectItem key={grade} value={grade}>
                  {grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Students Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold">
              Students ({totalStudents})
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Badge variant="secondary">
                Page {currentPage} of {totalPages}
              </Badge>
              <Badge variant="outline">
                {pageSize} per page
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead className="hidden sm:table-cell">School name</TableHead>
                  <TableHead className="hidden md:table-cell">Grade</TableHead>
                  <TableHead className="hidden lg:table-cell">Guardian</TableHead>
                  <TableHead className="hidden xl:table-cell">Emergency Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12">
                      <div className="flex items-center justify-center">
                        <div className="flex items-center gap-3 text-gray-600">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-black"></div>
                          <span>Loading...</span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No students found
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => (
                    <TableRow key={student._id}>
                      <TableCell className="font-medium">{student.studentId}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{student.firstName} {student.lastName}</div>
                          <div className="text-sm text-gray-500 sm:hidden">{student.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{student.email}</TableCell>
                      <TableCell className="hidden sm:table-cell">{student.schoolId?.name || '—'}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">{student.class}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {student.guardianInfo ? 
                          `${student.guardianInfo.firstName} ${student.guardianInfo.lastName}` : 
                          'N/A'
                        }
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        {student.emergencyContact?.phone || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                          {student.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewStudent(student)}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditStudent(student)}
                            title="Edit student"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteStudent(student)}
                            title="Delete student"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        
        {/* Pagination */}
        {/* {totalPages > 1 && ( */}
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show</span>
              <Select value={pageSize.toString()} onValueChange={(value) => handlePageSizeChange(Number(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue placeholder={pageSize.toString()} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-600">per page</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
            
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalStudents)} of {totalStudents} students
            </div>
          </div>
        {/* )} */}
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete student "{studentToDelete?.firstName} {studentToDelete?.lastName}"? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => confirmDeleteStudent()}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Student'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Import Modal */}
      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Students</DialogTitle>
            <DialogDescription>
              Select the school to import students for, then choose a CSV/XLS/XLSX file. Download the template for required columns.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button type="button" variant="outline" onClick={async () => {
              try {
                await downloadTemplate('admin/students/template', 'student_bulk_upload_template.csv')
                toast({ title: 'Success', description: 'Template downloaded successfully' });
              } catch (e: any) {
                toast({ title: 'Error', description: e?.message || 'Failed to download template', variant: 'destructive' });
              }
            }} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download Student Template
            </Button>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">School</label>
              <Select value={importSchoolId} onValueChange={setImportSchoolId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a school" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((s) => (
                    <SelectItem key={s._id} value={s._id}>{s.name} ({s.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsImportModalOpen(false)}>Cancel</Button>
              <Button onClick={() => { if (importSchoolId) { handleExcelUpload(importSchoolId); setIsImportModalOpen(false); } }} disabled={!importSchoolId}>
                Choose File
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Student Modal */}
      <AddStudentModal 
        isOpen={isAddStudentModalOpen}
        onClose={() => {
          setIsAddStudentModalOpen(false)
          setSelectedStudent(null)
        }}
        studentData={selectedStudent}
        handleDone={() => {
          fetchStudents(1, pageSize, searchTerm, gradeFilter, selectedSchoolId)
          setIsAddStudentModalOpen(false)
          setSelectedStudent(null)
        }}
        schools={schools}
      />

      {/* Bulk Import Error Modal */}
      {importResults && (
        <BulkImportErrorModal
          open={showErrorModal}
          onOpenChange={(open) => {
            setShowErrorModal(open)
            if (!open) {
              setImportResults(null)
              setImportFileName("")
            }
          }}
          insertedCount={importResults.insertedCount}
          skippedCount={importResults.skippedCount}
          errors={importResults.errors}
          fileName={importFileName}
        />
      )}
    </div> 
  )
}