"use client"
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Search, Plus, Edit, Trash2, Eye, Loader2, KeyRound } from 'lucide-react'
import axios from 'axios'
import AddParentModal from './Add-parent/AddParent'
import EditParentModal from './Edit-parent/EditParent'
import ResetPasswordModal from './Reset-password/ResetPassword'
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

interface Parent {
  _id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  address: string | null
  gender: string | null
  isActive: boolean
  numberOfChildren: number
  parentType: string | null
  isPrimaryContact: boolean
  hasPickupPermission: boolean
}

type School = { _id: string; name: string; schoolCode?: string }

type ParentsApiPayload = {
  parents?: Parent[]
  pagination?: {
    currentPage?: number
    totalPages?: number
    totalCount?: number
    limit?: number
  }
}

const normalizeText = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').trim()

const matchesSearchTerm = (parent: Parent, search: string) => {
  const normalizedSearch = normalizeText(search)
  if (!normalizedSearch) {
    return true
  }

  const searchableText = normalizeText([
    parent.firstName,
    parent.lastName,
    parent.email,
    parent.phone || '',
    parent.gender || '',
    parent.parentType || ''
  ].join(' '))

  return normalizedSearch.split(' ').every((term) => searchableText.includes(term))
}

export default function ManageParentsPage() {
  const [parents, setParents] = useState<Parent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [genderFilter, setGenderFilter] = useState('all')
  const [parentTypeFilter, setParentTypeFilter] = useState('all')
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("")
  const [schools, setSchools] = useState<School[]>([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [parentToDelete, setParentToDelete] = useState<Parent | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [totalPages, setTotalPages] = useState(1)
  const [totalParents, setTotalParents] = useState(0)

  // Loading states
  const [isDeleting, setIsDeleting] = useState(false)

  // Add Parent Modal state
  const [isAddParentModalOpen, setIsAddParentModalOpen] = useState(false)

  // Edit Parent Modal state
  const [isEditParentModalOpen, setIsEditParentModalOpen] = useState(false)
  const [parentToEdit, setParentToEdit] = useState<Parent | null>(null)

  // Reset Password Modal state
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false)
  const [parentToResetPassword, setParentToResetPassword] = useState<Parent | null>(null)
  const fetchParentsRef = useRef<((...args: any[]) => Promise<void>) | null>(null)

  const router = useRouter()

  useEffect(() => {
    const initialize = async () => {
      const schoolList = await fetchSchools()
      fetchParents(1, pageSize, searchTerm, genderFilter, parentTypeFilter, selectedSchoolId, schoolList)
    }

    initialize()
  }, [])

  const fetchSchools = async (): Promise<School[]> => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      const response = await axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/schools`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const list = response.data?.data?.schools || response.data?.data || []
      const normalized = Array.isArray(list) ? list : []
      setSchools(normalized)
      return normalized
    } catch (error) {
      console.error('Error fetching schools:', error)
      setSchools([])
      return []
    }
  }

  const fetchParents = async (
    page = 1,
    limit = 5,
    search = '',
    gender = 'all',
    parentType = 'all',
    schoolId = '',
    schoolsOverride?: School[]
  ) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token')

      const params: any = {
        page,
        limit
      }

      if (search.trim()) {
        params.search = search.trim()
      }

      if (gender && gender !== 'all') {
        params.gender = gender
      }

      if (parentType && parentType !== 'all') {
        params.parentType = parentType
      }

      if (schoolId && schoolId.trim()) {
        params.schoolId = schoolId.trim()
      }

      // For "All Schools", aggregate results by querying each school and combining them.
      if (!schoolId?.trim()) {
        const sourceSchools = (schoolsOverride && schoolsOverride.length > 0 ? schoolsOverride : schools)
          .filter((school) => school?._id)

        if (sourceSchools.length > 0) {
          const requestParams = {
            ...(gender && gender !== 'all' && { gender }),
            ...(parentType && parentType !== 'all' && { parentType }),
            page: 1,
            limit: 1000
          }

          const responses = await Promise.allSettled(
            sourceSchools.map((school) =>
              axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/parents`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
                params: {
                  ...requestParams,
                  schoolId: school._id
                }
              })
            )
          )

          const mergedParentMap = new Map<string, Parent>()

          responses.forEach((result) => {
            if (result.status !== 'fulfilled') {
              return
            }

            const payload: ParentsApiPayload = result.value?.data?.data || {}
            const schoolParents = Array.isArray(payload.parents) ? payload.parents : []

            schoolParents.forEach((parent) => {
              if (parent?._id && !mergedParentMap.has(parent._id)) {
                mergedParentMap.set(parent._id, parent)
              }
            })
          })

          const combinedParents = Array.from(mergedParentMap.values())
          const filteredParents = combinedParents.filter((parent) => matchesSearchTerm(parent, search))
          const combinedTotal = filteredParents.length
          const combinedTotalPages = Math.max(1, Math.ceil(combinedTotal / limit))
          const safePage = Math.min(Math.max(page, 1), combinedTotalPages)
          const startIndex = (safePage - 1) * limit
          const paginatedParents = filteredParents.slice(startIndex, startIndex + limit)

          setParents(paginatedParents)
          setCurrentPage(safePage)
          setTotalPages(combinedTotalPages)
          setTotalParents(combinedTotal)
          setPageSize(limit)
          return
        }
      }

      const response = await axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/parents`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        params
      })

      if (response.data.success && response.data.data) {
        const payload: ParentsApiPayload = response.data.data
        const parentsData = Array.isArray(payload.parents) ? payload.parents : []
        const pagination = payload.pagination || {}

        setParents(parentsData || [])

        // Update pagination state
        setCurrentPage(pagination.currentPage || page)
        setTotalPages(pagination.totalPages || 1)
        setTotalParents(pagination.totalCount || 0)
        setPageSize(pagination.limit || limit)
      } else {
        setParents([])
        setTotalParents(0)
        setTotalPages(1)
      }
    } catch (error) {
      console.error('Error fetching parents:', error)
      setParents([])
      setTotalParents(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchParentsRef.current = fetchParents
  }, [fetchParents])

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    fetchParents(newPage, pageSize, searchTerm, genderFilter, parentTypeFilter, selectedSchoolId)
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setCurrentPage(1)
    fetchParents(1, newSize, searchTerm, genderFilter, parentTypeFilter, selectedSchoolId)
  }

  // Handle search with debounce
  const debouncedSearch = useCallback(
    debounce((search: string, gender: string, parentType: string, schoolId: string) => {
      setCurrentPage(1)
      fetchParentsRef.current?.(1, pageSize, search, gender, parentType, schoolId)
    }, 500),
    [pageSize]
  )

  // Handle search change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    debouncedSearch(value, genderFilter, parentTypeFilter, selectedSchoolId)
  }

  // Handle gender filter change
  const handleGenderFilterChange = (value: string) => {
    setGenderFilter(value)
    setCurrentPage(1)
    fetchParents(1, pageSize, searchTerm, value, parentTypeFilter, selectedSchoolId)
  }

  // Handle parentType filter change
  const handleParentTypeFilterChange = (value: string) => {
    setParentTypeFilter(value)
    setCurrentPage(1)
    fetchParents(1, pageSize, searchTerm, genderFilter, value, selectedSchoolId)
  }

  // Handle school filter change
  const handleSchoolFilterChange = (schoolId: string) => {
    const next = schoolId === "all" ? "" : schoolId
    setSelectedSchoolId(next)
    setCurrentPage(1)
    fetchParents(1, pageSize, searchTerm, genderFilter, parentTypeFilter, next)
  }

  const handleAddParent = () => {
    setIsAddParentModalOpen(true)
  }

  const handleAddParentSuccess = () => {
    // Refetch parents after successful creation
    fetchParents(currentPage, pageSize, searchTerm, genderFilter, parentTypeFilter, selectedSchoolId)
  }

  const handleEditParent = (parent: Parent) => {
    setParentToEdit(parent)
    setIsEditParentModalOpen(true)
  }

  const handleEditParentSuccess = () => {
    // Refetch parents after successful update
    fetchParents(currentPage, pageSize, searchTerm, genderFilter, parentTypeFilter, selectedSchoolId)
  }

  const handleResetPassword = (parent: Parent) => {
    setParentToResetPassword(parent)
    setIsResetPasswordModalOpen(true)
  }

  const handleResetPasswordSuccess = () => {
    // Refetch parents after successful password reset
    fetchParents(currentPage, pageSize, searchTerm, genderFilter, parentTypeFilter, selectedSchoolId)
  }

  const handleViewParent = (parent: Parent) => {
    router.push(`/super-admin/manage/parents/view/${parent._id}`)
  }

  const handleDeleteParent = (parent: Parent) => {
    setParentToDelete(parent)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteParent = async () => {
    if (!parentToDelete) return

    setIsDeleting(true)
    try {
      const token = localStorage.getItem('accessToken')

      const response = await axios.delete(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/parents/${parentToDelete._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.data.success) {
        toast.success(response.data.message || "Parent deleted successfully")
      } else {
        toast.error(response.data.message || "Failed to delete parent")
      }

      setIsDeleteDialogOpen(false)
      setParentToDelete(null)
      fetchParents(currentPage, pageSize, searchTerm, genderFilter, parentTypeFilter, selectedSchoolId)
    } catch (error: any) {
      console.error('Error deleting parent:', error)
      toast.error(error.response?.data?.message || "Failed to delete parent")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Manage Parents</h1>
            <p className="text-sm sm:text-base text-gray-600">
              Add, edit, and manage parent information across your school
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleAddParent}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Parent
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search parents by name, email..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          </div>
          <Select value={selectedSchoolId || "all"} onValueChange={handleSchoolFilterChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Schools" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Schools</SelectItem>
              {schools.map((school) => (
                <SelectItem key={school._id} value={school._id}>
                  {school.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={genderFilter} onValueChange={handleGenderFilterChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genders</SelectItem>
              <SelectItem value="MALE">Male</SelectItem>
              <SelectItem value="FEMALE">Female</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
          <Select value={parentTypeFilter} onValueChange={handleParentTypeFilterChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="FATHER">Father</SelectItem>
              <SelectItem value="MOTHER">Mother</SelectItem>
              <SelectItem value="GUARDIAN">Guardian</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Parents Table */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-lg font-semibold">
                Parents ({totalParents})
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
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Email</TableHead>
                    <TableHead className="hidden md:table-cell">Phone</TableHead>
                    <TableHead className="hidden lg:table-cell">Gender</TableHead>
                    <TableHead className="hidden lg:table-cell">Type</TableHead>
                    <TableHead className="hidden md:table-cell">Children</TableHead>
                    <TableHead className="hidden xl:table-cell">Primary Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-12">
                        <div className="flex items-center justify-center">
                          <div className="flex items-center gap-3 text-gray-600">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-black"></div>
                            <span>Loading...</span>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : parents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                        No parents found
                      </TableCell>
                    </TableRow>
                  ) : (
                    parents.map((parent) => (
                      <TableRow key={parent._id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{parent.firstName} {parent.lastName}</div>
                            <div className="text-sm text-gray-500 sm:hidden">{parent.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{parent.email}</TableCell>
                        <TableCell className="hidden md:table-cell">{parent.phone || 'N/A'}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge variant="outline">{parent.gender || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge variant="outline">{parent.parentType || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="secondary">{parent.numberOfChildren}</Badge>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          <Badge variant={parent.isPrimaryContact ? "default" : "outline"}>
                            {parent.isPrimaryContact ? 'Yes' : 'No'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={parent.isActive ? 'default' : 'secondary'}>
                            {parent.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewParent(parent)}
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditParent(parent)}
                              title="Edit parent"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {/* <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResetPassword(parent)}
                              title="Reset password"
                              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            >
                              <KeyRound className="h-4 w-4" />
                            </Button> */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteParent(parent)}
                              title="Delete parent"
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
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalParents)} of {totalParents} parents
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
                Are you sure you want to delete parent "{parentToDelete?.firstName} {parentToDelete?.lastName}"?
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
                onClick={confirmDeleteParent}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Parent'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Parent Modal */}
        <AddParentModal
          isOpen={isAddParentModalOpen}
          onClose={() => setIsAddParentModalOpen(false)}
          onSuccess={handleAddParentSuccess}
          schools={schools}
        />

        {/* Edit Parent Modal */}
        <EditParentModal
          isOpen={isEditParentModalOpen}
          onClose={() => {
            setIsEditParentModalOpen(false)
            setParentToEdit(null)
          }}
          onSuccess={handleEditParentSuccess}
          parentId={parentToEdit?._id || null}
          schools={schools}
        />

        {/* Reset Password Modal */}
        <ResetPasswordModal
          isOpen={isResetPasswordModalOpen}
          onClose={() => {
            setIsResetPasswordModalOpen(false)
            setParentToResetPassword(null)
          }}
          onSuccess={handleResetPasswordSuccess}
          parentId={parentToResetPassword?._id || null}
          parentName={parentToResetPassword ? `${parentToResetPassword.firstName} ${parentToResetPassword.lastName}` : undefined}
        />
      </div>
    </div>
  )
}