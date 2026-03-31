"use client"

import { useEffect } from 'react'
// Import API interceptors to initialize both fetch wrapper and axios interceptors
import '@/lib/api-interceptors'

// This component ensures API interceptors (both fetch and axios) are set up
// It doesn't render anything, just initializes the interceptors
export default function AxiosInterceptor() {
  useEffect(() => {
    // The api-interceptors.ts file sets up both fetch wrapper and axios interceptors when imported
    // This component just ensures it's loaded early in the app lifecycle
  }, [])
  
  return null
}

