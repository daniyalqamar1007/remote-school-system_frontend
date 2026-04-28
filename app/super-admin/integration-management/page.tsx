export default function IntegrationManagementPage() {
  return null
}
// import { useRouter } from 'next/navigation'
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Checkbox } from "@/components/ui/checkbox"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Badge } from "@/components/ui/badge"
// import { Textarea } from "@/components/ui/textarea"
// import { Separator } from "@/components/ui/separator"
// import { ScrollArea } from "@/components/ui/scroll-area"
// import { Alert, AlertDescription } from "@/components/ui/alert"
// import { toast } from 'sonner'
// import { integrationsApi } from '@/lib/api'
// import { 
//   Plus, 
//   Trash2, 
//   Settings, 
//   Plug,
//   PlugZap,
//   Power,
//   PowerOff,
//   Link,
//   Unlink,
//   RefreshCw,
//   CheckCircle,
//   XCircle,
//   AlertTriangle,
//   Activity,
//   Clock,
//   BarChart3,
//   Eye,
//   Edit,
//   TestTube,
//   Play,
//   Pause
// } from 'lucide-react'

// const GLOBAL_SETTINGS_KEY = 'srs_integration_global_settings'

// interface Integration {
//   id: string
//   name: string
//   type: 'lms' | 'sis' | 'financial' | 'transportation' | 'assessment' | 'communication' | 'hr' | 'library' | 'reporting' | 'medical' | 'other'
//   status: 'active' | 'inactive' | 'error' | 'testing'
//   provider: string
//   version: string
//   endpoint: string
//   authType: 'api-key' | 'oauth2' | 'basic' | 'bearer'
//   credentials: Record<string, any>
//   lastSync: string
//   nextSync?: string
//   syncFrequency: 'real-time' | 'hourly' | 'daily' | 'weekly' | 'manual'
//   dataDirection: 'import' | 'export' | 'bidirectional'
//   mappedFields: FieldMapping[]
//   settings: IntegrationSettings
//   metrics: IntegrationMetrics
//   createdAt: string
//   lastModified: string
// }

// interface FieldMapping {
//   localField: string
//   remoteField: string
//   dataType: string
//   required: boolean
//   transformation?: string
// }

// interface IntegrationSettings {
//   timeout: number
//   retryAttempts: number
//   batchSize: number
//   enableLogging: boolean
//   validateData: boolean
//   autoSync: boolean
//   notifications: boolean
// }

// interface IntegrationMetrics {
//   totalSyncs: number
//   successfulSyncs: number
//   failedSyncs: number
//   lastSyncDuration: number
//   averageSyncTime: number
//   recordsProcessed: number
//   errorRate: number
// }

// interface SyncLog {
//   id: string
//   integrationId: string
//   startTime: string
//   endTime?: string
//   status: 'running' | 'completed' | 'failed' | 'cancelled'
//   recordsProcessed: number
//   recordsSuccessful: number
//   recordsFailed: number
//   errors: string[]
//   duration: number
// }

// export default function IntegrationManagementPage() {
//   const router = useRouter()

//   useEffect(() => {
//     router.replace('/super-admin/dashboard')
//   }, [router])

//   return null

//   const [integrations, setIntegrations] = useState<Integration[]>([])
//   const [syncLogs, setSyncLogs] = useState<SyncLog[]>([])
//   const [loading, setLoading] = useState(true)
//   const [activeTab, setActiveTab] = useState('integrations')

//   // Form states
//   const [isCreating, setIsCreating] = useState(false)
//   const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
//   const [integrationName, setIntegrationName] = useState('')
//   const [integrationType, setIntegrationType] = useState<Integration['type']>('lms')
//   const [integrationProvider, setIntegrationProvider] = useState('')
//   const [integrationEndpoint, setIntegrationEndpoint] = useState('')
//   const [integrationAuthType, setIntegrationAuthType] = useState<Integration['authType']>('api-key')
//   const [integrationCredentials, setIntegrationCredentials] = useState<Record<string, any>>({})
//   const [integrationSyncFreq, setIntegrationSyncFreq] = useState<Integration['syncFrequency']>('daily')
//   const [integrationDataDirection, setIntegrationDataDirection] = useState<Integration['dataDirection']>('bidirectional')
//   const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([])
//   const [integrationSettings, setIntegrationSettings] = useState<IntegrationSettings>({
//     timeout: 30000,
//     retryAttempts: 3,
//     batchSize: 100,
//     enableLogging: true,
//     validateData: true,
//     autoSync: true,
//     notifications: true
//   })

//   const [globalSettings, setGlobalSettings] = useState({
//     enableIntegrations: true,
//     autoRetry: true,
//     defaultTimeout: 30,
//     maxRetryAttempts: 3,
//     logRetentionDays: 90
//   })
//   const [savingSettings, setSavingSettings] = useState(false)

//   useEffect(() => {
//     fetchIntegrations()
//     fetchSyncLogs()
//   }, [])

//   useEffect(() => {
//     try {
//       const raw = typeof window !== 'undefined' ? localStorage.getItem(GLOBAL_SETTINGS_KEY) : null
//       if (raw) {
//         const parsed = JSON.parse(raw)
//         setGlobalSettings(prev => ({ ...prev, ...parsed }))
//       }
//     } catch (_) {}
//   }, [])

//   const getBaseUrl = () => process.env.NEXT_PUBLIC_SRS_SERVER || ''
//   const getAuthHeaders = () => {
//     const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
//     return {
//       'Content-Type': 'application/json',
//       ...(token ? { Authorization: `Bearer ${token}` } : {}),
//     }
//   }

//   const fetchIntegrations = async () => {
//     try {
//       const data = await integrationsApi.getAll(1, 100)
//       const list = data?.integrations ?? data?.data?.integrations ?? (Array.isArray(data) ? data : [])
//       setIntegrations(Array.isArray(list) ? list : [])
//     } catch (error) {
//       console.error('Error fetching integrations:', error)
//       setIntegrations([])
//       toast.error('Failed to load integrations')
//     } finally {
//       setLoading(false)
//     }
//   }

//   const fetchSyncLogs = async () => {
//     try {
//       const data = await integrationsApi.getLogs(1, 50)
//       const list = data?.logs ?? data?.data?.logs ?? (Array.isArray(data) ? data : [])
//       setSyncLogs(Array.isArray(list) ? list : [])
//     } catch (error) {
//       console.error('Error fetching sync logs:', error)
//       setSyncLogs([])
//     }
//   }

//   const getIntegrationStatusIcon = (status: string) => {
//     switch (status) {
//       case 'active':
//         return <CheckCircle className="h-5 w-5 text-green-500" />
//       case 'inactive':
//         return <PowerOff className="h-5 w-5 text-gray-500" />
//       case 'error':
//         return <XCircle className="h-5 w-5 text-red-500" />
//       case 'testing':
//         return <TestTube className="h-5 w-5 text-blue-500" />
//       default:
//         return <Plug className="h-5 w-5 text-gray-500" />
//     }
//   }

//   const getIntegrationTypeIcon = (type: string) => {
//     switch (type) {
//       case 'lms':
//         return <BarChart3 className="h-4 w-4" />
//       case 'financial':
//         return <Activity className="h-4 w-4" />
//       case 'transportation':
//         return <Activity className="h-4 w-4" />
//       case 'assessment':
//         return <Activity className="h-4 w-4" />
//       case 'communication':
//         return <Activity className="h-4 w-4" />
//       case 'hr':
//         return <Activity className="h-4 w-4" />
//       case 'library':
//         return <Activity className="h-4 w-4" />
//       case 'medical':
//         return <Activity className="h-4 w-4" />
//       default:
//         return <Plug className="h-4 w-4" />
//     }
//   }

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'active':
//         return 'default'
//       case 'inactive':
//         return 'secondary'
//       case 'error':
//         return 'destructive'
//       case 'testing':
//         return 'outline'
//       default:
//         return 'secondary'
//     }
//   }

//   const handleCreateIntegration = () => {
//     setIsCreating(true)
//     setSelectedIntegration(null)
//     setIntegrationName('')
//     setIntegrationType('lms')
//     setIntegrationProvider('')
//     setIntegrationEndpoint('')
//     setIntegrationAuthType('api-key')
//     setIntegrationCredentials({})
//     setIntegrationSyncFreq('daily')
//     setIntegrationDataDirection('bidirectional')
//     setFieldMappings([])
//     setIntegrationSettings({
//       timeout: 30000,
//       retryAttempts: 3,
//       batchSize: 100,
//       enableLogging: true,
//       validateData: true,
//       autoSync: true,
//       notifications: true
//     })
//   }

//   const handleEditIntegration = (integration: Integration) => {
//     setSelectedIntegration(integration)
//     setIsCreating(false)
//     setIntegrationName(integration.name)
//     setIntegrationType(integration.type)
//     setIntegrationProvider(integration.provider)
//     setIntegrationEndpoint(integration.endpoint)
//     setIntegrationAuthType(
//       integration.authType === 'basic-auth' ? 'basic' : integration.authType === 'jwt' ? 'bearer' : (integration.authType as any)
//     )
//     setIntegrationCredentials(integration.credentials || {})
//     setIntegrationSyncFreq(integration.syncFrequency)
//     setIntegrationDataDirection(integration.dataDirection)
//     setFieldMappings(integration.mappedFields)
//     setIntegrationSettings(integration.settings)
//   }

//   const mapAuthTypeToBackend = (t: string) => {
//     if (t === 'basic') return 'basic-auth'
//     if (t === 'bearer') return 'jwt'
//     return t
//   }
//   const mapSyncFreqToBackend = (f: string) => (f === 'real-time' ? 'manual' : f)

//   const handleSaveIntegration = async () => {
//     if (!integrationName?.trim() || !integrationProvider?.trim() || !integrationEndpoint?.trim()) {
//       alert('Please fill in Name, Provider, and API Endpoint.')
//       return
//     }
//     try {
//       const integrationData = {
//         name: integrationName.trim(),
//         type: integrationType,
//         provider: integrationProvider.trim(),
//         endpoint: integrationEndpoint.trim(),
//         authType: mapAuthTypeToBackend(integrationAuthType),
//         credentials: integrationCredentials,
//         syncFrequency: mapSyncFreqToBackend(integrationSyncFreq),
//         dataDirection: integrationDataDirection,
//         mappedFields: fieldMappings,
//         settings: integrationSettings
//       }

//       const url = selectedIntegration
//         ? `${getBaseUrl()}/super-admin/integrations/${selectedIntegration.id}`
//         : `${getBaseUrl()}/super-admin/integrations`
//       const method = selectedIntegration ? 'PUT' : 'POST'

//       const response = await fetch(url, {
//         method,
//         headers: getAuthHeaders(),
//         body: JSON.stringify(integrationData),
//       })

//       if (response.ok) {
//         fetchIntegrations()
//         setIsCreating(false)
//         setSelectedIntegration(null)
//         return
//       }
//       const err = await response.json().catch(() => ({}))
//       const msg = err?.message || err?.error || (Array.isArray(err?.message) ? err.message.join(', ') : null) || response.statusText
//       alert(`Save failed: ${msg || response.status}`)
//     } catch (error) {
//       console.error('Error saving integration:', error)
//       alert('Error saving integration. Check console or network.')
//     }
//   }

//   const handleTestConnection = async (integrationId: string) => {
//     try {
//       const response = await fetch(`${getBaseUrl()}/super-admin/integrations/${integrationId}/test`, {
//         method: 'POST',
//         headers: getAuthHeaders(),
//       })
//       if (response.ok) {
//         const result = await response.json()
//         const payload = result?.data ?? result
//         const success = payload?.success ?? result?.success
//         const message = payload?.message ?? result?.message
//         alert(success ? 'Connection test successful!' : `Connection test failed: ${message || 'Unknown error'}`)
//       } else {
//         alert('Connection test failed')
//       }
//     } catch (error) {
//       console.error('Error testing connection:', error)
//       alert('Error testing connection')
//     }
//   }

//   const handleSyncNow = async (integrationId: string) => {
//     try {
//       const response = await fetch(`${getBaseUrl()}/super-admin/integrations/${integrationId}/sync`, {
//         method: 'POST',
//         headers: getAuthHeaders(),
//       })
//       if (response.ok) {
//         fetchIntegrations()
//         fetchSyncLogs()
//       }
//     } catch (error) {
//       console.error('Error starting sync:', error)
//     }
//   }

//   const handleToggleIntegration = async (integrationId: string, active: boolean) => {
//     try {
//       const response = await fetch(`${getBaseUrl()}/super-admin/integrations/${integrationId}/toggle`, {
//         method: 'POST',
//         headers: getAuthHeaders(),
//         body: JSON.stringify({ active }),
//       })
//       if (response.ok) {
//         fetchIntegrations()
//       }
//     } catch (error) {
//       console.error('Error toggling integration:', error)
//     }
//   }

//   const handleDeleteIntegration = async (integrationId: string) => {
//     if (!confirm('Are you sure you want to delete this integration?')) return

//     try {
//       const response = await fetch(`${getBaseUrl()}/super-admin/integrations/${integrationId}`, {
//         method: 'DELETE',
//         headers: getAuthHeaders(),
//       })
//       if (response.ok) {
//         fetchIntegrations()
//       }
//     } catch (error) {
//       console.error('Error deleting integration:', error)
//     }
//   }

//   const addFieldMapping = () => {
//     const newMapping: FieldMapping = {
//       localField: '',
//       remoteField: '',
//       dataType: 'string',
//       required: false
//     }
//     setFieldMappings([...fieldMappings, newMapping])
//   }

//   const updateFieldMapping = (index: number, updates: Partial<FieldMapping>) => {
//     const updated = [...fieldMappings]
//     updated[index] = { ...updated[index], ...updates }
//     setFieldMappings(updated)
//   }

//   const removeFieldMapping = (index: number) => {
//     setFieldMappings(fieldMappings.filter((_, i) => i !== index))
//   }

//   const activeIntegrationsCount = integrations.filter(int => int.status === 'active').length
//   const errorIntegrationsCount = integrations.filter(int => int.status === 'error').length

//   const handleSaveGlobalSettings = () => {
//     setSavingSettings(true)
//     try {
//       localStorage.setItem(GLOBAL_SETTINGS_KEY, JSON.stringify(globalSettings))
//       toast.success('Global integration settings saved')
//     } catch {
//       toast.error('Failed to save settings')
//     } finally {
//       setSavingSettings(false)
//     }
//   }

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-96">
//         <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
//       </div>
//     )
//   }

//   return (
//     <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
//       <div className="flex justify-between items-center">
//         <div>
//           <h1 className="text-3xl font-bold tracking-tight">Integration Management</h1>
//           <p className="text-muted-foreground">
//             Configure and monitor third-party system integrations
//           </p>
//         </div>
//         <div className="flex items-center gap-2">
//           <Badge variant={errorIntegrationsCount > 0 ? 'destructive' : 'secondary'}>
//             {errorIntegrationsCount} Errors
//           </Badge>
//           <Badge variant="default">
//             {activeIntegrationsCount} Active
//           </Badge>
//         </div>
//       </div>

//       <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
//         <TabsList>
//           <TabsTrigger value="integrations">Integrations</TabsTrigger>
//           <TabsTrigger value="logs">Sync Logs</TabsTrigger>
//           <TabsTrigger value="settings">Settings</TabsTrigger>
//         </TabsList>

//         <TabsContent value="integrations" className="space-y-6">
//           <div className="flex justify-between items-center">
//             <h2 className="text-2xl font-bold">System Integrations</h2>
//             <Button onClick={handleCreateIntegration} className="flex items-center gap-2">
//               <Plus className="h-4 w-4" />
//               Add Integration
//             </Button>
//           </div>

//           {(isCreating || selectedIntegration) && (
//             <Card>
//               <CardHeader>
//                 <CardTitle>{selectedIntegration ? 'Edit Integration' : 'Add Integration'}</CardTitle>
//                 <CardDescription>
//                   Configure connection settings and data mapping for third-party systems
//                 </CardDescription>
//               </CardHeader>
//               <CardContent className="space-y-6">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div className="space-y-2">
//                     <Label htmlFor="integrationName">Integration Name</Label>
//                     <Input
//                       id="integrationName"
//                       value={integrationName}
//                       onChange={(e) => setIntegrationName(e.target.value)}
//                       placeholder="Enter integration name"
//                     />
//                   </div>
//                   <div className="space-y-2">
//                     <Label htmlFor="integrationType">Type</Label>
//                     <Select value={integrationType} onValueChange={(value: any) => setIntegrationType(value)}>
//                       <SelectTrigger>
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="lms">Learning Management System</SelectItem>
//                         <SelectItem value="sis">Student Information System</SelectItem>
//                         <SelectItem value="reporting">Report System</SelectItem>
//                         <SelectItem value="financial">Financial System</SelectItem>
//                         <SelectItem value="transportation">Transportation System</SelectItem>
//                         <SelectItem value="assessment">Assessment Platform</SelectItem>
//                         <SelectItem value="communication">Communication Tool</SelectItem>
//                         <SelectItem value="hr">HR System</SelectItem>
//                         <SelectItem value="library">Library System</SelectItem>
//                         <SelectItem value="medical">Medical System</SelectItem>
//                         <SelectItem value="other">Other</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div className="space-y-2">
//                     <Label htmlFor="integrationProvider">Provider</Label>
//                     <Input
//                       id="integrationProvider"
//                       value={integrationProvider}
//                       onChange={(e) => setIntegrationProvider(e.target.value)}
//                       placeholder="e.g., Google Classroom, PowerSchool"
//                     />
//                   </div>
//                   <div className="space-y-2">
//                     <Label htmlFor="integrationEndpoint">API Endpoint</Label>
//                     <Input
//                       id="integrationEndpoint"
//                       value={integrationEndpoint}
//                       onChange={(e) => setIntegrationEndpoint(e.target.value)}
//                       placeholder="https://api.example.com/v1"
//                     />
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   <div className="space-y-2">
//                     <Label htmlFor="integrationAuthType">Authentication</Label>
//                     <Select value={integrationAuthType} onValueChange={(value: any) => setIntegrationAuthType(value)}>
//                       <SelectTrigger>
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="api-key">API Key</SelectItem>
//                         <SelectItem value="oauth2">OAuth 2.0</SelectItem>
//                         <SelectItem value="basic">Basic Auth</SelectItem>
//                         <SelectItem value="bearer">Bearer Token</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>
//                   <div className="space-y-2">
//                     <Label htmlFor="integrationSyncFreq">Sync Frequency</Label>
//                     <Select value={integrationSyncFreq} onValueChange={(value: any) => setIntegrationSyncFreq(value)}>
//                       <SelectTrigger>
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="real-time">Real-time</SelectItem>
//                         <SelectItem value="hourly">Hourly</SelectItem>
//                         <SelectItem value="daily">Daily</SelectItem>
//                         <SelectItem value="weekly">Weekly</SelectItem>
//                         <SelectItem value="manual">Manual</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>
//                   <div className="space-y-2">
//                     <Label htmlFor="integrationDataDirection">Data Direction</Label>
//                     <Select value={integrationDataDirection} onValueChange={(value: any) => setIntegrationDataDirection(value)}>
//                       <SelectTrigger>
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="import">Import Only</SelectItem>
//                         <SelectItem value="export">Export Only</SelectItem>
//                         <SelectItem value="bidirectional">Bidirectional</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>
//                 </div>

//                 <Separator />

//                 {/* Credentials Section */}
//                 <div className="space-y-4">
//                   <h3 className="text-lg font-semibold">Authentication Credentials</h3>
                  
//                   {integrationAuthType === 'api-key' && (
//                     <div className="space-y-2">
//                       <Label htmlFor="apiKey">API Key</Label>
//                       <Input
//                         id="apiKey"
//                         type="password"
//                         value={integrationCredentials.apiKey || ''}
//                         onChange={(e) => setIntegrationCredentials({...integrationCredentials, apiKey: e.target.value})}
//                         placeholder="Enter API key"
//                       />
//                     </div>
//                   )}

//                   {integrationAuthType === 'basic' && (
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                       <div className="space-y-2">
//                         <Label htmlFor="username">Username</Label>
//                         <Input
//                           id="username"
//                           value={integrationCredentials.username || ''}
//                           onChange={(e) => setIntegrationCredentials({...integrationCredentials, username: e.target.value})}
//                           placeholder="Enter username"
//                         />
//                       </div>
//                       <div className="space-y-2">
//                         <Label htmlFor="password">Password</Label>
//                         <Input
//                           id="password"
//                           type="password"
//                           value={integrationCredentials.password || ''}
//                           onChange={(e) => setIntegrationCredentials({...integrationCredentials, password: e.target.value})}
//                           placeholder="Enter password"
//                         />
//                       </div>
//                     </div>
//                   )}

//                   {integrationAuthType === 'oauth2' && (
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                       <div className="space-y-2">
//                         <Label htmlFor="clientId">Client ID</Label>
//                         <Input
//                           id="clientId"
//                           value={integrationCredentials.clientId || ''}
//                           onChange={(e) => setIntegrationCredentials({...integrationCredentials, clientId: e.target.value})}
//                           placeholder="Enter client ID"
//                         />
//                       </div>
//                       <div className="space-y-2">
//                         <Label htmlFor="clientSecret">Client Secret</Label>
//                         <Input
//                           id="clientSecret"
//                           type="password"
//                           value={integrationCredentials.clientSecret || ''}
//                           onChange={(e) => setIntegrationCredentials({...integrationCredentials, clientSecret: e.target.value})}
//                           placeholder="Enter client secret"
//                         />
//                       </div>
//                     </div>
//                   )}

//                   {integrationAuthType === 'bearer' && (
//                     <div className="space-y-2">
//                       <Label htmlFor="bearerToken">Bearer Token</Label>
//                       <Input
//                         id="bearerToken"
//                         type="password"
//                         value={integrationCredentials.bearerToken || ''}
//                         onChange={(e) => setIntegrationCredentials({...integrationCredentials, bearerToken: e.target.value})}
//                         placeholder="Enter bearer token"
//                       />
//                     </div>
//                   )}
//                 </div>

//                 <Separator />

//                 {/* Field Mapping */}
//                 <div className="space-y-4">
//                   <div className="flex items-center justify-between">
//                     <h3 className="text-lg font-semibold">Field Mapping</h3>
//                     <Button onClick={addFieldMapping} size="sm" variant="outline">
//                       <Plus className="h-4 w-4 mr-2" />
//                       Add Mapping
//                     </Button>
//                   </div>

//                   <div className="space-y-3">
//                     {fieldMappings.map((mapping, index) => (
//                       <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
//                         <Input
//                           placeholder="Local field"
//                           value={mapping.localField}
//                           onChange={(e) => updateFieldMapping(index, { localField: e.target.value })}
//                           className="flex-1"
//                         />
//                         <span className="text-muted-foreground">→</span>
//                         <Input
//                           placeholder="Remote field"
//                           value={mapping.remoteField}
//                           onChange={(e) => updateFieldMapping(index, { remoteField: e.target.value })}
//                           className="flex-1"
//                         />
//                         <Select 
//                           value={mapping.dataType} 
//                           onValueChange={(value) => updateFieldMapping(index, { dataType: value })}
//                         >
//                           <SelectTrigger className="w-24">
//                             <SelectValue />
//                           </SelectTrigger>
//                           <SelectContent>
//                             <SelectItem value="string">String</SelectItem>
//                             <SelectItem value="number">Number</SelectItem>
//                             <SelectItem value="date">Date</SelectItem>
//                             <SelectItem value="boolean">Boolean</SelectItem>
//                           </SelectContent>
//                         </Select>
//                         <Checkbox
//                           checked={mapping.required}
//                           onCheckedChange={(checked) => updateFieldMapping(index, { required: checked as boolean })}
//                         />
//                         <Button
//                           variant="outline"
//                           size="sm"
//                           onClick={() => removeFieldMapping(index)}
//                         >
//                           <Trash2 className="h-4 w-4" />
//                         </Button>
//                       </div>
//                     ))}
//                   </div>
//                 </div>

//                 <Separator />

//                 {/* Integration Settings */}
//                 <div className="space-y-4">
//                   <h3 className="text-lg font-semibold">Settings</h3>
                  
//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                     <div className="space-y-2">
//                       <Label htmlFor="timeout">Timeout (ms)</Label>
//                       <Input
//                         id="timeout"
//                         type="number"
//                         value={integrationSettings.timeout}
//                         onChange={(e) => setIntegrationSettings({...integrationSettings, timeout: Number(e.target.value)})}
//                       />
//                     </div>
//                     <div className="space-y-2">
//                       <Label htmlFor="retryAttempts">Retry Attempts</Label>
//                       <Input
//                         id="retryAttempts"
//                         type="number"
//                         value={integrationSettings.retryAttempts}
//                         onChange={(e) => setIntegrationSettings({...integrationSettings, retryAttempts: Number(e.target.value)})}
//                       />
//                     </div>
//                     <div className="space-y-2">
//                       <Label htmlFor="batchSize">Batch Size</Label>
//                       <Input
//                         id="batchSize"
//                         type="number"
//                         value={integrationSettings.batchSize}
//                         onChange={(e) => setIntegrationSettings({...integrationSettings, batchSize: Number(e.target.value)})}
//                       />
//                     </div>
//                   </div>

//                   <div className="flex flex-wrap gap-4">
//                     <div className="flex items-center space-x-2">
//                       <Checkbox
//                         id="enableLogging"
//                         checked={integrationSettings.enableLogging}
//                         onCheckedChange={(checked) => setIntegrationSettings({...integrationSettings, enableLogging: checked as boolean})}
//                       />
//                       <Label htmlFor="enableLogging">Enable Logging</Label>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                       <Checkbox
//                         id="validateData"
//                         checked={integrationSettings.validateData}
//                         onCheckedChange={(checked) => setIntegrationSettings({...integrationSettings, validateData: checked as boolean})}
//                       />
//                       <Label htmlFor="validateData">Validate Data</Label>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                       <Checkbox
//                         id="autoSync"
//                         checked={integrationSettings.autoSync}
//                         onCheckedChange={(checked) => setIntegrationSettings({...integrationSettings, autoSync: checked as boolean})}
//                       />
//                       <Label htmlFor="autoSync">Auto Sync</Label>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                       <Checkbox
//                         id="notifications"
//                         checked={integrationSettings.notifications}
//                         onCheckedChange={(checked) => setIntegrationSettings({...integrationSettings, notifications: checked as boolean})}
//                       />
//                       <Label htmlFor="notifications">Notifications</Label>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-4 pt-4">
//                   <Button onClick={handleSaveIntegration}>
//                     Save Integration
//                   </Button>
//                   <Button 
//                     variant="outline" 
//                     onClick={() => {
//                       setIsCreating(false)
//                       setSelectedIntegration(null)
//                     }}
//                   >
//                     Cancel
//                   </Button>
//                 </div>
//               </CardContent>
//             </Card>
//           )}

//           <div className="grid gap-4">
//             {integrations.length === 0 ? (
//               <Card>
//                 <CardContent className="flex flex-col items-center justify-center py-12">
//                   <Plug className="h-12 w-12 text-muted-foreground mb-4" />
//                   <h3 className="text-lg font-semibold mb-2">No Integrations</h3>
//                   <p className="text-muted-foreground text-center mb-4">
//                     Get started by adding your first system integration
//                   </p>
//                   <Button onClick={handleCreateIntegration} className="flex items-center gap-2">
//                     <Plus className="h-4 w-4" />
//                     Add Integration
//                   </Button>
//                 </CardContent>
//               </Card>
//             ) : (
//               integrations.map((integration) => (
//                 <Card key={integration.id} className={`border-l-4 ${
//                   integration.status === 'active' ? 'border-l-green-500' :
//                   integration.status === 'error' ? 'border-l-red-500' :
//                   integration.status === 'testing' ? 'border-l-blue-500' :
//                   'border-l-gray-500'
//                 }`}>
//                   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                     <div className="space-y-1">
//                       <CardTitle className="flex items-center gap-2">
//                         {getIntegrationStatusIcon(integration.status)}
//                         {integration.name}
//                         <Badge variant={getStatusColor(integration.status) as any}>
//                           {integration.status}
//                         </Badge>
//                         <Badge variant="outline" className="flex items-center gap-1">
//                           {getIntegrationTypeIcon(integration.type)}
//                           {integration.type}
//                         </Badge>
//                       </CardTitle>
//                       <CardDescription>
//                         {integration.provider} • {integration.version} • {integration.dataDirection}
//                       </CardDescription>
//                     </div>
//                     <div className="flex items-center gap-2">
//                       <Button 
//                         variant="outline" 
//                         size="sm"
//                         onClick={() => handleTestConnection(integration.id)}
//                       >
//                         <TestTube className="h-4 w-4" />
//                       </Button>
//                       <Button 
//                         variant="outline" 
//                         size="sm"
//                         onClick={() => handleSyncNow(integration.id)}
//                       >
//                         <RefreshCw className="h-4 w-4" />
//                       </Button>
//                       <Button 
//                         variant="outline" 
//                         size="sm"
//                         onClick={() => handleEditIntegration(integration)}
//                       >
//                         <Edit className="h-4 w-4" />
//                       </Button>
//                       <Button 
//                         variant="outline" 
//                         size="sm"
//                         onClick={() => handleToggleIntegration(integration.id, integration.status !== 'active')}
//                       >
//                         {integration.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
//                       </Button>
//                       <Button 
//                         variant="outline" 
//                         size="sm"
//                         onClick={() => handleDeleteIntegration(integration.id)}
//                       >
//                         <Trash2 className="h-4 w-4" />
//                       </Button>
//                     </div>
//                   </CardHeader>
//                   <CardContent>
//                     <div className="space-y-3">
//                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
//                         <div>
//                           <p className="font-medium">Sync Frequency</p>
//                           <p className="text-muted-foreground">{integration.syncFrequency}</p>
//                         </div>
//                         <div>
//                           <p className="font-medium">Last Sync</p>
//                           <p className="text-muted-foreground">{new Date(integration.lastSync).toLocaleString()}</p>
//                         </div>
//                         <div>
//                           <p className="font-medium">Success Rate</p>
//                           <p className="text-muted-foreground">
//                             {((integration.metrics.successfulSyncs / integration.metrics.totalSyncs) * 100).toFixed(1)}%
//                           </p>
//                         </div>
//                         <div>
//                           <p className="font-medium">Records Processed</p>
//                           <p className="text-muted-foreground">{integration.metrics.recordsProcessed.toLocaleString()}</p>
//                         </div>
//                       </div>

//                       {integration.mappedFields.length > 0 && (
//                         <div>
//                           <p className="text-sm font-medium mb-1">Field Mappings:</p>
//                           <div className="flex flex-wrap gap-1">
//                             {integration.mappedFields.slice(0, 5).map((mapping, index) => (
//                               <Badge key={index} variant="secondary" className="text-xs">
//                                 {mapping.localField} → {mapping.remoteField}
//                               </Badge>
//                             ))}
//                             {integration.mappedFields.length > 5 && (
//                               <Badge variant="outline" className="text-xs">
//                                 +{integration.mappedFields.length - 5} more
//                               </Badge>
//                             )}
//                           </div>
//                         </div>
//                       )}

//                       <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
//                         <span>Endpoint: {integration.endpoint}</span>
//                         <span>Auth: {integration.authType}</span>
//                         <span>Avg Sync: {integration.metrics.averageSyncTime}ms</span>
//                         {integration.nextSync && (
//                           <span>Next Sync: {new Date(integration.nextSync).toLocaleString()}</span>
//                         )}
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>
//               ))
//             )}
//           </div>
//         </TabsContent>

//         <TabsContent value="logs" className="space-y-6">
//           <div className="flex justify-between items-center">
//             <h2 className="text-2xl font-bold">Synchronization Logs</h2>
//             <div className="flex items-center gap-2">
//               <Badge variant="outline">
//                 {syncLogs.filter(log => log.status === 'running').length} Running
//               </Badge>
//               <Badge variant="outline">
//                 {syncLogs.filter(log => log.status === 'failed').length} Failed
//               </Badge>
//             </div>
//           </div>

//           <div className="grid gap-4">
//             {syncLogs.length === 0 ? (
//               <Card>
//                 <CardContent className="flex flex-col items-center justify-center py-12">
//                   <Activity className="h-12 w-12 text-muted-foreground mb-4" />
//                   <h3 className="text-lg font-semibold mb-2">No Sync Logs</h3>
//                   <p className="text-muted-foreground text-center">
//                     Synchronization logs will appear here when integrations run
//                   </p>
//                 </CardContent>
//               </Card>
//             ) : (
//               syncLogs.map((log) => (
//                 <Card key={log.id}>
//                   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                     <div className="space-y-1">
//                       <CardTitle className="flex items-center gap-2">
//                         {log.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-500" />}
//                         {log.status === 'failed' && <XCircle className="h-5 w-5 text-red-500" />}
//                         {log.status === 'running' && <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />}
//                         {log.status === 'cancelled' && <XCircle className="h-5 w-5 text-gray-500" />}
//                         Integration Sync
//                         <Badge variant={
//                           log.status === 'completed' ? 'default' :
//                           log.status === 'failed' ? 'destructive' :
//                           log.status === 'running' ? 'outline' : 'secondary'
//                         }>
//                           {log.status}
//                         </Badge>
//                       </CardTitle>
//                       <CardDescription>
//                         Started: {new Date(log.startTime).toLocaleString()}
//                         {log.endTime && ` • Duration: ${log.duration}ms`}
//                       </CardDescription>
//                     </div>
//                     <div className="text-right text-sm">
//                       <p className="font-medium">{log.recordsProcessed} records</p>
//                       <p className="text-muted-foreground">
//                         {log.recordsSuccessful} success, {log.recordsFailed} failed
//                       </p>
//                     </div>
//                   </CardHeader>
//                   {log.errors.length > 0 && (
//                     <CardContent>
//                       <div className="space-y-2">
//                         <p className="text-sm font-medium text-red-600">Errors:</p>
//                         <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
//                           {log.errors.slice(0, 3).map((error, index) => (
//                             <li key={index}>{error}</li>
//                           ))}
//                           {log.errors.length > 3 && (
//                             <li>...and {log.errors.length - 3} more errors</li>
//                           )}
//                         </ul>
//                       </div>
//                     </CardContent>
//                   )}
//                 </Card>
//               ))
//             )}
//           </div>
//         </TabsContent>

//         <TabsContent value="settings" className="space-y-6">
//           <Card>
//             <CardHeader>
//               <CardTitle>Global Integration Settings</CardTitle>
//               <CardDescription>
//                 Configure system-wide integration and synchronization settings
//               </CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-6">
//               <div className="space-y-4">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <Label className="text-base font-medium">Enable Integrations</Label>
//                     <p className="text-sm text-muted-foreground">
//                       Turn on/off all system integrations
//                     </p>
//                   </div>
//                   <Checkbox
//                     checked={globalSettings.enableIntegrations}
//                     onCheckedChange={(checked) =>
//                       setGlobalSettings(prev => ({ ...prev, enableIntegrations: !!checked }))
//                     }
//                   />
//                 </div>

//                 <Separator />

//                 <div className="flex items-center justify-between">
//                   <div>
//                     <Label className="text-base font-medium">Auto-retry Failed Syncs</Label>
//                     <p className="text-sm text-muted-foreground">
//                       Automatically retry failed synchronizations
//                     </p>
//                   </div>
//                   <Checkbox
//                     checked={globalSettings.autoRetry}
//                     onCheckedChange={(checked) =>
//                       setGlobalSettings(prev => ({ ...prev, autoRetry: !!checked }))
//                     }
//                   />
//                 </div>

//                 <Separator />

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div className="space-y-2">
//                     <Label>Default Timeout (seconds)</Label>
//                     <Input
//                       type="number"
//                       min={1}
//                       value={globalSettings.defaultTimeout}
//                       onChange={(e) =>
//                         setGlobalSettings(prev => ({
//                           ...prev,
//                           defaultTimeout: parseInt(e.target.value, 10) || 30
//                         }))
//                       }
//                     />
//                   </div>
//                   <div className="space-y-2">
//                     <Label>Max Retry Attempts</Label>
//                     <Input
//                       type="number"
//                       min={0}
//                       value={globalSettings.maxRetryAttempts}
//                       onChange={(e) =>
//                         setGlobalSettings(prev => ({
//                           ...prev,
//                           maxRetryAttempts: parseInt(e.target.value, 10) || 3
//                         }))
//                       }
//                     />
//                   </div>
//                 </div>

//                 <div className="space-y-2">
//                   <Label>Log Retention Days</Label>
//                   <Input
//                     type="number"
//                     min={1}
//                     value={globalSettings.logRetentionDays}
//                     onChange={(e) =>
//                       setGlobalSettings(prev => ({
//                         ...prev,
//                         logRetentionDays: parseInt(e.target.value, 10) || 90
//                       }))
//                     }
//                   />
//                 </div>

//                 <Button onClick={handleSaveGlobalSettings} disabled={savingSettings}>
//                   {savingSettings ? 'Saving...' : 'Save Settings'}
//                 </Button>
//               </div>
//             </CardContent>
//           </Card>
//         </TabsContent>
//       </Tabs>
//     </div>
//   )
// }
