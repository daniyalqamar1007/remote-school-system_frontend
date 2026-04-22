"use client"

import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import { Edit, Trash2, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from 'sonner'
import AddAdminModal from "./Add-Super-Admins/AddSuperAdmins"

interface Admin {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  gender: string
  schoolId?: { _id: string; name: string }
  createdAt?: string
}

const normalizeSearchText = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').trim()

const matchesAdminSearch = (admin: Admin, query: string) => {
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery) return true

  const searchableText = normalizeSearchText([
    admin.firstName || '',
    admin.lastName || '',
    admin.email || '',
    admin.phone || ''
  ].join(' '))

  return normalizedQuery.split(' ').every((term) => searchableText.includes(term))
}

export default function AdminsTable() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [limit, setLimit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [adminToDelete, setAdminToDelete] = useState<Admin | null>(null)

  const fetchAdmins = useCallback(async (page = 1, pageLimit = 10, query = "") => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken')
      const base = `${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/manage/super-admins`
      const normalizedQuery = normalizeSearchText(query)
      const hasMultiWordQuery = normalizedQuery.includes(' ')
      // Use the first token for API search and apply exact multi-word matching on client.
      const apiSearchQuery = hasMultiWordQuery ? normalizedQuery.split(' ')[0] : normalizedQuery
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(pageLimit))
      if (apiSearchQuery) params.set('search', apiSearchQuery)
      const url = `${base}?${params.toString()}`
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      const list = response.data?.data?.admins || []
      const pg = response.data?.data?.pagination || {}
      const parsedList: Admin[] = Array.isArray(list) ? list : []
      const filteredList = normalizedQuery ? parsedList.filter((admin) => matchesAdminSearch(admin, normalizedQuery)) : parsedList

      setAdmins(filteredList)
      if (hasMultiWordQuery) {
        setCurrentPage(1)
        setTotalPages(1)
        setTotalCount(filteredList.length)
      } else {
        setCurrentPage(pg.currentPage || page)
        setTotalPages(pg.totalPages || 1)
        setTotalCount(pg.totalCount || 0)
      }
      setLimit(pg.limit || pageLimit)
    } catch (error) {
      console.error("Error fetching admins:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAdmins(1, limit, "")
  }, [fetchAdmins])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 500)
    return () => clearTimeout(t)
  }, [searchTerm])

  useEffect(() => {
    fetchAdmins(1, limit, debouncedSearch)
  }, [debouncedSearch])

  const handleDeleteClick = (admin: Admin) => {
    setAdminToDelete(admin)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!adminToDelete) return

    setIsDeleting(true)
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('authToken')
      await axios.delete(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/manage/super-admins/${adminToDelete._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })
      toast.success("Admin deleted successfully")

      setDeleteConfirmOpen(false)
      setAdminToDelete(null)
      fetchAdmins(currentPage, limit, debouncedSearch)
    } catch (error) {
      console.error("Error deleting admin:", error)
      toast.error("Failed to delete admin")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false)
    setAdminToDelete(null)
  }

  const handleEditAdmin = async (admin: Admin) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken')
      const res = await axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/manage/super-admins/${admin._id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const full = res.data?.data?.admin || admin
      setSelectedAdmin(full)
      setIsModalOpen(true)
    } catch (e) {
      console.error('Failed to load admin details', e)
      toast.error("Failed to load admin details")
    } finally {
      setLoading(false)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedAdmin(null)
  }

  const handlePageChange = (page: number) => {
    const p = Math.max(1, Math.min(totalPages, page))
    fetchAdmins(p, limit, debouncedSearch)
  }

  return (
    <div className="container mx-auto py-6 lg:py-10 px-4 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl lg:text-3xl font-bold">Super Admins</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button onClick={() => setIsModalOpen(true)} className="bg-black text-white hover:bg-gray-800 w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Add Super Admin
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <Input
          placeholder="Search super admins by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:max-w-sm"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      ) : (
        <>
          <div className="relative overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Name</TableHead>
                  <TableHead className="min-w-[200px] hidden sm:table-cell">Email</TableHead>
                  <TableHead className="min-w-[100px] hidden lg:table-cell">Phone</TableHead>
                  <TableHead className="min-w-[100px] hidden lg:table-cell">Gender</TableHead>
                  <TableHead className="min-w-[100px] hidden lg:table-cell">Record Created At</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12">
                      <div className="flex items-center justify-center">
                        <div className="flex items-center gap-3 text-gray-600">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-black"></div>
                          <span>Loading...</span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : admins.length > 0 ? (
                  admins.map((admin) => (
                    <TableRow key={admin._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{admin.firstName} {admin.lastName || '—'}</div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate hidden sm:table-cell">{admin.email || '—'}</TableCell>
                      <TableCell className="hidden md:table-cell">{admin.phone || '—'}</TableCell>
                      <TableCell className="hidden lg:table-cell capitalize">{String(admin.gender || '').toLowerCase() || '—'}</TableCell>
                      <TableCell className="hidden xl:table-cell">{admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : '—'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEditAdmin(admin)} title="Edit">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              handleDeleteClick(admin)
                            }}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No super admins found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between px-2 py-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show</span>
              <select
                value={String(limit)}
                onChange={(e) => fetchAdmins(1, Number(e.target.value), debouncedSearch)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
              <span className="text-sm text-gray-600">per page</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) pageNum = i + 1
                  else if (currentPage <= 3) pageNum = i + 1
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i
                  else pageNum = currentPage - 2 + i
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
              >
                Next
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              Showing {totalCount === 0 ? 0 : ((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalCount)} of {totalCount} admins
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete super admin{" "}
              <span className="font-semibold">
                {adminToDelete?.firstName} {adminToDelete?.lastName}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelDelete}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Super Admin'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddAdminModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        adminData={selectedAdmin as any || null}
        onSuccess={() => fetchAdmins(1, limit, debouncedSearch)}
      />
    </div>
  )
}
