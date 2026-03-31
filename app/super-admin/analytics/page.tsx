"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  School,
  Activity,
  Calendar,
  Download,
  RefreshCw,
  Database,
  Server,
  Clock,
  Shield,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  UserCheck,
  UserX,
  BookOpen,
  GraduationCap,
  UserCog,
  Baby,
  Building2,
  Zap
} from "lucide-react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { toast } from "sonner"
import axios from "axios"

interface AnalyticsData {
  userGrowth: {
    labels: string[]
    data: number[]
    growth: number
  }
  schoolStats: {
    totalSchools: number
    activeSchools: number
    newSchoolsThisMonth: number
    totalStudentCapacity?: number
  }
  userActivity: {
    dailyActiveUsers: number
    weeklyActiveUsers: number
    monthlyActiveUsers: number
  }
  roleDistribution: {
    role: string
    count: number
    percentage: number
  }[]
  systemHealth: {
    uptime: string
    responseTime: number
    errorRate: number
    status: string
  }
  topSchools: {
    _id: string
    name: string
    userCount: number
    activityScore: number
  }[]
}

interface UserAnalytics {
  newUsers: number
  activeUsers: number
  timeframe: string
}

interface DataStats {
  totalUsers: number
  totalStudents: number
  totalTeachers: number
  totalSchools: number
  totalActivities: number
  storageUsed: string
  lastBackup: string
  databaseSize: string
  totalDocuments: number
}

interface SessionAnalytics {
  totalSessions: number
  activeSessions: number
  suspiciousSessions: number
  uniqueUsers: number
  timeframe: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export default function SystemAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null)
  const [dataStats, setDataStats] = useState<DataStats | null>(null)
  const [sessionAnalytics, setSessionAnalytics] = useState<SessionAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState("30d")
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchAllAnalytics()
  }, [timeframe])

  const fetchAllAnalytics = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      // Fetch all analytics in parallel
      const [analyticsRes, userAnalyticsRes, dataStatsRes, sessionAnalyticsRes] = await Promise.allSettled([
        axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/analytics?timeframe=${timeframe}`, { headers }),
        axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/analytics/users?timeframe=${timeframe}`, { headers }),
        axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/data-stats`, { headers }),
        axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/user-sessions/analytics?timeframe=${timeframe}`, { headers })
      ])

      if (analyticsRes.status === 'fulfilled' && analyticsRes.value.data) {
        setAnalytics(analyticsRes.value.data)
      }

      if (userAnalyticsRes.status === 'fulfilled' && userAnalyticsRes.value.data) {
        setUserAnalytics(userAnalyticsRes.value.data)
      }

      if (dataStatsRes.status === 'fulfilled' && dataStatsRes.value.data) {
        setDataStats(dataStatsRes.value.data)
      }

      if (sessionAnalyticsRes.status === 'fulfilled' && sessionAnalyticsRes.value.data) {
        setSessionAnalytics(sessionAnalyticsRes.value.data)
      }

    } catch (error: any) {
      console.error("Error fetching analytics:", error)
      toast.error("Failed to load some analytics data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAllAnalytics()
    setRefreshing(false)
    toast.success("Analytics refreshed successfully")
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <div className="text-lg font-semibold text-muted-foreground">Loading system analytics...</div>
            <div className="text-sm text-muted-foreground mt-2">Gathering comprehensive system data</div>
          </div>
        </div>
      </div>
    )
  }

  // Prepare chart data
  const userGrowthChartData = analytics?.userGrowth?.labels?.map((label, index) => ({
    date: label,
    users: analytics.userGrowth.data[index] || 0
  })) || []

  // Helper function to format role names
  const formatRoleName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'STUDENT': 'Student',
      'TEACHER': 'Teacher',
      'PARENT': 'Parent',
      'ADMIN': 'Admin',
      'SECRETARY': 'Secretary',
      'NURSE': 'Nurse',
      'SUPER_ADMIN': 'Super Admin'
    }
    return roleMap[role.toUpperCase()] || role
  }

  const roleDistributionData = analytics?.roleDistribution?.map(role => ({
    name: formatRoleName(role.role),
    value: role.count,
    percentage: role.percentage,
    originalRole: role.role
  })) || []

  const topSchoolsData = analytics?.topSchools?.slice(0, 5).map(school => ({
    name: school.name.length > 20 ? school.name.substring(0, 20) + '...' : school.name,
    users: school.userCount,
    activity: school.activityScore
  })) || []

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            System Analytics
          </h2>
          <p className="text-muted-foreground mt-1">
            Comprehensive insights into system usage, performance, and health across all schools
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          {/* <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="w-full sm:w-auto">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button> */}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
            <School className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics?.schoolStats?.totalSchools || 0}</div>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-xs text-muted-foreground">
                {analytics?.schoolStats?.activeSchools || 0} active
              </p>
              {!!analytics?.schoolStats?.newSchoolsThisMonth && analytics.schoolStats.newSchoolsThisMonth > 0 && (
                <Badge variant="secondary" className="text-xs">
                  +{analytics.schoolStats.newSchoolsThisMonth} this month
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dataStats?.totalUsers || 0}</div>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-xs text-muted-foreground">
                {userAnalytics?.activeUsers || 0} active
              </p>
              {!!userAnalytics?.newUsers && userAnalytics.newUsers > 0 && (
                <Badge variant="secondary" className="text-xs">
                  +{userAnalytics.newUsers} new
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* User Growth Chart */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              User Growth Over Time
            </CardTitle>
            <CardDescription>
              New user registrations for the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {userGrowthChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={userGrowthChartData}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280"
                      fontSize={12}
                      tick={{ fill: '#6b7280' }}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      fontSize={12}
                      tick={{ fill: '#6b7280' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="users" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorUsers)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No growth data available</p>
                  </div>
                </div>
              )}
            </div>
            {analytics?.userGrowth && (
              <div className="mt-4 flex items-center justify-between text-sm">
                <div>
                  <span className="text-muted-foreground">Growth Rate: </span>
                  <span className={`font-semibold ${analytics.userGrowth.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {analytics.userGrowth.growth >= 0 ? '+' : ''}{analytics.userGrowth.growth}%
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total New Users: </span>
                  <span className="font-semibold">
                    {analytics.userGrowth.data.reduce((sum, val) => sum + val, 0)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role Distribution Pie Chart */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              User Distribution by Role
            </CardTitle>
            <CardDescription>
              Breakdown of users across different roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {roleDistributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {roleDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No role distribution data</p>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {roleDistributionData.slice(0, 4).map((role, index) => (
                <div key={role.name} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm font-medium">{role.name}</span>
                  </div>
                  <span className="text-sm font-semibold">{role.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-1">
        {/* Top Schools */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <School className="h-5 w-5 text-green-600" />
              Top Performing Schools
            </CardTitle>
            <CardDescription>
              Schools with highest user activity and engagement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topSchoolsData.length > 0 ? (
                topSchoolsData.map((school, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm font-bold">
                          {index + 1}
                        </div>
                        <span className="font-medium">{school.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{school.users} users</Badge>
                      </div>
                    </div>
                    <Progress value={school.activity} className="h-2" />
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <School className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No school data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Distribution Detailed */}
      {analytics?.roleDistribution && analytics.roleDistribution.length > 0 && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              Detailed Role Distribution
            </CardTitle>
            <CardDescription>
              Complete breakdown of all user roles in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {analytics.roleDistribution.map((role, index) => (
                <div key={role.role} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium">{formatRoleName(role.role)}</span>
                    </div>
                    <Badge variant="secondary">{role.percentage.toFixed(1)}%</Badge>
                  </div>
                  <div className="text-2xl font-bold mb-2">{role.count}</div>
                  <Progress value={role.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
