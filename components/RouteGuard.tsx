'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface RouteGuardProps {
  children: React.ReactNode
  requiredRole?: string
  allowUnauthenticated?: boolean
}

// Role to dashboard path mapping
const ROLE_DASHBOARD_MAP: { [key: string]: string } = {
  'SUPER_ADMIN': '/super-admin/dashboard',
  'SUPERADMIN': '/super-admin/dashboard',
  'SuperAdmin': '/super-admin/dashboard',
  'ADMIN': '/admin/dashboard',
  'Admin': '/admin/dashboard',
  'TEACHER': '/teacher/dashboard',
  'Teacher': '/teacher/dashboard',
  'STUDENT': '/student/profile',
  'Student': '/student/profile',
  'PARENT': '/parent/dashboard',
  'Parent': '/parent/dashboard',
  'NURSE': '/nurse/dashboard',
  'Nurse': '/nurse/dashboard',
  'SECRETARY': '/secretary',
  'Secretary': '/secretary',
}

// Role to route prefix mapping
const ROLE_ROUTE_PREFIX: { [key: string]: string } = {
  'SUPER_ADMIN': '/super-admin',
  'SUPERADMIN': '/super-admin',
  'SuperAdmin': '/super-admin',
  'ADMIN': '/admin',
  'Admin': '/admin',
  'TEACHER': '/teacher',
  'Teacher': '/teacher',
  'STUDENT': '/student',
  'Student': '/student',
  'PARENT': '/parent',
  'Parent': '/parent',
  'NURSE': '/nurse',
  'Nurse': '/nurse',
  'SECRETARY': '/secretary',
  'Secretary': '/secretary',
}

export default function RouteGuard({ 
  children, 
  requiredRole,
  allowUnauthenticated = false 
}: RouteGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    const checkAuth = () => {
      try {
        // Get token and user info from localStorage
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
        const userInfoStr = localStorage.getItem('userInfo')
        const userRole = localStorage.getItem('role')

        // Parse user info if available
        let userInfo: any = null
        if (userInfoStr) {
          try {
            userInfo = JSON.parse(userInfoStr)
          } catch (e) {
            console.error('Error parsing userInfo:', e)
          }
        }

        // Get role from userInfo if not in localStorage
        const role = userRole || userInfo?.role || userInfo?.type || ''

        // Normalize role to uppercase for comparison
        // Handle SUPER_ADMIN variations
        let normalizedRole = role.toUpperCase()
        if (normalizedRole === 'SUPERADMIN' || normalizedRole === 'SUPER ADMIN') {
          normalizedRole = 'SUPER_ADMIN'
        }
        // Ensure SECRETARY role is properly recognized (already uppercase, but explicit check)
        // This ensures consistency with role mappings

        if (pathname === '/select-dashboard' && token) {
          setIsAuthorized(true)
          setIsChecking(false)
          return
        }

        if (pathname === '/login') {
          const justLoggedOut = sessionStorage.getItem('justLoggedOut')
          if (justLoggedOut === 'true') {
            sessionStorage.removeItem('justLoggedOut')
            setIsAuthorized(true)
            setIsChecking(false)
            return
          }
          if (token && role) {
            const rolesList = userInfo?.roles && Array.isArray(userInfo.roles) ? userInfo.roles : []
            if (rolesList.length > 1) {
              router.replace('/select-dashboard')
              setIsChecking(false)
              return
            }
            const dashboardPath = ROLE_DASHBOARD_MAP[normalizedRole] || ROLE_DASHBOARD_MAP[role] || ROLE_DASHBOARD_MAP[userInfo?.role] || '/dashboard'
            console.log('User already logged in, redirecting to:', dashboardPath)
            router.replace(dashboardPath)
            setIsChecking(false)
            return
          }
          setIsAuthorized(true)
          setIsChecking(false)
          return
        }

        // If route allows unauthenticated access
        if (allowUnauthenticated) {
          setIsAuthorized(true)
          setIsChecking(false)
          return
        }

        // Check if user is authenticated
        if (!token || !role) {
          console.log('No token or role found, redirecting to login')
          router.replace('/login')
          return
        }

        // If a specific role is required
        if (requiredRole) {
          const normalizedRequiredRole = requiredRole.toUpperCase()
          
          // Check if user has the required role
          if (normalizedRole !== normalizedRequiredRole) {
            console.log(`Role mismatch: user has ${normalizedRole}, required ${normalizedRequiredRole}`)
            
            // Redirect to user's own dashboard based on their role
            const userDashboard = ROLE_DASHBOARD_MAP[normalizedRole] || ROLE_DASHBOARD_MAP[role] || '/dashboard'
            router.replace(userDashboard)
            return
          }

          // Check if user is trying to access a route outside their role's prefix
          const userRoutePrefix = ROLE_ROUTE_PREFIX[normalizedRole] || ROLE_ROUTE_PREFIX[role]
          if (userRoutePrefix && !pathname.startsWith(userRoutePrefix)) {
            console.log(`User trying to access route outside their role prefix: ${pathname}`)
            const userDashboard = ROLE_DASHBOARD_MAP[normalizedRole] || ROLE_DASHBOARD_MAP[role] || '/dashboard'
            router.replace(userDashboard)
            return
          }
        } else {
          // No specific role required, but check if user is accessing wrong role's routes
          const userRoutePrefix = ROLE_ROUTE_PREFIX[normalizedRole] || ROLE_ROUTE_PREFIX[role]
          if (userRoutePrefix && !pathname.startsWith(userRoutePrefix) && pathname !== '/login') {
            // User is authenticated but trying to access another role's route
            console.log(`Authenticated user trying to access wrong role route: ${pathname}`)
            const userDashboard = ROLE_DASHBOARD_MAP[normalizedRole] || ROLE_DASHBOARD_MAP[role] || '/dashboard'
            router.replace(userDashboard)
            return
          }
        }

        // All checks passed
        setIsAuthorized(true)
        setIsChecking(false)
      } catch (error) {
        console.error('Error in RouteGuard:', error)
        if (pathname === '/login' || allowUnauthenticated) {
          setIsAuthorized(true)
          setIsChecking(false)
          return
        }
        setIsAuthorized(false)
        setIsChecking(false)
        router.replace('/login')
      }
    }

    checkAuth()

    // Listen for storage changes (when user logs in/out in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'accessToken' || e.key === 'token' || e.key === 'role' || e.key === 'userInfo') {
        console.log('Storage changed, rechecking auth...')
        checkAuth()
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [router, pathname, requiredRole, allowUnauthenticated])

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  // If not authorized, don't render children (redirect is happening)
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">Redirecting to the appropriate page...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

