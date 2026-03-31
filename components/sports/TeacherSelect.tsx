"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { adminApi } from '@/lib/api'
import { Loader2, X, Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Teacher {
  _id: string
  firstName: string
  lastName: string
  email?: string
}

interface TeacherSelectProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  multiple?: boolean
  selectedValues?: string[]
  onMultipleChange?: (values: string[]) => void
  excludeTeacherId?: string // Teacher ID to exclude from the list (e.g., head coach)
  schoolId?: string // School ID to filter teachers by school
  eligibleForSports?: boolean // Filter to show only teachers eligible for sports
}

export function TeacherSelect({
  value,
  onValueChange,
  placeholder = "Select teacher...",
  disabled = false,
  multiple = false,
  selectedValues = [],
  onMultipleChange,
  excludeTeacherId,
  schoolId,
  eligibleForSports = false
}: TeacherSelectProps) {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [open, setOpen] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const loadTeachers = async (pageNum: number = 1, search: string = '') => {
    try {
      setLoading(true)
      const params: any = {
        page: pageNum.toString(),
        limit: '20'
      }
      if (search) {
        params.search = search
      }
      // Filter by school if schoolId is provided
      if (schoolId) {
        params.schoolId = schoolId
      }
      // Filter by eligible_for_sports if eligibleForSports prop is true
      if (eligibleForSports) {
        params.eligibleForSports = 'true'
      }

      const response = await adminApi.teachers.getAll(params)
      
      // Handle response structure - handle new API response format
      let teachersData: Teacher[] = []
      if (response) {
        // Check for new API format: { success, statusCode, message, data: { teachers: [], pagination: {} } }
        if (response.data) {
          if (Array.isArray(response.data.teachers)) {
            teachersData = response.data.teachers
          } else if (Array.isArray(response.data)) {
            teachersData = response.data
          }
        } else if (response.teachers && Array.isArray(response.teachers)) {
          teachersData = response.teachers
        } else if (Array.isArray(response)) {
          teachersData = response
        }
      }
      
      // Ensure we have an array and each teacher has required fields
      // Also exclude the teacher specified in excludeTeacherId (e.g., head coach)
      teachersData = Array.isArray(teachersData) 
        ? teachersData.filter(t => {
            if (!t || !t._id || !t.firstName || !t.lastName) return false
            // Exclude teacher if it matches excludeTeacherId
            if (excludeTeacherId && t._id === excludeTeacherId) return false
            return true
          })
        : []

      if (pageNum === 1) {
        setTeachers(teachersData)
      } else {
        setTeachers(prev => {
          const existingIds = new Set(prev.map(t => t._id))
          const newTeachers = teachersData.filter(t => !existingIds.has(t._id))
          return [...prev, ...newTeachers]
        })
      }

      // Check if there are more pages
      const totalPages = response?.data?.pagination?.totalPages || response?.pagination?.totalPages || 1
      setHasMore(pageNum < totalPages)
    } catch (error) {
      console.error('Error loading teachers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || loading || !hasMore) return

    const container = scrollContainerRef.current
    const scrollTop = container.scrollTop
    const scrollHeight = container.scrollHeight
    const clientHeight = container.clientHeight

    // Load more when scrolled to 80% of the container
    if (scrollTop + clientHeight >= scrollHeight * 0.8) {
      const nextPage = page + 1
      setPage(nextPage)
      loadTeachers(nextPage, searchTerm)
    }
  }, [page, searchTerm, loading, hasMore, schoolId, eligibleForSports])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  useEffect(() => {
    if (open) {
      setPage(1)
      setTeachers([]) // Clear previous teachers when opening
      loadTeachers(1, searchTerm || '')
    }
  }, [open, schoolId, eligibleForSports]) // Reload when schoolId or eligibleForSports changes

  // Separate effect for search term changes
  useEffect(() => {
    if (open) {
      // Debounce search term changes
      const timeoutId = setTimeout(() => {
        setPage(1)
        setTeachers([]) // Clear previous teachers when search changes
        loadTeachers(1, searchTerm || '')
      }, 300)
      
      return () => clearTimeout(timeoutId)
    }
  }, [searchTerm, open, schoolId, eligibleForSports]) // Reload when schoolId or eligibleForSports changes

  // Load selected teacher if value is set but not in teachers list (for edit mode)
  useEffect(() => {
    if (value && !multiple && !teachers.find(t => t._id === value)) {
      // Load the specific teacher by ID
      const loadSelectedTeacher = async () => {
        try {
          const params: any = { page: '1', limit: '1000' }
          if (schoolId) {
            params.schoolId = schoolId
          }
          if (eligibleForSports) {
            params.eligibleForSports = 'true'
          }
          const response = await adminApi.teachers.getAll(params)
          let allTeachers: Teacher[] = []
          
          if (response?.data?.teachers) {
            allTeachers = response.data.teachers
          } else if (Array.isArray(response?.data)) {
            allTeachers = response.data
          } else if (response?.teachers) {
            allTeachers = response.teachers
          } else if (Array.isArray(response)) {
            allTeachers = response
          }
          
          const selected = allTeachers.find(t => t._id === value)
          if (selected) {
            // Add to teachers list if not already there
            setTeachers(prev => {
              if (!prev.find(t => t._id === value)) {
                return [selected, ...prev]
              }
              return prev
            })
          }
        } catch (error) {
          console.error('Error loading selected teacher:', error)
        }
      }
        loadSelectedTeacher()
    }
  }, [value, multiple, schoolId, eligibleForSports])

  // Single select
  if (!multiple) {
    const selectedTeacher = teachers.find(t => t._id === value)

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
              {selectedTeacher
                ? `${selectedTeacher.firstName} ${selectedTeacher.lastName}${selectedTeacher.email ? ` (${selectedTeacher.email})` : ''}`
                : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Search teachers..." 
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              <CommandEmpty>
                {loading ? 'Loading...' : 'No teachers found.'}
              </CommandEmpty>
              <CommandGroup>
                <div 
                  ref={scrollContainerRef}
                  className="max-h-[300px] overflow-y-auto"
                >
                  {teachers
                    .filter(teacher => !excludeTeacherId || teacher._id !== excludeTeacherId)
                    .map((teacher) => (
                      <CommandItem
                        key={teacher._id}
                        value={teacher._id}
                        onSelect={() => {
                          onValueChange(teacher._id)
                          setOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === teacher._id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="flex-1">
                          {teacher.firstName} {teacher.lastName}
                          {teacher.email && (
                            <span className="text-gray-500 ml-2">({teacher.email})</span>
                          )}
                        </span>
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

  // Load selected teachers if values are set but not in teachers list (for edit mode)
  // Also reload when excludeTeacherId changes to filter it out
  useEffect(() => {
    if (multiple && selectedValues.length > 0) {
      const missingTeachers = selectedValues.filter(id => !teachers.find(t => t._id === id))
      if (missingTeachers.length > 0) {
        // Load the specific teachers by IDs
            const loadSelectedTeachers = async () => {
          try {
            const params: any = { page: '1', limit: '1000' }
            if (schoolId) {
              params.schoolId = schoolId
            }
            if (eligibleForSports) {
              params.eligibleForSports = 'true'
            }
            const response = await adminApi.teachers.getAll(params)
            let allTeachers: Teacher[] = []
            
            if (response?.data?.teachers) {
              allTeachers = response.data.teachers
            } else if (Array.isArray(response?.data)) {
              allTeachers = response.data
            } else if (response?.teachers) {
              allTeachers = response.teachers
            } else if (Array.isArray(response)) {
              allTeachers = response
            }
            
            const selected = allTeachers.filter(t => missingTeachers.includes(t._id))
            if (selected.length > 0) {
              // Add to teachers list if not already there
              setTeachers(prev => {
                const existingIds = new Set(prev.map(t => t._id))
                const newTeachers = selected.filter(t => !existingIds.has(t._id))
                return [...newTeachers, ...prev]
              })
            }
          } catch (error) {
            console.error('Error loading selected teachers:', error)
          }
        }
        loadSelectedTeachers()
      }
    }
  }, [multiple, selectedValues, teachers.length, excludeTeacherId, schoolId, eligibleForSports])

  // Multiple select (for assistant coaches)
  const handleTeacherToggle = (teacherId: string) => {
    if (!onMultipleChange) return
    
    const isSelected = selectedValues.includes(teacherId)
    if (isSelected) {
      onMultipleChange(selectedValues.filter(id => id !== teacherId))
    } else {
      onMultipleChange([...selectedValues, teacherId])
    }
  }

  const selectedTeachers = teachers.filter(t => selectedValues.includes(t._id))

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {selectedValues.length > 0
              ? `${selectedValues.length} teacher${selectedValues.length > 1 ? 's' : ''} selected`
              : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Search teachers..." 
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              <CommandEmpty>
                {loading ? 'Loading...' : 'No teachers found.'}
              </CommandEmpty>
              <CommandGroup>
                <div 
                  ref={scrollContainerRef}
                  className="max-h-[300px] overflow-y-auto"
                >
                  {teachers
                    .filter(teacher => !excludeTeacherId || teacher._id !== excludeTeacherId)
                    .map((teacher) => {
                      const isSelected = selectedValues.includes(teacher._id)
                      return (
                        <CommandItem
                          key={teacher._id}
                          value={teacher._id}
                          onSelect={() => handleTeacherToggle(teacher._id)}
                        >
                          <div className="flex items-center space-x-2 w-full">
                            <div
                              className={cn(
                                "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "opacity-50 [&_svg]:invisible"
                              )}
                            >
                              <Check className="h-4 w-4" />
                            </div>
                            <span className="flex-1">
                              {teacher.firstName} {teacher.lastName}
                              {teacher.email && (
                                <span className="text-gray-500 ml-2">({teacher.email})</span>
                              )}
                            </span>
                          </div>
                        </CommandItem>
                      )
                    })}
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
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedTeachers.map((teacher) => (
            <Badge key={teacher._id} variant="secondary" className="flex items-center gap-1">
              {teacher.firstName} {teacher.lastName}
              <button
                type="button"
                onClick={() => handleTeacherToggle(teacher._id)}
                disabled={disabled}
                className="ml-1 hover:text-red-600 focus:outline-none"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
