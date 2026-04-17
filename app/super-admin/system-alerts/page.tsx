'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from 'sonner'
import { systemAlertsApi } from '@/lib/api'
import { 
  Plus, 
  Trash2, 
  Settings, 
  Bell,
  BellRing,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Database,
  Server,
  Activity,
  Zap,
  Filter,
  Search,
  MoreHorizontal,
  Shield
} from 'lucide-react'

interface SystemAlert {
  id: string
  title: string
  message: string
  type: 'critical' | 'warning' | 'info' | 'success'
  category: 'system' | 'security' | 'performance' | 'data' | 'integration'
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'active' | 'acknowledged' | 'resolved' | 'ignored'
  createdAt: string
  acknowledgedAt?: string
  acknowledgedBy?: string
  resolvedAt?: string
  resolvedBy?: string
  source: string
  affectedSystems: string[]
  actionItems?: string[]
  metadata?: Record<string, any>
}

interface AlertRule {
  id: string
  name: string
  description: string
  condition: string
  threshold: number
  duration: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'system' | 'security' | 'performance' | 'data' | 'integration'
  enabled: boolean
  notifications: NotificationChannel[]
  cooldown: number
  createdAt: string
  lastTriggered?: string
}

interface NotificationChannel {
  type: 'email' | 'sms' | 'webhook' | 'slack'
  target: string
  enabled: boolean
}

interface NotificationTemplate {
  id: string
  name: string
  type: 'email' | 'sms' | 'webhook' | 'slack'
  subject: string
  body: string
  variables: string[]
}

export default function SystemAlertsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/super-admin/dashboard')
  }, [router])

  return null

  const [alerts, setAlerts] = useState<SystemAlert[]>([])
  const [alertRules, setAlertRules] = useState<AlertRule[]>([])
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('alerts')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Form states for alert rules
  const [isCreatingRule, setIsCreatingRule] = useState(false)
  const [selectedRule, setSelectedRule] = useState<AlertRule | null>(null)
  const [ruleName, setRuleName] = useState('')
  const [ruleDescription, setRuleDescription] = useState('')
  const [ruleCondition, setRuleCondition] = useState('')
  const [ruleThreshold, setRuleThreshold] = useState(0)
  const [ruleDuration, setRuleDuration] = useState(5)
  const [ruleSeverity, setRuleSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')
  const [ruleCategory, setRuleCategory] = useState<'system' | 'security' | 'performance' | 'data' | 'integration'>('system')
  const [ruleEnabled, setRuleEnabled] = useState(true)
  const [ruleNotifications, setRuleNotifications] = useState<NotificationChannel[]>([])
  const [ruleCooldown, setRuleCooldown] = useState(30)

  const ALERT_SETTINGS_KEY = 'srs_system_alert_global_settings'
  const [alertSettings, setAlertSettings] = useState({
    enableSystemAlerts: true,
    emailNotifications: true,
    smsNotifications: false,
    defaultRecipients: '',
    alertRetentionDays: 90,
    maxAlertsPerHour: 100
  })
  const [savingAlertSettings, setSavingAlertSettings] = useState(false)

  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null)
  const [templateName, setTemplateName] = useState('')
  const [templateType, setTemplateType] = useState<'email' | 'sms' | 'webhook' | 'slack'>('email')
  const [templateSubject, setTemplateSubject] = useState('')
  const [templateBody, setTemplateBody] = useState('')
  const [templateVariablesStr, setTemplateVariablesStr] = useState('')

  useEffect(() => {
    fetchAlerts()
    fetchAlertRules()
    fetchNotificationTemplates()
  }, [])

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(ALERT_SETTINGS_KEY) : null
      if (raw) {
        const parsed = JSON.parse(raw)
        setAlertSettings(prev => ({ ...prev, ...parsed }))
      }
    } catch (_) {}
  }, [])

  const fetchAlerts = async () => {
    try {
      const data = await systemAlertsApi.getAll(1, 50, {
        status: filterStatus !== 'all' ? filterStatus : undefined,
        category: filterCategory !== 'all' ? filterCategory : undefined,
        priority: filterPriority !== 'all' ? filterPriority : undefined,
      })
      const list = data?.alerts ?? data?.data?.alerts ?? (Array.isArray(data) ? data : [])
      setAlerts(Array.isArray(list) ? list : [])
    } catch (error) {
      console.error('Error fetching alerts:', error)
      toast.error("Failed to fetch system alerts")
    } finally {
      setLoading(false)
    }
  }

  const fetchAlertRules = async () => {
    try {
      const data = await systemAlertsApi.getRules()
      const list = Array.isArray(data) ? data : (data?.rules ?? data?.data ?? [])
      setAlertRules(Array.isArray(list) ? list : [])
    } catch (error) {
      console.error('Error fetching alert rules:', error)
      toast.error("Failed to fetch alert rules")
    }
  }

  const fetchNotificationTemplates = async () => {
    try {
      const data = await systemAlertsApi.getTemplates()
      const list = Array.isArray(data) ? data : (data?.templates ?? data?.data ?? [])
      setTemplates(Array.isArray(list) ? list : [])
    } catch (error) {
      console.error('Error fetching notification templates:', error)
      toast.error("Failed to fetch notification templates")
    }
  }

  const getAlertIcon = (type: string, status: string) => {
    if (status === 'resolved') return <CheckCircle className="h-5 w-5 text-green-500" />
    if (status === 'ignored') return <XCircle className="h-5 w-5 text-gray-500" />
    
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'system':
        return <Server className="h-4 w-4" />
      case 'security':
        return <Shield className="h-4 w-4" />
      case 'performance':
        return <Zap className="h-4 w-4" />
      case 'data':
        return <Database className="h-4 w-4" />
      case 'integration':
        return <Activity className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'destructive'
      case 'high':
        return 'destructive'
      case 'medium':
        return 'default'
      case 'low':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await systemAlertsApi.acknowledge(alertId)
      toast.success("Alert acknowledged successfully")
      fetchAlerts()
    } catch (error) {
      console.error('Error acknowledging alert:', error)
      toast.error("Failed to acknowledge alert")
    }
  }

  const handleResolveAlert = async (alertId: string) => {
    try {
      await systemAlertsApi.resolve(alertId)
      toast.success("Alert resolved successfully")
      fetchAlerts()
    } catch (error) {
      console.error('Error resolving alert:', error)
      toast.error("Failed to resolve alert")
    }
  }

  const handleIgnoreAlert = async (alertId: string) => {
    try {
      await systemAlertsApi.ignore(alertId)
      toast.success("Alert ignored successfully")
      fetchAlerts()
    } catch (error) {
      console.error('Error ignoring alert:', error)
      toast.error("Failed to ignore alert")
    }
  }

  const handleCreateRule = () => {
    setIsCreatingRule(true)
    setSelectedRule(null)
    setRuleName('')
    setRuleDescription('')
    setRuleCondition('')
    setRuleThreshold(0)
    setRuleDuration(5)
    setRuleSeverity('medium')
    setRuleCategory('system')
    setRuleEnabled(true)
    setRuleNotifications([])
    setRuleCooldown(30)
  }

  const handleEditRule = (rule: AlertRule) => {
    setSelectedRule(rule)
    setIsCreatingRule(false)
    setRuleName(rule.name)
    setRuleDescription(rule.description)
    setRuleCondition(rule.condition)
    setRuleThreshold(rule.threshold)
    setRuleDuration(rule.duration)
    setRuleSeverity(rule.severity)
    setRuleCategory(rule.category)
    setRuleEnabled(rule.enabled)
    setRuleNotifications(rule.notifications)
    setRuleCooldown(rule.cooldown)
  }

  const handleSaveRule = async () => {
    const name = (ruleName || '').trim()
    const condition = (ruleCondition || '').trim()
    if (!name || !condition) {
      toast.error("Rule name and condition are required")
      return
    }
    try {
      const ruleData = {
        name,
        description: (ruleDescription || '').trim(),
        condition,
        threshold: Number(ruleThreshold) || 0,
        duration: Number(ruleDuration) || 5,
        severity: ruleSeverity || 'medium',
        category: ruleCategory || 'system',
        enabled: ruleEnabled,
        notifications: Array.isArray(ruleNotifications) ? ruleNotifications : [],
        cooldown: Number(ruleCooldown) || 5
      }

      if (selectedRule) {
        await systemAlertsApi.updateRule(selectedRule.id, ruleData)
        toast.success("Alert rule updated successfully")
      } else {
        await systemAlertsApi.createRule(ruleData)
        toast.success("Alert rule created successfully")
      }

      fetchAlertRules()
      setIsCreatingRule(false)
      setSelectedRule(null)
    } catch (error: any) {
      console.error('Error saving alert rule:', error)
      toast.error(error?.message || "Failed to save alert rule")
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    if (!ruleId) {
      toast.error("Cannot delete: invalid rule")
      return
    }
    if (!confirm('Are you sure you want to delete this alert rule?')) return

    try {
      await systemAlertsApi.deleteRule(ruleId)
      toast.success("Alert rule deleted successfully")
      fetchAlertRules()
    } catch (error: any) {
      console.error('Error deleting alert rule:', error)
      toast.error(error?.message || "Failed to delete alert rule")
    }
  }

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      await systemAlertsApi.toggleRule(ruleId, enabled)
      toast.success(`Alert rule ${enabled ? 'enabled' : 'disabled'} successfully`)
      fetchAlertRules()
    } catch (error) {
      console.error('Error toggling alert rule:', error)
      toast.error("Failed to toggle alert rule")
    }
  }

  const addNotificationChannel = () => {
    const newChannel: NotificationChannel = {
      type: 'email',
      target: '',
      enabled: true
    }
    setRuleNotifications([...ruleNotifications, newChannel])
  }

  const updateNotificationChannel = (index: number, updates: Partial<NotificationChannel>) => {
    const updated = [...ruleNotifications]
    updated[index] = { ...updated[index], ...updates }
    setRuleNotifications(updated)
  }

  const removeNotificationChannel = (index: number) => {
    setRuleNotifications(ruleNotifications.filter((_, i) => i !== index))
  }

  const openCreateTemplate = () => {
    setSelectedTemplate(null)
    setIsCreatingTemplate(true)
    setTemplateName('')
    setTemplateType('email')
    setTemplateSubject('')
    setTemplateBody('')
    setTemplateVariablesStr('')
  }

  const openEditTemplate = (template: NotificationTemplate) => {
    setIsCreatingTemplate(false)
    setSelectedTemplate(template)
    setTemplateName(template.name)
    setTemplateType(template.type as 'email' | 'sms' | 'webhook' | 'slack')
    setTemplateSubject(template.subject || '')
    setTemplateBody(template.body || '')
    setTemplateVariablesStr((template.variables || []).join(', '))
  }

  const handleSaveTemplate = async () => {
    const variables = templateVariablesStr.split(',').map(v => v.trim()).filter(Boolean)
    try {
      if (selectedTemplate) {
        await systemAlertsApi.updateTemplate(selectedTemplate.id, { name: templateName, type: templateType, subject: templateSubject, body: templateBody, variables })
        toast.success('Template updated successfully')
      } else {
        await systemAlertsApi.createTemplate({ name: templateName, type: templateType, subject: templateSubject, body: templateBody, variables })
        toast.success('Template created successfully')
      }
      fetchNotificationTemplates()
      setSelectedTemplate(null)
      setIsCreatingTemplate(false)
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error('Failed to save template')
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return
    try {
      await systemAlertsApi.deleteTemplate(templateId)
      toast.success('Template deleted successfully')
      fetchNotificationTemplates()
      if (selectedTemplate?.id === templateId) {
        setSelectedTemplate(null)
        setIsCreatingTemplate(false)
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error('Failed to delete template')
    }
  }

  const filteredAlerts = alerts.filter(alert => {
    const matchesStatus = filterStatus === 'all' || alert.status === filterStatus
    const matchesCategory = filterCategory === 'all' || alert.category === filterCategory
    const matchesPriority = filterPriority === 'all' || alert.priority === filterPriority
    const matchesSearch = searchTerm === '' || 
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesCategory && matchesPriority && matchesSearch
  })

  const activeAlertsCount = alerts.filter(alert => alert.status === 'active').length
  const criticalAlertsCount = alerts.filter(alert => alert.priority === 'critical' && alert.status === 'active').length

  const handleSaveAlertSettings = () => {
    setSavingAlertSettings(true)
    try {
      localStorage.setItem(ALERT_SETTINGS_KEY, JSON.stringify(alertSettings))
      toast.success('Global alert settings saved')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSavingAlertSettings(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Alerts & Notifications</h1>
          <p className="text-muted-foreground">
            Monitor system health, configure alerts, and manage notifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={criticalAlertsCount > 0 ? 'destructive' : 'secondary'}>
            {criticalAlertsCount} Critical
          </Badge>
          <Badge variant={activeAlertsCount > 0 ? 'default' : 'secondary'}>
            {activeAlertsCount} Active
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
          <TabsTrigger value="rules">Alert Rules</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search alerts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
                
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="acknowledged">Acknowledged</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="ignored">Ignored</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="data">Data</SelectItem>
                    <SelectItem value="integration">Integration</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Alerts List */}
          <div className="space-y-4">
            {filteredAlerts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Active Alerts</h3>
                  <p className="text-muted-foreground text-center">
                    All systems are operating normally
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredAlerts.map((alert) => (
                <Card key={alert.id} className={`border-l-4 ${
                  alert.type === 'critical' ? 'border-l-red-500' :
                  alert.type === 'warning' ? 'border-l-yellow-500' :
                  alert.type === 'info' ? 'border-l-blue-500' :
                  'border-l-green-500'
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getAlertIcon(alert.type, alert.status)}
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{alert.title}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant={getPriorityColor(alert.priority)} className="text-xs">
                              {alert.priority.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                              {getCategoryIcon(alert.category)}
                              {alert.category}
                            </Badge>
                            <Badge variant={alert.status === 'active' ? 'destructive' : 'secondary'} className="text-xs">
                              {alert.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {alert.status === 'active' && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleAcknowledgeAlert(alert.id)}
                            >
                              Acknowledge
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleResolveAlert(alert.id)}
                            >
                              Resolve
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleIgnoreAlert(alert.id)}
                            >
                              Ignore
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-muted-foreground">{alert.message}</p>
                      
                      {alert.affectedSystems.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Affected Systems:</p>
                          <div className="flex flex-wrap gap-1">
                            {alert.affectedSystems.map((system, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {system}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {alert.actionItems && alert.actionItems.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Recommended Actions:</p>
                          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                            {alert.actionItems.map((action, index) => (
                              <li key={index}>{action}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                        <span>Created: {new Date(alert.createdAt).toLocaleString()}</span>
                        <span>Source: {alert.source}</span>
                        {alert.acknowledgedAt && (
                          <span>Acknowledged: {new Date(alert.acknowledgedAt).toLocaleString()}</span>
                        )}
                        {alert.resolvedAt && (
                          <span>Resolved: {new Date(alert.resolvedAt).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Alert Rules</h2>
            <Button onClick={handleCreateRule} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Rule
            </Button>
          </div>

          {(isCreatingRule || selectedRule) && (
            <Card>
              <CardHeader>
                <CardTitle>{selectedRule ? 'Edit Alert Rule' : 'Create Alert Rule'}</CardTitle>
                <CardDescription>
                  Configure conditions and notifications for system alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ruleName">Rule Name</Label>
                    <Input
                      id="ruleName"
                      value={ruleName}
                      onChange={(e) => setRuleName(e.target.value)}
                      placeholder="Enter rule name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ruleCategory">Category</Label>
                    <Select value={ruleCategory} onValueChange={(value: any) => setRuleCategory(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="data">Data</SelectItem>
                        <SelectItem value="integration">Integration</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ruleDescription">Description</Label>
                  <Textarea
                    id="ruleDescription"
                    value={ruleDescription}
                    onChange={(e) => setRuleDescription(e.target.value)}
                    placeholder="Enter rule description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ruleSeverity">Severity</Label>
                    <Select value={ruleSeverity} onValueChange={(value: any) => setRuleSeverity(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ruleThreshold">Threshold</Label>
                    <Input
                      id="ruleThreshold"
                      type="number"
                      value={ruleThreshold}
                      onChange={(e) => setRuleThreshold(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ruleDuration">Duration (minutes)</Label>
                    <Input
                      id="ruleDuration"
                      type="number"
                      value={ruleDuration}
                      onChange={(e) => setRuleDuration(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ruleCondition">Condition</Label>
                  <Textarea
                    id="ruleCondition"
                    value={ruleCondition}
                    onChange={(e) => setRuleCondition(e.target.value)}
                    placeholder="Enter alert condition (e.g., cpu_usage > 80 AND memory_usage > 90)"
                    rows={3}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Notification Channels</Label>
                    <Button onClick={addNotificationChannel} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Channel
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {ruleNotifications.map((channel, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Select 
                          value={channel.type} 
                          onValueChange={(value: any) => updateNotificationChannel(index, { type: value })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="sms">SMS</SelectItem>
                            <SelectItem value="webhook">Webhook</SelectItem>
                            <SelectItem value="slack">Slack</SelectItem>
                          </SelectContent>
                        </Select>

                        <Input
                          placeholder="Target (email, phone, URL, channel)"
                          value={channel.target}
                          onChange={(e) => updateNotificationChannel(index, { target: e.target.value })}
                          className="flex-1"
                        />

                        <Checkbox
                          checked={channel.enabled}
                          onCheckedChange={(checked) => updateNotificationChannel(index, { enabled: checked as boolean })}
                        />

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeNotificationChannel(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ruleEnabled"
                      checked={ruleEnabled}
                      onCheckedChange={(checked) => setRuleEnabled(checked as boolean)}
                    />
                    <Label htmlFor="ruleEnabled">Enable this rule</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="ruleCooldown">Cooldown (minutes)</Label>
                    <Input
                      id="ruleCooldown"
                      type="number"
                      value={ruleCooldown}
                      onChange={(e) => setRuleCooldown(Number(e.target.value))}
                      className="w-20"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <Button onClick={handleSaveRule}>
                    Save Rule
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsCreatingRule(false)
                      setSelectedRule(null)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {alertRules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {rule.name}
                      <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                        {rule.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getCategoryIcon(rule.category)}
                        {rule.category}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{rule.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditRule(rule)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleToggleRule(rule.id, !rule.enabled)}
                    >
                      {rule.enabled ? 'Disable' : 'Enable'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteRule(rule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-4 text-sm">
                      <Badge variant={getPriorityColor(rule.severity)}>
                        {rule.severity.toUpperCase()}
                      </Badge>
                      <span>Threshold: {rule.threshold}</span>
                      <span>Duration: {rule.duration}m</span>
                      <span>Cooldown: {rule.cooldown}m</span>
                      <span>Notifications: {rule.notifications.length}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Condition: {rule.condition}
                    </p>
                    {rule.lastTriggered && (
                      <p className="text-xs text-muted-foreground">
                        Last triggered: {new Date(rule.lastTriggered).toLocaleString()}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Notification Templates</h2>
            <Button className="flex items-center gap-2" onClick={openCreateTemplate}>
              <Plus className="h-4 w-4" />
              Create Template
            </Button>
          </div>

          {(isCreatingTemplate || selectedTemplate) && (
            <Card>
              <CardHeader>
                <CardTitle>{selectedTemplate ? 'Edit Template' : 'Create Template'}</CardTitle>
                <CardDescription>Configure name, type, subject, body and variables for notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Template name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={templateType} onValueChange={(v: 'email' | 'sms' | 'webhook' | 'slack') => setTemplateType(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="webhook">Webhook</SelectItem>
                        <SelectItem value="slack">Slack</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Subject (optional for SMS)</Label>
                  <Input value={templateSubject} onChange={(e) => setTemplateSubject(e.target.value)} placeholder="e.g. System Alert: {{alertTitle}}" />
                </div>
                <div className="space-y-2">
                  <Label>Body</Label>
                  <Textarea value={templateBody} onChange={(e) => setTemplateBody(e.target.value)} placeholder="Use {{variableName}} for placeholders" rows={4} />
                </div>
                <div className="space-y-2">
                  <Label>Variables (comma-separated)</Label>
                  <Input value={templateVariablesStr} onChange={(e) => setTemplateVariablesStr(e.target.value)} placeholder="alertTitle, alertMessage, severity, timestamp" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveTemplate}>Save Template</Button>
                  <Button variant="outline" onClick={() => { setSelectedTemplate(null); setIsCreatingTemplate(false) }}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{template.name}</CardTitle>
                      <CardDescription>Type: {template.type}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{template.type}</Badge>
                      <Button variant="outline" size="sm" onClick={() => openEditTemplate(template)}>Edit</Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteTemplate(template.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-sm font-medium">Subject:</Label>
                      <p className="text-sm text-muted-foreground">{template.subject || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Body:</Label>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{template.body}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Variables:</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(template.variables || []).map((variable, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {variable}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Global Alert Settings</CardTitle>
              <CardDescription>
                Configure system-wide alert and notification settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Enable System Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Turn on/off all system alerts and monitoring
                    </p>
                  </div>
                  <Checkbox
                    checked={alertSettings.enableSystemAlerts}
                    onCheckedChange={(checked) =>
                      setAlertSettings(prev => ({ ...prev, enableSystemAlerts: !!checked }))
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send alert notifications via email
                    </p>
                  </div>
                  <Checkbox
                    checked={alertSettings.emailNotifications}
                    onCheckedChange={(checked) =>
                      setAlertSettings(prev => ({ ...prev, emailNotifications: !!checked }))
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send critical alerts via SMS
                    </p>
                  </div>
                  <Checkbox
                    checked={alertSettings.smsNotifications}
                    onCheckedChange={(checked) =>
                      setAlertSettings(prev => ({ ...prev, smsNotifications: !!checked }))
                    }
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Default Alert Recipients</Label>
                  <Textarea
                    placeholder="Enter email addresses separated by commas"
                    rows={3}
                    value={alertSettings.defaultRecipients}
                    onChange={(e) =>
                      setAlertSettings(prev => ({ ...prev, defaultRecipients: e.target.value }))
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Alert Retention Days</Label>
                    <Input
                      type="number"
                      min={1}
                      value={alertSettings.alertRetentionDays}
                      onChange={(e) =>
                        setAlertSettings(prev => ({
                          ...prev,
                          alertRetentionDays: parseInt(e.target.value, 10) || 90
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Alerts Per Hour</Label>
                    <Input
                      type="number"
                      min={1}
                      value={alertSettings.maxAlertsPerHour}
                      onChange={(e) =>
                        setAlertSettings(prev => ({
                          ...prev,
                          maxAlertsPerHour: parseInt(e.target.value, 10) || 100
                        }))
                      }
                    />
                  </div>
                </div>

                <Button onClick={handleSaveAlertSettings} disabled={savingAlertSettings}>
                  {savingAlertSettings ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
