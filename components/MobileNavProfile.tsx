import React, { useEffect, useState } from 'react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
import { Button } from './ui/button'
import Image from 'next/image'
import { LogOut } from 'lucide-react'
import { handleLogout } from '@/lib/logout'

interface UserProfile {
  firstName: string
  lastName: string
  email: string
  role: string
}

const MobileNavProfile = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('authToken')
        
        if (!token) {
          console.warn('⚠️ No auth token found');
          setUserProfile({
            firstName: 'User',
            lastName: '',
            email: 'Please log in',
            role: 'User'
          });
          return;
        }
        
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
          
          const userProfile = {
            firstName: profileData.firstName || 'User',
            lastName: profileData.lastName || '',
            email: profileData.email || '',
            role: profileData.role || 'User'
          };
          
          setUserProfile(userProfile);
          localStorage.setItem('userProfile', JSON.stringify(userProfile));
        } else {
          if (response.status === 401 || response.status === 403) {
            // Authentication failed, clear auth data
            localStorage.removeItem('authToken');
            localStorage.removeItem('userProfile');
            window.location.href = '/login';
            return;
          }
          
          setUserProfile({
            firstName: 'User',
            lastName: '',
            email: 'Error loading profile',
            role: 'User'
          });
        }
      } catch (error) {
        console.error('💥 Error fetching profile:', error)
        setUserProfile({
          firstName: 'User',
          lastName: '',
          email: 'Error loading profile',
          role: 'User'
        });
      }
    }

    fetchUserProfile()
  }, [])

  return (
    <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" className="-m-2.5 p-2.5 text-gray-700">
        <span className="sr-only">Open user menu</span>
        <div className="flex items-center gap-2">
          <Image
            className="h-8 w-8 rounded-full bg-gray-50"
            src="/Logo/srs.png"
            alt=""
            width={32}
            height={32}
          />
          <div className="hidden sm:block text-left">
            <div className="text-sm font-medium text-gray-900">
              {userProfile ? `${userProfile.firstName} ${userProfile.lastName}`.trim() : 'Loading...'}
            </div>
          </div>
        </div>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>
        <div>
          <div className="font-medium">{userProfile ? `${userProfile.firstName} ${userProfile.lastName}`.trim() : 'Loading...'}</div>
          <div className="text-sm text-gray-500">{userProfile?.email || 'Loading...'}</div>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
        <LogOut className="mr-2 h-4 w-4" />
        Log out
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
  )
}

export default MobileNavProfile