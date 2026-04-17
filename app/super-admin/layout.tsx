"use client"

import type React from "react"
import {
  LayoutDashboard,
  Users,
  Building,
  Shield,
  Settings,
  UserCog,
  School,
  FileText,
  BarChart3,
  Key,
  Calendar,
  Database,
  Activity,
  Globe,
  Mail,
  Clock,
  RotateCw,
  Bell,
  ShieldCheck,
  Plug,
  ChevronDown,
  ChevronRight,
  Trophy,
  UserCheck,
  Stethoscope,
  Clock as ClockIcon,
  Calendar as CalendarIcon,
  CheckCircle,
  AlertTriangle,
  FileCheck,
  Video
} from "lucide-react"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { ToastContainer } from "react-toastify"
import SuperAdminSidebar from "./components/SuperAdmin-Sidebar"
import SuperAdminMobileSidebar from "./components/SuperAdmin-Mobile-Sidebar"
import RouteGuard from "@/components/RouteGuard"

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
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
    { name: "Dashboard", href: "/super-admin/dashboard", icon: LayoutDashboard },

    // { name: "Manage Schools", href: "/super-admin/schools", icon: School },
    {
      name: "Manage Schools",
      icon: School,
      submenu: [
        { name: "Schools", href: "/super-admin/schools" },
        { name: "Departments", href: "/super-admin/departments" },
        { name: "Courses", href: "/super-admin/courses" }
      ]
    },
    {
      name: "User Management",
      icon: Users,
      submenu: [
        { name: "Super Admins", href: "/super-admin/manage/super-admins" },
        { name: "Admins", href: "/super-admin/manage/admins" },
        { name: "Students", href: "/super-admin/manage/students" },
        { name: "Parents", href: "/super-admin/manage/parents" },
        { name: "Teachers", href: "/super-admin/manage/teachers" },
        { name: "Nurses", href: "/super-admin/manage/nurses" },
        { name: "Secretaries", href: "/super-admin/manage/secretaries" }
        // { name: "Users", href: "/super-admin/manage/users" }
      ]
    },
    { name: "Password Management", href: "/super-admin/password-management", icon: Key },
    { name: "Roles for Teachers", href: "/super-admin/teacher-roles", icon: UserCog },
    
    { name: "Data Management", href: "/super-admin/data-management", icon: Database },
    { name: "Audit Logs", href: "/super-admin/audit-logs", icon: Activity },
    { name: "System Analytics", href: "/super-admin/analytics", icon: BarChart3 },
    { name: "Reports", href: "/super-admin/reports", icon: FileText },
    { name: "Report Builder", href: "/super-admin/report-builder", icon: BarChart3 },
    { name: "Scheduled Jobs", href: "/super-admin/scheduled-jobs", icon: Clock },
    { name: "Discipline Management", href: "/super-admin/discipline", icon: AlertTriangle },
    { name: "Lesson Plan Approval", href: "/super-admin/lesson-plan-approval", icon: FileCheck },
   
    {
      name: "Sports Management",
      icon: Trophy,
      submenu: [
        { name: "Programs", href: "/super-admin/sports/programs" },
        { name: "Student Assignments", href: "/super-admin/sports/assignments" },
        // { name: "Eligibility & Medical", href: "/super-admin/sports/eligibility" },
        { name: "Schedule", href: "/super-admin/sports/schedule" },
        { name: "Attendance", href: "/super-admin/sports/attendance" },
        { name: "Statistics Report", href: "/super-admin/sports/reports" }
      ]
    },
    {
      name: "Club Management",
      icon: Users,
      submenu: [
        { name: "Overview", href: "/super-admin/clubs" },
        { name: "Student Assignments", href: "/super-admin/clubs/assignments" },
        // { name: "Membership Approvals", href: "/super-admin/clubs/approvals" },
        { name: "Attendance", href: "/super-admin/clubs/attendance" },
        { name: "Announcements", href: "/super-admin/clubs/announcements" },
        { name: "Events", href: "/super-admin/clubs/events" },
        { name: "Analytics", href: "/super-admin/clubs/analytics" },
        { name: "Reports", href: "/super-admin/clubs/reports" }
      ]
    },
    // { name: "Access Control", href: "/super-admin/access-control", icon: Shield },
    // { name: "Session Management", href: "/super-admin/session-management", icon: Users },
    // { name: "System Monitoring", href: "/super-admin/system-monitoring", icon: Activity },
    { name: "System Settings", href: "/super-admin/system-settings", icon: Globe },
    { name: "Email Templates", href: "/super-admin/email-templates", icon: Mail },
    { name: "Roles & Permissions", href: "/super-admin/roles", icon: Shield },
    { name: "Academic Terms", href: "/super-admin/academic-terms", icon: Calendar },
    { name: "Rollover Management", href: "/super-admin/rollover-management", icon: RotateCw },
    // { name: "System Alerts", href: "/super-admin/system-alerts", icon: Bell },
    // { name: "Certificate Management", href: "/super-admin/certificate-management", icon: ShieldCheck },
    // { name: "Integration Management", href: "/super-admin/integration-management", icon: Plug },
    { name: "Demo Videos", href: "/super-admin/demo-videos", icon: Video },
  ]

  if (!isMounted) {
    return null
  }

  return (
    <RouteGuard requiredRole="SUPER_ADMIN">
      <div className="relative flex min-h-screen">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <SuperAdminSidebar
        navigation={navigation}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* Main Content */}
      <div className="flex w-full flex-1 flex-col lg:pl-72">
        {/* Top Navbar for Mobile */}
        <SuperAdminMobileSidebar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />

        {/* Page Content */}
        <main className="flex-1">{children}</main>

        {/* Toast Notification Container */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
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
      </div>
    </div>
    </RouteGuard>
  )
}
