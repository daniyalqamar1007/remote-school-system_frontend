"use client"

import type React from "react"

import { Calendar, FileText, LayoutDashboard, LogOut, Menu, Plus, School, UserPlus, X, Heart, Pill, Stethoscope, Shield, AlertTriangle, Upload, BarChart3, Trophy } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { ToastContainer } from "react-toastify"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import SidebarProfile from "@/components/SidebarProfile"
import RouteGuard from "@/components/RouteGuard"

export default function NurseLayout({
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
      href: "/nurse/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Student Health Records",
      href: "/nurse/health-record",
      icon: UserPlus,
    },
    {
      name: "Nurse Visits",
      href: "/nurse/visits",
      icon: Stethoscope,
    },
    {
      name: "Health Alerts",
      href: "/nurse/alerts",
      icon: AlertTriangle,
    },
    {
      name: "Sports Approvals",
      href: "/nurse/sports-approvals",
      icon: Trophy,
    },
    {
      name: "Documents",
      href: "/nurse/documents",
      icon: Upload,
    },
    {
      name: "Statistics Report",
      href: "/nurse/reports",
      icon: BarChart3,
    },
  ]

  if (!isMounted) {
    return null
  }

  return (
    <RouteGuard requiredRole="NURSE">
      <div className="relative flex min-h-screen">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
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
          <Link href="/nurse/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
    <Image
      src="/Logo/srs.png"
      alt="RSS Nurse Logo"
      width={32}
      height={32}
      className="h-8 w-8 rounded-full"
    />
    <span className="text-xl font-semibold">RSS Nurse</span>
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
                            className={`h-6 w-6 shrink-0 ${
                              isActive ? "text-black" : "text-gray-400 group-hover:text-black"
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
                <SidebarProfile title="Nurse" />
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex w-full flex-1 flex-col lg:pl-72">
        {/* Top Navbar for Mobile */}
        <div className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b bg-white px-4 shadow-sm sm:gap-x-6 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="-m-2.5 p-2.5 text-gray-700"
            onClick={() => setIsSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </Button>

          {/* Logo for Mobile */}
          <div className="flex flex-1 items-center gap-x-3">
            <School className="h-8 w-8" />
            <span className="text-xl font-semibold">RSS Nurse</span>
          </div>

          {/* Mobile Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="-m-2.5 p-2.5 text-gray-700">
                <span className="sr-only">Open user menu</span>
                <Image
                  className="h-8 w-8 rounded-full bg-gray-50"
                  src="https://external-preview.redd.it/auth0-stable-support-for-app-router-v0-9hlmLSqkruo0AYwR-TJd50zI1txBKsK5e1Qputn2lGM.jpg?width=1080&crop=smart&auto=webp&s=f25c5459703d0f6d74df1a2bc49103c8629fd396"
                  alt=""
                  width={32}
                  height={32}
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Page Content */}
        <main className="flex-1">{children}</main>
      </div>
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
        theme="light"
        style={{ zIndex: 9999 }}
        className="toast-container"
      />
    </div>
    </RouteGuard>
  )
}

