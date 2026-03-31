// Parent API functions for dashboard data
import { getAuthHeaders, clearAuthData } from './token'

const API_BASE_URL = process.env.NEXT_PUBLIC_SRS_SERVER;

// Helper function to handle auto-logout on 401 Unauthorized
const handleUnauthorized = () => {
  // Clear all auth data using centralized function
  clearAuthData()
  
  // Redirect to login page
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
}

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    
    // Check for 401 Unauthorized - check both HTTP status and error body
    const statusCode = response.status || errorData.status || errorData.statusCode || errorData.code
    
    if (statusCode === 401) {
      // Auto-logout on 401 Unauthorized
      handleUnauthorized()
      // Throw error but don't show toast (user is being logged out)
      throw new Error('Session expired. Please login again.')
    }
    
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
  }
  
  const data = await response.json()
  
  // Also check successful responses for 401 status in the body
  if (data && (data.status === 401 || data.statusCode === 401 || data.code === 401)) {
    handleUnauthorized()
    throw new Error('Session expired. Please login again.')
  }
  
  return data
}

export const parentApi = {
  // Get student summary with grades, attendance, behavior
  getStudentSummary: async (studentId: string) => {
    const response = await fetch(`${API_BASE_URL}/parent/student-summary/${studentId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get student grades
  getStudentGrades: async (studentId: string) => {
    const response = await fetch(`${API_BASE_URL}/grade/by-student/${studentId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get student GPA
  getStudentGPA: async (studentId: string) => {
    const response = await fetch(`${API_BASE_URL}/grade/gpa/${studentId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get student attendance
  getStudentAttendance: async (studentId: string) => {
    const response = await fetch(`${API_BASE_URL}/student/${studentId}/daily-attendance`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get student behavior records
  getStudentBehavior: async (studentId: string) => {
    const response = await fetch(`${API_BASE_URL}/behavior?studentId=${studentId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get student health records
  getStudentHealth: async (studentId: string) => {
    const response = await fetch(`${API_BASE_URL}/student/${studentId}/health-records`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get school announcements
  getAnnouncements: async () => {
    const response = await fetch(`${API_BASE_URL}/announcements`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get school events
  getEvents: async () => {
    const response = await fetch(`${API_BASE_URL}/events`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get student assignments
  getStudentAssignments: async (studentId: string) => {
    const response = await fetch(`${API_BASE_URL}/student/${studentId}/assignments`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get student schedule
  getStudentSchedule: async (studentId: string) => {
    const response = await fetch(`${API_BASE_URL}/schedule/student/${studentId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};
