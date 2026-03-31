// components/AuthGuard.tsx
"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getToken, getUserRole, clearAuthData, isAuthenticated as checkIsAuthenticated } from '@/lib/token'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole: string
  redirectTo?: string
}

export default function AuthGuard({ 
  children, 
  requiredRole, 
  redirectTo = '/login' 
}: AuthGuardProps) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuthentication = () => {
      const token = getToken()
      const userRole = getUserRole()
      
      // Basic validation - need both token and role
      if (!token || !userRole) {
        // Clear partial auth data using centralized function
        clearAuthData()
        
        setIsAuthenticated(false)
        setIsLoading(false)
        router.push(redirectTo)
        return
      }
      
      // Check if user has the required role (case insensitive)
      const normalizedUserRole = userRole.toUpperCase()
      const normalizedRequiredRole = requiredRole.toUpperCase()
      
      if (normalizedUserRole !== normalizedRequiredRole) {
        // Don't clear data for role mismatch, just redirect
        setIsAuthenticated(false)
        setIsLoading(false)
        router.push(redirectTo)
        return
      }
      
      setIsAuthenticated(true)
      setIsLoading(false)
    }

    // Check immediately (no delay like parent portal)
    checkAuthentication()

    // Listen for storage changes (when user logs in/out in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'role') {
        checkAuthentication()
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // Check every 2 minutes
    const interval = setInterval(checkAuthentication, 120000)

    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [router, requiredRole, redirectTo])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">Please log in with the correct credentials to access this portal.</p>
          <button 
            onClick={() => router.push(redirectTo)} 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
