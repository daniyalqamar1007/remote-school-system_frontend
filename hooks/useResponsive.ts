"use client"

import { useState, useEffect } from 'react'

interface UseBreakpointReturn {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  screenSize: 'mobile' | 'tablet' | 'desktop'
}

export function useBreakpoint(): UseBreakpointReturn {
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      if (width < 768) {
        setScreenSize('mobile')
      } else if (width < 1024) {
        setScreenSize('tablet')
      } else {
        setScreenSize('desktop')
      }
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)

    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  return {
    isMobile: screenSize === 'mobile',
    isTablet: screenSize === 'tablet',
    isDesktop: screenSize === 'desktop',
    screenSize,
  }
}

interface UseMobileNavigationReturn {
  isMobileMenuOpen: boolean
  toggleMobileMenu: () => void
  closeMobileMenu: () => void
}

export function useMobileNavigation(): UseMobileNavigationReturn {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { isMobile } = useBreakpoint()

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  // Close mobile menu when switching to desktop
  useEffect(() => {
    if (!isMobile) {
      setIsMobileMenuOpen(false)
    }
  }, [isMobile])

  return {
    isMobileMenuOpen,
    toggleMobileMenu,
    closeMobileMenu,
  }
}

// Responsive grid classes helper
export const getResponsiveGridCols = (mobile: number = 1, tablet: number = 2, desktop: number = 4) => {
  return `grid-cols-${mobile} md:grid-cols-${tablet} lg:grid-cols-${desktop}`
}

// Responsive spacing helper
export const getResponsiveSpacing = (mobile: string = '4', tablet: string = '6', desktop: string = '8') => {
  return `space-y-${mobile} md:space-y-${tablet} lg:space-y-${desktop}`
}

// Responsive padding helper
export const getResponsivePadding = (mobile: string = '4', tablet: string = '6', desktop: string = '8') => {
  return `p-${mobile} md:p-${tablet} lg:p-${desktop}`
}
