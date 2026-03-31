// Global axios configuration with 401 auto-logout interceptor
import axios from 'axios'

// Track if we're currently refreshing to avoid multiple refresh attempts
let isRefreshing = false
let failedQueue: Array<{ resolve: (value?: any) => void; reject: (reason?: any) => void }> = []

// Helper function to attempt token refresh
const attemptTokenRefresh = async (): Promise<boolean> => {
  if (isRefreshing) {
    // Wait for ongoing refresh
    return new Promise((resolve) => {
      failedQueue.push({ resolve: () => resolve(true), reject: () => resolve(false) })
    })
  }

  isRefreshing = true
  const refreshTokenValue = localStorage.getItem('refreshToken')
  
  if (!refreshTokenValue) {
    isRefreshing = false
    return false
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshTokenValue }),
    })

    if (!response.ok) {
      isRefreshing = false
      failedQueue.forEach(({ reject }) => reject())
      failedQueue = []
      return false
    }

    const data = await response.json()
    
    localStorage.setItem('accessToken', data.access_token)
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('refreshToken', data.refresh_token)
    if (data.user) {
      localStorage.setItem('userInfo', JSON.stringify(data.user))
    }

    isRefreshing = false
    failedQueue.forEach(({ resolve }) => resolve())
    failedQueue = []
    return true
  } catch (error) {
    console.error('Token refresh failed:', error)
    isRefreshing = false
    failedQueue.forEach(({ reject }) => reject())
    failedQueue = []
    return false
  }
}

// Helper function to handle auto-logout on 401 Unauthorized
const handleUnauthorized = () => {
  // Clear all localStorage items
  localStorage.clear()
  
  // Also clear sessionStorage for good measure
  sessionStorage.clear()
  
  // Redirect to login page
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
}

// Configure axios response interceptor to handle 401 errors globally
// Excludes login/auth endpoints to prevent logout during login attempts
axios.interceptors.response.use(
  (response) => {
    // Skip 401 handling for authentication endpoints (login, MFA, password change, etc.)
    const url = response.config?.url || ''
    const isAuthEndpoint = url.includes('/auth/login') || 
                          url.includes('/auth/verify-mfa') || 
                          url.includes('/auth/resend-mfa') ||
                          url.includes('/auth/change-password') ||
                          url.includes('/auth/verify-otp')
    
    if (isAuthEndpoint) {
      return response
    }
    
    // Check response data for 401 status codes
    const data = response.data
    if (data && (data.status === 401 || data.statusCode === 401 || data.code === 401)) {
      handleUnauthorized()
      return Promise.reject(new Error('Session expired. Please login again.'))
    }
    return response
  },
  async (error) => {
    // Skip 401 handling for authentication endpoints (login, MFA, password change, etc.)
    const url = error.config?.url || ''
    const isAuthEndpoint = url.includes('/auth/login') || 
                          url.includes('/auth/verify-mfa') || 
                          url.includes('/auth/resend-mfa') ||
                          url.includes('/auth/change-password') ||
                          url.includes('/auth/verify-otp')
    
    if (isAuthEndpoint) {
      return Promise.reject(error)
    }
    
    // Check for 401 in HTTP status or error response
    const statusCode = 
      error.response?.status || 
      error.response?.data?.status || 
      error.response?.data?.statusCode || 
      error.response?.data?.code ||
      error.status ||
      error.statusCode ||
      error.code

    if (statusCode === 401) {
      // Try to refresh token before logging out
      const refreshed = await attemptTokenRefresh()
      if (refreshed) {
        // Retry the original request with new token
        const config = error.config
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
        if (token && config) {
          config.headers = config.headers || {}
          config.headers.Authorization = `Bearer ${token}`
          return axios(config)
        }
      } else {
        // Refresh failed, log out
        handleUnauthorized()
        return Promise.reject(new Error('Session expired. Please login again.'))
      }
    }
    
    return Promise.reject(error)
  }
)

// Export configured axios instance
export default axios

