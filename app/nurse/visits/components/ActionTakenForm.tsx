'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Plus, X } from 'lucide-react'
import { toast } from 'sonner'

const API_BASE_URL = process.env.NEXT_PUBLIC_SRS_SERVER || 'http://localhost:3014'

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

interface ActionTakenFormProps {
  visitId: string
  studentId: string
  existingActions: string[]
  onSuccess: () => void
  onCancel: () => void
}

export default function ActionTakenForm({ visitId, studentId, existingActions, onSuccess, onCancel }: ActionTakenFormProps) {
  const [loading, setLoading] = useState(false)
  const [actions, setActions] = useState<string[]>(existingActions || [])
  const [newAction, setNewAction] = useState('')

  const handleAddAction = () => {
    if (newAction.trim()) {
      setActions(prev => [...prev, newAction.trim()])
      setNewAction('')
    }
  }

  const handleRemoveAction = (index: number) => {
    setActions(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (actions.length === 0) {
      toast.error('Please add at least one action taken')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/nurse/health-records/student/${studentId}/nurse-visit/${visitId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          actionTaken: actions
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        if (data.success === false) {
          toast.error(data.message || 'Failed to update actions taken')
          return
        }
        
        toast.success(data.message || 'Actions taken updated successfully')
        onSuccess()
      } else {
        toast.error(data.message || 'Failed to update actions taken')
      }
    } catch (error: any) {
      console.error('Error updating actions taken:', error)
      toast.error('Error updating actions taken')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="newAction">Add Action Taken</Label>
        <div className="flex gap-2">
          <Input
            id="newAction"
            placeholder="e.g., Applied bandage, Administered medication, Checked vitals"
            value={newAction}
            onChange={(e) => setNewAction(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddAction()
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAddAction}
            disabled={!newAction.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {actions.length > 0 && (
        <div className="space-y-2">
          <Label>Actions Taken ({actions.length})</Label>
          <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3">
            {actions.map((action, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <span className="text-sm text-gray-700">{action}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveAction(index)}
                  className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || actions.length === 0} className="bg-black hover:bg-gray-800 text-white">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Actions'
          )}
        </Button>
      </div>
    </form>
  )
}

