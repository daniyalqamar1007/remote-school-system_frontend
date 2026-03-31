"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { ToastContainer } from "react-toastify"
import SecretarySidebar from "./components/Secretary-Sidebar/SecretarySidebar"
import SecretaryMobileSidebar from "./components/Secretary-Mobile-Sidebar/SecretaryMobileSidebar"
import RouteGuard from "@/components/RouteGuard"
import ErrorBoundary from "@/components/ErrorBoundary"

export default function SecretaryLayout({ children }: { children: React.ReactNode }) {
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

  if (!isMounted) {
    return null
  }

  return (
    <ErrorBoundary>
      <RouteGuard requiredRole="SECRETARY">
        <div className="relative flex min-h-screen">
        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <SecretarySidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

        {/* Main Content */}
        <div className="flex w-full flex-1 flex-col lg:pl-72">
          {/* Top Navbar for Mobile */}
          <SecretaryMobileSidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

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
          />    </div>
      </div>
      </RouteGuard>
    </ErrorBoundary>
  )
}
