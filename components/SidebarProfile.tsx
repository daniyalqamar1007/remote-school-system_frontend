import React, { useEffect, useState } from 'react'
import { LogOut } from 'lucide-react'
import Image from 'next/image'
import { handleLogout } from '@/lib/logout'
import { useRouter } from 'next/navigation'

interface UserProfile {
  firstName: string
  lastName: string
  email: string
  role: string
}

const SidebarProfile = ({title}:{title:string}) => {
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [authToken, setAuthToken] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken')
        const userId = localStorage.getItem('id')
        
        console.log('🔍 SidebarProfile Debug:', { token: !!token, userId, title });
        
        if (!token) {
          console.warn('⚠️ No auth token found in SidebarProfile');
          // Set fallback profile instead of clearing everything
          setUserProfile({
            firstName: 'User',
            lastName: '',
            email: 'Authentication required',
            role: title
          });
          return;
        }
        
        console.log('🔄 Fetching fresh profile for', title);
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Content-Type': 'application/json'
          }
        })
        
        console.log('📡 Profile response status:', response.status);
        
          if (response.ok) {
          const profileData = await response.json()
          console.log('✅ Fresh profile data:', profileData);
          
          // Handle both direct user object and nested user object
          const userData = profileData.user || profileData;
          
          const userProfile = {
            firstName: userData.firstName || 'User',
            lastName: userData.lastName || '',
            email: userData.email || '',
            role: userData.role || title
          };
          
          setUserProfile(userProfile);
          // Store fresh data in localStorage
          localStorage.setItem('userProfile', JSON.stringify(userProfile));
        } else {
          console.error('❌ Profile fetch failed:', response.status, response.statusText);
          
          // If authentication failed (401), clear localStorage and redirect to login
          if (response.status === 401) {
            console.warn('🔓 401 Unauthorized - Clearing localStorage and redirecting to login');
            
            // Clear all authentication-related localStorage items
            localStorage.removeItem('accessToken')
            localStorage.removeItem('token')
            localStorage.removeItem('authToken')
            localStorage.removeItem('refreshToken')
            localStorage.removeItem('userInfo')
            localStorage.removeItem('userProfile')
            localStorage.removeItem('role')
            localStorage.removeItem('id')
            localStorage.removeItem('userId')
            localStorage.removeItem('parentId')
            localStorage.removeItem('studentId')
            
            // Set a flag to indicate logout just happened (prevents redirect loops)
            sessionStorage.setItem('justLoggedOut', 'true')
            
            // Redirect to login page
            router.push('/login')
            return;
          }
          
          // For 403 or other errors, set fallback profile
          if (response.status === 403) {
            console.warn('🔓 403 Forbidden in SidebarProfile');
            setUserProfile({
              firstName: 'User',
              lastName: '',
              email: 'Session expired',
              role: title
            });
            return;
          }
          
          // For other errors, set fallback profile
          setUserProfile({
            firstName: 'User',
            lastName: '',
            email: 'Error loading profile',
            role: title
          });
        }
      } catch (error: any) {
        console.error('💥 Error fetching profile:', error)
        
        // Check if it's a 401 error from fetch
        if (error?.response?.status === 401 || (error?.message && error.message.includes('401'))) {
          console.warn('🔓 401 Unauthorized in catch block - Clearing localStorage and redirecting to login');
          
          // Clear all authentication-related localStorage items
          localStorage.removeItem('accessToken')
          localStorage.removeItem('token')
          localStorage.removeItem('authToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('userInfo')
          localStorage.removeItem('userProfile')
          localStorage.removeItem('role')
          localStorage.removeItem('id')
          localStorage.removeItem('userId')
          localStorage.removeItem('parentId')
          localStorage.removeItem('studentId')
          
          // Set a flag to indicate logout just happened (prevents redirect loops)
          sessionStorage.setItem('justLoggedOut', 'true')
          
          // Redirect to login page
          router.push('/login')
          return;
        }
        
        // Set fallback profile for other errors
        setUserProfile({
          firstName: 'User',
          lastName: '',
          email: 'Network error',
          role: title
        });
      }
    }

    // Check current auth token
    const currentToken = localStorage.getItem('authToken')
    setAuthToken(currentToken)
    
    // Only fetch if we have a token
    if (currentToken) {
      fetchUserProfile()
    } else {
      // Set fallback immediately if no token
      setUserProfile({
        firstName: 'User',
        lastName: '',
        email: 'Please log in',
        role: title
      });
    }
  }, [title, authToken])

  // Listen for localStorage changes to refresh profile when new user logs in
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authToken' || e.key === 'parentId' || e.key === 'role') {
        console.log('🔄 Auth data changed, refreshing profile...')
        const newToken = localStorage.getItem('authToken')
        setAuthToken(newToken)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const onLogout = () => {
    handleLogout()
  }

  return (
    <div className="border-t border-gray-200 pt-4">
      <div className="flex items-center gap-x-3 px-2 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
          <Image
            src="/Logo/srs.png"
            alt="Profile"
            width={24}
            height={24}
            className="h-6 w-6 rounded-full"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {userProfile ? `${userProfile.firstName} ${userProfile.lastName}`.trim() : 'Loading...'}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {userProfile?.email || ''}
          </p>
          <p className="text-xs text-gray-700 font-medium">
            {userProfile?.role || title}
          </p>
        </div>
      </div>
      <button
        onClick={onLogout}
        className="flex w-full items-center gap-x-3 rounded-md px-2 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-black transition-all duration-200"
      >
        <LogOut className="h-5 w-5" />
        Sign Out
      </button>
    </div>
  )
}

export default SidebarProfile