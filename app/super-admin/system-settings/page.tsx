"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
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
  Settings,
  Mail,
  Shield,
  Palette,
  Clock,
  Globe,
  Database,
  Bell,
  Users,
  FileText,
  Key,
  Server,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Save
} from "lucide-react"
import { toast } from 'sonner'

interface SystemConfig {
  _id?: string
  key: string
  name: string
  value: any
  category: string
  description?: string
  validationRules?: any
  lastModified?: string
}

interface SystemSettings {
  general: SystemConfig[]
  email: SystemConfig[]
  security: SystemConfig[]
  branding: SystemConfig[]
  notifications: SystemConfig[]
  integrations: SystemConfig[]
}

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    general: [],
    email: [],
    security: [],
    branding: [],
    notifications: [],
    integrations: []
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testingEmail, setTestingEmail] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  useEffect(() => {
    fetchSettings()
  }, [])

  const getDefaultSettings = () => ({
    general: [
      { key: 'system_name', name: 'System Name', value: 'Student Revelation System', category: 'general', description: 'Name of the system' },
      { key: 'system_version', name: 'System Version', value: '1.0.0', category: 'general', description: 'Current version' },
      { key: 'time_zone', name: 'Time Zone', value: 'UTC', category: 'general', description: 'Default timezone' },
      { key: 'date_format', name: 'Date Format', value: 'MM/DD/YYYY', category: 'general', description: 'Date display format' },
      { key: 'maintenance_mode', name: 'Maintenance Mode', value: false, category: 'general', description: 'Enable maintenance mode' },
      { key: 'max_file_size', name: 'Max File Size (MB)', value: 50, category: 'general', description: 'Maximum file upload size' },
      { key: 'session_timeout', name: 'Session Timeout (minutes)', value: 60, category: 'general', description: 'User session timeout' }
    ],
    email: [
      { key: 'smtp_host', name: 'SMTP Host', value: '', category: 'email', description: 'Email server host' },
      { key: 'smtp_port', name: 'SMTP Port', value: 587, category: 'email', description: 'Email server port' },
      { key: 'smtp_username', name: 'SMTP Username', value: '', category: 'email', description: 'Email username' },
      { key: 'smtp_password', name: 'SMTP Password', value: '', category: 'email', description: 'Email password' },
      { key: 'smtp_secure', name: 'Use SSL/TLS', value: true, category: 'email', description: 'Enable secure connection' },
      { key: 'from_email', name: 'From Email', value: '', category: 'email', description: 'Default sender email' },
      { key: 'from_name', name: 'From Name', value: 'SRS System', category: 'email', description: 'Default sender name' }
    ],
    security: [
      { key: 'password_min_length', name: 'Min Password Length', value: 8, category: 'security', description: 'Minimum password length' },
      { key: 'password_require_special', name: 'Require Special Characters', value: true, category: 'security', description: 'Password must contain special characters' },
      { key: 'password_require_numbers', name: 'Require Numbers', value: true, category: 'security', description: 'Password must contain numbers' },
      { key: 'max_login_attempts', name: 'Max Login Attempts', value: 5, category: 'security', description: 'Maximum failed login attempts' },
      { key: 'lockout_duration', name: 'Lockout Duration (minutes)', value: 30, category: 'security', description: 'Account lockout duration' },
      { key: 'two_factor_auth', name: 'Two-Factor Authentication', value: false, category: 'security', description: 'Enable 2FA requirement' }
    ],
    branding: [
      { key: 'school_logo', name: 'School Logo URL', value: '', category: 'branding', description: 'URL to school logo' },
      { key: 'primary_color', name: 'Primary Color', value: '#3b82f6', category: 'branding', description: 'Primary brand color' },
      { key: 'secondary_color', name: 'Secondary Color', value: '#6b7280', category: 'branding', description: 'Secondary brand color' },
      { key: 'school_name', name: 'School Name', value: '', category: 'branding', description: 'Official school name' },
      { key: 'school_address', name: 'School Address', value: '', category: 'branding', description: 'School physical address' },
      { key: 'contact_phone', name: 'Contact Phone', value: '', category: 'branding', description: 'Main contact phone' }
    ],
    notifications: [
      { key: 'email_notifications', name: 'Email Notifications', value: true, category: 'notifications', description: 'Enable email notifications' },
      { key: 'sms_notifications', name: 'SMS Notifications', value: false, category: 'notifications', description: 'Enable SMS notifications' },
      { key: 'push_notifications', name: 'Push Notifications', value: true, category: 'notifications', description: 'Enable push notifications' },
      { key: 'notification_frequency', name: 'Notification Frequency', value: 'immediate', category: 'notifications', description: 'How often to send notifications' },
      { key: 'digest_schedule', name: 'Digest Schedule', value: 'daily', category: 'notifications', description: 'Summary email schedule' }
    ],
    integrations: [
      { key: 'google_calendar', name: 'Google Calendar', value: false, category: 'integrations', description: 'Enable Google Calendar integration' },
      { key: 'microsoft_teams', name: 'Microsoft Teams', value: false, category: 'integrations', description: 'Enable Teams integration' },
      { key: 'zoom_integration', name: 'Zoom Integration', value: false, category: 'integrations', description: 'Enable Zoom integration' },
      { key: 'backup_frequency', name: 'Backup Frequency', value: 'daily', category: 'integrations', description: 'Automated backup schedule' },
      { key: 'api_rate_limit', name: 'API Rate Limit', value: 1000, category: 'integrations', description: 'API requests per hour limit' }
    ]
  })

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/system-settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        const payload = data?.data ?? data
        if (payload && typeof payload === 'object' && payload.settings) {
          const { settings: apiSettings } = payload
          setSettings({
            general: Array.isArray(apiSettings.general) ? apiSettings.general : [],
            email: Array.isArray(apiSettings.email) ? apiSettings.email : [],
            security: Array.isArray(apiSettings.security) ? apiSettings.security : [],
            branding: Array.isArray(apiSettings.branding) ? apiSettings.branding : [],
            notifications: Array.isArray(apiSettings.notifications) ? apiSettings.notifications : [],
            integrations: Array.isArray(apiSettings.integrations) ? apiSettings.integrations : [],
          })
        } else if (payload && typeof payload === 'object' && payload.general && Array.isArray(payload.general)) {
          setSettings({
            general: payload.general ?? [],
            email: payload.email ?? [],
            security: payload.security ?? [],
            branding: payload.branding ?? [],
            notifications: payload.notifications ?? [],
            integrations: payload.integrations ?? [],
          })
        } else {
          const defaultSettings = getDefaultSettings()
          setSettings(defaultSettings)
        }
      } else {
        console.error(`API request failed with status: ${response.status}`)
        const defaultSettings = getDefaultSettings()
        setSettings(defaultSettings)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      // On error, fallback to default settings
      const defaultSettings = getDefaultSettings()
      setSettings(defaultSettings)
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: prev[category as keyof SystemSettings].map(setting =>
        setting.key === key ? { ...setting, value } : setting
      )
    }))
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      const url = `${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/system-settings`
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      })

      if (response.ok) {
        toast.success('Settings saved successfully')
        await fetchSettings()
      } else {
        const err = await response.json().catch(() => ({}))
        const message = err?.message || (response.status === 401 ? 'Please sign in again' : response.status === 400 ? 'Invalid request. Check your data.' : `Failed to save (${response.status})`)
        toast.error(message)
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      const msg = error instanceof Error ? error.message : 'Network or server error'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const testEmail = async () => {
    try {
      setTestingEmail(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/test-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        toast.success('Test email sent successfully')
      } else {
        toast.error('Failed to send test email')
      }
    } catch (error) {
      console.error('Error sending test email:', error)
      toast.error('Error sending test email')
    } finally {
      setTestingEmail(false)
    }
  }

  const resetToDefaults = async () => {
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      try {
        const token = localStorage.getItem('token')
        const categories = ['general', 'email', 'security', 'branding', 'notifications', 'integrations']
        for (const category of categories) {
          const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/system-settings/reset`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ category }),
          })
          if (!response.ok) {
            toast.error(`Failed to reset ${category} settings`)
            return
          }
        }
        toast.success('Settings reset to defaults')
        await fetchSettings()
      } catch (error) {
        console.error('Error resetting settings:', error)
        toast.error('Error resetting settings')
      }
    }
  }

  const renderSetting = (setting: SystemConfig, category: string) => {
    const { key, name, value, description } = setting

    if (typeof value === 'boolean') {
      return (
        <div key={key} className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor={key}>{name}</Label>
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            <Switch
              id={key}
              checked={value}
              onCheckedChange={(checked) => updateSetting(category, key, checked)}
            />
          </div>
        </div>
      )
    }

    if (key === 'notification_frequency' || key === 'digest_schedule' || key === 'backup_frequency') {
      const options = key === 'notification_frequency' 
        ? [{ value: 'immediate', label: 'Immediate' }, { value: 'hourly', label: 'Hourly' }, { value: 'daily', label: 'Daily' }]
        : key === 'digest_schedule'
        ? [{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }]
        : [{ value: 'hourly', label: 'Hourly' }, { value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }]

      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={key}>{name}</Label>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
          <Select value={value} onValueChange={(newValue) => updateSetting(category, key, newValue)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    }

    if (key.includes('color')) {
      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={key}>{name}</Label>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
          <div className="flex items-center space-x-2">
            <Input
              id={key}
              type="color"
              value={value}
              onChange={(e) => updateSetting(category, key, e.target.value)}
              className="w-16 h-10"
            />
            <Input
              type="text"
              value={value}
              onChange={(e) => updateSetting(category, key, e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
      )
    }

    if (key.includes('address') || key.includes('description')) {
      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={key}>{name}</Label>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
          <Textarea
            id={key}
            value={value}
            onChange={(e) => updateSetting(category, key, e.target.value)}
            rows={3}
          />
        </div>
      )
    }

    if (key.includes('password')) {
      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={key}>{name}</Label>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
          <Input
            id={key}
            type="password"
            value={value}
            onChange={(e) => updateSetting(category, key, e.target.value)}
          />
        </div>
      )
    }

    if (typeof value === 'number') {
      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={key}>{name}</Label>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
          <Input
            id={key}
            type="number"
            value={value}
            onChange={(e) => updateSetting(category, key, parseInt(e.target.value))}
          />
        </div>
      )
    }

    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={key}>{name}</Label>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        <Input
          id={key}
          type="text"
          value={value}
          onChange={(e) => updateSetting(category, key, e.target.value)}
        />
      </div>
    )
  }

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'general': return <Settings className="h-4 w-4" />
      case 'email': return <Mail className="h-4 w-4" />
      case 'security': return <Shield className="h-4 w-4" />
      case 'branding': return <Palette className="h-4 w-4" />
      case 'notifications': return <Bell className="h-4 w-4" />
      case 'integrations': return <Database className="h-4 w-4" />
      default: return <Settings className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading system settings...</span>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground">Configure system-wide settings and preferences</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={resetToDefaults}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={saveSettings} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general" className="flex items-center space-x-2">
            {getTabIcon('general')}
            <span>General</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center space-x-2">
            {getTabIcon('email')}
            <span>Email</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            {getTabIcon('security')}
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center space-x-2">
            {getTabIcon('branding')}
            <span>Branding</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            {getTabIcon('notifications')}
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center space-x-2">
            {getTabIcon('integrations')}
            <span>Integrations</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic system configuration and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings.general.map((setting) => renderSetting(setting, 'general'))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>SMTP settings for sending system emails</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings.email.map((setting) => renderSetting(setting, 'email'))}
              <div className="pt-4 border-t">
                <Button onClick={testEmail} disabled={testingEmail} variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  {testingEmail ? 'Sending...' : 'Send Test Email'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Password policies and authentication settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings.security.map((setting) => renderSetting(setting, 'security'))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Branding & Appearance</CardTitle>
              <CardDescription>Customize the look and feel of your system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings.branding.map((setting) => renderSetting(setting, 'branding'))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure how and when notifications are sent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings.notifications.map((setting) => renderSetting(setting, 'notifications'))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Integrations & Services</CardTitle>
              <CardDescription>Third-party integrations and system services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings.integrations.map((setting) => renderSetting(setting, 'integrations'))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}