// Global API interceptors initialization
// This file sets up 401 auto-logout for both fetch and axios
// Import this file early in the app (e.g., in root layout or providers)

// Import to initialize fetch wrapper
import './api'

// Import to initialize axios interceptors  
import './axios-config'

// This file doesn't export anything, it just initializes the interceptors
// when imported

