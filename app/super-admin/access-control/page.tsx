"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { 
  Shield,
  Plus,
  Edit,
  Trash2,
  Globe,
  MapPin,
  Monitor,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Ban,
  Check,
  X
} from "lucide-react"
import { toast } from 'sonner'
import { accessControlApi } from '@/lib/api'

interface AccessControl {
  _id: string
  name: string
  type: 'WHITELIST' | 'BLACKLIST'
  status: 'ACTIVE' | 'INACTIVE'
  priority: number
  ipAddresses: string[]
  ipRanges: string[]
  countries: string[]
  deviceFingerprints: string[]
  description?: string
  expiresAt?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export default function AccessControlPage() {
  const [accessControls, setAccessControls] = useState<AccessControl[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<AccessControl | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'WHITELIST' as 'WHITELIST' | 'BLACKLIST',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    priority: 1,
    ipAddresses: '',
    ipRanges: '',
    countries: '',
    deviceFingerprints: '',
    description: '',
    expiresAt: ''
  })

  const getCurrentUserId = () => {
    if (typeof window === 'undefined') return 'super-admin'
    try {
      const raw = localStorage.getItem('userInfo')
      if (raw) {
        const info = JSON.parse(raw)
        return info?.id ?? info?._id ?? 'super-admin'
      }
    } catch (_) {}
    return 'super-admin'
  }

  useEffect(() => {
    fetchAccessControls()
  }, [])

  const fetchAccessControls = async () => {
    try {
      setLoading(true)
      const data = await accessControlApi.getAll()
      const payload = data?.data ?? data
      const list = payload?.accessControls ?? (Array.isArray(data) ? data : [])
      setAccessControls(Array.isArray(list) ? list : [])
    } catch (error: any) {
      console.error('Error fetching access controls:', error)
      toast.error(error?.message ?? 'Error fetching access control rules')
      setAccessControls([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const userId = getCurrentUserId()
    try {
      const payload = {
        ...formData,
        ipAddresses: formData.ipAddresses.split('\n').map(ip => ip.trim()).filter(Boolean),
        ipRanges: formData.ipRanges.split('\n').map(r => r.trim()).filter(Boolean),
        countries: formData.countries.split('\n').map(c => c.trim()).filter(Boolean),
        deviceFingerprints: formData.deviceFingerprints.split('\n').map(fp => fp.trim()).filter(Boolean),
        createdBy: userId,
        updatedBy: userId
      }

      if (editingRule) {
        await accessControlApi.update(editingRule._id, payload)
        toast.success('Access control rule updated successfully')
      } else {
        await accessControlApi.create(payload)
        toast.success('Access control rule created successfully')
      }
      setDialogOpen(false)
      resetForm()
      fetchAccessControls()
    } catch (error: any) {
      console.error('Error saving access control:', error)
      toast.error(error?.message ?? `Failed to ${editingRule ? 'update' : 'create'} access control rule`)
    }
  }

  const handleEdit = (rule: AccessControl) => {
    setEditingRule(rule)
    setFormData({
      name: rule.name,
      type: rule.type,
      status: rule.status,
      priority: rule.priority,
      ipAddresses: rule.ipAddresses.join('\n'),
      ipRanges: rule.ipRanges.join('\n'),
      countries: rule.countries.join('\n'),
      deviceFingerprints: rule.deviceFingerprints.join('\n'),
      description: rule.description || '',
      expiresAt: rule.expiresAt ? new Date(rule.expiresAt).toISOString().split('T')[0] : ''
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this access control rule?')) return

    try {
      await accessControlApi.delete(id, getCurrentUserId())
      toast.success('Access control rule deleted successfully')
      fetchAccessControls()
    } catch (error: any) {
      console.error('Error deleting access control:', error)
      toast.error(error?.message ?? 'Failed to delete access control rule')
    }
  }

  const toggleStatus = async (rule: AccessControl) => {
    try {
      const newStatus = rule.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
      await accessControlApi.update(rule._id, { status: newStatus, updatedBy: getCurrentUserId() })
      toast.success(`Access control rule ${newStatus.toLowerCase()}`)
      fetchAccessControls()
    } catch (error: any) {
      console.error('Error updating status:', error)
      toast.error(error?.message ?? 'Failed to update access control rule status')
    }
  }

  const resetForm = () => {
    setEditingRule(null)
    setFormData({
      name: '',
      type: 'WHITELIST',
      status: 'ACTIVE',
      priority: 1,
      ipAddresses: '',
      ipRanges: '',
      countries: '',
      deviceFingerprints: '',
      description: '',
      expiresAt: ''
    })
  }

  const getTypeIcon = (type: string) => {
    return type === 'WHITELIST' ? 
      <CheckCircle className="h-4 w-4 text-green-600" /> : 
      <Ban className="h-4 w-4 text-red-600" />
  }

  const getTypeBadge = (type: string) => {
    return type === 'WHITELIST' ? 
      <Badge className="bg-green-100 text-green-800">Whitelist</Badge> : 
      <Badge className="bg-red-100 text-red-800">Blacklist</Badge>
  }

  const getStatusBadge = (status: string) => {
    return status === 'ACTIVE' ? 
      <Badge className="bg-blue-100 text-blue-800">Active</Badge> : 
      <Badge variant="secondary">Inactive</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Access Control</h2>
          <p className="text-muted-foreground">
            Manage IP whitelisting, blacklisting, and geographic access restrictions
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          <Button variant="outline" size="sm" onClick={fetchAccessControls}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Rule
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {accessControls.filter(ac => ac.type === 'WHITELIST' && ac.status === 'ACTIVE').length}
                </p>
                <p className="text-sm text-muted-foreground">Active Whitelists</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Ban className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">
                  {accessControls.filter(ac => ac.type === 'BLACKLIST' && ac.status === 'ACTIVE').length}
                </p>
                <p className="text-sm text-muted-foreground">Active Blacklists</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">
                  {accessControls.reduce((acc, ac) => acc + ac.countries.length, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Countries Restricted</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Monitor className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">
                  {accessControls.reduce((acc, ac) => acc + ac.ipAddresses.length + ac.ipRanges.length, 0)}
                </p>
                <p className="text-sm text-muted-foreground">IP Rules</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Access Control Rules Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Access Control Rules
          </CardTitle>
          <CardDescription>
            Manage and monitor access control rules for enhanced security
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading access control rules...</div>
          ) : accessControls.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No Access Control Rules</h3>
              <p className="text-muted-foreground mb-4">
                Create your first access control rule to enhance system security
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Rule
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>IP Rules</TableHead>
                    <TableHead>Countries</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessControls.map((rule) => (
                    <TableRow key={rule._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{rule.name}</p>
                          {rule.description && (
                            <p className="text-sm text-muted-foreground">{rule.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(rule.type)}
                          {getTypeBadge(rule.type)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(rule.status)}
                          <Switch
                            checked={rule.status === 'ACTIVE'}
                            onCheckedChange={() => toggleStatus(rule)}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{rule.priority}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{rule.ipAddresses.length} IPs</p>
                          <p>{rule.ipRanges.length} Ranges</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{rule.countries.length}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(rule.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(rule)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(rule._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Rule Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open)
        if (!open) resetForm()
      }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? 'Edit Access Control Rule' : 'Create Access Control Rule'}
            </DialogTitle>
            <DialogDescription>
              Configure IP whitelisting, blacklisting, and geographic restrictions
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rule Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Corporate Office Whitelist"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: 'WHITELIST' | 'BLACKLIST') => 
                    setFormData({...formData, type: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WHITELIST">Whitelist (Allow)</SelectItem>
                    <SelectItem value="BLACKLIST">Blacklist (Block)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value)})}
                  min="1"
                  max="100"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: 'ACTIVE' | 'INACTIVE') => 
                    setFormData({...formData, status: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Optional description for this rule"
                rows={2}
              />
            </div>

            {/* IP Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>IP Addresses (one per line)</Label>
                <Textarea
                  value={formData.ipAddresses}
                  onChange={(e) => setFormData({...formData, ipAddresses: e.target.value})}
                  placeholder="192.168.1.1&#10;203.0.113.45"
                  rows={6}
                />
              </div>
              <div className="space-y-2">
                <Label>IP Ranges (CIDR format, one per line)</Label>
                <Textarea
                  value={formData.ipRanges}
                  onChange={(e) => setFormData({...formData, ipRanges: e.target.value})}
                  placeholder="192.168.1.0/24&#10;10.0.0.0/8"
                  rows={6}
                />
              </div>
            </div>

            {/* Geographic and Device Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Countries (ISO codes, one per line)</Label>
                <Textarea
                  value={formData.countries}
                  onChange={(e) => setFormData({...formData, countries: e.target.value})}
                  placeholder="US&#10;CA&#10;GB"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Device Fingerprints (one per line)</Label>
                <Textarea
                  value={formData.deviceFingerprints}
                  onChange={(e) => setFormData({...formData, deviceFingerprints: e.target.value})}
                  placeholder="device-fingerprint-hash-1&#10;device-fingerprint-hash-2"
                  rows={4}
                />
              </div>
            </div>

            {/* Expiration */}
            <div className="space-y-2">
              <Label>Expiration Date (optional)</Label>
              <Input
                type="date"
                value={formData.expiresAt}
                onChange={(e) => setFormData({...formData, expiresAt: e.target.value})}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingRule ? 'Update Rule' : 'Create Rule'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
