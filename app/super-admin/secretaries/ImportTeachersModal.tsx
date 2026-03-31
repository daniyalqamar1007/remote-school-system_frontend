"use client"

import React, { useEffect, useState } from "react"
import axios from "axios"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Loader2, Upload } from "lucide-react"
import { toast } from 'sonner'

interface School { _id: string; name: string }

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (schoolId: string) => void
}

export default function ImportTeachersModal({ open, onOpenChange, onSuccess }: Props) {
  const [schools, setSchools] = useState<School[]>([])
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("")
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    ;(async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
        const res = await axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/schools`, { headers: { Authorization: `Bearer ${token}` } })
        setSchools(res.data?.data?.schools || [])
      } catch (e) {
        // ignore
      }
    })()
  }, [open])

  const handleUpload = async () => {
    if (!selectedSchoolId) {
      toast.error('Please select a school')
      return
    }
    if (!file) {
      toast.error('Please choose a file to import')
      return
    }
    try {
      setLoading(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      const formData = new FormData()
      formData.append('file', file)
      const url = `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/teachers/import?schoolId=${selectedSchoolId}`
      const res = await axios.post(url, formData, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } })
      toast.success(res?.data?.message || 'Teachers imported successfully')
      onOpenChange(false)
      onSuccess?.(selectedSchoolId)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to import teachers')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Teachers</DialogTitle>
          <DialogDescription>Select a school and upload Excel/CSV to import teachers.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-700 mb-1 block">School</label>
            <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
              <SelectTrigger>
                <SelectValue placeholder="Select school" />
              </SelectTrigger>
              <SelectContent>
                {schools.map(s => (
                  <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-gray-700 mb-1 block">File</label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleUpload} disabled={loading}>
            {loading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</>) : (<><Upload className="h-4 w-4 mr-2" />Upload</>)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


