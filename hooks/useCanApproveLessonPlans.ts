import { useState, useEffect } from 'react'

export function useCanApproveLessonPlans() {
  const [canApprove, setCanApprove] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const check = async () => {
      try {
        const API = process.env.NEXT_PUBLIC_SRS_SERVER
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
        if (!token) {
          setCanApprove(false)
          return
        }
        const response = await fetch(`${API}/admin/lesson-plans/can-approve`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        })
        if (response.ok) {
          const data = await response.json()
          setCanApprove(!!data.canApprove)
        } else {
          setCanApprove(false)
        }
      } catch {
        setCanApprove(false)
      } finally {
        setLoading(false)
      }
    }
    check()
  }, [])

  return { canApprove, loading }
}
