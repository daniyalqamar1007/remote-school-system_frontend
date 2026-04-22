"use client"

import type React from "react"

import { Calendar, FileText, LayoutDashboard, LogOut, Menu, Plus, School, UserCheck, X, Users, Trophy, Award } from "lucide-react"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { ToastContainer } from "react-toastify"
import StudentSidebar from "./components/Student-Sidebar/StudentSidebar"
import StudentMobileSidebar from "./components/Student-Mobile-Sidebar/StudentMobileSidebar"
import RouteGuard from "@/components/RouteGuard"

export default function TeachersPortal({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsSidebarOpen(false)
  }, [pathname])

  const navigation = [
    {
      name: "Dashboard",
      href: "/student/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "My Profile",
      href: "/student/profile",
      icon: UserCheck,
    },
    {
      name: "Attendance",
      href: "/student/attendance",
      icon: UserCheck,
    },
    {
      name: "Grades",
      href: "/student/results",
      icon: Plus,
    },
    {
      name: "Fees",
      href: "/student/fees",
      icon: FileText,
    },
    {
      name: "Classes Schedule",
      href: "/student/schedule",
      icon: FileText,
    },
    {
      name: "My Sports",
      href: "/student/sports",
      icon: Trophy,
    },
    {
      name: "My Clubs",
      href: "/student/clubs",
      icon: Users,
    },
    {
      name: "Honor Roll",
      href: "/student/honor-roll",
      icon: Award,
    },
    {
        name: "Communication",
        href: "/student/communication",
        icon: FileText,
      },
  ]

  if (!isMounted) {
    return null
  }

  return (
    <RouteGuard requiredRole="STUDENT">
      <div className="relative flex min-h-screen">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <StudentSidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      {/* Main Content */}
      <div className="flex w-full flex-1 flex-col lg:pl-72">
        <StudentMobileSidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} /> 
        <main className="flex-1">{children}</main>
      </div>
    </div>
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      limit={5}
      style={{ zIndex: 9999 }}
      className="toast-container"
    />
    </RouteGuard>
  )
}
