export default function SecretariesPage() {
  return null
}
// import { useRouter } from 'next/navigation'
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { toast } from 'sonner'
// import { Plus, Edit, Trash2, Key, Eye, EyeOff, Loader2, Search } from 'lucide-react'
// import axios from 'axios'
// import PhoneInput from 'react-phone-input-2'
// import 'react-phone-input-2/lib/style.css'

// interface Secretary {
//   _id: string
//   email: string
//   firstName: string
//   lastName: string
//   phone?: string
//   address?: string
//   schoolId?: {
//     _id: string
//     name: string
//     schoolCode?: string
//   }
//   createdAt?: string
// }

// interface School {
//   _id: string
//   name: string
//   schoolCode?: string
// }

// // Simple debounce function
// const debounce = (func: Function, wait: number) => {
//   let timeout: NodeJS.Timeout
//   return function executedFunction(...args: any[]) {
//     const later = () => {
//       clearTimeout(timeout)
//       func(...args)
//     }
//     clearTimeout(timeout)
//     timeout = setTimeout(later, wait)
//   }
// }

// const API = process.env.NEXT_PUBLIC_SRS_SERVER

// export default function SuperAdminSecretariesPage() {
//   const router = useRouter()

//   useEffect(() => {
//     router.replace('/super-admin/dashboard')
//   }, [router])

//   return null

//   const [secretaries, setSecretaries] = useState<Secretary[]>([])
//   const [schools, setSchools] = useState<School[]>([])
//   const [loading, setLoading] = useState(true)
//   const [searchTerm, setSearchTerm] = useState('')
//   const [selectedSchoolId, setSelectedSchoolId] = useState<string>("all")
  
//   // Pagination state
//   const [currentPage, setCurrentPage] = useState(1)
//   const [pageSize, setPageSize] = useState(10)
//   const [totalPages, setTotalPages] = useState(1)
//   const [totalSecretaries, setTotalSecretaries] = useState(0)
  
//   // Modal states
//   const [isAddModalOpen, setIsAddModalOpen] = useState(false)
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false)
//   const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
//   const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false)
  
//   // Selected secretary for operations
//   const [selectedSecretary, setSelectedSecretary] = useState<Secretary | null>(null)
//   const [secretaryToDelete, setSecretaryToDelete] = useState<Secretary | null>(null)
  
//   // Loading states
//   const [isSubmitting, setIsSubmitting] = useState(false)
//   const [isDeleting, setIsDeleting] = useState(false)
//   const [isChangingPassword, setIsChangingPassword] = useState(false)
  
//   // Form states
//   const [formData, setFormData] = useState({
//     firstName: '',
//     lastName: '',
//     email: '',
//     password: '',
//     phone: '',
//     address: '',
//     schoolId: ''
//   })
  
//   // Password change form
//   const [passwordData, setPasswordData] = useState({
//     password: '',
//     confirmPassword: ''
//   })
//   const [showPassword, setShowPassword] = useState(false)
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false)
//   const [showAddPassword, setShowAddPassword] = useState(false)

//   // Fetch schools
//   const fetchSchools = async () => {
//     try {
//       const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
//       const response = await axios.get(`${API}/super-admin/schools`, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//         },
//       })
//       const list = response.data?.data?.schools || response.data?.data || []
//       setSchools(Array.isArray(list) ? list : [])
//     } catch (error) {
//       console.error("Error fetching schools:", error)
//       setSchools([])
//     }
//   }

//   // Fetch secretaries with pagination and filters
//   const fetchSecretaries = useCallback(async (page = 1, limit = 10, search = '', schoolId = '') => {
//     try {
//       setLoading(true)
//       const token = localStorage.getItem('token') || localStorage.getItem('accessToken')

//       const params: any = {
//         page,
//         limit
//       }
      
//       if (search.trim()) {
//         params.search = search.trim()
//       }
      
//       if (schoolId && schoolId.trim()) {
//         params.schoolId = schoolId.trim()
//       }

//       const response = await axios.get(`${API}/super-admin/secretaries`, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//         },
//         params
//       })

//       if (response.data.success && response.data.data) {
//         const { secretaries, pagination } = response.data.data

//         setSecretaries(Array.isArray(secretaries) ? secretaries : [])
//         setCurrentPage(pagination?.currentPage || page)
//         setTotalPages(pagination?.totalPages || 1)
//         setTotalSecretaries(pagination?.totalCount || 0)
//         setPageSize(pagination?.limit || limit)
//       } else {
//         setSecretaries([])
//         setTotalSecretaries(0)
//         setTotalPages(1)
//       }
//     } catch (error) {
//       console.error('Error fetching secretaries:', error)
//       setSecretaries([])
//       setTotalSecretaries(0)
//       setTotalPages(1)
//     } finally {
//       setLoading(false)
//     }
//   }, [])

//   useEffect(() => {
//     fetchSchools()
//     fetchSecretaries(1, pageSize, '', 'all')
//   }, [])

//   // Debounce search
//   useEffect(() => {
//     const t = setTimeout(() => {
//       setCurrentPage(1)
//       fetchSecretaries(1, pageSize, searchTerm, selectedSchoolId)
//     }, 500)
//     return () => clearTimeout(t)
//   }, [searchTerm])

//   // Handle pagination
//   const handlePageChange = (newPage: number) => {
//     setCurrentPage(newPage)
//     fetchSecretaries(newPage, pageSize, searchTerm, selectedSchoolId)
//   }

//   const handlePageSizeChange = (newSize: number) => {
//     setPageSize(newSize)
//     setCurrentPage(1)
//     fetchSecretaries(1, newSize, searchTerm, selectedSchoolId)
//   }

//   // Handle school filter change
//   const handleSchoolFilterChange = (schoolId: string) => {
//     setSelectedSchoolId(schoolId)
//     setCurrentPage(1)
//     // Pass "all" as empty string to backend, or the actual schoolId
//     const schoolIdParam = schoolId === "all" ? "" : schoolId
//     fetchSecretaries(1, pageSize, searchTerm, schoolIdParam)
//   }

//   const handleAddSecretary = () => {
//     setFormData({
//       firstName: '',
//       lastName: '',
//       email: '',
//       password: '',
//       phone: '',
//       address: '',
//       schoolId: ''
//     })
//     setSelectedSecretary(null)
//     setIsSubmitting(false) // Reset loading state when opening modal
//     setIsAddModalOpen(true)
//   }

//   const handleEditSecretary = (secretary: Secretary) => {
//     setFormData({
//       firstName: secretary.firstName || '',
//       lastName: secretary.lastName || '',
//       email: secretary.email || '',
//       password: '',
//       phone: secretary.phone || '',
//       address: secretary.address || '',
//       schoolId: secretary.schoolId?._id || ''
//     })
//     setSelectedSecretary(secretary)
//     setIsSubmitting(false) // Reset loading state when opening modal
//     setIsEditModalOpen(true)
//   }

//   const handleDeleteSecretary = (secretary: Secretary) => {
//     setSecretaryToDelete(secretary)
//     setIsDeleteDialogOpen(true)
//   }

//   const handleChangePassword = (secretary: Secretary) => {
//     setSelectedSecretary(secretary)
//     setPasswordData({
//       password: '',
//       confirmPassword: ''
//     })
//     setIsChangePasswordModalOpen(true)
//   }

//   // Check if school already has secretary
//   const checkSchoolHasSecretary = async (schoolId: string): Promise<boolean> => {
//     try {
//       const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
//       const response = await axios.get(`${API}/admin/secretaries`, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//         },
//         params: {
//           schoolId,
//           limit: 1,
//           page: 1
//         }
//       })

//       if (response.data.success && response.data.data) {
//         // Handle both paginated and non-paginated response formats
//         let secretaries = []
//         if (response.data.data.secretaries) {
//           secretaries = response.data.data.secretaries
//         } else if (Array.isArray(response.data.data)) {
//           secretaries = response.data.data
//         }
//         return Array.isArray(secretaries) && secretaries.length > 0
//       }
//       return false
//     } catch (error) {
//       console.error('Error checking school secretary:', error)
//       return false
//     }
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
    
//     // Set loading state immediately to prevent multiple clicks
//     if (isSubmitting) {
//       return // Already submitting, ignore additional clicks
//     }
//     setIsSubmitting(true)
    
//     try {
//       if (!formData.firstName || !formData.lastName || !formData.email) {
//         toast.error("Please fill in all required fields", { toastId: 'validation-error-required' })
//         setIsSubmitting(false)
//         return
//       }

//       if (isAddModalOpen) {
//         if (!formData.password) {
//           toast.error("Password is required", { toastId: 'validation-error-password' })
//           setIsSubmitting(false)
//           return
//         }

//         if (formData.password.length < 8) {
//           toast.error("Password must be at least 8 characters long", { toastId: 'validation-error-password-length' })
//           setIsSubmitting(false)
//           return
//         }

//         if (!formData.schoolId) {
//           toast.error("Please select a school", { toastId: 'validation-error-school' })
//           setIsSubmitting(false)
//           return
//         }

//         // Check if school already has a secretary
//         const hasSecretary = await checkSchoolHasSecretary(formData.schoolId)
//         if (hasSecretary) {
//           toast.error("This school already has a secretary assigned. Please delete the existing secretary first.", { toastId: 'validation-error-school-has-secretary' })
//           setIsSubmitting(false)
//           return
//         }
//       }
//       const token = localStorage.getItem('token') || localStorage.getItem('accessToken')

//       if (isAddModalOpen) {
//         // Ensure schoolId is properly included
//         if (!formData.schoolId || formData.schoolId.trim() === '') {
//           toast.error("Please select a school", { toastId: 'validation-error-school-empty' })
//           setIsSubmitting(false)
//           return
//         }

//         const response = await axios.post(
//           `${API}/admin/secretaries`,
//           {
//             firstName: formData.firstName,
//             lastName: formData.lastName,
//             email: formData.email,
//             password: formData.password,
//             phone: formData.phone,
//             address: formData.address,
//             schoolId: formData.schoolId // Explicitly include schoolId
//           },
//           {
//             headers: {
//               'Authorization': `Bearer ${token}`,
//               'Content-Type': 'application/json',
//             },
//           }
//         )

//         if (response.data.success) {
//           toast.success("Secretary created successfully", { toastId: 'create-secretary-success' })
//           setIsAddModalOpen(false)
//           // Reset form
//           setFormData({
//             firstName: '',
//             lastName: '',
//             email: '',
//             password: '',
//             phone: '',
//             address: '',
//             schoolId: ''
//           })
//           fetchSecretaries(1, pageSize, searchTerm, selectedSchoolId)
//         } else {
//           toast.error(response.data.message || "Failed to create secretary", { toastId: 'create-secretary-error' })
//         }
//       } else {
//         // Edit - don't send email, password, or schoolId
//         const updateData: any = {
//           firstName: formData.firstName,
//           lastName: formData.lastName,
//           phone: formData.phone,
//           address: formData.address
//         }

//         if (!selectedSecretary) return

//         const response = await axios.put(
//           `${API}/admin/secretaries/${selectedSecretary._id}`,
//           updateData,
//           {
//             headers: {
//               'Authorization': `Bearer ${token}`,
//               'Content-Type': 'application/json',
//             },
//           }
//         )

//         if (response.data.success) {
//           toast.success("Secretary updated successfully", { toastId: 'update-secretary-success' })
//           setIsEditModalOpen(false)
//           fetchSecretaries(currentPage, pageSize, searchTerm, selectedSchoolId)
//         } else {
//           toast.error(response.data.message || "Failed to update secretary", { toastId: 'update-secretary-error' })
//         }
//       }
//     } catch (error: any) {
//       console.error('Error submitting secretary:', error)
//       const errorMessage = error.response?.data?.message || "An error occurred"
//       toast.error(errorMessage, { toastId: 'submit-secretary-error' })
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   const handleDelete = async () => {
//     if (!secretaryToDelete) return

//     try {
//       setIsDeleting(true)
//       const token = localStorage.getItem('token') || localStorage.getItem('accessToken')

//       const response = await axios.delete(
//         `${API}/admin/secretaries/${secretaryToDelete._id}`,
//         {
//           headers: {
//             'Authorization': `Bearer ${token}`,
//           },
//         }
//       )

//       if (response.data.success) {
//         setIsDeleteDialogOpen(false)
//         setSecretaryToDelete(null)
        
//         // Show only one toast with auto-close and unique ID
//         toast.success("Secretary deleted successfully", {
//           toastId: 'delete-secretary-success',
//           autoClose: 3000,
//         })
        
//         // Fetch updated list after a short delay to ensure toast is visible
//         setTimeout(() => {
//           fetchSecretaries(currentPage, pageSize, searchTerm, selectedSchoolId)
//         }, 100)
//       } else {
//         toast.error(response.data.message || "Failed to delete secretary", {
//           toastId: 'delete-secretary-error',
//           autoClose: 3000,
//         })
//       }
//     } catch (error: any) {
//       console.error('Error deleting secretary:', error)
//       const errorMessage = error.response?.data?.message || "Failed to delete secretary"
      
//       toast.error(errorMessage, {
//         toastId: 'delete-secretary-error',
//         autoClose: 3000,
//       })
//     } finally {
//       setIsDeleting(false)
//     }
//   }

//   const handleChangePasswordSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()

//     if (!passwordData.password || !passwordData.confirmPassword) {
//       toast.error("Please fill in both password fields", { toastId: 'password-validation-empty' })
//       return
//     }

//     if (passwordData.password.length < 8) {
//       toast.error("Password must be at least 8 characters long", { toastId: 'password-validation-length' })
//       return
//     }

//     if (passwordData.password !== passwordData.confirmPassword) {
//       toast.error("Passwords do not match", { toastId: 'password-validation-match' })
//       return
//     }

//     if (!selectedSecretary) return

//     try {
//       setIsChangingPassword(true)
//       const token = localStorage.getItem('token') || localStorage.getItem('accessToken')

//       const response = await axios.put(
//         `${API}/admin/secretaries/${selectedSecretary._id}/change-password`,
//         {
//           password: passwordData.password,
//           confirmPassword: passwordData.confirmPassword
//         },
//         {
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json',
//           },
//         }
//       )

//       if (response.data.success) {
//         toast.success("Password changed successfully", { toastId: 'change-password-success' })
//         setIsChangePasswordModalOpen(false)
//         setPasswordData({ password: '', confirmPassword: '' })
//         setSelectedSecretary(null)
//       } else {
//         toast.error(response.data.message || "Failed to change password", { toastId: 'change-password-error' })
//       }
//     } catch (error: any) {
//       console.error('Error changing password:', error)
//       const errorMessage = error.response?.data?.message || "Failed to change password"
//       toast.error(errorMessage, { toastId: 'change-password-error' })
//     } finally {
//       setIsChangingPassword(false)
//     }
//   }

//   return (
//     <div className="space-y-6 p-4 sm:p-6">
//       {/* Header */}
//       <div className="space-y-4">
//         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//           <div className="space-y-1">
//             <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
//               Manage Secretaries
//             </h1>
//             <p className="text-sm sm:text-base text-gray-600">
//               Add, edit, and manage secretaries across all schools
//             </p>
//           </div>
//           <Button onClick={handleAddSecretary} className="w-full sm:w-auto">
//             <Plus className="h-4 w-4 mr-2" />
//             Add Secretary
//           </Button>
//         </div>

//         {/* Search and Filters */}
//         <div className="flex flex-col sm:flex-row gap-4">
//           <div className="relative flex-1">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
//             <Input
//               placeholder="Search secretaries by name or email..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="pl-10"
//             />
//           </div>
//           <div className="min-w-[200px]">
//             <Select
//               value={selectedSchoolId || "all"}
//               onValueChange={handleSchoolFilterChange}
//             >
//               <SelectTrigger className="w-full">
//                 <SelectValue placeholder="All Schools" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All Schools</SelectItem>
//                 {schools.map((school) => (
//                   <SelectItem key={school._id} value={school._id}>
//                     {school.name}{school.schoolCode ? ` (${school.schoolCode})` : ""}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>
//         </div>
//       </div>

//       {/* Secretaries Table */}
//       <Card className="shadow-sm">
//         <CardHeader className="pb-4">
//           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//             <CardTitle className="text-lg font-semibold">
//               Secretaries ({totalSecretaries})
//             </CardTitle>
//             <div className="flex items-center gap-2 text-sm text-gray-600">
//               <Badge variant="secondary">
//                 Page {currentPage} of {totalPages}
//               </Badge>
//               <Badge variant="outline">
//                 {pageSize} per page
//               </Badge>
//             </div>
//           </div>
//         </CardHeader>
//         <CardContent className="p-0">
//           <div className="overflow-x-auto">
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>Name</TableHead>
//                   <TableHead className="hidden sm:table-cell">Email</TableHead>
//                   <TableHead className="hidden md:table-cell">School</TableHead>
//                   <TableHead className="hidden lg:table-cell">Phone</TableHead>
//                   <TableHead className="hidden xl:table-cell">Address</TableHead>
//                   <TableHead className="text-right">Actions</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {loading ? (
//                   <TableRow>
//                     <TableCell colSpan={6} className="py-12">
//                       <div className="flex items-center justify-center">
//                         <div className="flex items-center gap-3 text-gray-600">
//                           <Loader2 className="h-5 w-5 animate-spin" />
//                           <span>Loading...</span>
//                         </div>
//                       </div>
//                     </TableCell>
//                   </TableRow>
//                 ) : secretaries.length === 0 ? (
//                   <TableRow>
//                     <TableCell colSpan={6} className="text-center py-8 text-gray-500">
//                       No secretaries found
//                     </TableCell>
//                   </TableRow>
//                 ) : (
//                   secretaries.map((secretary) => (
//                     <TableRow key={secretary._id}>
//                       <TableCell>
//                         <div>
//                           <div className="font-medium">{secretary.firstName} {secretary.lastName}</div>
//                           <div className="text-sm text-gray-500 sm:hidden">{secretary.email}</div>
//                           <div className="text-sm text-gray-500 md:hidden">{secretary.schoolId?.name || '—'}</div>
//                         </div>
//                       </TableCell>
//                       <TableCell className="hidden sm:table-cell">{secretary.email}</TableCell>
//                       <TableCell className="hidden md:table-cell">{secretary.schoolId?.name || '—'}</TableCell>
//                       <TableCell className="hidden lg:table-cell">{secretary.phone || 'N/A'}</TableCell>
//                       <TableCell className="hidden xl:table-cell">{secretary.address || 'N/A'}</TableCell>
//                       <TableCell className="text-right">
//                         <div className="flex justify-end gap-1">
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             onClick={() => handleEditSecretary(secretary)}
//                             title="Edit secretary"
//                           >
//                             <Edit className="h-4 w-4" />
//                           </Button>
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             onClick={() => handleChangePassword(secretary)}
//                             title="Change password"
//                           >
//                             <Key className="h-4 w-4" />
//                           </Button>
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             onClick={() => handleDeleteSecretary(secretary)}
//                             title="Delete secretary"
//                           >
//                             <Trash2 className="h-4 w-4" />
//                           </Button>
//                         </div>
//                       </TableCell>
//                     </TableRow>
//                   ))
//                 )}
//               </TableBody>
//             </Table>
//           </div>
//         </CardContent>
        
//         {/* Pagination */}
//         <div className="flex items-center justify-between px-6 py-4 border-t">
//           <div className="flex items-center gap-2">
//             <span className="text-sm text-gray-600">Show</span>
//             <Select value={pageSize.toString()} onValueChange={(value) => handlePageSizeChange(Number(value))}>
//               <SelectTrigger className="w-20">
//                 <SelectValue placeholder={pageSize.toString()} />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="5">5</SelectItem>
//                 <SelectItem value="10">10</SelectItem>
//                 <SelectItem value="20">20</SelectItem>
//                 <SelectItem value="50">50</SelectItem>
//               </SelectContent>
//             </Select>
//             <span className="text-sm text-gray-600">per page</span>
//           </div>
          
//           <div className="flex items-center gap-2">
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => handlePageChange(currentPage - 1)}
//               disabled={currentPage === 1}
//             >
//               Previous
//             </Button>
            
//             <div className="flex items-center gap-1">
//               {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
//                 let pageNum;
//                 if (totalPages <= 5) {
//                   pageNum = i + 1;
//                 } else if (currentPage <= 3) {
//                   pageNum = i + 1;
//                 } else if (currentPage >= totalPages - 2) {
//                   pageNum = totalPages - 4 + i;
//                 } else {
//                   pageNum = currentPage - 2 + i;
//                 }
                
//                 return (
//                   <Button
//                     key={pageNum}
//                     variant={currentPage === pageNum ? "default" : "outline"}
//                     size="sm"
//                     onClick={() => handlePageChange(pageNum)}
//                     className="w-8 h-8 p-0"
//                   >
//                     {pageNum}
//                   </Button>
//                 );
//               })}
//             </div>
            
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => handlePageChange(currentPage + 1)}
//               disabled={currentPage === totalPages}
//             >
//               Next
//             </Button>
//           </div>
          
//           <div className="text-sm text-gray-600">
//             Showing {totalSecretaries === 0 ? 0 : ((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalSecretaries)} of {totalSecretaries} secretaries
//           </div>
//         </div>
//       </Card>

//       {/* Add/Edit Modal */}
//       <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => {
//         if (!isSubmitting) {
//           setIsAddModalOpen(open && isAddModalOpen)
//           setIsEditModalOpen(open && isEditModalOpen)
//           // Reset form and loading state when closing modal
//           if (!open) {
//             setIsSubmitting(false)
//             setFormData({
//               firstName: '',
//               lastName: '',
//               email: '',
//               password: '',
//               phone: '',
//               address: '',
//               schoolId: ''
//             })
//           }
//         }
//       }}>
//         <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>{isAddModalOpen ? 'Add Secretary' : 'Edit Secretary'}</DialogTitle>
//             <DialogDescription>
//               {isAddModalOpen 
//                 ? 'Create a new secretary. Select a school from the dropdown. Only one secretary can be assigned per school.'
//                 : 'Update secretary information'}
//             </DialogDescription>
//           </DialogHeader>
//           <form onSubmit={handleSubmit}>
//             <div className="grid gap-4 py-4">
//               {isAddModalOpen && (
//                 <div className="space-y-2">
//                   <Label htmlFor="schoolId">School *</Label>
//                   <Select
//                     value={formData.schoolId}
//                     onValueChange={(value) => setFormData({ ...formData, schoolId: value })}
//                   >
//                     <SelectTrigger>
//                       <SelectValue placeholder="Select a school" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {schools.map((school) => (
//                         <SelectItem key={school._id} value={school._id}>
//                           {school.name}{school.schoolCode ? ` (${school.schoolCode})` : ""}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>
//               )}
//               <div className="grid grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="firstName">First Name *</Label>
//                   <Input
//                     id="firstName"
//                     value={formData.firstName}
//                     onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
//                     required
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="lastName">Last Name *</Label>
//                   <Input
//                     id="lastName"
//                     value={formData.lastName}
//                     onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
//                     required
//                   />
//                 </div>
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="email">Email *</Label>
//                 <Input
//                   id="email"
//                   type="email"
//                   value={formData.email}
//                   onChange={(e) => setFormData({ ...formData, email: e.target.value })}
//                   required
//                   disabled={isEditModalOpen}
//                 />
//               </div>
//               {isAddModalOpen && (
//                 <div className="space-y-2">
//                   <Label htmlFor="password">Password * (Minimum 8 characters)</Label>
//                   <div className="relative">
//                     <Input
//                       id="password"
//                       type={showAddPassword ? "text" : "password"}
//                       value={formData.password}
//                       onChange={(e) => setFormData({ ...formData, password: e.target.value })}
//                       required
//                       minLength={8}
//                     />
//                     <Button
//                       type="button"
//                       variant="ghost"
//                       size="sm"
//                       className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
//                       onClick={() => setShowAddPassword(!showAddPassword)}
//                     >
//                       {showAddPassword ? (
//                         <EyeOff className="h-4 w-4 text-gray-500" />
//                       ) : (
//                         <Eye className="h-4 w-4 text-gray-500" />
//                       )}
//                     </Button>
//                   </div>
//                 </div>
//               )}
//               <div className="space-y-2">
//                 <Label htmlFor="phone">Phone</Label>
//                 <PhoneInput
//                   country={'us'}
//                   value={formData.phone || ''}
//                   onChange={(value) => setFormData({ ...formData, phone: value })}
//                   containerClass="w-full border border-gray-200 rounded-md relative"
//                   inputClass="!w-full !h-10 !border-0 !shadow-none !pl-12"
//                   buttonClass="!border-0 !bg-white !h-10 !rounded-none !border-r !border-gray-200"
//                   placeholder="Phone number"
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="address">Address</Label>
//                 <Input
//                   id="address"
//                   value={formData.address}
//                   onChange={(e) => setFormData({ ...formData, address: e.target.value })}
//                 />
//               </div>
//             </div>
//             <DialogFooter>
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => {
//                   setIsAddModalOpen(false)
//                   setIsEditModalOpen(false)
//                   setIsSubmitting(false) // Reset loading state on cancel
//                   setFormData({
//                     firstName: '',
//                     lastName: '',
//                     email: '',
//                     password: '',
//                     phone: '',
//                     address: '',
//                     schoolId: ''
//                   })
//                 }}
//                 disabled={isSubmitting}
//               >
//                 Cancel
//               </Button>
//               <Button type="submit" disabled={isSubmitting}>
//                 {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
//                 {isAddModalOpen ? 'Create' : 'Update'}
//               </Button>
//             </DialogFooter>
//           </form>
//         </DialogContent>
//       </Dialog>

//       {/* Change Password Modal */}
//       <Dialog open={isChangePasswordModalOpen} onOpenChange={(open) => {
//         if (!isChangingPassword) {
//           setIsChangePasswordModalOpen(open)
//         }
//       }}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Change Password</DialogTitle>
//             <DialogDescription>
//               Set a new password for the secretary. Password must be at least 8 characters long.
//             </DialogDescription>
//           </DialogHeader>
//           <form onSubmit={handleChangePasswordSubmit}>
//             <div className="grid gap-4 py-4">
//               <div className="space-y-2">
//                 <Label htmlFor="newPassword">New Password * (Minimum 8 characters)</Label>
//                 <div className="relative">
//                   <Input
//                     id="newPassword"
//                     type={showPassword ? "text" : "password"}
//                     value={passwordData.password}
//                     onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
//                     required
//                     minLength={8}
//                   />
//                   <Button
//                     type="button"
//                     variant="ghost"
//                     size="sm"
//                     className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
//                     onClick={() => setShowPassword(!showPassword)}
//                   >
//                     {showPassword ? (
//                       <EyeOff className="h-4 w-4 text-gray-500" />
//                     ) : (
//                       <Eye className="h-4 w-4 text-gray-500" />
//                     )}
//                   </Button>
//                 </div>
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="confirmPassword">Confirm Password *</Label>
//                 <div className="relative">
//                   <Input
//                     id="confirmPassword"
//                     type={showConfirmPassword ? "text" : "password"}
//                     value={passwordData.confirmPassword}
//                     onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
//                     required
//                     minLength={8}
//                   />
//                   <Button
//                     type="button"
//                     variant="ghost"
//                     size="sm"
//                     className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
//                     onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                   >
//                     {showConfirmPassword ? (
//                       <EyeOff className="h-4 w-4 text-gray-500" />
//                     ) : (
//                       <Eye className="h-4 w-4 text-gray-500" />
//                     )}
//                   </Button>
//                 </div>
//               </div>
//             </div>
//             <DialogFooter>
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => setIsChangePasswordModalOpen(false)}
//                 disabled={isChangingPassword}
//               >
//                 Cancel
//               </Button>
//               <Button type="submit" disabled={isChangingPassword}>
//                 {isChangingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
//                 Change Password
//               </Button>
//             </DialogFooter>
//           </form>
//         </DialogContent>
//       </Dialog>

//       {/* Delete Confirmation Dialog */}
//       <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => {
//         if (!isDeleting) {
//           setIsDeleteDialogOpen(open)
//           if (!open) {
//             setSecretaryToDelete(null)
//             setIsDeleting(false)
//           }
//         }
//       }}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Delete Secretary</DialogTitle>
//             <DialogDescription>
//               Are you sure you want to delete secretary "{secretaryToDelete?.firstName} {secretaryToDelete?.lastName}"? 
//               This action cannot be undone and will remove the secretary from the school.
//             </DialogDescription>
//           </DialogHeader>
//           <DialogFooter>
//             <Button
//               variant="outline"
//               onClick={() => setIsDeleteDialogOpen(false)}
//               disabled={isDeleting}
//             >
//               Cancel
//             </Button>
//             <Button
//               variant="destructive"
//               onClick={handleDelete}
//               disabled={isDeleting}
//             >
//               {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
//               Delete
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//     </div>
//   )
// }

