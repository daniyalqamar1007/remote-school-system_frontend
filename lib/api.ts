// API utility functions for backend integration
import { getToken, clearAuthData, getAuthHeaders as getTokenAuthHeaders } from './token'

const API_BASE_URL = process.env.NEXT_PUBLIC_SRS_SERVER || 'http://localhost:3014'

// Helper function to get auth headers - uses centralized token module
const getAuthHeaders = () => {
  return getTokenAuthHeaders()
}

// Track if we're currently refreshing to avoid multiple refresh attempts
let isRefreshing = false

// Helper function to attempt token refresh
const attemptTokenRefresh = async (): Promise<boolean> => {
  if (isRefreshing) {
    // Wait a bit for ongoing refresh
    await new Promise(resolve => setTimeout(resolve, 500))
    return !!localStorage.getItem('accessToken')
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
    return true
  } catch (error) {
    console.error('Token refresh failed:', error)
    isRefreshing = false
    return false
  }
}

// Helper function to handle auto-logout on 401 Unauthorized
const handleUnauthorized = () => {
  // Clear all auth data using centralized function
  clearAuthData()
  
  // Redirect to login page
  // Use window.location.href for a full page reload to ensure clean state
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
}

// Global fetch wrapper to handle 401 errors for direct fetch calls
// This wraps the native fetch to automatically handle 401 errors
// Excludes login/auth endpoints to prevent logout during login attempts
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch
  
  window.fetch = async function(...args: Parameters<typeof fetch>): Promise<Response> {
    // Extract URL from various input types
    let url = ''
    if (typeof args[0] === 'string') {
      url = args[0]
    } else if (args[0] instanceof URL) {
      url = args[0].href
    } else if (args[0] instanceof Request) {
      url = args[0].url
    }
    
    const isAuthEndpoint = url.includes('/auth/login') || 
                          url.includes('/auth/verify-mfa') || 
                          url.includes('/auth/resend-mfa') ||
                          url.includes('/auth/change-password') ||
                          url.includes('/auth/verify-otp')
    
    const response = await originalFetch(...args)
    
    // Skip 401 handling for authentication endpoints (login, MFA, password change, OTP, etc.)
    if (isAuthEndpoint) {
      return response
    }
    
    // Check for 401 in HTTP status (most common case)
    if (response.status === 401) {
      // Try to refresh token before logging out
      const refreshed = await attemptTokenRefresh()
      if (refreshed) {
        // Retry the original request with new token
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
        if (token) {
          const newHeaders = new Headers(args[1]?.headers || {})
          newHeaders.set('Authorization', `Bearer ${token}`)
          const newArgs = [
            args[0],
            { ...args[1], headers: newHeaders }
          ] as Parameters<typeof fetch>
          return originalFetch(...newArgs)
        }
      } else {
        handleUnauthorized()
        return response
      }
    }
    
    // Also check response body for 401 status codes (for APIs that return 200 with 401 in body)
    // Only check if response is not already consumed
    if (response.ok || response.status >= 400) {
      try {
        // Clone response to avoid consuming the original stream
        const clonedResponse = response.clone()
        const data = await clonedResponse.json().catch(() => null)
        
        if (data) {
          const statusCode = data.status || data.statusCode || data.code
          if (statusCode === 401) {
            // Try to refresh token before logging out
            const refreshed = await attemptTokenRefresh()
            if (!refreshed) {
              handleUnauthorized()
            }
            return response
          }
        }
      } catch (e) {
        // If response is not JSON or can't be cloned, ignore
        // The HTTP status check above will handle most cases
      }
    }
    
    return response
  }
}

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }))
    
    // Check for 401 Unauthorized - check both HTTP status and error body
    const statusCode = response.status || error.status || error.statusCode || error.code
    
    if (statusCode === 401) {
      // Try to refresh token before logging out
      const refreshed = await attemptTokenRefresh()
      if (refreshed) {
        // Retry the request with new token
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
        if (token) {
          const retryResponse = await fetch(response.url, {
            ...response,
            headers: {
              ...response.headers,
              'Authorization': `Bearer ${token}`
            }
          })
          return handleResponse(retryResponse)
        }
      } else {
        // Auto-logout on 401 Unauthorized after refresh failed
        handleUnauthorized()
        // Throw error but don't show toast (user is being logged out)
        throw new Error('Session expired. Please login again.')
      }
    }
    
    // Handle custom response format: { success: false, message: string, statusCode: number, data: null }
    if (error.message || error.data === null) {
      throw new Error(error.message || `HTTP error! status: ${response.status}`)
    }
    throw new Error(error.message || `HTTP error! status: ${response.status}`)
  }
  const data = await response.json()
  
  // Also check successful responses for 401 status in the body (some APIs return 200 with 401 in body)
  if (data && (data.status === 401 || data.statusCode === 401 || data.code === 401)) {
    // Try to refresh token before logging out
    const refreshed = await attemptTokenRefresh()
    if (!refreshed) {
      handleUnauthorized()
      throw new Error('Session expired. Please login again.')
    }
    // If refresh succeeded, the token is updated and user can continue
  }
  
  // Handle custom response format: { success: true, statusCode: number, message: string, data: any }
  // Return data if response has data field, otherwise return the whole response
  if (data.success !== undefined && data.data !== undefined) {
    return data.data || data
  }
  return data
}

// ==================== EMAIL TEMPLATES ====================
export const emailTemplatesApi = {
  getAll: async (page = 1, limit = 10, filters = {}) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    })
    const response = await fetch(`${API_BASE_URL}/super-admin/email-templates?${params}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  create: async (templateData: any) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/email-templates`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(templateData),
    })
    return handleResponse(response)
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/email-templates/${id}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  update: async (id: string, templateData: any) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/email-templates/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(templateData),
    })
    return handleResponse(response)
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/email-templates/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  preview: async (id: string, previewData: any) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/email-templates/${id}/preview`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(previewData),
    })
    return handleResponse(response)
  }
}

// ==================== SCHEDULED JOBS ====================
export const scheduledJobsApi = {
  getAll: async (page = 1, limit = 10, filters: Record<string, string | number | boolean | undefined> = {}) => {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', String(limit))
    Object.entries(filters).forEach(([k, v]) => {
      if (v != null && v !== '') params.set(k, String(v))
    })
    const response = await fetch(`${API_BASE_URL}/super-admin/scheduled-jobs?${params}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  create: async (jobData: any) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/scheduled-jobs`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(jobData),
    })
    return handleResponse(response)
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/scheduled-jobs/${id}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  update: async (id: string, jobData: any) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/scheduled-jobs/${id}`, {
      method: 'PUT',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(jobData),
    })
    return handleResponse(response)
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/scheduled-jobs/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  run: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/scheduled-jobs/${id}/run`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  toggle: async (id: string, enabled: boolean) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/scheduled-jobs/${id}/toggle`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    })
    return handleResponse(response)
  }
}

// ==================== ROLLOVER MANAGEMENT ====================
export const rolloverApi = {
  getConfigs: async (filters = {}) => {
    const params = new URLSearchParams(filters)
    const response = await fetch(`${API_BASE_URL}/super-admin/rollover-configs?${params}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  create: async (configData: any) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/rollover-configs`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(configData),
    })
    return handleResponse(response)
  },

  update: async (id: string, configData: any) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/rollover-configs/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(configData),
    })
    return handleResponse(response)
  },

  execute: async (id: string, options: any) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/rollover-configs/${id}/execute`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(options),
    })
    return handleResponse(response)
  },

  preview: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/rollover-configs/${id}/preview`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  }
}

// ==================== CUSTOM REPORTS ====================
export const customReportsApi = {
  getAll: async (page = 1, limit = 10, filters = {}) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    })
    const response = await fetch(`${API_BASE_URL}/super-admin/custom-reports?${params}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  create: async (reportData: any) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/custom-reports`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(reportData),
    })
    return handleResponse(response)
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/custom-reports/${id}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  update: async (id: string, reportData: any) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/custom-reports/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(reportData),
    })
    return handleResponse(response)
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/custom-reports/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  preview: async (reportConfig: any) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/custom-reports/preview`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(reportConfig),
    })
    return handleResponse(response)
  },

  run: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/custom-reports/${id}/run`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })
    return response.blob() // For Excel file download
  },

  getDataSources: async () => {
    const response = await fetch(`${API_BASE_URL}/super-admin/custom-reports/data-sources`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  }
}

// ==================== SYSTEM ALERTS ====================
export const systemAlertsApi = {
  getAll: async (page = 1, limit = 10, filters: Record<string, string | undefined> = {}) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })
    Object.entries(filters).forEach(([k, v]) => { if (v != null && v !== '') params.set(k, v) })
    const response = await fetch(`${API_BASE_URL}/super-admin/system-alerts?${params}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  acknowledge: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/system-alerts/${id}/acknowledge`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  resolve: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/system-alerts/${id}/resolve`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  ignore: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/system-alerts/${id}/ignore`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  // Alert Rules
  getRules: async () => {
    const response = await fetch(`${API_BASE_URL}/super-admin/alert-rules`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  createRule: async (ruleData: any) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/alert-rules`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(ruleData),
    })
    return handleResponse(response)
  },

  updateRule: async (id: string, ruleData: any) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/alert-rules/${id}`, {
      method: 'PUT',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(ruleData),
    })
    return handleResponse(response)
  },

  deleteRule: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/alert-rules/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  toggleRule: async (id: string, enabled: boolean) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/alert-rules/${id}/toggle`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    })
    return handleResponse(response)
  },

  // Notification Templates
  getTemplates: async () => {
    const response = await fetch(`${API_BASE_URL}/super-admin/notification-templates`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  createTemplate: async (templateData: { name: string; type: string; subject?: string; body: string; variables?: string[] }) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/notification-templates`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(templateData),
    })
    return handleResponse(response)
  },

  updateTemplate: async (id: string, templateData: { name: string; type: string; subject?: string; body: string; variables?: string[] }) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/notification-templates/${id}`, {
      method: 'PUT',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(templateData),
    })
    return handleResponse(response)
  },

  deleteTemplate: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/notification-templates/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  }
}

// ==================== ACCESS CONTROL ====================
export const accessControlApi = {
  getAll: async (params?: { page?: number; limit?: number; type?: string; isActive?: boolean }) => {
    const searchParams = new URLSearchParams()
    if (params?.page != null) searchParams.set('page', String(params.page))
    if (params?.limit != null) searchParams.set('limit', String(params.limit))
    if (params?.type) searchParams.set('type', params.type)
    if (params?.isActive !== undefined) searchParams.set('isActive', String(params.isActive))
    const response = await fetch(`${API_BASE_URL}/super-admin/access-control?${searchParams}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },
  create: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/access-control`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse(response)
  },
  update: async (id: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/access-control/${id}`, {
      method: 'PUT',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse(response)
  },
  delete: async (id: string, deletedBy: string) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/access-control/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ deletedBy }),
    })
    return handleResponse(response)
  },
}

// ==================== SESSION MANAGEMENT ====================
export const sessionManagementApi = {
  getSessions: async (params: { page?: number; limit?: number; status?: string; userRole?: string; search?: string; suspicious?: boolean }) => {
    const searchParams = new URLSearchParams()
    if (params.page != null) searchParams.set('page', String(params.page))
    if (params.limit != null) searchParams.set('limit', String(params.limit))
    if (params.status && params.status !== 'all') searchParams.set('status', params.status)
    if (params.userRole && params.userRole !== 'all') searchParams.set('userRole', params.userRole)
    if (params.search) searchParams.set('search', params.search)
    if (params.suspicious) searchParams.set('suspicious', 'true')
    const response = await fetch(`${API_BASE_URL}/super-admin/user-sessions?${searchParams}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },
  getAnalytics: async (timeframe?: string) => {
    const url = timeframe
      ? `${API_BASE_URL}/super-admin/user-sessions/analytics?timeframe=${encodeURIComponent(timeframe)}`
      : `${API_BASE_URL}/super-admin/user-sessions/analytics`
    const response = await fetch(url, { headers: getAuthHeaders() })
    return handleResponse(response)
  },
  terminateSession: async (sessionId: string, terminatedBy: string) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/user-sessions/${encodeURIComponent(sessionId)}/terminate`, {
      method: 'PUT',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ terminatedBy }),
    })
    return handleResponse(response)
  },
  terminateAllUserSessions: async (userId: string, terminatedBy: string) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/user-sessions/user/${encodeURIComponent(userId)}/terminate-all`, {
      method: 'PUT',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ terminatedBy }),
    })
    return handleResponse(response)
  },
}

// ==================== CERTIFICATE MANAGEMENT ====================
export const certificatesApi = {
  getAll: async (page = 1, limit = 10, filters = {}) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    })
    const response = await fetch(`${API_BASE_URL}/super-admin/certificates?${params}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  create: async (certificateData: any) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/certificates`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(certificateData),
    })
    return handleResponse(response)
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/certificates/${id}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  update: async (id: string, certificateData: any) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/certificates/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(certificateData),
    })
    return handleResponse(response)
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/certificates/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  revoke: async (id: string, reason: string) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/certificates/${id}/revoke`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    })
    return handleResponse(response)
  },

  renew: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/certificates/${id}/renew`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  download: async (id: string, format: string) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/certificates/${id}/download?format=${format}`, {
      headers: getAuthHeaders(),
    })
    return response.blob()
  },

  generateCSR: async (csrData: any) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/certificates/generate-csr`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(csrData),
    })
    return handleResponse(response)
  },

  getRequests: async () => {
    const response = await fetch(`${API_BASE_URL}/super-admin/certificate-requests`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  approveRequest: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/certificate-requests/${id}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  rejectRequest: async (id: string, reason: string) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/certificate-requests/${id}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    })
    return handleResponse(response)
  },

  getTrustedCAs: async () => {
    const response = await fetch(`${API_BASE_URL}/super-admin/trusted-cas`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  }
}

// ==================== INTEGRATION MANAGEMENT ====================
export const integrationsApi = {
  getAll: async (page = 1, limit = 10, filters = {}) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    })
    const response = await fetch(`${API_BASE_URL}/super-admin/integrations?${params}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  create: async (integrationData: any) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/integrations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(integrationData),
    })
    return handleResponse(response)
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/integrations/${id}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  update: async (id: string, integrationData: any) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/integrations/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(integrationData),
    })
    return handleResponse(response)
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/integrations/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  test: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/integrations/${id}/test`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  sync: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/integrations/${id}/sync`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  toggle: async (id: string, active: boolean) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/integrations/${id}/toggle`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ active }),
    })
    return handleResponse(response)
  },

  getLogs: async (page = 1, limit = 10, filters = {}) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    })
    const response = await fetch(`${API_BASE_URL}/super-admin/integration-logs?${params}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  }
}

// ==================== SPORTS MANAGEMENT ====================
export const sportsApi = {
  // Sports Programs
  programs: {
    getAll: async (filters = {}) => {
      const params = new URLSearchParams(filters)
      const response = await fetch(`${API_BASE_URL}/sports/programs?${params}`, {
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },

    create: async (programData: any) => {
      const response = await fetch(`${API_BASE_URL}/sports/programs`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(programData),
      })
      return handleResponse(response)
    },

    getById: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/sports/programs/${id}`, {
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },

    update: async (id: string, programData: any) => {
      const response = await fetch(`${API_BASE_URL}/sports/programs/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(programData),
      })
      return handleResponse(response)
    },

    delete: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/sports/programs/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      return response.ok
    },

    getMyCoachPrograms: async () => {
      const response = await fetch(`${API_BASE_URL}/sports/programs/my-coach-programs`, {
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    }
  },

  // Student Assignments
  assignments: {
    getAll: async (filters = {}) => {
      const params = new URLSearchParams(filters)
      const response = await fetch(`${API_BASE_URL}/sports/assignments?${params}`, {
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },

    create: async (assignmentData: any) => {
      const response = await fetch(`${API_BASE_URL}/sports/assignments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(assignmentData),
      })
      return handleResponse(response)
    },

    update: async (id: string, updateData: any) => {
      const response = await fetch(`${API_BASE_URL}/sports/assignments/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updateData),
      })
      return handleResponse(response)
    },

    remove: async (id: string, withdrawalData: any) => {
      const response = await fetch(`${API_BASE_URL}/sports/assignments/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify(withdrawalData),
      })
      return handleResponse(response)
    },

    getById: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/sports/assignments/${id}`, {
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },

    getByProgram: async (programId: string) => {
      const response = await fetch(`${API_BASE_URL}/sports/assignments/program/${programId}`, {
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    }
  },

  // Eligibility & Medical
  eligibility: {
    check: async (studentId: string, sportsProgramId: string) => {
      const response = await fetch(`${API_BASE_URL}/sports/eligibility/${studentId}/${sportsProgramId}`, {
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },

    updateMedical: async (assignmentId: string, medicalData: any) => {
      const response = await fetch(`${API_BASE_URL}/sports/assignments/${assignmentId}/medical`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(medicalData),
      })
      return handleResponse(response)
    },

    refreshClearance: async (assignmentId: string) => {
      const response = await fetch(`${API_BASE_URL}/sports/assignments/${assignmentId}/medical/refresh`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    }
  },

  // Schedule Management
  schedule: {
    getAll: async (filters = {}) => {
      const params = new URLSearchParams(filters)
      const response = await fetch(`${API_BASE_URL}/sports/schedules?${params}`, {
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },

    getById: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/sports/schedules/${id}`, {
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },

    create: async (scheduleData: any) => {
      const response = await fetch(`${API_BASE_URL}/sports/schedules`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(scheduleData),
      })
      return handleResponse(response)
    },

    update: async (id: string, updateData: any) => {
      const response = await fetch(`${API_BASE_URL}/sports/schedules/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updateData),
      })
      return handleResponse(response)
    },

    delete: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/sports/schedules/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },

    getByDate: async (date: string) => {
      const response = await fetch(`${API_BASE_URL}/sports/schedules/by-date?date=${encodeURIComponent(date)}`, {
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },

    getByProgram: async (programId: string) => {
      const response = await fetch(`${API_BASE_URL}/sports/schedules/program/${programId}`, {
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    }
  },

  // Attendance Management
  attendance: {
    getAll: async (filters = {}) => {
      const params = new URLSearchParams(filters)
      const response = await fetch(`${API_BASE_URL}/sports/attendance?${params}`, {
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },

    getById: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/sports/attendance/${id}`, {
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },

    record: async (attendanceData: any) => {
      const response = await fetch(`${API_BASE_URL}/sports/attendance`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(attendanceData),
      })
      return handleResponse(response)
    },

    update: async (id: string, updateData: any) => {
      const response = await fetch(`${API_BASE_URL}/sports/attendance/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updateData),
      })
      return handleResponse(response)
    },

    getPending: async () => {
      const response = await fetch(`${API_BASE_URL}/sports/attendance/pending`, {
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },

    createBulk: async (bulkData: any) => {
      const response = await fetch(`${API_BASE_URL}/sports/attendance/bulk`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(bulkData),
      })
      return handleResponse(response)
    },

    getByProgram: async (programId: string) => {
      const response = await fetch(`${API_BASE_URL}/sports/attendance/program/${programId}`, {
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    }
  },

  // Student Portal
  student: {
    getMySports: async () => {
      const response = await fetch(`${API_BASE_URL}/sports/student/my-sports`, {
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },

    getMySchedule: async (filters = {}) => {
      const params = new URLSearchParams(filters)
      const response = await fetch(`${API_BASE_URL}/sports/student/my-schedule?${params}`, {
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },

    getMyAttendance: async (filters = {}) => {
      const params = new URLSearchParams(filters)
      const response = await fetch(`${API_BASE_URL}/sports/student/my-attendance?${params}`, {
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },

    getMyStats: async () => {
      const response = await fetch(`${API_BASE_URL}/sports/student/stats`, {
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    }
  },

  // Parent Portal
  parent: {
    getChildrenSports: async () => {
      const response = await fetch(`${API_BASE_URL}/sports/parent/children-sports`, {
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },

    getChildrenSchedule: async (filters = {}) => {
      const params = new URLSearchParams(filters)
      const response = await fetch(`${API_BASE_URL}/sports/parent/children-schedule?${params}`, {
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },

    getChildrenAttendance: async (filters = {}) => {
      const params = new URLSearchParams(filters)
      const response = await fetch(`${API_BASE_URL}/sports/parent/children-attendance?${params}`, {
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    }
  },

  // Reports
  reports: {
    get: async (filters = {}) => {
      const params = new URLSearchParams(filters)
      const response = await fetch(`${API_BASE_URL}/sports/reports?${params}`, {
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },

    export: async (filters = {}) => {
      const params = new URLSearchParams({ ...filters, format: 'pdf' })
      const response = await fetch(`${API_BASE_URL}/sports/reports/export?${params}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) {
        throw new Error('Failed to export report')
      }
      // Return blob for PDF download
      return await response.blob()
    },

    getParticipation: async (schoolId?: string, filters = {}) => {
      const params = new URLSearchParams({
        ...(schoolId && { schoolId }),
        ...filters
      })
      const response = await fetch(`${API_BASE_URL}/sports/reports/participation?${params}`, {
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },

    getAttendance: async (schoolId?: string, filters = {}) => {
      const params = new URLSearchParams({
        ...(schoolId && { schoolId }),
        ...filters
      })
      const response = await fetch(`${API_BASE_URL}/sports/reports/attendance?${params}`, {
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    }
  },

  // Eligibility
  checkEligibility: async (studentId: string, sportsProgramId: string) => {
    const response = await fetch(`${API_BASE_URL}/sports/eligibility/${studentId}/${sportsProgramId}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  // Coach Functions
  coach: {
    getMyPrograms: async () => {
      const response = await fetch(`${API_BASE_URL}/sports/my-programs`, {
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },

    getMyTeams: async (filters = {}) => {
      const params = new URLSearchParams(filters)
      const response = await fetch(`${API_BASE_URL}/sports/my-teams?${params}`, {
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },

    notifyParents: async (notificationData: any) => {
      const response = await fetch(`${API_BASE_URL}/sports/notify-parents`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(notificationData),
      })
      return handleResponse(response)
    }
  },

  // Activities
  activities: {
    getAll: async (page = 1, limit = 10, filters = {}) => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      })
      const response = await fetch(`${API_BASE_URL}/sports/activities?${params}`, {
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    }
  }
}

// ==================== SCHEDULE API ====================
export const scheduleApi = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters)
    const response = await fetch(`${API_BASE_URL}/schedule?${params}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  getByStudent: async (studentId: string, date: string) => {
    const params = new URLSearchParams({
      studentId,
      date
    })
    const response = await fetch(`${API_BASE_URL}/schedule/by-student?${params}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  getStudentFullSchedule: async (studentId: string) => {
    const params = new URLSearchParams({
      studentId
    })
    const response = await fetch(`${API_BASE_URL}/schedule/student-full-schedule?${params}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  getStudentWeekSchedule: async (studentId: string) => {
    const response = await fetch(`${API_BASE_URL}/schedule/for-student/${studentId}/week`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  create: async (scheduleData: any) => {
    const response = await fetch(`${API_BASE_URL}/schedule/add`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(scheduleData),
    })
    return handleResponse(response)
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/schedule/${id}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  update: async (id: string, scheduleData: any) => {
    const response = await fetch(`${API_BASE_URL}/schedule/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(scheduleData),
    })
    return handleResponse(response)
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/schedule/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    return response.ok
  }
}

// ==================== ADMIN API ====================
// ==================== CLUBS MANAGEMENT ====================
export const clubsApi = {
  // Basic CRUD
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters)
    const response = await fetch(`${API_BASE_URL}/clubs?${params}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  create: async (clubData: any) => {
    const response = await fetch(`${API_BASE_URL}/clubs`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(clubData),
    })
    return handleResponse(response)
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/clubs/${id}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  update: async (id: string, clubData: any) => {
    const response = await fetch(`${API_BASE_URL}/clubs/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(clubData),
    })
    return handleResponse(response)
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/clubs/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    return response.ok
  },

  // Membership Management
  requestMembership: async (clubId: string, membershipData: any) => {
    const response = await fetch(`${API_BASE_URL}/clubs/${clubId}/membership/request`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(membershipData),
    })
    return handleResponse(response)
  },

  approveMembership: async (clubId: string, membershipId: string, approvalData: any) => {
    const response = await fetch(`${API_BASE_URL}/clubs/${clubId}/membership/${membershipId}/approve`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(approvalData),
    })
    return handleResponse(response)
  },

  rejectMembership: async (clubId: string, membershipId: string, rejectionData: any) => {
    const response = await fetch(`${API_BASE_URL}/clubs/${clubId}/membership/${membershipId}/reject`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(rejectionData),
    })
    return handleResponse(response)
  },

  getMembers: async (clubId: string, status?: string) => {
    const params = new URLSearchParams(status ? { status } : {})
    const response = await fetch(`${API_BASE_URL}/clubs/${clubId}/members?${params}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  getPendingRequests: async (clubId: string) => {
    const response = await fetch(`${API_BASE_URL}/clubs/${clubId}/membership/pending`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  // Student Portal
  student: {
    getMyClubs: async () => {
      const response = await fetch(`${API_BASE_URL}/student/clubs/my-clubs`, {
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },

    getAvailableClubs: async () => {
      const response = await fetch(`${API_BASE_URL}/student/clubs/available`, {
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },

    requestMembership: async (membershipData: any) => {
      console.log('Sending membership request:', membershipData);
      const response = await fetch(`${API_BASE_URL}/student/clubs/request-membership`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(membershipData),
      })
      console.log('Membership request response status:', response.status);
      return handleResponse(response)
    },

    getMyRequests: async () => {
      const response = await fetch(`${API_BASE_URL}/student/clubs/requests`, {
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },

    getMyClubSchedule: async (filters = {}) => {
      const params = new URLSearchParams(filters)
      const response = await fetch(`${API_BASE_URL}/clubs/student/my-club-schedule?${params}`, {
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },

    getMyClubAttendance: async (filters = {}) => {
      const params = new URLSearchParams(filters)
      const response = await fetch(`${API_BASE_URL}/clubs/student/my-club-attendance?${params}`, {
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    }
  },

  // Attendance
  markAttendance: async (clubId: string, attendanceData: any) => {
    const response = await fetch(`${API_BASE_URL}/clubs/${clubId}/attendance`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(attendanceData),
    })
    return handleResponse(response)
  },

  getAttendance: async (clubId: string, filters = {}) => {
    const params = new URLSearchParams(filters)
    const response = await fetch(`${API_BASE_URL}/clubs/${clubId}/attendance?${params}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  // Announcements
  createAnnouncement: async (clubId: string, announcementData: any) => {
    const response = await fetch(`${API_BASE_URL}/clubs/${clubId}/announcements`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(announcementData),
    })
    return handleResponse(response)
  },

  getAnnouncements: async (clubId: string) => {
    const response = await fetch(`${API_BASE_URL}/clubs/${clubId}/announcements`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  // Notifications
  notifyParentsOfAbsence: async (clubId: string, notificationData: any) => {
    const response = await fetch(`${API_BASE_URL}/clubs/${clubId}/notify-absence`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(notificationData),
    })
    return handleResponse(response)
  },

  notifyMembersOfAnnouncement: async (clubId: string, announcementId: string) => {
    const response = await fetch(`${API_BASE_URL}/clubs/${clubId}/announcements/${announcementId}/notify`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  // Analytics
  getSchoolAnalytics: async (schoolId: string) => {
    const response = await fetch(`${API_BASE_URL}/clubs/school/${schoolId}/analytics`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  }
}

// ==================== HONOR ROLL MANAGEMENT ====================
export const honorRollApi = {
  // Criteria Management
  getCriteria: async (filters = {}) => {
    const params = new URLSearchParams(filters)
    const response = await fetch(`${API_BASE_URL}/honor-roll/criteria?${params}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  createCriteria: async (criteriaData: any) => {
    const response = await fetch(`${API_BASE_URL}/honor-roll/criteria`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(criteriaData),
    })
    return handleResponse(response)
  },

  updateCriteria: async (id: string, updateData: any) => {
    const response = await fetch(`${API_BASE_URL}/honor-roll/criteria/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData),
    })
    return handleResponse(response)
  },

  deleteCriteria: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/honor-roll/criteria/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    return response.ok
  },

  // Award Management
  calculateHonorRoll: async (calculationData: any) => {
    const response = await fetch(`${API_BASE_URL}/honor-roll/calculate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(calculationData),
    })
    return handleResponse(response)
  },

  getAwards: async (filters = {}) => {
    const params = new URLSearchParams(filters)
    const response = await fetch(`${API_BASE_URL}/honor-roll/awards?${params}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  // Reports
  getReports: async (filters = {}) => {
    const params = new URLSearchParams(filters)
    const response = await fetch(`${API_BASE_URL}/honor-roll/reports?${params}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  }
}

export const adminApi = {
  students: {
    getAll: async (filters = {}) => {
      const params = new URLSearchParams(filters)
      const response = await fetch(`${API_BASE_URL}/admin/students?${params}`, {
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },

    getById: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/admin/students/${id}`, {
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },

    create: async (studentData: any) => {
      const response = await fetch(`${API_BASE_URL}/admin/students`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(studentData),
      })
      return handleResponse(response)
    },

    update: async (id: string, studentData: any) => {
      const response = await fetch(`${API_BASE_URL}/admin/students/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(studentData),
      })
      return handleResponse(response)
    },

    delete: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/admin/students/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      return response.ok
    },

    export: async () => {
      const response = await fetch(`${API_BASE_URL}/admin/students/export`, {
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },

    bulkUpload: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch(`${API_BASE_URL}/admin/students/bulk-upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('accessToken')}`,
        },
        body: formData,
      })
      return handleResponse(response)
    }
  },

  teachers: {
    getAll: async (filters = {}) => {
      const params = new URLSearchParams(filters)
      const response = await fetch(`${API_BASE_URL}/admin/teachers?${params}`, {
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },

    create: async (teacherData: any) => {
      const response = await fetch(`${API_BASE_URL}/admin/teachers`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(teacherData),
      })
      return handleResponse(response)
    },

    update: async (id: string, teacherData: any) => {
      const response = await fetch(`${API_BASE_URL}/admin/teachers/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(teacherData),
      })
      return handleResponse(response)
    },

    delete: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/admin/teachers/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      return response.ok
    },

    bulkUpload: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch(`${API_BASE_URL}/admin/teachers/bulk-upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('accessToken')}`,
        },
        body: formData,
      })
      return handleResponse(response)
    }
  },

  parents: {
    getAll: async (filters = {}) => {
      const params = new URLSearchParams(filters)
      const response = await fetch(`${API_BASE_URL}/admin/parents?${params}`, {
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },

    create: async (parentData: any) => {
      const response = await fetch(`${API_BASE_URL}/admin/parents`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(parentData),
      })
      return handleResponse(response)
    },

    update: async (id: string, parentData: any) => {
      const response = await fetch(`${API_BASE_URL}/admin/parents/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(parentData),
      })
      return handleResponse(response)
    },

    delete: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/admin/parents/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      return response.ok
    }
  }
}

// ==================== STUDENTS API ====================
export const studentsApi = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters)
    const response = await fetch(`${API_BASE_URL}/student?${params}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/student/${id}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  getHealthRecords: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/student/${id}/health-records`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  create: async (studentData: any) => {
    const response = await fetch(`${API_BASE_URL}/student`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(studentData),
    })
    return handleResponse(response)
  },

  update: async (id: string, studentData: any) => {
    const response = await fetch(`${API_BASE_URL}/student/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(studentData),
    })
    return handleResponse(response)
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/student/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    return response.ok
  }
}

// ==================== NURSE API ====================
export const nurseApi = {
  healthRecords: {
    getByStudentId: async (studentId: string) => {
      const response = await fetch(`${API_BASE_URL}/nurse/health-records/student/${studentId}`, {
        headers: getAuthHeaders(),
      })
      
      // Handle 404 or not found responses
      if (response.status === 404) {
        return null
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (errorData.message?.includes('not found') || errorData.message?.includes('No health record')) {
          return null
        }
        throw new Error(errorData.message || 'Failed to fetch health record')
      }
      
      return handleResponse(response)
    },

    create: async (healthRecordData: any) => {
      const response = await fetch(`${API_BASE_URL}/nurse/health-records`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(healthRecordData),
      })
      return handleResponse(response)
    },

    update: async (studentId: string, healthRecordData: any) => {
      const response = await fetch(`${API_BASE_URL}/nurse/health-records/student/${studentId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(healthRecordData),
      })
      return handleResponse(response)
    },

    addPhysicalExam: async (studentId: string, examData: any) => {
      const response = await fetch(`${API_BASE_URL}/nurse/health-records/student/${studentId}/physical-exam`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(examData),
      })
      return handleResponse(response)
    },

    addNurseVisit: async (studentId: string, visitData: any) => {
      const response = await fetch(`${API_BASE_URL}/nurse/health-records/student/${studentId}/nurse-visit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(visitData),
      })
      return handleResponse(response)
    },

    addImmunization: async (studentId: string, immunizationData: any) => {
      const response = await fetch(`${API_BASE_URL}/nurse/health-records/student/${studentId}/immunization`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(immunizationData),
      })
      return handleResponse(response)
    },

    addMedication: async (studentId: string, medicationData: any) => {
      const response = await fetch(`${API_BASE_URL}/nurse/health-records/student/${studentId}/medication`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(medicationData),
      })
      return handleResponse(response)
    },

    addHealthAlert: async (studentId: string, alertData: any) => {
      const response = await fetch(`${API_BASE_URL}/nurse/health-records/student/${studentId}/health-alert`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(alertData),
      })
      return handleResponse(response)
    },

    getAllForSchool: async (filters = {}) => {
      const params = new URLSearchParams(filters)
      const response = await fetch(`${API_BASE_URL}/nurse/health-records/school?${params}`, {
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    }
  },

  reports: {
    generate: async (reportConfig: any) => {
      const response = await fetch(`${API_BASE_URL}/nurse/reports/generate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(reportConfig),
      })
      return response // Return response directly for blob handling
    },

    getMedicationReport: async () => {
      const response = await fetch(`${API_BASE_URL}/nurse/reports/medication`, {
        headers: getAuthHeaders(),
      })
      return response // Return response directly for blob handling
    },

    getVisitsReport: async () => {
      const response = await fetch(`${API_BASE_URL}/nurse/reports/visits`, {
        headers: getAuthHeaders(),
      })
      return response // Return response directly for blob handling
    },

    getHealthAlertsReport: async () => {
      const response = await fetch(`${API_BASE_URL}/nurse/reports/health-alerts`, {
        headers: getAuthHeaders(),
      })
      return response // Return response directly for blob handling
    },

    getImmunizationReport: async () => {
      const response = await fetch(`${API_BASE_URL}/nurse/reports/immunization`, {
        headers: getAuthHeaders(),
      })
      return response // Return response directly for blob handling
    }
  }
}

// ==================== FEE API ====================
export const feeApi = {
  createPolicy: async (payload: any) => {
    const response = await fetch(`${API_BASE_URL}/fee/policies`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    })
    return handleResponse(response)
  },

  getPolicies: async (filters: Record<string, string | number | boolean | undefined> = {}) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => {
      if (v != null && v !== '') params.set(k, String(v))
    })
    const response = await fetch(`${API_BASE_URL}/fee/policies?${params}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  updatePolicy: async (id: string, payload: any) => {
    const response = await fetch(`${API_BASE_URL}/fee/policies/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    })
    return handleResponse(response)
  },

  deactivatePolicy: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/fee/policies/${id}/deactivate`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  upsertDiscount: async (payload: any) => {
    const response = await fetch(`${API_BASE_URL}/fee/discounts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    })
    return handleResponse(response)
  },

  getDiscounts: async (filters: Record<string, string | number | boolean | undefined> = {}) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => {
      if (v != null && v !== '') params.set(k, String(v))
    })
    const response = await fetch(`${API_BASE_URL}/fee/discounts?${params}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  generateInstallments: async (payload: any) => {
    const response = await fetch(`${API_BASE_URL}/fee/installments/generate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    })
    return handleResponse(response)
  },

  getInstallments: async (filters: Record<string, string | number | boolean | undefined> = {}) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => {
      if (v != null && v !== '') params.set(k, String(v))
    })
    const response = await fetch(`${API_BASE_URL}/fee/installments?${params}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  recordPayment: async (installmentId: string, payload: any) => {
    const response = await fetch(`${API_BASE_URL}/fee/installments/${installmentId}/payments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    })
    return handleResponse(response)
  },

  manualClearance: async (installmentId: string, payload: any) => {
    const response = await fetch(`${API_BASE_URL}/fee/installments/${installmentId}/manual-clearance`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    })
    return handleResponse(response)
  },

  runReminders: async (payload: { schoolId?: string } = {}) => {
    const response = await fetch(`${API_BASE_URL}/fee/reminders/run`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    })
    return handleResponse(response)
  },

  getMyInstallments: async (academicYear?: string) => {
    const params = new URLSearchParams()
    if (academicYear) params.set('academicYear', academicYear)
    const response = await fetch(`${API_BASE_URL}/fee/my/installments?${params}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  getMySummary: async (academicYear?: string) => {
    const params = new URLSearchParams()
    if (academicYear) params.set('academicYear', academicYear)
    const response = await fetch(`${API_BASE_URL}/fee/my/summary?${params}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },
}

export default {
  emailTemplatesApi,
  scheduledJobsApi,
  rolloverApi,
  customReportsApi,
  systemAlertsApi,
  accessControlApi,
  sessionManagementApi,
  certificatesApi,
  integrationsApi,
  sportsApi,
  clubsApi,
  honorRollApi,
  scheduleApi,
  studentsApi,
  adminApi,
  nurseApi,
  feeApi
}
