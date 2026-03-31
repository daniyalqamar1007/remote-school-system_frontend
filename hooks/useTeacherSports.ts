import { useState, useEffect } from 'react'
import { sportsApi } from '@/lib/api'

export function useTeacherSports() {
  const [hasSportsPrograms, setHasSportsPrograms] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSportsPrograms = async () => {
      try {
        const response = await sportsApi.programs.getMyCoachPrograms()
        console.log('🏈 Sports programs response:', response)
        
        // Handle the response structure from backend
        let programs = []
        if (response.success && response.data) {
          programs = response.data
        } else if (response.data) {
          programs = response.data
        } else if (response.programs) {
          programs = response.programs
        } else if (Array.isArray(response)) {
          programs = response
        }
        
        console.log('🏈 Extracted programs:', programs)
        setHasSportsPrograms(programs.length > 0)
      } catch (error) {
        console.error('Error checking teacher sports programs:', error)
        setHasSportsPrograms(false)
      } finally {
        setLoading(false)
      }
    }

    checkSportsPrograms()
  }, [])

  return { hasSportsPrograms, loading }
}