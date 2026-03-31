'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  ArrowLeft, Settings, Save, Plus, Trash2, Edit, 
  Users, Clock, MapPin, Mail, Shield, Activity
} from 'lucide-react';
import { toast } from 'sonner';

interface ClubSettings {
  _id: string;
  name: string;
  description?: string;
  type: string;
  maxMembers?: number;
  requiresApproval: boolean;
  isActive: boolean;
  location?: string;
  contactEmail?: string;
  meetingSchedule?: {
    days: string[];
    startTime: string;
    endTime: string;
    frequency: string;
  };
  activities: string[];
  rules: string[];
  announcements: Array<{
    _id: string;
    title: string;
    message: string;
    createdAt: string;
    isActive: boolean;
  }>;
}

interface GlobalSettings {
  maxClubsPerStudent: number;
  requireParentalConsent: boolean;
  allowStudentWithdrawal: boolean;
  defaultMeetingDuration: number;
  notificationSettings: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    parentNotifications: boolean;
  };
}

const clubTypes = [
  'Academic', 'Sports', 'Arts', 'Service', 'STEM', 'Cultural', 'Language', 'Other'
];

const frequencies = ['Weekly', 'Bi-weekly', 'Monthly', 'Quarterly'];
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const ClubSettingsPage = () => {
  const router = useRouter();
  const [clubSettings, setClubSettings] = useState<ClubSettings[]>([]);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
    maxClubsPerStudent: 3,
    requireParentalConsent: false,
    allowStudentWithdrawal: true,
    defaultMeetingDuration: 60,
    notificationSettings: {
      emailNotifications: true,
      smsNotifications: false,
      parentNotifications: true
    }
  });
  const [selectedClub, setSelectedClub] = useState<ClubSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('global');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newRule, setNewRule] = useState('');
  const [newActivity, setNewActivity] = useState('');

  useEffect(() => {
    fetchClubSettings();
    fetchGlobalSettings();
  }, []);

  const fetchClubSettings = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setClubSettings(data);
      } else {
        toast.error('Failed to fetch club settings');
      }
    } catch (error) {
      console.error('Error fetching club settings:', error);
      toast.error('Error fetching club settings');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGlobalSettings = async () => {
    // This would fetch global settings from the backend
    // For now, using default values
    try {
      // TODO: Implement backend endpoint for global club settings
      console.log('Global settings loaded (using defaults)');
    } catch (error) {
      console.error('Error fetching global settings:', error);
    }
  };

  const updateClubSettings = async (clubId: string, updates: Partial<ClubSettings>) => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs/${clubId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        toast.success('Club settings updated successfully');
        fetchClubSettings();
        setIsEditDialogOpen(false);
        setSelectedClub(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || 'Failed to update club settings');
      }
    } catch (error) {
      console.error('Error updating club settings:', error);
      toast.error('Error updating club settings');
    }
  };

  const updateGlobalSettings = async () => {
    try {
      // TODO: Implement backend endpoint for global settings
      toast.success('Global settings updated successfully');
    } catch (error) {
      console.error('Error updating global settings:', error);
      toast.error('Error updating global settings');
    }
  };

  const handleEditClub = (club: ClubSettings) => {
    setSelectedClub({
      ...club,
      rules: club.rules || [],
      activities: club.activities || []
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveClubChanges = () => {
    if (!selectedClub) return;

    const updates = {
      name: selectedClub.name,
      description: selectedClub.description,
      type: selectedClub.type,
      maxMembers: selectedClub.maxMembers,
      requiresApproval: selectedClub.requiresApproval,
      isActive: selectedClub.isActive,
      location: selectedClub.location,
      contactEmail: selectedClub.contactEmail,
      meetingSchedule: selectedClub.meetingSchedule,
      activities: selectedClub.activities,
      rules: selectedClub.rules
    };

    updateClubSettings(selectedClub._id, updates);
  };

  const addRule = () => {
    if (!selectedClub || !newRule.trim()) return;
    
    setSelectedClub({
      ...selectedClub,
      rules: [...(selectedClub.rules || []), newRule.trim()]
    });
    setNewRule('');
  };

  const removeRule = (index: number) => {
    if (!selectedClub) return;
    
    const updatedRules = selectedClub.rules.filter((_, i) => i !== index);
    setSelectedClub({
      ...selectedClub,
      rules: updatedRules
    });
  };

  const addActivity = () => {
    if (!selectedClub || !newActivity.trim()) return;
    
    setSelectedClub({
      ...selectedClub,
      activities: [...(selectedClub.activities || []), newActivity.trim()]
    });
    setNewActivity('');
  };

  const removeActivity = (index: number) => {
    if (!selectedClub) return;
    
    const updatedActivities = selectedClub.activities.filter((_, i) => i !== index);
    setSelectedClub({
      ...selectedClub,
      activities: updatedActivities
    });
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Academic': 'bg-blue-100 text-blue-800',
      'Sports': 'bg-green-100 text-green-800',
      'Arts': 'bg-purple-100 text-purple-800',
      'Service': 'bg-yellow-100 text-yellow-800',
      'STEM': 'bg-indigo-100 text-indigo-800',
      'Cultural': 'bg-pink-100 text-pink-800',
      'Language': 'bg-orange-100 text-orange-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || colors['Other'];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clubs
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Club Settings</h1>
            <p className="text-muted-foreground">
              Configure club parameters and system-wide settings
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="global">Global Settings</TabsTrigger>
          <TabsTrigger value="clubs">Individual Clubs</TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System-Wide Club Settings</CardTitle>
              <CardDescription>
                Configure global policies and defaults for all clubs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Student Limits */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Student Participation</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="maxClubs">Maximum Clubs Per Student</Label>
                    <Input
                      id="maxClubs"
                      type="number"
                      value={globalSettings.maxClubsPerStudent}
                      onChange={(e) => setGlobalSettings({
                        ...globalSettings,
                        maxClubsPerStudent: parseInt(e.target.value) || 3
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="meetingDuration">Default Meeting Duration (minutes)</Label>
                    <Input
                      id="meetingDuration"
                      type="number"
                      value={globalSettings.defaultMeetingDuration}
                      onChange={(e) => setGlobalSettings({
                        ...globalSettings,
                        defaultMeetingDuration: parseInt(e.target.value) || 60
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Policies */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Policies</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Require Parental Consent</Label>
                      <p className="text-sm text-muted-foreground">
                        Students must have parent approval to join clubs
                      </p>
                    </div>
                    <Switch
                      checked={globalSettings.requireParentalConsent}
                      onCheckedChange={(checked) => setGlobalSettings({
                        ...globalSettings,
                        requireParentalConsent: checked
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Student Withdrawal</Label>
                      <p className="text-sm text-muted-foreground">
                        Students can leave clubs without admin approval
                      </p>
                    </div>
                    <Switch
                      checked={globalSettings.allowStudentWithdrawal}
                      onCheckedChange={(checked) => setGlobalSettings({
                        ...globalSettings,
                        allowStudentWithdrawal: checked
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Notification Settings</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Send email notifications for club activities
                      </p>
                    </div>
                    <Switch
                      checked={globalSettings.notificationSettings.emailNotifications}
                      onCheckedChange={(checked) => setGlobalSettings({
                        ...globalSettings,
                        notificationSettings: {
                          ...globalSettings.notificationSettings,
                          emailNotifications: checked
                        }
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Send SMS notifications for urgent updates
                      </p>
                    </div>
                    <Switch
                      checked={globalSettings.notificationSettings.smsNotifications}
                      onCheckedChange={(checked) => setGlobalSettings({
                        ...globalSettings,
                        notificationSettings: {
                          ...globalSettings.notificationSettings,
                          smsNotifications: checked
                        }
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Parent Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify parents of club activities and membership changes
                      </p>
                    </div>
                    <Switch
                      checked={globalSettings.notificationSettings.parentNotifications}
                      onCheckedChange={(checked) => setGlobalSettings({
                        ...globalSettings,
                        notificationSettings: {
                          ...globalSettings.notificationSettings,
                          parentNotifications: checked
                        }
                      })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={updateGlobalSettings}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Global Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clubs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Individual Club Settings</CardTitle>
              <CardDescription>
                Configure specific settings for each club
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Club Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Max Members</TableHead>
                    <TableHead>Requires Approval</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clubSettings.map((club) => (
                    <TableRow key={club._id}>
                      <TableCell className="font-medium">{club.name}</TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(club.type)}>
                          {club.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {club.maxMembers || 'Unlimited'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={club.requiresApproval ? 'default' : 'secondary'}>
                          {club.requiresApproval ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={club.isActive ? 'default' : 'destructive'}>
                          {club.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditClub(club)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Club Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Club Settings</DialogTitle>
            <DialogDescription>
              Configure settings for {selectedClub?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedClub && (
            <div className="space-y-6 py-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Basic Information</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="clubName">Club Name</Label>
                    <Input
                      id="clubName"
                      value={selectedClub.name}
                      onChange={(e) => setSelectedClub({
                        ...selectedClub,
                        name: e.target.value
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clubType">Club Type</Label>
                    <Select
                      value={selectedClub.type}
                      onValueChange={(value) => setSelectedClub({
                        ...selectedClub,
                        type: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {clubTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={selectedClub.description || ''}
                    onChange={(e) => setSelectedClub({
                      ...selectedClub,
                      description: e.target.value
                    })}
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="maxMembers">Max Members</Label>
                    <Input
                      id="maxMembers"
                      type="number"
                      value={selectedClub.maxMembers || ''}
                      onChange={(e) => setSelectedClub({
                        ...selectedClub,
                        maxMembers: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={selectedClub.location || ''}
                      onChange={(e) => setSelectedClub({
                        ...selectedClub,
                        location: e.target.value
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={selectedClub.contactEmail || ''}
                      onChange={(e) => setSelectedClub({
                        ...selectedClub,
                        contactEmail: e.target.value
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Settings</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Requires Approval</Label>
                    <p className="text-sm text-muted-foreground">
                      New members need approval to join
                    </p>
                  </div>
                  <Switch
                    checked={selectedClub.requiresApproval}
                    onCheckedChange={(checked) => setSelectedClub({
                      ...selectedClub,
                      requiresApproval: checked
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Active Status</Label>
                    <p className="text-sm text-muted-foreground">
                      Club is currently active and accepting members
                    </p>
                  </div>
                  <Switch
                    checked={selectedClub.isActive}
                    onCheckedChange={(checked) => setSelectedClub({
                      ...selectedClub,
                      isActive: checked
                    })}
                  />
                </div>
              </div>

              {/* Activities */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Activities</h4>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add new activity..."
                    value={newActivity}
                    onChange={(e) => setNewActivity(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addActivity()}
                  />
                  <Button onClick={addActivity} disabled={!newActivity.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedClub.activities.map((activity, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {activity}
                      <button
                        onClick={() => removeActivity(index)}
                        className="ml-1 hover:text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Rules */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Club Rules</h4>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add new rule..."
                    value={newRule}
                    onChange={(e) => setNewRule(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addRule()}
                  />
                  <Button onClick={addRule} disabled={!newRule.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {selectedClub.rules.map((rule, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{rule}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeRule(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveClubChanges}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClubSettingsPage;