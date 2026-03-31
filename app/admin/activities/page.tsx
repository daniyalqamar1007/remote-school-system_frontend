"use client"

import { useEffect, useState } from "react"
import { Bell, Calendar, Filter, Loader2, MoreVertical, Search, Trash, User } from "lucide-react"
import axios from "axios"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from 'sonner';

interface Activity {
  _id: string
  title: string
  subtitle: string
  performBy: string
  createdAt: string
  updatedAt: string
  __v: number
}

// Define the API response type
interface ApiResponse {
  totalRecords: number
  totalPages: number
  currentPage: number
  currentLimit: number
  data: Activity[]
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")

  const fetchActivities = async (page: number = 1, limit: number = 10) => {
    try {
      setIsLoading(true)
      setError(null)
      const token = localStorage.getItem('accessToken')
      const userInfoStr = localStorage.getItem('userInfo')
      
      if (!token || !userInfoStr) {
        throw new Error("No authentication data found")
      }

      const userInfo = JSON.parse(userInfoStr)
      const adminId = userInfo._id || userInfo.id
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        performBy: 'ADMIN',
        actorId: adminId,
        role: 'ADMIN',
      })

      if (searchTerm.trim()) {
        params.append('title', searchTerm.trim())
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/activity?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch activities")
      }

      const data: ApiResponse = await response.json()

      setActivities(data.data || [])
      setTotalPages(data.totalPages || 1)
      setTotalRecords(data.totalRecords || 0)
    } catch (err) {
      console.error("Error fetching activities:", err)
      setError("Failed to load activities. Please try again later.")
      setActivities([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities(currentPage, pageSize)
  }, [currentPage, pageSize])

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchActivities(1, pageSize)
      } else {
        setCurrentPage(1)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Helper function to calculate relative time
  const getRelativeTime = (date: Date): string => {
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInMinutes < 1) {
      return "Just now"
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    } else {
      return new Date(date).toLocaleDateString()
    }
  }

  // Function to delete an activity
  const deleteActivity = async (id: string) => {
    try {
      setIsDeleting(id)
      const token = localStorage.getItem('accessToken')
      
      await axios.delete(`${process.env.NEXT_PUBLIC_SRS_SERVER}/activity/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      toast.success("The activity has been successfully deleted.")
      // Refresh the current page
      fetchActivities(currentPage, pageSize)
    } catch (err) {
      console.error("Error deleting activity:", err)
      toast.error("Failed to delete the activity. Please try again.")
    } finally {
      setIsDeleting(null)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Recent Activities</h1>
            <p className="text-gray-500">Track and monitor all Admin activities.</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-gray-200">
          <CardContent className="flex items-center gap-6 p-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                placeholder="Search activities..." 
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Activities Table */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-lg font-semibold">
                Activity Timeline ({totalRecords})
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
                    <TableHead>Activity</TableHead>
                    <TableHead className="hidden md:table-cell">Description</TableHead>
                    <TableHead className="hidden lg:table-cell">Performed By</TableHead>
                    <TableHead className="hidden xl:table-cell">Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12">
                        <div className="flex items-center justify-center">
                          <div className="flex items-center gap-3 text-gray-600">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-black"></div>
                            <span>Loading...</span>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-red-500">
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : activities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No activities found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    activities.map((activity) => (
                      <TableRow key={activity._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="rounded-full bg-gray-100 p-2">
                              <User className="h-4 w-4 text-gray-600" />
                            </div>
                            <div>
                              <div className="font-medium">{activity.title}</div>
                              <div className="text-sm text-gray-500 md:hidden">
                                {activity.subtitle}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="text-sm text-gray-600 max-w-md truncate">
                            {activity.subtitle || 'No description'}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="text-sm">{activity.performBy || 'Admin'}</div>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          <div className="text-sm">
                            <div>{getRelativeTime(new Date(activity.createdAt))}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(activity.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Completed
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-40 p-0" align="end">
                              <Button
                                variant="ghost"
                                className="flex w-full items-center justify-start text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 text-sm"
                                onClick={() => deleteActivity(activity._id)}
                                disabled={isDeleting === activity._id}
                              >
                                {isDeleting === activity._id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash className="mr-2 h-4 w-4" />
                                )}
                                {isDeleting === activity._id ? "Deleting..." : "Delete"}
                              </Button>
                            </PopoverContent>
                          </Popover>
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
                disabled={currentPage === 1 || isLoading}
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
                disabled={currentPage === totalPages || isLoading}
              >
                Next
              </Button>
            </div>
            
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} activities
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
