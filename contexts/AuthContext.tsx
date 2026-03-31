'use client';

// ⚠️ DISABLED: This AuthContext is currently disabled in favor of the unified login system
// The login page (app/login/page.tsx) handles authentication and password change popups
// to maintain compatibility with the existing unified schema and authentication flows.

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PasswordChangePopup from '@/components/PasswordChangePopup';

const getApiBaseUrl = () => {
  const raw = process.env.NEXT_PUBLIC_SRS_SERVER;
  if (!raw || raw === 'undefined' || raw === 'null') {
    return 'http://localhost:3014';
  }
  return raw;
};

interface User {
  id: string;
  email: string;
  role: string;
  schoolId?: string;
  profile?: any;
  mustChangePassword?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  isAuthenticated: boolean;
  showPasswordChangePopup: boolean;
  setShowPasswordChangePopup: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordChangePopup, setShowPasswordChangePopup] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuthStatus();
    
    // Set up automatic token refresh before expiration (refresh at 50 minutes when token expires at 60 minutes)
    const setupAutoRefresh = () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      
      // Parse JWT to get expiration time
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = payload.exp * 1000; // Convert to milliseconds
        const now = Date.now();
        const timeUntilExpiry = expirationTime - now;
        
        // Refresh token 10 minutes before expiration (at 50 minutes)
        const refreshTime = timeUntilExpiry - (10 * 60 * 1000);
        
        if (refreshTime > 0) {
          const timeoutId = setTimeout(async () => {
            const refreshed = await refreshToken();
            if (refreshed) {
              // Set up next refresh
              setupAutoRefresh();
            }
          }, refreshTime);
          
          return () => clearTimeout(timeoutId);
        } else {
          // Token expires soon, refresh immediately
          refreshToken();
        }
      } catch (error) {
        console.error('Error parsing token for auto-refresh:', error);
      }
    };
    
    const cleanup = setupAutoRefresh();
    return cleanup;
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const userInfo = localStorage.getItem('userInfo');

      if (token && userInfo) {
        // Verify token is still valid
        const response = await fetch(`${getApiBaseUrl()}/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          
          // Check if user needs to change password during auth check
          if (data.user.mustChangePassword === true) {
            setShowPasswordChangePopup(true);
            // Don't redirect to dashboard if they need to change password
            return;
          }
        } else {
          // Token might be expired, try to refresh
          const refreshed = await refreshToken();
          if (!refreshed) {
            logout();
          }
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Login failed');
    }

    const data = await response.json();
    
    localStorage.setItem('accessToken', data.access_token);
    localStorage.setItem('refreshToken', data.refresh_token);
    localStorage.setItem('userInfo', JSON.stringify(data.user));
    
    // Store user ID separately for easy access
    if (data.user.id) {
      localStorage.setItem('id', data.user.id);
      localStorage.setItem('userId', data.user.id);
    }
    
    setUser(data.user);

    // Check if user must change password - handle boolean or string values
    const needsPasswordChange = data.user.mustChangePassword === true || 
                               data.user.mustChangePassword === 'true' || 
                               data.user.mustChangePassword === 1;

    if (needsPasswordChange) {
      setShowPasswordChangePopup(true);
      return;
    }

    // Role-based routing
    redirectUserToPortal(data.user.role);
  };

  const redirectUserToPortal = (role: string) => {
    try {
      switch(role) {
        case 'SUPER_ADMIN':
          router.push('/super-admin/dashboard');
          break;
        case 'ADMIN':
          router.push('/admin/dashboard');
          break;
        case 'TEACHER':
          router.push('/teacher/dashboard');
          break;
        case 'STUDENT':
          router.push('/student/profile');
          break;
        case 'PARENT':
          router.push('/parent/dashboard');
          break;
        case 'NURSE':
          router.push('/nurse/dashboard');
          break;
        case 'SECRETARY':
          router.push('/secretary');
          break;
        default:
          console.warn('Unknown role:', role, 'redirecting to default dashboard');
          router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error during redirection:', error);
      router.push('/dashboard');
    }
  };

  const handlePasswordChangeComplete = (success: boolean) => {
    setShowPasswordChangePopup(false);
    if (success && user) {
      // Update user state to remove mustChangePassword flag
      const updatedUser = { ...user, mustChangePassword: false };
      setUser(updatedUser);
      
      // Update localStorage as well
      localStorage.setItem('userInfo', JSON.stringify(updatedUser));
      
      console.log('Password change complete, redirecting user with role:', user.role);
      // Redirect to appropriate portal
      redirectUserToPortal(user.role);
    }
  };

  const logout = async () => {
    try {
      const refreshTokenValue = localStorage.getItem('refreshToken');
      
      if (refreshTokenValue) {
        await fetch(`${getApiBaseUrl()}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: JSON.stringify({ refresh_token: refreshTokenValue }),
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear ALL local storage items
      localStorage.removeItem('accessToken');
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('userProfile');
      localStorage.removeItem('role');
      localStorage.removeItem('id');
      localStorage.removeItem('userId');
      localStorage.removeItem('parentId');
      localStorage.removeItem('studentId');
      
      // Set flag to prevent redirect loop
      sessionStorage.setItem('justLoggedOut', 'true');
      
      setUser(null);
      // Use window.location.href for hard redirect
      window.location.href = '/login';
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshTokenValue = localStorage.getItem('refreshToken');
      
      if (!refreshTokenValue) {
        return false;
      }

      const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshTokenValue }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      
      localStorage.setItem('accessToken', data.access_token);
      localStorage.setItem('refreshToken', data.refresh_token);
      localStorage.setItem('userInfo', JSON.stringify(data.user));
      
      setUser(data.user);
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    refreshToken,
    isAuthenticated: !!user,
    showPasswordChangePopup,
    setShowPasswordChangePopup,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {showPasswordChangePopup && user && (
        <PasswordChangePopup
          isOpen={showPasswordChangePopup}
          onClose={handlePasswordChangeComplete}
          userRole={user.role}
        />
      )}
    </AuthContext.Provider>
  );
}

// Fallback hook to provide user data from localStorage for components that still use useAuth
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const userInfo = localStorage.getItem('userInfo');
        
        if (token && userInfo) {
          // Parse stored user data
          const userData = JSON.parse(userInfo);
          
          // Store user ID in localStorage for easy access
          if (userData.id) {
            localStorage.setItem('id', userData.id);
            localStorage.setItem('userId', userData.id);
          }
          
          // If profile is missing, fetch it from the backend
          if (!userData.profile) {
            try {
              const response = await fetch(`${getApiBaseUrl()}/auth/profile`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });
              
              if (response.ok) {
                const profileData = await response.json();
                userData.profile = profileData.user.profile;
                
                // Update localStorage with profile data
                localStorage.setItem('userInfo', JSON.stringify(userData));
              }
            } catch (error) {
              console.error('Error fetching user profile:', error);
            }
          }
          
          setUser(userData);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Minimal interface to keep existing components working
  return {
    user,
    loading,
    isAuthenticated: !!user,
    // Disabled functions - components should not use these
    login: () => Promise.reject(new Error('Use login page instead')),
    logout: () => {
      // Clear ALL local storage items
      localStorage.removeItem('accessToken');
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('userProfile');
      localStorage.removeItem('role');
      localStorage.removeItem('id');
      localStorage.removeItem('userId');
      localStorage.removeItem('parentId');
      localStorage.removeItem('studentId');
      
      // Set flag to prevent redirect loop
      sessionStorage.setItem('justLoggedOut', 'true');
      
      window.location.href = '/login';
    },
    refreshToken: () => Promise.resolve(false),
    showPasswordChangePopup: false,
    setShowPasswordChangePopup: () => {},
  };
}
