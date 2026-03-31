'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, BarChart3, TrendingUp, Target, Award, 
  ArrowLeft, Activity, Clock, PieChart, BarChart2, LineChart, Star, CheckCircle, AlertCircle, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface ClubAnalytics {
  // Summary metrics
  totalClubs: number;
  totalMembers: number;
  averageClubSize: number;
  overallParticipationRate: number;
  mostPopularType: string;
  activeClubs: number;
  inactiveClubs: number;
  
  // Detailed breakdowns
  clubsByType: Array<{
    type: string;
    count: number;
    members: number;
    avgMembersPerClub: number;
  }>;
  
  // Performance metrics
  topPerformingClubs: Array<{
    clubId: string;
    name: string;
    type: string;
    memberCount: number;
    meetingCount: number;
    participationRate: number;
    attendanceRate: number;
    activityLevel: 'High' | 'Medium' | 'Low';
    performanceScore: number;
  }>;
  
  // Activity metrics
  clubsByActivityLevel: {
    high: number;
    medium: number;
    low: number;
  };
  
  // Time-based metrics
  membershipTrends: Array<{
    month: string;
    memberships: number;
  }>;
}

const ClubAnalyticsPage = () => {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<ClubAnalytics | null>(null);
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs/analytics?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch analytics data');
      }
      
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics data. Please try again.');
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const getTypeColor = (type: string = ''): string => {
    const colors: Record<string, string> = {
      'Academic': 'bg-blue-500 text-blue-50',
      'Sports': 'bg-green-500 text-green-50',
      'Arts': 'bg-purple-500 text-purple-50',
      'Cultural': 'bg-amber-500 text-amber-50',
      'Science': 'bg-indigo-500 text-indigo-50',
      'Technology': 'bg-pink-500 text-pink-50',
      'default': 'bg-gray-500 text-gray-50'
    };
    return colors[type] || colors['default'];
  };

  const getPerformanceColor = (rate: number = 0): string => {
    if (rate >= 70) return 'text-green-500';
    if (rate >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getActivityLevelColor = (level: string = ''): string => {
    switch (level.toLowerCase()) {
      case 'high': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Loading analytics data...</p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <AlertCircle className="h-16 w-16 text-red-500" />
        <h2 className="text-2xl font-semibold">Failed to Load Analytics</h2>
        <p className="text-muted-foreground">{error || 'No data available'}</p>
        <Button onClick={fetchAnalytics} className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  // Calculate total clubs by activity level for the chart
  const activityLevels = [
    { name: 'High', value: analytics.clubsByActivityLevel?.high || 0, color: 'bg-green-500' },
    { name: 'Medium', value: analytics.clubsByActivityLevel?.medium || 0, color: 'bg-yellow-500' },
    { name: 'Low', value: analytics.clubsByActivityLevel?.low || 0, color: 'bg-red-500' },
  ];
  const totalActivity = activityLevels.reduce((sum, level) => sum + level.value, 0) || 1;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header with time range selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push('/secretary/clubs')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clubs
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Club Analytics</h1>
            <p className="text-muted-foreground text-sm">
              Comprehensive performance metrics and insights
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="text-sm border rounded-md px-3 py-1.5"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="12m">Last 12 months</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clubs</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalClubs || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.activeClubs || 0} active • {analytics.inactiveClubs || 0} inactive
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalMembers?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              Avg. {analytics.averageClubSize?.toFixed(1)} members per club
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Popular</CardTitle>
            <Award className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{analytics.mostPopularType || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              Most active club type
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Club Distribution by Type */}
        <Card className="md:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Club Distribution</CardTitle>
                <CardDescription>By type and membership</CardDescription>
              </div>
              <PieChart className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.clubsByType?.length ? (
                [...analytics.clubsByType]
                  .sort((a, b) => (b?.members || 0) - (a?.members || 0))
                  .map((type, index) => (
                    <div key={`${type?.type}-${index}`} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Badge className={getTypeColor(type?.type || '')} variant="outline">
                            {type?.type || 'Unknown'}
                          </Badge>
                          <span className="text-muted-foreground">{type?.count || 0} clubs</span>
                        </div>
                        <span className="font-medium">{type?.members || 0} members</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ 
                            width: `${((type?.members || 0) / (analytics?.totalMembers || 1)) * 100}%` 
                          }} 
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Avg: {(type?.avgMembersPerClub || 0).toFixed(1)}/club</span>
                        <span>{Math.round(((type?.members || 0) / (analytics?.totalMembers || 1)) * 100)}% of total</span>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No club data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Clubs */}
        <Card className="md:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top Performing Clubs</CardTitle>
                <CardDescription>Based on participation and attendance</CardDescription>
              </div>
              <Award className="h-5 w-5 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topPerformingClubs?.length ? (
                analytics.topPerformingClubs.slice(0, 3).map((club) => (
                  <div key={club.clubId} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{club.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {club.type}
                          </Badge>
                          <Badge variant="outline" className={getActivityLevelColor(club.activityLevel)}>
                            {club.activityLevel} Activity
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{club.memberCount} members</div>
                        <div className="text-xs text-muted-foreground">{club.meetingCount} meetings</div>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Attendance</span>
                        <span className={getPerformanceColor(club.attendanceRate) + " font-medium"}>
                          {club.attendanceRate}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${club.attendanceRate}%` }} 
                        />
                      </div>
                    </div>
                    
                    {/* Performance Score - Commented out for now */}
                    {/* <div className="flex items-center justify-between pt-1 text-sm">
                      <span className="text-muted-foreground">Performance Score</span>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500 mr-1" />
                        <span className="font-bold">{club.performanceScore}/100</span>
                      </div>
                    </div> */}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No club performance data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activity & Engagement */}
        <Card className="md:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Activity & Engagement</CardTitle>
                <CardDescription>Club participation levels</CardDescription>
              </div>
              <Activity className="h-5 w-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium mb-3">Clubs by Activity Level</h4>
                <div className="space-y-3">
                  {activityLevels.map((level) => (
                    <div key={level.name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`h-3 w-3 rounded-full ${level.color}`}></div>
                          <span>{level.name}</span>
                        </div>
                        <span className="font-medium">{level.value} clubs</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`${level.color} h-2 rounded-full`} 
                          style={{ width: `${(level.value / totalActivity) * 100}%` }} 
                        />
                      </div>
                      <div className="text-xs text-muted-foreground text-right">
                        {Math.round((level.value / totalActivity) * 100)}% of total
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Recent Activity - Commented out as it uses membershipTrends */}
              {/* <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-3">Recent Activity</h4>
                <div className="space-y-3">
                  {analytics.membershipTrends?.slice(0, 3).map((trend, index) => (
                    <div key={`trend-${index}`} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{trend.month}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{trend.memberships} new members</span>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div> */}
              
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <span className="text-sm font-medium">Inactive Clubs</span>
                </div>
                <span className="text-lg font-bold text-amber-700">
                  {analytics?.inactiveClubs || 0}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium">Avg. Club Size</span>
                </div>
                <span className="text-lg font-bold text-blue-700">
                  {(analytics?.averageClubSize || 0).toFixed(1)} members
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Membership Trends - Commented out per user request */}
      {/* <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle>Membership Trends</CardTitle>
              <CardDescription>
                New club memberships over time
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8">
                <LineChart className="mr-2 h-4 w-4" />
                Export Data
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-end gap-1.5">
            {analytics?.membershipTrends?.length > 0 ? (
              analytics.membershipTrends.map((trend, index) => {
                const maxMembers = Math.max(...analytics.membershipTrends.map(t => t?.memberships || 0));
                const height = maxMembers > 0 ? (trend.memberships / maxMembers) * 100 : 0;
                const isCurrentMonth = index === (analytics?.membershipTrends?.length || 0) - 1;
                
                return (
                  <div key={index} className="flex flex-col items-center flex-1 group">
                    <div 
                      className={`w-full rounded-t-sm transition-all duration-300 ${isCurrentMonth ? 'bg-gradient-to-t from-blue-600 to-blue-500' : 'bg-blue-400'}`} 
                      style={{ 
                        height: `${Math.max(10, height)}%`,
                        minHeight: '20px'
                      }}
                    >
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-center text-xs text-white font-medium p-1">
                        {trend.memberships}
                      </div>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1 text-center px-1">
                      {trend.month.split('/')[0]}
                      <span className="hidden sm:inline">/{trend.month.split('/')[1]}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground h-full">
                No membership data available for the selected time range.
              </div>
            )}
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
};

export default ClubAnalyticsPage;
