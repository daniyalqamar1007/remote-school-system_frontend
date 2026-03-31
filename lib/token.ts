/**
 * Centralized Token Management
 * 
 * This module provides a single source of truth for token storage.
 * All components should use these functions instead of directly accessing localStorage.
 */

// Standard token key - use this everywhere
const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_INFO_KEY = 'userInfo';
const USER_ROLE_KEY = 'role';
const USER_ID_KEY = 'id';

/**
 * Get the authentication token
 * Falls back to legacy keys for backward compatibility
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Primary key
  let token = localStorage.getItem(TOKEN_KEY);
  
  // Fallback to legacy keys for backward compatibility
  if (!token) {
    token = localStorage.getItem('accessToken') || localStorage.getItem('authToken');
    
    // If found in legacy key, migrate to standard key
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
  }
  
  return token;
}

/**
 * Set the authentication token
 */
export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(TOKEN_KEY, token);
  
  // Also set legacy keys for backward compatibility during transition
  localStorage.setItem('accessToken', token);
  localStorage.setItem('authToken', token);
}

/**
 * Get the refresh token
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Set the refresh token
 */
export function setRefreshToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

/**
 * Get user info from storage
 */
export function getUserInfo(): any | null {
  if (typeof window === 'undefined') return null;
  
  const userInfo = localStorage.getItem(USER_INFO_KEY);
  if (userInfo) {
    try {
      return JSON.parse(userInfo);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Set user info in storage
 */
export function setUserInfo(user: any): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_INFO_KEY, JSON.stringify(user));
  
  // Also set individual fields for backward compatibility
  if (user.id) {
    localStorage.setItem(USER_ID_KEY, user.id);
    localStorage.setItem('userId', user.id);
  }
  if (user.role) {
    localStorage.setItem(USER_ROLE_KEY, user.role);
  }
  if (user.parentId) {
    localStorage.setItem('parentId', user.parentId);
  }
  if (user.studentId) {
    localStorage.setItem('studentId', user.studentId);
  }
}

/**
 * Get user role
 */
export function getUserRole(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(USER_ROLE_KEY);
}

/**
 * Set user role
 */
export function setUserRole(role: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_ROLE_KEY, role);
}

/**
 * Get user ID
 */
export function getUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(USER_ID_KEY) || localStorage.getItem('userId');
}

/**
 * Set user ID
 */
export function setUserId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_ID_KEY, id);
  localStorage.setItem('userId', id);
}

/**
 * Clear all authentication data
 */
export function clearAuthData(): void {
  if (typeof window === 'undefined') return;
  
  // Remove all auth-related items
  const keysToRemove = [
    TOKEN_KEY,
    REFRESH_TOKEN_KEY,
    USER_INFO_KEY,
    USER_ROLE_KEY,
    USER_ID_KEY,
    // Legacy keys
    'accessToken',
    'authToken',
    'userId',
    'userProfile',
    'parentId',
    'studentId',
  ];
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  // Also clear session storage
  sessionStorage.clear();
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const token = getToken();
  const role = getUserRole();
  return !!token && !!role;
}

/**
 * Get authorization headers for API calls
 */
export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
}

/**
 * Store full login response
 */
export function storeLoginData(data: {
  access_token?: string;
  token?: string;
  refresh_token?: string;
  user?: {
    id?: string;
    _id?: string;
    role?: string;
    parentId?: string;
    studentId?: string;
    [key: string]: any;
  };
}): void {
  const token = data.access_token || data.token;
  if (token) {
    setToken(token);
  }
  
  if (data.refresh_token) {
    setRefreshToken(data.refresh_token);
  }
  
  if (data.user) {
    setUserInfo(data.user);
    
    if (data.user.role) {
      setUserRole(data.user.role);
    }
    
    const userId = data.user.id || data.user._id;
    if (userId) {
      setUserId(userId);
    }
  }
}


