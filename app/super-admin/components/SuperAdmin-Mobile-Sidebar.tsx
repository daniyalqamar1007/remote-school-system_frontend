"use client"

import { Menu, User } from "lucide-react"
import { useEffect, useState } from "react"
import Image from "next/image"

interface SuperAdminMobileSidebarProps {
  isSidebarOpen: boolean
  setIsSidebarOpen: (open: boolean) => void
}

interface UserProfile {
  firstName: string
  lastName: string
  email: string
  role: string
}

export default function SuperAdminMobileSidebar({ 
  isSidebarOpen, 
  setIsSidebarOpen 
}: SuperAdminMobileSidebarProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Try to fetch from API using the correct token key
        const token = localStorage.getItem('accessToken');
        if (token) {
          const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/auth/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
              'Content-Type': 'application/json'
            }
          })
          
          if (response.ok) {
            const profileData = await response.json()
            
            // Handle nested user object from API response
            const userData = profileData.user || profileData;
            
            const userProfile = {
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              email: userData.email || '',
              role: userData.role || ''
            };
            
            setUserProfile(userProfile);
            localStorage.setItem('userProfile', JSON.stringify(userProfile));
            return
          }
        }

        // Try to use cached profile if API fails or no token
        const cachedProfile = localStorage.getItem('userProfile');
        if (cachedProfile) {
          try {
            setUserProfile(JSON.parse(cachedProfile));
            return;
          } catch (e) {
            console.error('Failed to parse cached profile:', e);
          }
        }

        // Default fallback
        setUserProfile({
          firstName: '',
          lastName: '',
          email: '',
          role: ''
        })
      } catch (error) {
        console.error('Error fetching user profile:', error)
        // Try cached profile on error
        const cachedProfile = localStorage.getItem('userProfile');
        if (cachedProfile) {
          try {
            setUserProfile(JSON.parse(cachedProfile));
            return;
          } catch (e) {
            console.error('Failed to parse cached profile:', e);
          }
        }
        // Fallback
        setUserProfile({
          firstName: '',
          lastName: '',
          email: '',
          role: ''
        })
      }
    }

    fetchUserProfile()
  }, [])

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:hidden">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
        onClick={() => setIsSidebarOpen(true)}
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-gray-900/10 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex items-center gap-x-3">
          <Image src={'/Logo/srs.png'} alt='rss logo' height={32} width={32} className="h-8 w-8 rounded-full" />
          <span className="text-xl font-semibold text-gray-900">RSS Super Admin</span>
        </div>
        
        {/* User info on mobile */}
        <div className="flex items-center gap-x-2 ml-auto">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
            <User className="h-4 w-4 text-gray-600" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900">
              {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : 'Loading...'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
