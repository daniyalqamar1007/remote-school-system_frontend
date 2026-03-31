"use client"

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { adminApi } from '@/lib/api'
import { Loader2, ChevronsUpDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Student {
  _id: string
  firstName: string
  lastName: string
  email?: string
  gradeLevel?: string
  studentId?: string
}

interface StudentSelectProps {
  value?: string
  onValueChange: (value: string, student?: Student) => void
  placeholder?: string
  disabled?: boolean
  excludeStudentIds?: string[]
  schoolId?: string
}

const parseStudentsResponse = (response: any): Student[] => {
  if (!response) return []

  if (Array.isArray(response)) {
    return response as Student[]
  }

  if (Array.isArray(response?.students)) {
    return response.students as Student[]
  }

  if (Array.isArray(response?.data?.students)) {
    return response.data.students as Student[]
  }

  return []
}

export function StudentSelect({
  value,
  onValueChange,
  placeholder = 'Select student...',
  disabled = false,
  excludeStudentIds,
  schoolId
}: StudentSelectProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [open, setOpen] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const normalizedExcludeIds = React.useMemo(
    () => excludeStudentIds ?? [],
    [excludeStudentIds]
  )

  const loadStudents = useCallback(async (pageNum: number = 1, search: string = '') => {
    try {
      setLoading(true)
      const params: Record<string, string> = {
        page: pageNum.toString(),
        limit: '20'
      }
      if (search) {
        params.search = search
      }
      if (schoolId) {
        params.schoolId = schoolId
      }

      const response = await adminApi.students.getAll(params)
      let studentsData = parseStudentsResponse(response)

      if (normalizedExcludeIds.length > 0) {
        studentsData = studentsData.filter((student) => !normalizedExcludeIds.includes(student._id))
      }

      if (pageNum === 1) {
        setStudents(studentsData)
      } else {
        setStudents((prev) => {
          const existingIds = new Set(prev.map((student) => student._id))
          const newStudents = studentsData.filter((student) => !existingIds.has(student._id))
          return [...prev, ...newStudents]
        })
      }

      const totalPages = response?.pagination?.totalPages || 1
      setHasMore(pageNum < totalPages)
    } catch (error) {
      console.error('Error loading students:', error)
    } finally {
      setLoading(false)
    }
  }, [normalizedExcludeIds, schoolId])

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || loading || !hasMore) return

    const container = scrollContainerRef.current
    const scrollTop = container.scrollTop
    const scrollHeight = container.scrollHeight
    const clientHeight = container.clientHeight

    if (scrollTop + clientHeight >= scrollHeight * 0.8) {
      const nextPage = page + 1
      setPage(nextPage)
      loadStudents(nextPage, searchTerm)
    }
  }, [page, searchTerm, loading, hasMore, loadStudents])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  useEffect(() => {
    if (open) {
      setPage(1)
      setStudents([])
      loadStudents(1, searchTerm || '')
    }
  }, [open, loadStudents, schoolId])

  useEffect(() => {
    if (!open) return

    const timeoutId = setTimeout(() => {
      setPage(1)
      setStudents([])
      loadStudents(1, searchTerm || '')
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, open, loadStudents])

  useEffect(() => {
    if (!value || students.find((student) => student._id === value)) {
      return
    }

    const loadSelectedStudent = async () => {
      try {
        const student = await adminApi.students.getById(value)
        if (student && student._id) {
          setStudents((prev) => {
            if (prev.find((existing) => existing._id === student._id)) {
              return prev
            }
            return [student as Student, ...prev]
          })
        }
      } catch (error) {
        console.error('Error loading selected student:', error)
      }
    }

    loadSelectedStudent()
  }, [value, students])

  const selectedStudent = students.find((student) => student._id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          <span className="truncate">
            {selectedStudent
              ? `${selectedStudent.firstName} ${selectedStudent.lastName}` +
                (selectedStudent.email ? ` (${selectedStudent.email})` : '')
              : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search students..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? 'Loading...' : 'No students found.'}
            </CommandEmpty>
            <CommandGroup>
              <div
                ref={scrollContainerRef}
                className="max-h-[300px] overflow-y-auto"
              >
                {students
                  .filter((student) => !normalizedExcludeIds.includes(student._id))
                  .map((student) => (
                    <CommandItem
                      key={student._id}
                      value={student._id}
                      onSelect={() => {
                        onValueChange(student._id, student)
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === student._id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span className="flex-1">
                        {student.firstName} {student.lastName}
                        {student.gradeLevel && (
                          <span className="text-gray-500 ml-2">
                            (Grade {student.gradeLevel})
                          </span>
                        )}
                      </span>
                      {student.email && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {student.email}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                {loading && (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                )}
              </div>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}


