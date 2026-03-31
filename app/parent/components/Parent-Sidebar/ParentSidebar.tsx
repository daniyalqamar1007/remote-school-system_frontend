// app/parent/components/Parent-Sidebar/ParentSidebar.tsx

import React, { useEffect, useState } from 'react'
import { 
  User, Calendar, FileText, Book, Bell, MessageSquare, 
  ClipboardList, FileCheck, AlertTriangle, Clock, X, Home, FileHeart, Trophy, Award, Brain, CalendarDays, Users, AlertCircle
} from "lucide-react"
import Link from 'next/link'
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'
import SidebarProfile from '@/components/SidebarProfile'
import StudentSelector from '../StudentSelector'
import { useStudent } from '../../context/StudentContext'
import axios from 'axios'
import { Badge } from '@/components/ui/badge'


const ParentSidebar = ({isSidebarOpen, setIsSidebarOpen}:{isSidebarOpen:boolean, setIsSidebarOpen:any}) => {
  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const { selectedStudent } = useStudent()

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsSidebarOpen(false)
  }, [pathname])

  // Fetch unread alert count for selected student
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
        if (!token) return

        // Build query params - include studentId if student is selected
        const params = new URLSearchParams()
        if (selectedStudent?._id) {
          params.append('studentId', selectedStudent._id)
        }

        const url = `${process.env.NEXT_PUBLIC_SRS_SERVER}/parent/alerts/unread-count${params.toString() ? '?' + params.toString() : ''}`
        
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (response.data?.success) {
          const count = response.data.data?.count || 0
          setUnreadCount(count)
          console.log(`📊 Unread alerts count for ${selectedStudent?.firstName || 'all students'}: ${count}`)
        }
      } catch (error) {
        console.error('Error fetching unread alert count:', error)
        setUnreadCount(0)
      }
    }

    // Fetch immediately when student changes or on mount
    fetchUnreadCount()
    
    // Refresh count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [selectedStudent?._id]) // Re-fetch when selected student changes

  const navigation = [
    {
      name: "Dashboard",
      href: "/parent/dashboard",
      icon: Home,
    },
    {
      name: "Alerts",
      href: "/parent/alerts",
      icon: AlertCircle,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      name: "My Profile",
      href: "/parent/profile",
      icon: User,
    },
    {
      name: "Attendance",
      href: "/parent/attendance",
      icon: Clock,
    },
    {
      name: "Grades & Reports",
      href: "/parent/grades",
      icon: Book,
    },
    {
      name: "Honor Roll",
      href: "/parent/honor-roll",
      icon: Award,
    },
    {
      name: "Class Schedule",
      href: "/parent/schedule",
      icon: FileText,
    },
    // {
    //   name: "Homework & Assignments",
    //   href: "/parent/homework",
    //   icon: ClipboardList,
    // },
    // {
    //   name: "School Calendar",
    //   href: "/parent/calendar",
    //   icon: Calendar,
    // },
    // {
    //   name: "Events & Activities",
    //   href: "/parent/events",
    //   icon: CalendarDays,
    // },
    // {
    //   name: "Announcements",
    //   href: "/parent/announcements",
    //   icon: Bell,
    // },
    {
      name: "Communication",
      href: "/parent/communication",
      icon: MessageSquare,
    },
    {
      name: "Behavior Log",
      href: "/parent/behavior",
      icon: AlertTriangle,
    },
    {
      name: "Health & Medical",
      href: "/parent/health",
      icon: FileHeart,
    },
    {
      name: "Sports & Activities",
      href: "/parent/sports",
      icon: Trophy,
    },
    {
      name: "Clubs & Activities",
      href: "/parent/clubs-activities",
      icon: Users,
    },
    // {
    //   name: "Submit Absence",
    //   href: "/parent/absence",
    //   icon: FileCheck,
    // },
    // {
    //   name: "Documents & Forms",
    //   href: "/parent/documents",
    //   icon: FileCheck,
    // },
  ]

  if (!isMounted) {
    return null
  }

  return (
    <div
      className={cn(
        "fixed inset-y-0 z-50 flex w-72 flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      {/* Sidebar container */}
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r bg-white px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center justify-between">
          <Link href="/parent/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image
              src="/Logo/srs.png"
              alt="SRS Parent Logo"
              width={44}
              height={32}
              className="h-12 w-12 rounded-full"
            />
            <span className="text-xl font-semibold">SRS Parent</span>
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsSidebarOpen(false)}>
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Student Selector */}
        <StudentSelector />
        <Separator className="my-2" />

        {/* Primary Navigation */}
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            {/* Primary Nav Items */}
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`
                          group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6
                          ${isActive ? "bg-gray-50 text-black" : "text-gray-700 hover:bg-gray-50 hover:text-black"}
                        `}
                      >
                        <div className="relative">
                          <item.icon
                            className={`h-6 w-6 shrink-0 ${
                              isActive ? "text-black" : "text-gray-400 group-hover:text-black"
                            }`}
                          />
                          {item.badge && item.badge > 0 && (
                            <Badge 
                              variant="destructive" 
                              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                            >
                              {item.badge > 99 ? '99+' : item.badge}
                            </Badge>
                          )}
                        </div>
                        {item.name}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </li>

            {/* Profile */}
            <li className="-mx-6 mt-auto">
              <Separator className="mb-2" />
              <SidebarProfile title={"Parent"} />
            </li>
          </ul>
        </nav>
      </div>
    </div>
  )
}

export default ParentSidebar