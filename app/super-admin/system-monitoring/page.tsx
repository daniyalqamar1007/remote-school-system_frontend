"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { 
  Activity,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Server,
  Database,
  Cpu,
  HardDrive,
  Wifi,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  Zap,
  Globe
} from "lucide-react"
import { toast } from 'sonner'

interface SystemMetric {
  _id: string
  metricType: 'CPU_USAGE' | 'MEMORY_USAGE' | 'DISK_USAGE' | 'NETWORK_TRAFFIC' | 'DATABASE_CONNECTIONS' | 'RESPONSE_TIME' | 'USER_COUNT' | 'ERROR_RATE'
  value: number
  unit: string
  thresholds: {
    warning: number
    critical: number
  }
  alertLevel: 'INFO' | 'WARNING' | 'CRITICAL'
  timestamp: string
  metadata?: any
}

interface SystemHealth {
  overallHealth: number
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL'
  components: {
    database: { status: string; responseTime: number }
    api: { status: string; responseTime: number }
    cache: { status: string; hitRate: number }
    storage: { status: string; usage: number }
  }
  metrics: {
    cpu: number
    memory: number
    disk: number
    activeUsers: number
    errorRate: number
  }
  alerts: Array<{
    severity: string
    message: string
    timestamp: string
  }>
}

export default function SystemMonitoringPage() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [metrics, setMetrics] = useState<SystemMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('1h')
  const [autoRefresh, setAutoRefresh] = useState(true)

  const getBaseUrl = () => process.env.NEXT_PUBLIC_SRS_SERVER || ''
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
  }

  useEffect(() => {
    fetchSystemHealth()
    fetchMetrics()
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchSystemHealth()
        fetchMetrics()
      }, 30000)
      
      return () => clearInterval(interval)
    }
  }, [timeframe, autoRefresh])

  const fetchSystemHealth = async () => {
    try {
      const response = await fetch(`${getBaseUrl()}/super-admin/system-health`, {
        headers: getAuthHeaders(),
      })
      if (response.ok) {
        const data = await response.json()
        const payload = data?.data ?? data
        setSystemHealth(payload)
      } else {
        toast.error('Failed to fetch system health')
      }
    } catch (error) {
      console.error('Error fetching system health:', error)
      toast.error('Error fetching system health')
    }
  }

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        timeframe,
        limit: '100'
      })

      const response = await fetch(`${getBaseUrl()}/super-admin/system-metrics?${queryParams}`, {
        headers: getAuthHeaders(),
      })
      if (response.ok) {
        const data = await response.json()
        const payload = data?.data ?? data
        setMetrics(payload.metrics ?? [])
      } else {
        toast.error('Failed to fetch system metrics')
      }
    } catch (error) {
      console.error('Error fetching metrics:', error)
      toast.error('Error fetching system metrics')
    } finally {
      setLoading(false)
    }
  }

  const getHealthColor = (health: number) => {
    if (health >= 90) return 'text-green-600'
    if (health >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'CRITICAL':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      default:
        return <Activity className="h-5 w-5 text-gray-600" />
    }
  }

  const getMetricIcon = (metricType: string) => {
    switch (metricType) {
      case 'CPU_USAGE':
        return <Cpu className="h-6 w-6" />
      case 'MEMORY_USAGE':
        return <Zap className="h-6 w-6" />
      case 'DISK_USAGE':
        return <HardDrive className="h-6 w-6" />
      case 'NETWORK_TRAFFIC':
        return <Wifi className="h-6 w-6" />
      case 'DATABASE_CONNECTIONS':
        return <Database className="h-6 w-6" />
      case 'RESPONSE_TIME':
        return <Clock className="h-6 w-6" />
      case 'USER_COUNT':
        return <Users className="h-6 w-6" />
      case 'ERROR_RATE':
        return <AlertTriangle className="h-6 w-6" />
      default:
        return <Activity className="h-6 w-6" />
    }
  }

  const getAlertLevelColor = (level: string) => {
    switch (level) {
      case 'INFO':
        return 'text-blue-600 bg-blue-100'
      case 'WARNING':
        return 'text-yellow-600 bg-yellow-100'
      case 'CRITICAL':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const formatMetricValue = (value: number, unit: string) => {
    if (unit === '%') {
      return `${value.toFixed(1)}%`
    }
    if (unit === 'ms') {
      return `${value.toFixed(0)}ms`
    }
    if (unit === 'MB' || unit === 'GB') {
      return `${value.toFixed(2)} ${unit}`
    }
    return `${value.toFixed(0)} ${unit}`
  }

  const getLatestMetricByType = (type: string) => {
    return metrics
      .filter(m => m.metricType === type)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">System Monitoring</h2>
          <p className="text-muted-foreground">
            Real-time system health monitoring and performance metrics
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          <div className="flex items-center gap-2">
            <Label>Auto Refresh</Label>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
          </div>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1 Hour</SelectItem>
              <SelectItem value="6h">6 Hours</SelectItem>
              <SelectItem value="24h">24 Hours</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => { fetchSystemHealth(); fetchMetrics(); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      {systemHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getHealthIcon(systemHealth?.status || 'unknown')}
              System Health Overview
            </CardTitle>
            <CardDescription>
              Overall system health score: <span className={`font-bold ${getHealthColor(systemHealth?.overallHealth || 0)}`}>
                {systemHealth?.overallHealth || 0}%
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Health Progress Bar */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Overall Health</span>
                  <span className={`text-sm font-medium ${getHealthColor(systemHealth?.overallHealth || 0)}`}>
                    {systemHealth?.overallHealth || 0}%
                  </span>
                </div>
                <Progress 
                  value={systemHealth?.overallHealth || 0} 
                  className="h-3"
                />
              </div>

              {/* Component Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="h-5 w-5" />
                    <span className="font-medium">Database</span>
                  </div>
                  <Badge className={systemHealth?.components?.database?.status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {systemHealth?.components?.database?.status || 'unknown'}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">
                    Response: {systemHealth?.components?.database?.responseTime || 0}ms
                  </p>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Server className="h-5 w-5" />
                    <span className="font-medium">API</span>
                  </div>
                  <Badge className={systemHealth?.components?.api?.status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {systemHealth?.components?.api?.status || 'unknown'}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">
                    Response: {systemHealth?.components?.api?.responseTime || 0}ms
                  </p>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-5 w-5" />
                    <span className="font-medium">Cache</span>
                  </div>
                  <Badge className={systemHealth?.components?.cache?.status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {systemHealth?.components?.cache?.status || 'unknown'}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">
                    Hit Rate: {systemHealth?.components?.cache?.hitRate || 0}%
                  </p>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <HardDrive className="h-5 w-5" />
                    <span className="font-medium">Storage</span>
                  </div>
                  <Badge className={systemHealth?.components?.storage?.status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {systemHealth?.components?.storage?.status || 'unknown'}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">
                    Usage: {systemHealth?.components?.storage?.usage || 0}%
                  </p>
                </div>
              </div>

              {/* System Alerts */}
              {systemHealth?.alerts?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Active Alerts</h4>
                  <div className="space-y-2">
                    {systemHealth.alerts.map((alert, index) => (
                      <Alert key={index} className={alert.severity === 'CRITICAL' ? 'border-red-200' : 'border-yellow-200'}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>{alert.severity} Alert</AlertTitle>
                        <AlertDescription>
                          {alert.message}
                          <span className="text-sm text-muted-foreground ml-2">
                            {formatDate(alert.timestamp)}
                          </span>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {['CPU_USAGE', 'MEMORY_USAGE', 'DISK_USAGE', 'USER_COUNT'].map((metricType) => {
          const metric = getLatestMetricByType(metricType)
          if (!metric) return null

          return (
            <Card key={metricType}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getAlertLevelColor(metric.alertLevel)}`}>
                    {getMetricIcon(metricType)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {metricType.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    <p className="text-2xl font-bold">
                      {formatMetricValue(metric.value, metric.unit)}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Badge className={`text-xs ${getAlertLevelColor(metric.alertLevel)}`}>
                        {metric.alertLevel}
                      </Badge>
                      {metric.thresholds && (
                        <span className="text-xs text-muted-foreground">
                          Warn: {metric.thresholds.warning}{metric.unit}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {metric.unit === '%' && (
                  <Progress 
                    value={metric.value} 
                    className="mt-3 h-2"
                  />
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Response Time Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading metrics...</div>
            ) : (
              <div className="space-y-4">
                {['RESPONSE_TIME', 'DATABASE_CONNECTIONS'].map((metricType) => {
                  const metric = getLatestMetricByType(metricType)
                  if (!metric) return null

                  return (
                    <div key={metricType} className="flex justify-between items-center p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getMetricIcon(metricType)}
                        <div>
                          <p className="font-medium">
                            {metricType.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Last updated: {formatDate(metric.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">
                          {formatMetricValue(metric.value, metric.unit)}
                        </p>
                        <Badge className={`text-xs ${getAlertLevelColor(metric.alertLevel)}`}>
                          {metric.alertLevel}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              System Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading metrics...</div>
            ) : (
              <div className="space-y-4">
                {['NETWORK_TRAFFIC', 'ERROR_RATE'].map((metricType) => {
                  const metric = getLatestMetricByType(metricType)
                  if (!metric) return null

                  return (
                    <div key={metricType} className="flex justify-between items-center p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getMetricIcon(metricType)}
                        <div>
                          <p className="font-medium">
                            {metricType.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Last updated: {formatDate(metric.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">
                          {formatMetricValue(metric.value, metric.unit)}
                        </p>
                        <Badge className={`text-xs ${getAlertLevelColor(metric.alertLevel)}`}>
                          {metric.alertLevel}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Metrics History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Metrics ({timeframe})
          </CardTitle>
          <CardDescription>
            Historical view of system metrics over the selected timeframe
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading metrics history...</div>
          ) : metrics.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No Metrics Available</h3>
              <p className="text-muted-foreground">
                No metrics data available for the selected timeframe
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {metrics.slice(0, 10).map((metric) => (
                <div key={metric._id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getAlertLevelColor(metric.alertLevel)}`}>
                      {getMetricIcon(metric.metricType)}
                    </div>
                    <div>
                      <p className="font-medium">
                        {metric.metricType.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(metric.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      {formatMetricValue(metric.value, metric.unit)}
                    </p>
                    <Badge className={`text-xs ${getAlertLevelColor(metric.alertLevel)}`}>
                      {metric.alertLevel}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
