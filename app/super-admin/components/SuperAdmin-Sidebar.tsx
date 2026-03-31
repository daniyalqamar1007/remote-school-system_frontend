"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { X, User, LogOut, ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import Image from "next/image"

interface NavigationItem {
  name: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  submenu?: Array<{
    name: string
    href: string
  }>
}

interface SuperAdminSidebarProps {
  navigation: NavigationItem[]
  isSidebarOpen: boolean
  setIsSidebarOpen: (open: boolean) => void
}

interface UserProfile {
  firstName: string
  lastName: string
  email: string
  role: string
}

// Helper function to format role display (replace underscores with spaces)
const formatRole = (role: string | undefined): string => {
  if (!role) return ''
  return role.replace(/_/g, ' ')
}

export default function SuperAdminSidebar({ 
  navigation, 
  isSidebarOpen, 
  setIsSidebarOpen 
}: SuperAdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Auto-expand sports menu if on sports route
    if (pathname?.startsWith('/super-admin/sports')) {
      setExpandedMenus(prev => {
        const newSet = new Set(prev)
        // Find the sports menu item name from navigation
        const sportsMenuItem = navigation.find(item => 
          item.submenu?.some(sub => sub.href.startsWith('/super-admin/sports'))
        )
        if (sportsMenuItem) {
          newSet.add(sportsMenuItem.name)
        }
        return newSet
      })
    }
    // Auto-expand clubs menu if on clubs route
    if (pathname?.startsWith('/super-admin/clubs')) {
      setExpandedMenus(prev => {
        const newSet = new Set(prev)
        // Find the clubs menu item name from navigation
        const clubsMenuItem = navigation.find(item => 
          item.submenu?.some(sub => sub.href.startsWith('/super-admin/clubs'))
        )
        if (clubsMenuItem) {
          newSet.add(clubsMenuItem.name)
        }
        return newSet
      })
    }
  }, [pathname, navigation])

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Try to fetch from API using the correct token key
        const token = localStorage.getItem('accessToken');
        if (token) {
          console.log('🔄 Fetching fresh super admin profile...');
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
            console.log('✅ Super admin profile data received:', profileData);
            
            // Handle nested user object from API response
            const userData = profileData.user || profileData;
            
            const userProfile = {
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              email: userData.email || '',
              role: userData.role || ''
            };
            
            setUserProfile(userProfile);
            
            // Save to localStorage for future use
            localStorage.setItem('userProfile', JSON.stringify(userProfile));
            return
          } else {
            console.error('Failed to fetch profile:', response.status);
            
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
            
            // Try to use cached profile if API fails (for non-401 errors)
            const cachedProfile = localStorage.getItem('userProfile');
            if (cachedProfile) {
              try {
                setUserProfile(JSON.parse(cachedProfile));
                return;
              } catch (e) {
                console.error('Failed to parse cached profile:', e);
              }
            }
          }
        }

        // Try to use cached profile if no token
        const cachedProfile = localStorage.getItem('userProfile');
        if (cachedProfile) {
          try {
            setUserProfile(JSON.parse(cachedProfile));
            return;
          } catch (e) {
            console.error('Failed to parse cached profile:', e);
          }
        }

        // Default super admin profile if everything fails
        console.log('Using default super admin profile');
        setUserProfile({
          firstName: '',
          lastName: '',
          email: '',
          role: ''
        })
      } catch (error: any) {
        console.error('Error fetching user profile:', error)
        
        // Check if it's a 401 error
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
        
        // Try to use cached profile on error (for non-401 errors)
        const cachedProfile = localStorage.getItem('userProfile');
        if (cachedProfile) {
          try {
            setUserProfile(JSON.parse(cachedProfile));
            return;
          } catch (e) {
            console.error('Failed to parse cached profile:', e);
          }
        }
        // Fallback to default
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

  const handleLogout = () => {
    // Clear ALL localStorage items related to authentication
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
    
    // Use window.location.href for a hard redirect (clears React state)
    window.location.href = '/login'
  }

  const toggleSubmenu = (menuName: string) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev)
      if (newSet.has(menuName)) {
        newSet.delete(menuName)
      } else {
        newSet.add(menuName)
      }
      return newSet
    })
  }

  const isSubmenuActive = (submenu: Array<{ name: string; href: string }>) => {
    return submenu.some(item => pathname === item.href)
  }

  const isMenuActive = (item: NavigationItem) => {
    if (item.href) {
      return pathname === item.href
    }
    if (item.submenu) {
      return isSubmenuActive(item.submenu)
    }
    return false
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r bg-white px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <Image
              src="/Logo/srs.png"
              alt="SRS Super Admin Logo"
              width={44}
              height={32}
              className="h-12 w-12 rounded-full"
            />
            <span className="ml-2 text-xl font-bold text-gray-900">SRS Super Admin</span>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      {item.submenu ? (
                        <div>
                          <button
                            onClick={() => toggleSubmenu(item.name)}
                            className={cn(
                              isMenuActive(item)
                                ? 'bg-gray-50 text-black'
                                : 'text-gray-700 hover:text-black hover:bg-gray-50',
                              'group flex w-full items-center justify-between rounded-md p-2 text-sm leading-6 font-semibold transition-all duration-200'
                            )}
                          >
                            <div className="flex items-center gap-x-3">
                              <item.icon
                                className={cn(
                                  isMenuActive(item) ? 'text-black' : 'text-gray-400 group-hover:text-black',
                                  'h-6 w-6 shrink-0'
                                )}
                                aria-hidden="true"
                              />
                              {item.name}
                            </div>
                            {expandedMenus.has(item.name) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                          {expandedMenus.has(item.name) && (
                            <ul className="ml-6 mt-1 space-y-1">
                              {item.submenu.map((subItem) => (
                                <li key={subItem.name}>
                                  <Link
                                    href={subItem.href}
                                    className={cn(
                                      pathname === subItem.href
                                        ? 'bg-gray-100 text-black font-medium'
                                        : 'text-gray-600 hover:text-black hover:bg-gray-50',
                                      'block rounded-md px-3 py-2 text-sm leading-6 transition-all duration-200'
                                    )}
                                  >
                                    {subItem.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ) : (
                        <Link
                          href={item.href!}
                          className={cn(
                            pathname === item.href
                              ? 'bg-gray-50 text-black'
                              : 'text-gray-700 hover:text-black hover:bg-gray-50',
                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-all duration-200'
                          )}
                        >
                          <item.icon
                            className={cn(
                              pathname === item.href ? 'text-black' : 'text-gray-400 group-hover:text-black',
                              'h-6 w-6 shrink-0'
                            )}
                            aria-hidden="true"
                          />
                          {item.name}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
          
          {/* User Info */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center gap-x-3 px-2 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                <User className="h-5 w-5 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : 'Loading...'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {userProfile?.email || ''}
                </p>
                <p className="text-xs text-gray-700 font-medium uppercase">
                  {formatRole(userProfile?.role)}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-x-3 rounded-md px-2 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-black transition-all duration-200"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className={cn(
        "fixed inset-y-0 z-50 flex w-72 flex-col transition-transform lg:hidden",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r bg-white px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center justify-between">
            <div className="flex items-center">
              <Image
                src="/Logo/srs.png"
                alt="SRS Super Admin Logo"
                width={44}
                height={32}
                className="h-12 w-12 rounded-full"
              />
              <span className="ml-2 text-xl font-bold text-gray-900">SRS Super Admin</span>
            </div>
            <button
              type="button"
              className="rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500"
              onClick={() => setIsSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      {item.submenu ? (
                        <div>
                          <button
                            onClick={() => toggleSubmenu(item.name)}
                            className={cn(
                              isMenuActive(item)
                                ? 'bg-gray-50 text-black'
                                : 'text-gray-700 hover:text-black hover:bg-gray-50',
                              'group flex w-full items-center justify-between rounded-md p-2 text-sm leading-6 font-semibold transition-all duration-200'
                            )}
                          >
                            <div className="flex items-center gap-x-3">
                              <item.icon
                                className={cn(
                                  isMenuActive(item) ? 'text-black' : 'text-gray-400 group-hover:text-black',
                                  'h-6 w-6 shrink-0'
                                )}
                                aria-hidden="true"
                              />
                              {item.name}
                            </div>
                            {expandedMenus.has(item.name) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                          {expandedMenus.has(item.name) && (
                            <ul className="ml-6 mt-1 space-y-1">
                              {item.submenu.map((subItem) => (
                                <li key={subItem.name}>
                                  <Link
                                    href={subItem.href}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={cn(
                                      pathname === subItem.href
                                        ? 'bg-gray-100 text-black font-medium'
                                        : 'text-gray-600 hover:text-black hover:bg-gray-50',
                                      'block rounded-md px-3 py-2 text-sm leading-6 transition-all duration-200'
                                    )}
                                  >
                                    {subItem.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ) : (
                        <Link
                          href={item.href!}
                          className={cn(
                            pathname === item.href
                              ? 'bg-gray-50 text-black'
                              : 'text-gray-700 hover:text-black hover:bg-gray-50',
                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-all duration-200'
                          )}
                          onClick={() => setIsSidebarOpen(false)}
                        >
                          <item.icon
                            className={cn(
                              pathname === item.href ? 'text-black' : 'text-gray-400 group-hover:text-black',
                              'h-6 w-6 shrink-0'
                            )}
                            aria-hidden="true"
                          />
                          {item.name}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
          
          {/* User Profile Section */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center gap-x-3 px-2 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                <User className="h-5 w-5 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : 'Loading...'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {userProfile?.email || ''}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-x-3 rounded-md px-2 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-black transition-all duration-200"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
