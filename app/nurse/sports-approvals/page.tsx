'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trophy, Loader2, CheckCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

const API_BASE_URL = process.env.NEXT_PUBLIC_SRS_SERVER || 'http://localhost:3014'

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

export default function SportsApprovalsPage() {
  const [pending, setPending] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [approvingId, setApprovingId] = useState<string | null>(null)

  const fetchPending = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE_URL}/nurse/sports-approvals/pending`, {
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        const data = await res.json()
        setPending(Array.isArray(data) ? data : (data?.data ?? data?.pending ?? []))
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err?.message || 'Failed to load pending sports approvals')
        setPending([])
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load pending sports approvals')
      setPending([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPending()
  }, [fetchPending])

  const handleApprove = async (item: { studentId: string; programName: string }) => {
    const key = `${item.studentId}-${item.programName}`
    setApprovingId(key)
    try {
      const programEncoded = encodeURIComponent(item.programName)
      const res = await fetch(
        `${API_BASE_URL}/nurse/sports-approval/${item.studentId}/${programEncoded}`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ notes: '' }),
        }
      )
      if (res.ok) {
        toast.success(`Approved ${item.studentName} for ${item.programName}`)
        await fetchPending()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err?.message || 'Approval failed')
      }
    } catch (e: any) {
      toast.error(e?.message || 'Approval failed')
    } finally {
      setApprovingId(null)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="h-7 w-7 text-amber-600" />
            Sports Approvals
          </h1>
          <p className="text-gray-600 mt-1">
            Students with physician clearance who need nurse approval to participate in sports
          </p>
        </div>
        <Button variant="outline" onClick={fetchPending} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending approvals</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : pending.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No pending sports approvals. When students are assigned to sports and have a valid physical clearance, they will appear here for nurse approval.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Sports program</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pending.map((item: any, idx: number) => {
                    const key = `${item.studentId}-${item.programName}`
                    const isApproving = approvingId === key
                    return (
                      <TableRow key={idx}>
                        <TableCell className="font-medium text-black">
                          {item.studentName || 'Unknown'}
                        </TableCell>
                        <TableCell className="text-black">{item.gradeLevel || 'N/A'}</TableCell>
                        <TableCell className="text-black">{item.programName || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(item)}
                            disabled={isApproving}
                          >
                            {isApproving ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-2" />
                            )}
                            Approve
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
