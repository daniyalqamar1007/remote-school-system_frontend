'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, Download, FileText, Activity, Users, BarChart3, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const ClubReportsPage = () => {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const handleExportReport = async (type: 'activity' | 'membership' | 'performance') => {
    try {
      setIsGenerating(type);
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs/reports/${type}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `club-${type}-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} report exported successfully`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || `Failed to generate ${type} report`);
      }
    } catch (error) {
      console.error(`Error generating ${type} report:`, error);
      toast.error(`Error generating ${type} report`);
    } finally {
      setIsGenerating(null);
    }
  };

  const handleExportAll = async () => {
    try {
      setIsGenerating('all');
      const token = localStorage.getItem('accessToken');
      
      // Export all three reports sequentially
      const types: Array<'activity' | 'membership' | 'performance'> = ['activity', 'membership', 'performance'];
      
      for (const type of types) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs/reports/${type}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `club-${type}-report-${new Date().toISOString().split('T')[0]}.csv`;
          a.click();
          window.URL.revokeObjectURL(url);
        }
      }
      
      toast.success('All reports exported successfully');
    } catch (error) {
      console.error('Error generating reports:', error);
      toast.error('Error generating reports');
    } finally {
      setIsGenerating(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/admin/clubs')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clubs
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Club Reports</h1>
            <p className="text-muted-foreground">
              Generate comprehensive reports on club activities
            </p>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-5 w-5 text-blue-500" />
              <CardTitle>Activity Report</CardTitle>
            </div>
            <CardDescription>
              Comprehensive overview of all club activities and events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full"
              onClick={() => handleExportReport('activity')}
              disabled={isGenerating !== null}
            >
              {isGenerating === 'activity' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-green-500" />
              <CardTitle>Membership Report</CardTitle>
            </div>
            <CardDescription>
              Detailed analysis of membership trends and demographics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full"
              onClick={() => handleExportReport('membership')}
              disabled={isGenerating !== null}
            >
              {isGenerating === 'membership' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              <CardTitle>Performance Report</CardTitle>
            </div>
            <CardDescription>
              Club performance metrics and participation analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full"
              onClick={() => handleExportReport('performance')}
              disabled={isGenerating !== null}
            >
              {isGenerating === 'performance' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Report Information */}
      <Card>
        <CardHeader>
          <CardTitle>Report Information</CardTitle>
          <CardDescription>
            Details about available reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Activity Report</h4>
              <p className="text-sm text-muted-foreground">
                Includes all club activities, events, meetings, and participation records. 
                Useful for tracking club engagement and event planning.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Membership Report</h4>
              <p className="text-sm text-muted-foreground">
                Contains detailed membership information including student assignments, 
                join dates, roles, and membership trends over time.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Performance Report</h4>
              <p className="text-sm text-muted-foreground">
                Provides performance metrics including attendance rates, participation 
                statistics, and club performance comparisons.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClubReportsPage;

