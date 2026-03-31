'use client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { UserCheck, Heart, Activity, Plus, AlertTriangle, Pill, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

type IncidentData = {
  month: string;
  incidents: number;
};

type DashboardStats = {
  totalStudents: number;
  activeAlerts: number;
  todayVisits: number;
  weekVisits: number;
  activeMedications: number;
  studentsWithHealthRecords: number;
  immunizationsDue: number;
  studentsWithAllergies: number;
  studentsWithMedicalConditions: number;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_SRS_SERVER || 'http://localhost:3014';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

export default function NurseDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    activeAlerts: 0,
    todayVisits: 0,
    weekVisits: 0,
    activeMedications: 0,
    studentsWithHealthRecords: 0,
    immunizationsDue: 0,
    studentsWithAllergies: 0,
    studentsWithMedicalConditions: 0
  });
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<IncidentData[]>([]);
  const [recentIncidents, setRecentIncidents] = useState<any[]>([]);
  const [healthOverview, setHealthOverview] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/nurse/dashboard/stats`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error('Failed to fetch dashboard stats');
        toast.error('Failed to load dashboard data');
      }

      // Fetch visit trends for chart data
      try {
        const trendsResponse = await fetch(`${API_BASE_URL}/nurse/dashboard/visits-trend?period=30days`, {
          headers: getAuthHeaders(),
        });

        if (trendsResponse.ok) {
          const trendsData = await trendsResponse.json();
          // Group by month for the chart
          const monthlyVisits: { [key: string]: number } = {};
          trendsData.data.forEach((day: any) => {
            const monthKey = new Date(day.date).toLocaleString('default', { month: 'short' });
            monthlyVisits[monthKey] = (monthlyVisits[monthKey] || 0) + day.visits;
          });

          const chartData = Object.entries(monthlyVisits).map(([month, visits]) => ({
            month,
            incidents: visits as number
          }));
          
          setMonthlyData(chartData);
        } else {
          // Fallback to current month with today's data
          const fallbackData: IncidentData[] = [
            { month: "Current", incidents: stats.todayVisits || 0 }
          ];
          setMonthlyData(fallbackData);
        }
      } catch (trendsError) {
        console.error('Error fetching trends:', trendsError);
        // Fallback data
        const fallbackData: IncidentData[] = [
          { month: "Current", incidents: stats.todayVisits || 0 }
        ];
        setMonthlyData(fallbackData);
      }

      // Fetch recent visits/incidents
      try {
        const incidentsResponse = await fetch(`${API_BASE_URL}/nurse/dashboard/recent-visits?limit=5`, {
          headers: getAuthHeaders(),
        });

        if (incidentsResponse.ok) {
          const incidentsData = await incidentsResponse.json();
          setRecentIncidents(incidentsData);
        }
      } catch (incidentsError) {
        console.error('Error fetching recent incidents:', incidentsError);
        // Keep empty array as default
      }

      // Fetch health overview
      try {
        const overviewResponse = await fetch(`${API_BASE_URL}/nurse/dashboard/health-overview`, {
          headers: getAuthHeaders(),
        });

        if (overviewResponse.ok) {
          const overviewData = await overviewResponse.json();
          setHealthOverview(overviewData);
        }
      } catch (overviewError) {
        console.error('Error fetching health overview:', overviewError);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header Section - Improved */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-900">School Nurse Dashboard</h1>
          <p className="text-gray-600">Overview of health services and student care</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/nurse/health-record" className="flex-shrink-0">
            <Button size="lg" className="w-full sm:w-auto min-w-[200px] bg-black hover:bg-gray-800 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Student Health Records
            </Button>
          </Link>
          <Link href="/nurse/visits" className="flex-shrink-0">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              <Activity className="h-4 w-4 mr-2" />
              Nurse Visits
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Active enrollment</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.activeAlerts}</div>
            <p className="text-xs text-muted-foreground">Active alerts</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Visits</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.todayVisits}</div>
            <p className="text-xs text-muted-foreground">Nurse visits today</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medications</CardTitle>
            <Pill className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.activeMedications}</div>
            <p className="text-xs text-muted-foreground">Active medications</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Records</CardTitle>
            <Heart className="h-4 w-4 text-pink-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.studentsWithHealthRecords}</div>
            <p className="text-xs text-muted-foreground">Students with records</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalStudents > 0 
                ? `${Math.round((stats.studentsWithHealthRecords / stats.totalStudents) * 100)}% coverage`
                : '0% coverage'}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week Visits</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.weekVisits || 0}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Incidents */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Recent Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-3 border rounded-lg bg-white animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : recentIncidents.length > 0 ? (
              <ul className="space-y-3">
                {recentIncidents.map((incident, index) => {
                  const getSeverityColor = (severity: string) => {
                    switch (severity) {
                      case 'high': return 'bg-red-500';
                      case 'medium': return 'bg-yellow-500';
                      default: return 'bg-blue-500';
                    }
                  };

                  const getTimeAgo = (date: string) => {
                    const now = new Date();
                    const visitDate = new Date(date);
                    const diffInHours = Math.floor((now.getTime() - visitDate.getTime()) / (1000 * 60 * 60));
                    
                    if (diffInHours < 1) return 'Less than 1 hour ago';
                    if (diffInHours === 1) return '1 hour ago';
                    if (diffInHours < 24) return `${diffInHours} hours ago`;
                    const diffInDays = Math.floor(diffInHours / 24);
                    if (diffInDays === 1) return '1 day ago';
                    return `${diffInDays} days ago`;
                  };

                  return (
                    <li key={index} className="p-3 border rounded-lg bg-white flex items-start gap-3">
                      <div className={`w-2 h-2 ${getSeverityColor(incident.severity)} rounded-full mt-2`}></div>
                      <div>
                        <div className="font-medium">{incident.studentName} - {incident.reason}</div>
                        <div className="text-sm text-gray-500">
                          Grade {incident.grade} • {getTimeAgo(incident.visitDate)}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No recent incidents</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Incident Trends */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Monthly Incident Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#333" />
                <YAxis stroke="#333" />
                <Tooltip />
                <Line type="monotone" dataKey="incidents" stroke="#1a202c" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/nurse/visits">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <Plus className="h-6 w-6" />
                Add Nurse Visit
              </Button>
            </Link>
            
            <Link href="/nurse/health-record">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <UserCheck className="h-6 w-6" />
                Health Records
              </Button>
            </Link>
            
            <Link href="/nurse/alerts">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <AlertTriangle className="h-6 w-6" />
                Health Alerts
              </Button>
            </Link>
            
            <Link href="/nurse/documents">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <FileText className="h-6 w-6" />
                Documents
              </Button>
            </Link>
          
          </div>
        </CardContent>
      </Card>

      {/* Health Overview Section */}
      {healthOverview && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Visit Reasons */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Top Visit Reasons
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-8 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : healthOverview.visitReasons && healthOverview.visitReasons.length > 0 ? (
                <div className="space-y-3">
                  {healthOverview.visitReasons.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium capitalize">{item.reason}</span>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">No visit data available</p>
              )}
            </CardContent>
          </Card>

          {/* Common Allergies */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Common Allergies
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-8 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : healthOverview.allergies && healthOverview.allergies.common && healthOverview.allergies.common.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-2">
                    {healthOverview.allergies.total} students with allergies
                  </p>
                  {healthOverview.allergies.common.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded">
                      <span className="text-sm font-medium">{item.allergy}</span>
                      <Badge variant="destructive">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">No allergy data available</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
