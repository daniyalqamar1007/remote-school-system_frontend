"use client";

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Activity, Heart, AlertTriangle, Plus, X, Calendar, 
  Clock, CheckCircle, XCircle, Info, Filter, Search,
  Stethoscope, Pill, Shield, FileHeart, Edit3, Trash2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { format, parseISO } from "date-fns"
import { useStudent } from "../context/StudentContext"
import axios from "axios"

interface HealthCondition {
  _id?: string;
  type: 'allergy' | 'medical' | 'disability' | 'chronic' | 'dietary';
  condition: string;
  severity: 'mild' | 'moderate' | 'severe';
  description?: string;
  symptoms: string[];
  triggers: string[];
  medications: string[];
  restrictions: string[];
  emergencyPlan?: string;
  contactRequired: boolean;
  isActive: boolean;
  dateAdded: string;
  lastUpdated?: string;
  reviewDate?: string;
}

interface ActivityRestriction {
  _id?: string;
  activityType: 'physical_education' | 'sports' | 'field_trips' | 'swimming' | 'outdoor_activities' | 'other';
  restriction: string;
  reason: string;
  severity: 'minor' | 'moderate' | 'severe' | 'prohibited';
  alternatives?: string;
  conditions: string[];
  isTemporary: boolean;
  startDate: string;
  endDate?: string;
  doctorApprovalRequired: boolean;
  emergencyProcedure?: string;
  notes?: string;
}

interface ActivityParticipation {
  _id?: string;
  activityName: string;
  date: string;
  participationLevel: 'full' | 'modified' | 'observer' | 'excused';
  modifications?: string;
  reason?: string;
  supervisionNeeded: boolean;
  incidentReported: boolean;
  notes?: string;
}

export default function ParentActivityPage() {
  const { selectedStudent, isLoading: studentLoading } = useStudent();
  
  // State management
  const [healthConditions, setHealthConditions] = useState<HealthCondition[]>([]);
  const [activityRestrictions, setActivityRestrictions] = useState<ActivityRestriction[]>([]);
  const [activityParticipation, setActivityParticipation] = useState<ActivityParticipation[]>([]);
  const [filteredConditions, setFilteredConditions] = useState<HealthCondition[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("conditions");
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Dialog states
  const [isConditionDialogOpen, setIsConditionDialogOpen] = useState(false);
  const [isRestrictionDialogOpen, setIsRestrictionDialogOpen] = useState(false);
  const [editingCondition, setEditingCondition] = useState<HealthCondition | null>(null);
  
  // Form states
  const [conditionForm, setConditionForm] = useState<Partial<HealthCondition>>({
    type: 'medical',
    condition: '',
    severity: 'mild',
    description: '',
    symptoms: [],
    triggers: [],
    medications: [],
    restrictions: [],
    contactRequired: false,
    isActive: true
  });

  const [restrictionForm, setRestrictionForm] = useState<Partial<ActivityRestriction>>({
    activityType: 'physical_education',
    restriction: '',
    reason: '',
    severity: 'minor',
    isTemporary: false,
    doctorApprovalRequired: false,
    conditions: []
  });

  // Fetch data
  useEffect(() => {
    if (!selectedStudent) return;
    fetchActivityData();
  }, [selectedStudent]);

  // Filter conditions
  useEffect(() => {
    applyFilters();
  }, [healthConditions, searchQuery, severityFilter, typeFilter]);

  const fetchActivityData = async () => {
    if (!selectedStudent) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [conditionsRes, restrictionsRes, participationRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/health/activity-conditions/${selectedStudent._id}`),
        axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/health/activity-restrictions/${selectedStudent._id}`),
        axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/health/activity-participation/${selectedStudent._id}`)
      ]);

      setHealthConditions(conditionsRes.data || []);
      setActivityRestrictions(restrictionsRes.data || []);
      setActivityParticipation(participationRes.data || []);
    } catch (err) {
      console.error('Failed to fetch activity data:', err);
      setError('Failed to load activity data');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...healthConditions];
    
    if (severityFilter !== 'all') {
      filtered = filtered.filter(condition => condition.severity === severityFilter);
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(condition => condition.type === typeFilter);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(condition =>
        condition.condition.toLowerCase().includes(query) ||
        condition.description?.toLowerCase().includes(query) ||
        condition.symptoms.some(symptom => symptom.toLowerCase().includes(query)) ||
        condition.triggers.some(trigger => trigger.toLowerCase().includes(query))
      );
    }
    
    setFilteredConditions(filtered);
  };

  const saveHealthCondition = async () => {
    if (!selectedStudent || !conditionForm.condition?.trim()) return;
    
    try {
      const conditionData = {
        ...conditionForm,
        studentId: selectedStudent._id,
        dateAdded: editingCondition ? editingCondition.dateAdded : new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      if (editingCondition) {
        await axios.put(`${process.env.NEXT_PUBLIC_SRS_SERVER}/health/activity-conditions/${editingCondition._id}`, conditionData);
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_SRS_SERVER}/health/activity-conditions`, conditionData);
      }
      
      resetConditionForm();
      setIsConditionDialogOpen(false);
      fetchActivityData(); // Refresh data
    } catch (err) {
      setError('Failed to save health condition');
    }
  };

  const deleteHealthCondition = async (conditionId: string) => {
    if (!conditionId) return;
    
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_SRS_SERVER}/health/activity-conditions/${conditionId}`);
      fetchActivityData(); // Refresh data
    } catch (err) {
      setError('Failed to delete health condition');
    }
  };

  const resetConditionForm = () => {
    setConditionForm({
      type: 'medical',
      condition: '',
      severity: 'mild',
      description: '',
      symptoms: [],
      triggers: [],
      medications: [],
      restrictions: [],
      contactRequired: false,
      isActive: true
    });
    setEditingCondition(null);
  };

  const editCondition = (condition: HealthCondition) => {
    setConditionForm(condition);
    setEditingCondition(condition);
    setIsConditionDialogOpen(true);
  };

  const getConditionTypeColor = (type: string) => {
    const colors = {
      'allergy': 'bg-red-100 text-red-800',
      'medical': 'bg-blue-100 text-blue-800',
      'disability': 'bg-purple-100 text-purple-800',
      'chronic': 'bg-orange-100 text-orange-800',
      'dietary': 'bg-green-100 text-green-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      'mild': <Badge className="bg-green-100 text-green-800">Mild</Badge>,
      'moderate': <Badge className="bg-yellow-100 text-yellow-800">Moderate</Badge>,
      'severe': <Badge className="bg-red-100 text-red-800">Severe</Badge>
    };
    return variants[severity as keyof typeof variants] || null;
  };

  const getConditionIcon = (type: string) => {
    const icons = {
      'allergy': <AlertTriangle className="h-5 w-5 text-red-500" />,
      'medical': <Stethoscope className="h-5 w-5 text-blue-500" />,
      'disability': <Shield className="h-5 w-5 text-purple-500" />,
      'chronic': <Heart className="h-5 w-5 text-orange-500" />,
      'dietary': <Pill className="h-5 w-5 text-green-500" />
    };
    return icons[type as keyof typeof icons] || <Heart className="h-5 w-5 text-gray-500" />;
  };

  if (studentLoading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <span>Loading student data...</span>
      </div>
    );
  }

  if (!selectedStudent) {
    return (
      <div className="min-h-screen p-8">
        <Alert>
          <AlertDescription>
            Please select a student to view activity conditions and restrictions.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <span>Loading activity data...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-gray-800 dark:text-white">
            Activity Conditions & Restrictions
          </h1>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Avatar className="h-10 w-10">
              {selectedStudent.profilePhoto && (
                <AvatarImage src={selectedStudent.profilePhoto} alt={`${selectedStudent.firstName} ${selectedStudent.lastName}`} />
              )}
              <AvatarFallback>{selectedStudent.firstName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">
                {selectedStudent.firstName} {selectedStudent.lastName}
              </div>
              <div className="text-xs text-gray-500">
                Grade {selectedStudent.class} • Section {selectedStudent.section}
              </div>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Manage health conditions that affect activity participation
          </p>
        </div>

        {error && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-600">{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="conditions" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Health Conditions
            </TabsTrigger>
            <TabsTrigger value="restrictions" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Activity Restrictions
            </TabsTrigger>
            <TabsTrigger value="participation" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Participation Log
            </TabsTrigger>
          </TabsList>

          {/* Health Conditions Tab */}
          <TabsContent value="conditions" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-red-500" />
                      Health Conditions Affecting Activities
                    </CardTitle>
                    <CardDescription>
                      Manage health conditions that may affect your child's participation in school activities
                    </CardDescription>
                  </div>
                  <Dialog open={isConditionDialogOpen} onOpenChange={(open) => {
                    setIsConditionDialogOpen(open);
                    if (!open) resetConditionForm();
                  }}>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add Condition
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          {editingCondition ? 'Edit Health Condition' : 'Add Health Condition'}
                        </DialogTitle>
                        <DialogDescription>
                          Add or edit a health condition that affects activity participation
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Condition Type</Label>
                            <Select 
                              value={conditionForm.type} 
                              onValueChange={(value: HealthCondition['type']) => 
                                setConditionForm(prev => ({ ...prev, type: value }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="allergy">Allergy</SelectItem>
                                <SelectItem value="medical">Medical Condition</SelectItem>
                                <SelectItem value="disability">Disability</SelectItem>
                                <SelectItem value="chronic">Chronic Condition</SelectItem>
                                <SelectItem value="dietary">Dietary Restriction</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Severity</Label>
                            <Select 
                              value={conditionForm.severity} 
                              onValueChange={(value: HealthCondition['severity']) => 
                                setConditionForm(prev => ({ ...prev, severity: value }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="mild">Mild</SelectItem>
                                <SelectItem value="moderate">Moderate</SelectItem>
                                <SelectItem value="severe">Severe</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div>
                          <Label>Condition Name</Label>
                          <Input
                            value={conditionForm.condition || ''}
                            onChange={(e) => setConditionForm(prev => ({ ...prev, condition: e.target.value }))}
                            placeholder="e.g., Asthma, Diabetes, Epilepsy"
                          />
                        </div>
                        
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={conditionForm.description || ''}
                            onChange={(e) => setConditionForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Detailed description of the condition"
                          />
                        </div>
                        
                        <div>
                          <Label>Symptoms (comma-separated)</Label>
                          <Input
                            value={conditionForm.symptoms?.join(', ') || ''}
                            onChange={(e) => setConditionForm(prev => ({ 
                              ...prev, 
                              symptoms: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                            }))}
                            placeholder="e.g., shortness of breath, fatigue, headaches"
                          />
                        </div>
                        
                        <div>
                          <Label>Triggers (comma-separated)</Label>
                          <Input
                            value={conditionForm.triggers?.join(', ') || ''}
                            onChange={(e) => setConditionForm(prev => ({ 
                              ...prev, 
                              triggers: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                            }))}
                            placeholder="e.g., physical exertion, dust, stress"
                          />
                        </div>
                        
                        <div>
                          <Label>Current Medications (comma-separated)</Label>
                          <Input
                            value={conditionForm.medications?.join(', ') || ''}
                            onChange={(e) => setConditionForm(prev => ({ 
                              ...prev, 
                              medications: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                            }))}
                            placeholder="e.g., Inhaler, EpiPen, Insulin"
                          />
                        </div>
                        
                        <div>
                          <Label>Activity Restrictions (comma-separated)</Label>
                          <Input
                            value={conditionForm.restrictions?.join(', ') || ''}
                            onChange={(e) => setConditionForm(prev => ({ 
                              ...prev, 
                              restrictions: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                            }))}
                            placeholder="e.g., No swimming, Limited running, Avoid dust"
                          />
                        </div>
                        
                        <div>
                          <Label>Emergency Plan</Label>
                          <Textarea
                            value={conditionForm.emergencyPlan || ''}
                            onChange={(e) => setConditionForm(prev => ({ ...prev, emergencyPlan: e.target.value }))}
                            placeholder="What to do in case of emergency"
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={conditionForm.contactRequired || false}
                            onCheckedChange={(checked) => setConditionForm(prev => ({ ...prev, contactRequired: checked }))}
                          />
                          <Label>Require parent contact before activities</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={conditionForm.isActive !== false}
                            onCheckedChange={(checked) => setConditionForm(prev => ({ ...prev, isActive: checked }))}
                          />
                          <Label>Condition is currently active</Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConditionDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={saveHealthCondition}>
                          {editingCondition ? 'Update' : 'Add'} Condition
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search conditions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="allergy">Allergy</SelectItem>
                      <SelectItem value="medical">Medical</SelectItem>
                      <SelectItem value="disability">Disability</SelectItem>
                      <SelectItem value="chronic">Chronic</SelectItem>
                      <SelectItem value="dietary">Dietary</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severity</SelectItem>
                      <SelectItem value="mild">Mild</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="severe">Severe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Conditions List */}
                {filteredConditions.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-xl font-medium text-gray-600 dark:text-gray-400">No conditions found</p>
                    <p className="text-gray-500 dark:text-gray-500 mt-2">
                      {searchQuery ? "No conditions match your search criteria." : "Add your child's first health condition."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredConditions.map((condition) => (
                      <motion.div
                        key={condition._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card className="hover:shadow-md transition-all duration-200">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div className="flex items-start space-x-3">
                                <div className="mt-0.5">
                                  {getConditionIcon(condition.type)}
                                </div>
                                <div>
                                  <CardTitle className="text-lg">{condition.condition}</CardTitle>
                                  <CardDescription className="flex flex-wrap items-center gap-2 mt-1">
                                    <Badge className={getConditionTypeColor(condition.type)}>
                                      {condition.type.charAt(0).toUpperCase() + condition.type.slice(1)}
                                    </Badge>
                                    {getSeverityBadge(condition.severity)}
                                    {condition.contactRequired && (
                                      <Badge variant="outline" className="bg-orange-50 text-orange-700">
                                        Contact Required
                                      </Badge>
                                    )}
                                    {!condition.isActive && (
                                      <Badge variant="outline" className="bg-gray-50 text-gray-700">
                                        Inactive
                                      </Badge>
                                    )}
                                  </CardDescription>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => editCondition(condition)}
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => condition._id && deleteHealthCondition(condition._id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {condition.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">{condition.description}</p>
                            )}
                            
                            {condition.symptoms.length > 0 && (
                              <div>
                                <span className="text-sm font-medium">Symptoms: </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {condition.symptoms.map((symptom, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {symptom}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {condition.triggers.length > 0 && (
                              <div>
                                <span className="text-sm font-medium">Triggers: </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {condition.triggers.map((trigger, index) => (
                                    <Badge key={index} variant="outline" className="text-xs bg-yellow-50 text-yellow-800">
                                      {trigger}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {condition.medications.length > 0 && (
                              <div>
                                <span className="text-sm font-medium">Medications: </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {condition.medications.map((medication, index) => (
                                    <Badge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-800">
                                      {medication}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {condition.restrictions.length > 0 && (
                              <div>
                                <span className="text-sm font-medium">Activity Restrictions: </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {condition.restrictions.map((restriction, index) => (
                                    <Badge key={index} variant="outline" className="text-xs bg-red-50 text-red-800">
                                      {restriction}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {condition.emergencyPlan && (
                              <div className="p-3 bg-red-50 rounded-lg">
                                <span className="text-sm font-medium text-red-800">Emergency Plan: </span>
                                <p className="text-sm text-red-700 mt-1">{condition.emergencyPlan}</p>
                              </div>
                            )}
                            
                            <div className="text-xs text-gray-500 pt-2 border-t">
                              Added: {format(parseISO(condition.dateAdded), "MMM d, yyyy")}
                              {condition.lastUpdated && condition.lastUpdated !== condition.dateAdded && (
                                <span> • Updated: {format(parseISO(condition.lastUpdated), "MMM d, yyyy")}</span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Restrictions Tab */}
          <TabsContent value="restrictions" className="space-y-6">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Shield className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-xl font-medium text-gray-600 dark:text-gray-400">Activity Restrictions</p>
                <p className="text-gray-500 dark:text-gray-500 mt-2 text-center">
                  This feature is coming soon. Specific activity restrictions will be manageable here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Participation Log Tab */}
          <TabsContent value="participation" className="space-y-6">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Activity className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-xl font-medium text-gray-600 dark:text-gray-400">Participation Log</p>
                <p className="text-gray-500 dark:text-gray-500 mt-2 text-center">
                  This feature is coming soon. Activity participation history will be viewable here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
