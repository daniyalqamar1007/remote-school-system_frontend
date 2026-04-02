import React, { useEffect, useState } from 'react'
import { Calendar, FileText, LayoutDashboard, Plus, UserCheck, X, Trophy, Users, UserPlus, Clock, BarChart3, ChevronDown, ChevronRight, AlertTriangle, CheckCircle } from "lucide-react"
import Link from 'next/link'
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'
import SidebarProfile from '@/components/SidebarProfile'
import { useTeacherSports } from '@/hooks/useTeacherSports'
import { useCanApproveLessonPlans } from '@/hooks/useCanApproveLessonPlans'

const TeacherSidebar = ({ isSidebarOpen, setIsSidebarOpen }: { isSidebarOpen: boolean, setIsSidebarOpen: any }) => {

  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)
  const [sportsExpanded, setSportsExpanded] = useState(false)
  const { hasSportsPrograms } = useTeacherSports()
  const { canApprove } = useCanApproveLessonPlans()

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsSidebarOpen(false)
  }, [pathname])

  // Base navigation items
  const baseNavigation = [
    {
      name: "Dashboard",
      href: "/teacher/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Attendance",
      href: "/teacher/attendance",
      icon: UserCheck,
    },
    {
      name: "Grades",
      href: "/teacher/grades",
      icon: Plus,
    },
    {
      name: "Lesson Plans",
      href: "/teacher/lesson-plans",
      icon: FileText,
    },
    ...(canApprove ? [{
      name: "Approve Lesson Plans",
      href: "/teacher/lesson-plan-approval",
      icon: CheckCircle,
    }] : []),
    {
      name: "Discipline",
      href: "/teacher/discipline",
      icon: AlertTriangle,
    },
    {
      name: "Recent Activities",
      href: "/teacher/activities",
      icon: Plus,
    },
  ]

  // Sports submenu items
  const sportsSubmenu = [
    { name: "Programs", href: "/teacher/sports/programs", icon: Trophy },
    { name: "Assignments", href: "/teacher/sports/assignments", icon: UserPlus },
    { name: "Schedule", href: "/teacher/sports/schedule", icon: Clock },
    { name: "Attendance", href: "/teacher/sports/attendance", icon: UserCheck },
    { name: "Reports", href: "/teacher/sports/reports", icon: BarChart3 },
  ]

  // Check if any sports submenu item is active
  const isSportsActive = sportsSubmenu.some(item => pathname.startsWith(item.href))

  // Auto-expand sports menu if on a sports page
  useEffect(() => {
    if (isSportsActive) {
      setSportsExpanded(true)
    }
  }, [isSportsActive])

  // Clubs navigation item
  const clubsNavItem = {
    name: "My Clubs",
    href: "/teacher/clubs",
    icon: Users,
  }

  // Final navigation array
  const navigation = [
    ...baseNavigation,
    clubsNavItem,
    {
      name: "Communication",
      href: "/teacher/communication",
      icon: FileText,
    },
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
          <Link href="/teacher/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image
              src="/Logo/srs.png"
              alt="RSS Teacher Logo"
              width={44}
              height={32}
              className="h-12 w-12  rounded-full"
            />
            <span className="text-xl font-semibold">RSS Teacher</span>
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsSidebarOpen(false)}>
            <X className="h-6 w-6" />
          </Button>
        </div>

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
                        <item.icon
                          className={`h-6 w-6 shrink-0 ${isActive ? "text-black" : "text-gray-400 group-hover:text-black"
                            }`}
                        />
                        {item.name}
                      </Link>
                    </li>
                  )
                })}

                {/* Sports Management with Submenu - Only show if teacher has sports programs */}
                {hasSportsPrograms && (
                  <li>
                    <button
                      onClick={() => setSportsExpanded(!sportsExpanded)}
                      className={`
                        group flex w-full items-center gap-x-3 rounded-md p-2 text-sm font-semibold leading-6
                        ${isSportsActive ? "bg-gray-50 text-black" : "text-gray-700 hover:bg-gray-50 hover:text-black"}
                      `}
                    >
                      <Trophy
                        className={`h-6 w-6 shrink-0 ${isSportsActive ? "text-black" : "text-gray-400 group-hover:text-black"
                          }`}
                      />
                      <span className="flex-1 text-left">Sports Management</span>
                      {sportsExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                    {sportsExpanded && (
                      <ul className="ml-8 mt-1 space-y-1">
                        {sportsSubmenu.map((subItem) => {
                          const isSubActive = pathname === subItem.href || pathname.startsWith(subItem.href + '/')
                          return (
                            <li key={subItem.name}>
                              <Link
                                href={subItem.href}
                                className={`
                                  group flex gap-x-3 rounded-md p-2 text-sm leading-6
                                  ${isSubActive ? "bg-gray-50 text-black font-semibold" : "text-gray-600 hover:bg-gray-50 hover:text-black"}
                                `}
                              >
                                <subItem.icon
                                  className={`h-5 w-5 shrink-0 ${isSubActive ? "text-black" : "text-gray-400 group-hover:text-black"
                                    }`}
                                />
                                {subItem.name}
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </li>
                )}
              </ul>
            </li>

            {/* Profile */}
            <li className="-mx-6 mt-auto">
              <Separator className="mb-2" />
              <SidebarProfile title={"Teacher"} />
            </li>
          </ul>
        </nav>
      </div>
    </div>
  )
}

export default TeacherSidebar