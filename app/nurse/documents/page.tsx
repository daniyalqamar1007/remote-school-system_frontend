'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Search, 
  Plus, 
  Eye, 
  Download, 
  Trash2,
  FileText,
  Upload,
  Loader2,
  ChevronLeft,
  ChevronRight,
  File,
  FileImage,
  Shield
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import DocumentUploadForm from './components/DocumentUploadForm'

const API_BASE_URL = process.env.NEXT_PUBLIC_SRS_SERVER || 'http://localhost:3014'

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

const DOCUMENT_CATEGORIES = [
  'Medical Records',
  'Immunization Records',
  'Allergy Documentation',
  'Medication Forms',
  'Physical Exam Reports',
  'Emergency Contacts',
  'Insurance Information',
  'Doctor Notes',
  'Lab Results',
  'X-rays/Imaging',
  'IEP/504 Plans',
  'Permission Forms',
  'Other Health Documents'
]

const ACCESS_LEVELS = [
  'Public',
  'Staff Only',
  'Nurse Only',
  'Admin Only'
]

export default function DocumentManagementPage() {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [accessLevelFilter, setAccessLevelFilter] = useState('all')
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalDocuments, setTotalDocuments] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Dialog states
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isViewDocumentOpen, setIsViewDocumentOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<any>(null)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)

  // Stats
  const [stats, setStats] = useState({
    totalDocuments: 0,
    confidentialDocuments: 0,
    recentUploads: 0,
    storageUsed: 0
  })
  const [statsLoading, setStatsLoading] = useState(false)

  // Fetch stats (only called on page load)
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true)
      const response = await fetch(`${API_BASE_URL}/nurse/documents/stats`, {
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('[fetchStats] API Response:', data)
        if (data.success && data.data) {
          setStats({
            totalDocuments: data.data.totalDocuments || 0,
            confidentialDocuments: data.data.confidentialDocuments || 0,
            recentUploads: data.data.recentUploads || 0,
            storageUsed: data.data.storageUsed || 0
          })
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('[fetchStats] Failed to fetch stats:', errorData)
      }
    } catch (error: any) {
      console.error('Error fetching stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  // Fetch documents with pagination
  const fetchDocuments = useCallback(async (page: number, limit: number, search: string, category: string, accessLevel: string) => {
    try {
      setDocumentsLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })
      
      if (search) {
        params.append('search', search)
      }
      if (category !== 'all') {
        params.append('category', category)
      }
      if (accessLevel !== 'all') {
        params.append('accessLevel', accessLevel)
      }

      const response = await fetch(`${API_BASE_URL}/nurse/documents?${params.toString()}`, {
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('[fetchDocuments] API Response:', { 
          success: data.success, 
          documentsCount: data.documents?.length || 0,
          pagination: data.pagination 
        })
        
        // Check if backend returned an error
        if (data.success === false) {
          const errorMessage = data.message || data.error || 'Failed to load documents'
          console.error('[fetchDocuments] Backend error:', errorMessage)
          toast.error(errorMessage)
          setDocuments([])
          setTotalDocuments(0)
          setTotalPages(1)
          return
        }
        
        const documentsList = data?.documents || data?.data?.documents || (Array.isArray(data) ? data : [])
        const pagination = data?.pagination || {}
        
        console.log('[fetchDocuments] Processed documents:', { 
          documentsListLength: documentsList.length, 
          pagination 
        })
        
        setDocuments(Array.isArray(documentsList) ? documentsList : [])
        setTotalDocuments(pagination.total || documentsList.length)
        setTotalPages(pagination.totalPages || Math.ceil((pagination.total || documentsList.length) / limit))
      } else {
        // HTTP error - try to get error message from response
        let errorMessage = 'Failed to load documents'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch (parseError) {
          errorMessage = `Failed to load documents (Status: ${response.status})`
        }
        console.error('Failed to fetch documents:', errorMessage)
        toast.error(errorMessage)
        setDocuments([])
        setTotalDocuments(0)
        setTotalPages(1)
      }
    } catch (error: any) {
      console.error('Error fetching documents:', error)
      toast.error('Error loading documents')
      setDocuments([])
    } finally {
      setDocumentsLoading(false)
      setLoading(false)
    }
  }, [])

  // Fetch stats on page load only
  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchDocuments(currentPage, pageSize, searchTerm, categoryFilter, accessLevelFilter)
  }, [currentPage, pageSize])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1)
      fetchDocuments(1, pageSize, searchTerm, categoryFilter, accessLevelFilter)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, categoryFilter, accessLevelFilter, pageSize])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setCurrentPage(1)
  }

  const handleViewDocument = (document: any) => {
    setSelectedDocument(document)
    setIsViewDocumentOpen(true)
  }

  const handleDownloadDocument = async (document: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/nurse/health-records/student/${document.studentId}/download-document`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ documentId: document._id }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('[handleDownloadDocument] API Response:', data)
        
        if (data.success === false) {
          const errorMessage = data.message || data.error || 'Failed to generate download URL'
          toast.error(errorMessage)
          return
        }

        // Get the signed URL from the response
        const downloadUrl = data.data?.downloadUrl || data.downloadUrl
        const fileName = data.data?.fileName || document.originalName || document.fileName || 'document'

        if (!downloadUrl) {
          toast.error('Download URL not found')
          return
        }

        // Download the file from S3 using the signed URL
        try {
          const fileResponse = await fetch(downloadUrl)
          if (!fileResponse.ok) {
            throw new Error(`Failed to download file: ${fileResponse.statusText}`)
          }

          const blob = await fileResponse.blob()
          const url = window.URL.createObjectURL(blob)
          const a = window.document.createElement('a')
          a.href = url
          a.download = fileName
          window.document.body.appendChild(a)
          a.click()
          window.document.body.removeChild(a)
          window.URL.revokeObjectURL(url)
          toast.success('Document downloaded successfully')
        } catch (downloadError: any) {
          console.error('Error downloading file from S3:', downloadError)
          toast.error('Failed to download file from storage')
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.message || errorData.error || `Failed to download document (${response.status})`
        toast.error(errorMessage)
      }
    } catch (error: any) {
      console.error('Error downloading document:', error)
      toast.error(error.message || 'Error downloading document')
    }
  }

  const handleDeleteDocument = (document: any) => {
    setDocumentToDelete(document)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!documentToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(
        `${API_BASE_URL}/nurse/health-records/student/${documentToDelete.studentId}/delete-document`,
        {
          method: 'DELETE',
          headers: getAuthHeaders(),
          body: JSON.stringify({ documentId: documentToDelete._id }),
        }
      )

      const data = await response.json()
      console.log('[confirmDelete] API Response:', { ok: response.ok, data })
      
      if (response.ok) {
        if (data.success === false) {
          const errorMessage = data.message || data.error || 'Failed to delete document'
          toast.error(errorMessage)
          setDeleting(false)
          return
        }
        toast.success(data.message || 'Document deleted successfully')
        setDeleteDialogOpen(false)
        setDocumentToDelete(null)
        await fetchDocuments(currentPage, pageSize, searchTerm, categoryFilter, accessLevelFilter)
        fetchStats() // Refresh stats after deleting
      } else {
        const errorMessage = data.message || data.error || `Failed to delete document (${response.status})`
        toast.error(errorMessage)
      }
    } catch (error: any) {
      console.error('Error deleting document:', error)
      toast.error('Error deleting document')
    } finally {
      setDeleting(false)
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.startsWith('image/')) {
      return <FileImage className="h-4 w-4 text-blue-500" />
    } else if (mimeType === 'application/pdf') {
      return <FileText className="h-4 w-4 text-red-500" />
    } else {
      return <File className="h-4 w-4 text-gray-500" />
    }
  }

  const getAccessLevelBadge = (level: string) => {
    const colors: Record<string, string> = {
      'Admin Only': 'bg-red-500',
      'Nurse Only': 'bg-orange-500',
      'Staff Only': 'bg-yellow-500',
      'Public': 'bg-green-500'
    }
    return <Badge className={colors[level] || 'bg-gray-500'}>{level}</Badge>
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading && documents.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3 text-gray-600">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading documents...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
          <p className="text-gray-600 mt-1">Manage student health documents and medical records</p>
        </div>
        <Button 
          className="bg-black hover:bg-gray-800 text-white"
          onClick={() => setIsUploadOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocuments}</div>
            <p className="text-xs text-muted-foreground">All documents</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confidential</CardTitle>
            <Shield className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.confidentialDocuments}</div>
            <p className="text-xs text-muted-foreground">Confidential files</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Uploads</CardTitle>
            <Upload className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentUploads}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.storageUsed} MB</div>
            <p className="text-xs text-muted-foreground">Total storage</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by student name, document name, description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {DOCUMENT_CATEGORIES.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={accessLevelFilter} onValueChange={setAccessLevelFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by Access" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Access Levels</SelectItem>
                {ACCESS_LEVELS.map(level => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold">
              Documents ({totalDocuments})
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Badge variant="secondary">
                Page {currentPage} of {totalPages || 1}
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
                  <TableHead>Student</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead className="hidden lg:table-cell">Access Level</TableHead>
                  <TableHead className="hidden lg:table-cell">Size</TableHead>
                  <TableHead className="hidden lg:table-cell">Upload Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentsLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12">
                      <div className="flex items-center justify-center">
                        <div className="flex items-center gap-3 text-gray-600">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Loading documents...</span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : !Array.isArray(documents) || documents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No documents found
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((document: any) => (
                    <TableRow key={document._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-black">
                            {document.student?.firstName || 'Unknown'} {document.student?.lastName || 'Student'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {document.student?.gradeLevel || 'N/A'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getFileIcon(document.mimeType)}
                          <div>
                            <div className="font-medium text-black">
                              {document.originalName || document.fileName || 'N/A'}
                            </div>
                            {document.description && (
                              <div className="text-sm text-gray-500 line-clamp-1">
                                {document.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-black">
                        {document.category || 'N/A'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {getAccessLevelBadge(document.accessLevel || 'Staff Only')}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-black">
                        {formatFileSize(document.fileSize || 0)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-black">
                        {document.uploadDate ? format(new Date(document.uploadDate), 'MMM dd, yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDocument(document)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4 text-gray-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadDocument(document)}
                            title="Download"
                          >
                            <Download className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDocument(document)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
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
        <div className="flex items-center justify-between px-6 py-4 border-t">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Show per page:</span>
            <Select value={pageSize.toString()} onValueChange={(value) => handlePageSizeChange(Number(value))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalDocuments)} of {totalDocuments}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="min-w-[40px]"
                  >
                    {pageNum}
                  </Button>
                )
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Upload Document Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a health document for a student. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          <DocumentUploadForm
            onSuccess={() => {
              setIsUploadOpen(false)
              fetchDocuments(currentPage, pageSize, searchTerm, categoryFilter, accessLevelFilter)
              fetchStats() // Refresh stats after uploading
            }}
            onCancel={() => setIsUploadOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* View Document Dialog */}
      <Dialog open={isViewDocumentOpen} onOpenChange={setIsViewDocumentOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Document Details</DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Student</p>
                  <p className="font-medium text-black">
                    {selectedDocument.student?.firstName} {selectedDocument.student?.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Grade</p>
                  <p className="font-medium text-black">{selectedDocument.student?.gradeLevel || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Document Name</p>
                  <p className="font-medium text-black">{selectedDocument.originalName || selectedDocument.fileName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="font-medium text-black">{selectedDocument.category || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Access Level</p>
                  <div>{getAccessLevelBadge(selectedDocument.accessLevel || 'Staff Only')}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">File Size</p>
                  <p className="font-medium text-black">{formatFileSize(selectedDocument.fileSize || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Upload Date</p>
                  <p className="font-medium text-black">
                    {selectedDocument.uploadDate ? format(new Date(selectedDocument.uploadDate), 'MMM dd, yyyy HH:mm') : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">File Type</p>
                  <p className="font-medium text-black">{selectedDocument.mimeType || 'N/A'}</p>
                </div>
              </div>
              {selectedDocument.description && (
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="font-medium text-black">{selectedDocument.description}</p>
                </div>
              )}
              {selectedDocument.tags && selectedDocument.tags.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500">Tags</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {Array.isArray(selectedDocument.tags) ? (
                      selectedDocument.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="outline">{tag}</Badge>
                      ))
                    ) : (
                      <Badge variant="outline">{selectedDocument.tags}</Badge>
                    )}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={selectedDocument.isConfidential} disabled />
                <span className="text-sm">Confidential</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDocumentOpen(false)}>Close</Button>
            {selectedDocument && (
              <Button onClick={() => handleDownloadDocument(selectedDocument)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {documentToDelete && (
            <div className="py-4">
              <p className="text-sm text-gray-600">
                <strong>Student:</strong> {documentToDelete.student?.firstName} {documentToDelete.student?.lastName}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Document:</strong> {documentToDelete.originalName || documentToDelete.fileName || 'N/A'}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Category:</strong> {documentToDelete.category || 'N/A'}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
