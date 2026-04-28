'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  AlertCircle, 
  Home, 
  ArrowLeft,
  Search,
  HelpCircle
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function NotFound() {
  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 py-4 overflow-hidden">
      <div className="max-w-2xl w-full h-full flex items-center justify-center">
        <Card className="border-gray-200 shadow-xl w-full max-h-[95vh] overflow-y-auto">
          <CardContent className="p-4 sm:p-6 md:p-8 text-center">
            {/* Logo */}
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100">
                <Image
                  src="/Logo/srs.png"
                  alt="RSS Logo"
                  width={40}
                  height={40}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                />
              </div>
            </div>

            {/* 404 Icon */}
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-red-100 rounded-full blur-xl opacity-50"></div>
                <div className="relative bg-red-50 rounded-full p-3 sm:p-4">
                  <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-red-600" />
                </div>
              </div>
            </div>

            {/* Error Code */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-gray-900 mb-2 sm:mb-3">
              404
            </h1>

            {/* Error Message */}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
              Page Not Found
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 max-w-md mx-auto px-2">
              The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </p>

            {/* Helpful Links */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center mb-4 sm:mb-6">
              <Link href="/" className="w-full sm:w-auto">
                <Button className="bg-black hover:bg-gray-800 text-white w-full sm:w-auto text-sm sm:text-base">
                  <Home className="mr-2 h-4 w-4" />
                  Go to Home
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto text-sm sm:text-base">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
              </Link>
            </div>

            {/* Quick Links */}
            <div className="border-t border-gray-200 pt-4 sm:pt-6 mt-4 sm:mt-6">
              <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">Quick Links:</p>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm">
                <Link 
                  href="/admin/dashboard" 
                  className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 px-2 py-1"
                >
                  <Search className="h-3 w-3" />
                  <span className="whitespace-nowrap">Admin Dashboard</span>
                </Link>
                <Link 
                  href="/teacher/dashboard" 
                  className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 px-2 py-1"
                >
                  <Search className="h-3 w-3" />
                  <span className="whitespace-nowrap">Teacher Portal</span>
                </Link>
                <Link 
                  href="/student/profile" 
                  className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 px-2 py-1"
                >
                  <Search className="h-3 w-3" />
                  <span className="whitespace-nowrap">Student Portal</span>
                </Link>
                <Link 
                  href="/parent/dashboard" 
                  className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 px-2 py-1"
                >
                  <Search className="h-3 w-3" />
                  <span className="whitespace-nowrap">Parent Portal</span>
                </Link>
              </div>
            </div>

            {/* Help Text */}
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center gap-2 text-gray-500 text-xs sm:text-sm px-2">
                <HelpCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="break-words">If you believe this is an error, please contact your system administrator</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

