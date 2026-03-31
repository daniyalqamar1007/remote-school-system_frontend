import { clearAuthData } from './token'

/**
 * Centralized logout function that clears all authentication data
 * and redirects to login page
 */
export const handleLogout = () => {
  // Clear all auth data using centralized function
  clearAuthData()
  
  // Set a flag to indicate logout just happened (prevents redirect loops)
  sessionStorage.setItem('justLoggedOut', 'true')
  
  // Use window.location.href for a hard redirect (clears React state)
  // This ensures no redirect loops happen
  window.location.href = '/login'
}

