import React, { useEffect, useState } from 'react'
import { Calendar, FileText, LayoutDashboard, LogOut, Menu, Plus, School, UserPlus, X, Trophy, Users, Award, Brain, AlertTriangle, CalendarDays, Building2, ChevronDown, ChevronRight, Activity, UserCheck, Clock, BarChart3, Bell, CheckCircle, Key, FileBarChart, UserCog } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from 'next/link'
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'
import SidebarProfile from '@/components/SidebarProfile'

const AdminSidebar = ({ isSidebarOpen, setIsSidebarOpen }: { isSidebarOpen: boolean, setIsSidebarOpen: any }) => {
  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])

  // Check if any sports or clubs route is active to expand menu by default
  useEffect(() => {
    if (pathname?.startsWith('/admin/sports')) {
      setExpandedMenus(prev => {
        const menuKey = 'sports-management'
        if (!prev.includes(menuKey)) {
          return [...prev, menuKey]
        }
        return prev
      })
    }
    if (pathname?.startsWith('/admin/clubs')) {
      setExpandedMenus(prev => {
        const menuKey = 'club-management'
        if (!prev.includes(menuKey)) {
          return [...prev, menuKey]
        }
        return prev
      })
    }
  }, [pathname])

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => {
      if (prev.includes(menuName)) {
        return prev.filter(m => m !== menuName)
      }
      return [...prev, menuName]
    })
  }

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
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Lesson Plan Approval",
      href: "/admin/lesson-plan-approval",
      icon: FileText,
    },
    {
      name: "Manage Students",
      href: "/admin/manage-students",
      icon: UserPlus,
    },
    {
      name: "Manage Parents",
      href: "/admin/manage-parents",
      icon: UserPlus,
    },
    {
      name: "Manage Teachers",
      href: "/admin/manage-teachers",
      icon: UserPlus,
    },
    {
      name: "Honor Roll Management",
      href: "/admin/honor-roll",
      icon: Award,
    },
    // {
    //   name: "IEP Management",
    //   href: "/admin/iep",
    //   icon: Brain,
    //   hidden: true,
    // },
    {
      name: "Discipline Management",
      href: "/admin/discipline",
      icon: AlertTriangle,
    },
    {
      name: "Calendar Management",
      href: "/admin/calendar-management",
      icon: CalendarDays,
      hidden: true,
    },
    {
      name: "Academic Terms",
      href: "/admin/academic-terms",
      icon: Calendar,
    },
    {
      name: "Sports Management",
      href: "/admin/sports/programs",
      icon: Trophy,
      children: [
        {
          name: "Programs",
          href: "/admin/sports/programs",
          icon: Trophy,
        },
        {
          name: "Student Assignments",
          href: "/admin/sports/assignments",
          icon: UserCheck,
        },
        // {
        //   name: "Eligibility & Medical",
        //   href: "/admin/sports/eligibility",
        //   icon: Activity,
        // },
        {
          name: "Schedule",
          href: "/admin/sports/schedule",
          icon: Clock,
        },
        {
          name: "Attendance",
          href: "/admin/sports/attendance",
          icon: Calendar,
        },
        {
          name: "Statistics Report",
          href: "/admin/sports/reports",
          icon: BarChart3,
        },
      ],
    },
    {
      name: "Club Management",
      href: "/admin/clubs",
      icon: Users,
      children: [
        {
          name: "Overview",
          href: "/admin/clubs",
          icon: Users,
        },
        {
          name: "Student Assignments",
          href: "/admin/clubs/assignments",
          icon: UserCheck,
        },
        // {
        //   name: "Membership Approvals",
        //   href: "/admin/clubs/approvals",
        //   icon: CheckCircle,
        // },
        {
          name: "Attendance",
          href: "/admin/clubs/attendance",
          icon: Clock,
        },
        {
          name: "Announcements",
          href: "/admin/clubs/announcements",
          icon: Bell,
        },
        {
          name: "Events",
          href: "/admin/clubs/events",
          icon: Calendar,
        },
        {
          name: "Analytics",
          href: "/admin/clubs/analytics",
          icon: BarChart3,
        },
        {
          name: "Reports",
          href: "/admin/clubs/reports",
          icon: FileText,
        },
      ],
    },
    // {
    //   name: "Generate Report",
    //   href: "/admin/generate-report",
    //   icon: FileText,
    // },
    {
      name: "Recent Activity",
      href: "/admin/activities",
      icon: Calendar,
    },
    {
      name: "Courses",
      href: "/admin/courses",
      icon: Plus,
    },
    {
      name: "Departments",
      href: "/admin/departments",
      icon: Building2,
    },
    {
      name: "Password Management",
      href: "/admin/password-management",
      icon: Key,
    },
    {
      name: "Reports",
      href: "/admin/reports",
      icon: FileBarChart,
    },
    {
      name: "Roles for Teachers",
      href: "/admin/roles",
      icon: UserCog,
    }
    // {
    //   name: "Schedule Course",
    //   href: "/admin/schedule-course",
    //   icon: Plus,
    // }
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
        {/* Logo and Close Button */}
        <div className="flex h-16 shrink-0 items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image
              src="/Logo/srs.png"
              alt="RSS Admin Logo"
              width={44}
              height={32}
              className="h-12 w-12  rounded-full"
            />
            <span className="text-xl font-semibold">RSS Admin</span>
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
                {navigation.filter(item => !item.hidden).map((item: any) => {
                  const hasChildren = item.children && item.children.length > 0
                  const menuKey = item.name.toLowerCase().replace(/\s+/g, '-')
                  const isExpanded = expandedMenus.includes(menuKey)
                  // Check if any child is active
                  const isChildActive = hasChildren && item.children?.some((child: any) => {
                    // Exact match or sub-route match (but not the parent route itself)
                    return pathname === child.href || (pathname?.startsWith(child.href + '/') && pathname !== item.href)
                  })
                  // Parent is active only if pathname exactly matches parent href (not when child is active)
                  const isActive = pathname === item.href && !isChildActive
                  // Parent should be highlighted when child is active (for visual feedback), but child is the actual active item
                  const isParentActive = isChildActive

                  if (hasChildren) {
                    return (
                      <li key={item.name}>
                        <button
                          type="button"
                          onClick={() => toggleMenu(menuKey)}
                          className={`
                              group flex w-full items-center justify-between gap-x-3 rounded-md p-2 text-sm font-semibold leading-6
                              ${isParentActive ? "bg-gray-50 text-black" : "text-gray-700 hover:bg-gray-50 hover:text-black"}
                            `}
                        >
                          <div className="flex items-center gap-x-3 flex-1">
                            <item.icon
                              className={`h-6 w-6 shrink-0 ${isParentActive ? "text-black" : "text-gray-400 group-hover:text-black"
                                }`}
                            />
                            {item.name}
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 shrink-0" />
                          )}
                        </button>
                        {isExpanded && (
                          <ul className="mt-1 ml-8 space-y-1">
                            {item.children.map((child: any) => {
                              // For "Overview" (which matches parent href), only mark active if exact match
                              // For other children, check exact match or sub-route
                              const isOverview = child.href === item.href;
                              const isChildActive = isOverview
                                ? pathname === child.href
                                : (pathname === child.href || (pathname?.startsWith(child.href + '/') && pathname !== item.href));
                              return (
                                <li key={child.name}>
                                  <Link
                                    href={child.href}
                                    className={`
                                        group flex gap-x-3 rounded-md p-2 text-sm leading-6
                                        ${isChildActive ? "bg-gray-100 text-black font-medium" : "text-gray-600 hover:bg-gray-50 hover:text-black"}
                                      `}
                                  >
                                    <child.icon
                                      className={`h-5 w-5 shrink-0 ${isChildActive ? "text-black" : "text-gray-400 group-hover:text-black"
                                        }`}
                                    />
                                    {child.name}
                                  </Link>
                                </li>
                              )
                            })}
                          </ul>
                        )}
                      </li>
                    )
                  }

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
              </ul>
            </li>

            {/* Profile */}
            <li className="-mx-6 mt-auto">
              <Separator className="mb-2" />
              <SidebarProfile title='Administrator' />
            </li>
          </ul>
        </nav>
      </div>
    </div>
  )
}

export default AdminSidebar