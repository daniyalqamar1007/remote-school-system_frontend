"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Plus, Search, Edit, Trash2, Shield, Key, Users } from "lucide-react"
import { toast } from 'sonner'
import { getToken } from '@/lib/token'

function authHeaders(extra: Record<string, string> = {}) {
  const token = getToken()
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}

interface Permission {
  _id: string
  name: string
  resource: string
  action: string
  description: string
  createdAt: string
}

interface Role {
  _id: string
  name: string
  description: string
  permissions: Permission[]
  isSystemRole: boolean
  createdAt: string
  updatedAt: string
}

interface CreateRoleForm {
  name: string
  description: string
  permissions: string[]
}

interface CreatePermissionForm {
  name: string
  resource: string
  action: string
  description: string
}

const isValidPermission = (permission: unknown): permission is Permission => {
  if (!permission || typeof permission !== "object") return false

  const candidate = permission as Partial<Permission>
  return typeof candidate._id === "string" && typeof candidate.name === "string"
}

export default function RolesPermissions() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateRoleDialogOpen, setIsCreateRoleDialogOpen] = useState(false)
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false)
  const [isCreatePermissionDialogOpen, setIsCreatePermissionDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [activeTab, setActiveTab] = useState("roles")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'role' | 'permission' } | null>(null)

  const [createRoleForm, setCreateRoleForm] = useState<CreateRoleForm>({
    name: "",
    description: "",
    permissions: []
  })

  const [createPermissionForm, setCreatePermissionForm] = useState<CreatePermissionForm>({
    name: "",
    resource: "",
    action: "",
    description: ""
  })

  const resources = [
    "User", "Student", "Teacher", "Parent", "Course", "Grade", 
    "Attendance", "Assignment", "Schedule", "Document", "Report",
    "Settings", "Analytics", "Communication", "Health", "Behavior"
  ]

  const actions = [
    "create", "read", "update", "delete", "manage", "view", 
    "export", "import", "approve", "reject", "assign", "unassign"
  ]

  useEffect(() => {
    fetchRoles()
    fetchPermissions()
  }, [])

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/roles`, { headers: authHeaders() })
      if (response.ok) {
        const data = await response.json()
        const rolesData = Array.isArray(data) ? data : data?.data ?? []
        const normalizedRoles = (Array.isArray(rolesData) ? rolesData : []).map((role) => ({
          ...role,
          permissions: Array.isArray(role?.permissions)
            ? role.permissions.filter(isValidPermission)
            : [],
        }))

        setRoles(normalizedRoles)
      } else {
        toast.error("Failed to fetch roles")
      }
    } catch (error) {
      console.error("Error fetching roles:", error)
      toast.error("Error fetching roles")
    } finally {
      setLoading(false)
    }
  }

  const fetchPermissions = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/permissions`, { headers: authHeaders() })
      if (response.ok) {
        const data = await response.json()
        const permissionsData = Array.isArray(data) ? data : data?.data ?? []
        const normalizedPermissions = (Array.isArray(permissionsData) ? permissionsData : []).filter(isValidPermission)
        setPermissions(normalizedPermissions)
      } else {
        toast.error("Failed to fetch permissions")
      }
    } catch (error) {
      console.error("Error fetching permissions:", error)
      toast.error("Error fetching permissions")
    }
  }

  const handleCreateRole = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/roles`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(createRoleForm),
      })

      if (response.ok) {
        toast.success("Role created successfully")
        setIsCreateRoleDialogOpen(false)
        setCreateRoleForm({
          name: "",
          description: "",
          permissions: []
        })
        fetchRoles()
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to create role")
      }
    } catch (error) {
      console.error("Error creating role:", error)
      toast.error("Error creating role")
    }
  }

  const handleUpdateRole = async () => {
    if (!selectedRole) return

    try {
      const updateData = {
        name: selectedRole.name,
        description: selectedRole.description,
        permissions: selectedRole.permissions.map(p => p._id)
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/roles/${selectedRole._id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        toast.success("Role updated successfully")
        setIsEditRoleDialogOpen(false)
        setSelectedRole(null)
        fetchRoles()
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to update role")
      }
    } catch (error) {
      console.error("Error updating role:", error)
      toast.error("Error updating role")
    }
  }

  const handleDeleteRole = async (roleId: string) => {
    setDeleteDialogOpen(true)
    setItemToDelete({ id: roleId, type: 'role' })
  }

  const handleConfirmDelete = async () => {
    try {
      if (!itemToDelete) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/roles/${itemToDelete.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      })

      if (response.ok) {
        toast.success("Role deleted successfully")
        fetchRoles()
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to delete role")
      }
    } catch (error) {
      console.error("Error deleting role:", error)
      toast.error("Error deleting role")
    } finally {
      setDeleteDialogOpen(false)
      setItemToDelete(null)
    }
  }

  const handleCreatePermission = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/permissions`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(createPermissionForm),
      })

      if (response.ok) {
        toast.success("Permission created successfully")
        setIsCreatePermissionDialogOpen(false)
        setCreatePermissionForm({
          name: "",
          resource: "",
          action: "",
          description: ""
        })
        fetchPermissions()
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to create permission")
      }
    } catch (error) {
      console.error("Error creating permission:", error)
      toast.error("Error creating permission")
    }
  }

  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    if (checked) {
      setCreateRoleForm(prev => ({
        ...prev,
        permissions: [...prev.permissions, permissionId]
      }))
    } else {
      setCreateRoleForm(prev => ({
        ...prev,
        permissions: prev.permissions.filter(id => id !== permissionId)
      }))
    }
  }

  const handleEditPermissionToggle = (permissionId: string, checked: boolean) => {
    if (!selectedRole) return

    if (checked) {
      const permission = permissions.find(p => p._id === permissionId)
      if (permission) {
        setSelectedRole(prev => prev ? {
          ...prev,
          permissions: [...prev.permissions, permission]
        } : null)
      }
    } else {
      setSelectedRole(prev => prev ? {
        ...prev,
        permissions: prev.permissions.filter(p => p._id !== permissionId)
      } : null)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Roles & Permissions</h2>
          <p className="text-muted-foreground">
            Define and assign roles with specific permissions for access control
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:grid-cols-none">
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">System Roles</h3>
              <p className="text-sm text-muted-foreground">
                Manage user roles and their associated permissions
              </p>
            </div>
            <Dialog open={isCreateRoleDialogOpen} onOpenChange={setIsCreateRoleDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Role
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Role</DialogTitle>
                  <DialogDescription>
                    Define a new role with specific permissions for users.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="roleName">Role Name</Label>
                    <Input
                      id="roleName"
                      value={createRoleForm.name}
                      onChange={(e) => setCreateRoleForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="School Administrator"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roleDescription">Description</Label>
                    <Textarea
                      id="roleDescription"
                      value={createRoleForm.description}
                      onChange={(e) => setCreateRoleForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Role description and responsibilities"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-4">
                    <Label>Permissions</Label>
                    <div className="max-h-60 overflow-y-auto border rounded-md p-4">
                      <div className="space-y-2">
                        {permissions.map((permission) => (
                          <div key={permission._id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`permission-${permission._id}`}
                              checked={createRoleForm.permissions.includes(permission._id)}
                              onCheckedChange={(checked) => handlePermissionToggle(permission._id, checked as boolean)}
                            />
                            <div className="flex-1">
                              <Label htmlFor={`permission-${permission._id}`} className="text-sm font-medium">
                                {permission.name}
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                {permission.description} ({permission.resource}:{permission.action})
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleCreateRole}>
                    Create Role
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-muted-foreground">Loading roles...</div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role._id}>
                        <TableCell className="font-medium">{role.name}</TableCell>
                        <TableCell>{role.description}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {role.permissions.slice(0, 3).map((permission) => (
                              <Badge key={permission._id} variant="secondary" className="text-xs">
                                {permission.name}
                              </Badge>
                            ))}
                            {role.permissions.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{role.permissions.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={role.isSystemRole ? "default" : "outline"}>
                            {role.isSystemRole ? "System" : "Custom"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(role.createdAt).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedRole({
                                  ...role,
                                  permissions: Array.isArray(role.permissions)
                                    ? role.permissions.filter(isValidPermission)
                                    : [],
                                })
                                setIsEditRoleDialogOpen(true)
                              }}
                              disabled={role.isSystemRole}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRole(role._id)}
                              disabled={role.isSystemRole}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">System Permissions</h3>
              <p className="text-sm text-muted-foreground">
                Manage granular permissions for different system resources
              </p>
            </div>
            <Dialog open={isCreatePermissionDialogOpen} onOpenChange={setIsCreatePermissionDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Permission
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Permission</DialogTitle>
                  <DialogDescription>
                    Define a new permission for system resources.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="permissionName">Permission Name</Label>
                    <Input
                      id="permissionName"
                      value={createPermissionForm.name}
                      onChange={(e) => setCreatePermissionForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="View Students"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="resource">Resource</Label>
                    <select
                      id="resource"
                      value={createPermissionForm.resource}
                      onChange={(e) => setCreatePermissionForm(prev => ({ ...prev, resource: e.target.value }))}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select Resource</option>
                      {resources.map((resource) => (
                        <option key={resource} value={resource}>
                          {resource}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="action">Action</Label>
                    <select
                      id="action"
                      value={createPermissionForm.action}
                      onChange={(e) => setCreatePermissionForm(prev => ({ ...prev, action: e.target.value }))}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select Action</option>
                      {actions.map((action) => (
                        <option key={action} value={action}>
                          {action}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="permissionDescription">Description</Label>
                    <Textarea
                      id="permissionDescription"
                      value={createPermissionForm.description}
                      onChange={(e) => setCreatePermissionForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Allows viewing student information and records"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleCreatePermission}>
                    Create Permission
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Permission Name</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map((permission) => (
                    <TableRow key={permission._id}>
                      <TableCell className="font-medium">{permission.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{permission.resource}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{permission.action}</Badge>
                      </TableCell>
                      <TableCell>{permission.description}</TableCell>
                      <TableCell>
                        {new Date(permission.createdAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Role Dialog */}
      <Dialog open={isEditRoleDialogOpen} onOpenChange={setIsEditRoleDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update role information and permissions.
            </DialogDescription>
          </DialogHeader>
          {selectedRole && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editRoleName">Role Name</Label>
                <Input
                  id="editRoleName"
                  value={selectedRole.name}
                  onChange={(e) => setSelectedRole(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editRoleDescription">Description</Label>
                <Textarea
                  id="editRoleDescription"
                  value={selectedRole.description}
                  onChange={(e) => setSelectedRole(prev => prev ? { ...prev, description: e.target.value } : null)}
                  rows={3}
                />
              </div>
              <div className="space-y-4">
                <Label>Permissions</Label>
                <div className="max-h-60 overflow-y-auto border rounded-md p-4">
                  <div className="space-y-2">
                    {permissions.map((permission) => (
                      <div key={permission._id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-permission-${permission._id}`}
                          checked={selectedRole.permissions.some(p => p._id === permission._id)}
                          onCheckedChange={(checked) => handleEditPermissionToggle(permission._id, checked as boolean)}
                        />
                        <div className="flex-1">
                          <Label htmlFor={`edit-permission-${permission._id}`} className="text-sm font-medium">
                            {permission.name}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {permission.description} ({permission.resource}:{permission.action})
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="submit" onClick={handleUpdateRole}>
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {itemToDelete?.type}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
