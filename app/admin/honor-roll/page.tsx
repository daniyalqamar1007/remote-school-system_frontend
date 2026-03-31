"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Settings, Award, Calculator, Download, Users, TrendingUp, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { honorRollApi } from '@/lib/api';
import { GradeLevel, GradeLevelLabels, MarkingPeriod, MarkingPeriodLabels } from './enums';

interface HonorRollCriteria {
  _id: string;
  name: string;
  academicYear: string;
  markingPeriod: string;
  gradeLevel: string;
  minGPA: number;
  minGrade: number;
  coreSubjects: string[];
  requireAllCoreSubjects: boolean;
  allowDGrades: boolean;
  allowFGrades: boolean;
  description: string;
  isActive: boolean;
  createdAt: string;
}

interface HonorRollAward {
  _id: string;
  studentId: {
    _id: string;
    firstName: string;
    lastName: string;
    gradeLevel: string;
    section: string;
    gender: string;
  };
  awardName: string;
  academicYear: string;
  markingPeriod: string;
  gradeLevel: string;
  calculatedGPA: number;
  averageGrade: number;
  awardType: string;
  status: string;
  createdAt: string;
}

const API_BASE = process.env.NEXT_PUBLIC_SRS_SERVER;

export default function HonorRollManagement() {
  const [activeTab, setActiveTab] = useState("awards");
  const [criteria, setCriteria] = useState<HonorRollCriteria[]>([]);
  const [awards, setAwards] = useState<HonorRollAward[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCriteriaDialog, setShowCriteriaDialog] = useState(false);
  
  // Filters
  const [academicYear, setAcademicYear] = useState("2024-2025");
  const [markingPeriod, setMarkingPeriod] = useState("Q1");
  const [gradeLevel, setGradeLevel] = useState("");

  // Form states
  const [criteriaForm, setCriteriaForm] = useState({
    name: "",
    academicYear: "2024-2025",
    markingPeriod: MarkingPeriod.Q1,
    gradeLevel: "",
    minGPA: 3.5,
    minGrade: 90,
    coreSubjects: ["Mathematics", "English", "Science", "Social Studies"],
    requireAllCoreSubjects: true,
    allowDGrades: false,
    allowFGrades: false,
    description: ""
  });

  // Use enums for grade levels (matching manage-students format)
  const gradeLevels = Object.values(GradeLevel);
  const markingPeriods = Object.values(MarkingPeriod);
  const academicYears = ["2024-2025", "2025-2026"];
  
  // Form validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [newSubject, setNewSubject] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCriteria();
    fetchAwards();
  }, [academicYear, markingPeriod, gradeLevel]);

  const fetchCriteria = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/honor-roll/criteria`, {
        params: { academicYear, markingPeriod, gradeLevel: gradeLevel === 'all' ? '' : gradeLevel },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      // Handle array response
      const criteriaList = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      setCriteria(criteriaList);
    } catch (error: any) {
      console.error("Error fetching criteria:", error);
      toast.error(error.response?.data?.message || "Failed to fetch honor roll criteria");
      setCriteria([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAwards = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/honor-roll/awards`, {
        params: { academicYear, markingPeriod, gradeLevel: gradeLevel === 'all' ? '' : gradeLevel },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      // Handle array response
      const awardsList = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      setAwards(awardsList);
    } catch (error: any) {
      console.error("Error fetching awards:", error);
      toast.error(error.response?.data?.message || "Failed to fetch honor roll awards");
      setAwards([]);
    } finally {
      setLoading(false);
    }
  };

  const createCriteria = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const response = await axios.post(`${API_BASE}/honor-roll/criteria`, criteriaForm, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      toast.success("Honor roll criteria created successfully");
      setShowCriteriaDialog(false);
      setCriteriaForm({
        name: "",
        academicYear: "2024-2025",
        markingPeriod: MarkingPeriod.Q1,
        gradeLevel: "",
        minGPA: 3.5,
        minGrade: 90,
        coreSubjects: ["Mathematics", "English", "Science", "Social Studies"],
        requireAllCoreSubjects: true,
        allowDGrades: false,
        allowFGrades: false,
        description: ""
      });
      setFormErrors({});
      setNewSubject("");
      fetchCriteria();
    } catch (error: any) {
      console.error("Error creating criteria:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to create honor roll criteria";
      toast.error(errorMessage);
      
      // Log detailed error for debugging
      if (error.response?.data) {
        console.error("API Error Details:", error.response.data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateHonorRoll = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const response = await axios.post(`${API_BASE}/honor-roll/calculate`, {
        academicYear,
        markingPeriod
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const result = response.data?.data || response.data;
      toast.success(`Honor roll calculated: ${result.awarded || 0} students awarded out of ${result.processed || 0} processed`);
      fetchAwards();
    } catch (error: any) {
      console.error("Error calculating honor roll:", error);
      toast.error(error.response?.data?.message || "Failed to calculate honor roll. Make sure criteria are set up first.");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!criteriaForm.name || criteriaForm.name.trim() === '') {
      errors.name = 'Award name is required';
    }
    
    if (!criteriaForm.gradeLevel) {
      errors.gradeLevel = 'Grade level is required';
    }
    
    if (criteriaForm.minGPA < 0 || criteriaForm.minGPA > 4) {
      errors.minGPA = 'GPA must be between 0 and 4';
    }
    
    if (criteriaForm.minGrade < 0 || criteriaForm.minGrade > 100) {
      errors.minGrade = 'Grade must be between 0 and 100';
    }
    
    if (criteriaForm.coreSubjects.length === 0) {
      errors.coreSubjects = 'At least one core subject is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const addCoreSubject = () => {
    const subject = newSubject.trim();
    if (subject && !criteriaForm.coreSubjects.includes(subject)) {
      setCriteriaForm({
        ...criteriaForm,
        coreSubjects: [...criteriaForm.coreSubjects, subject]
      });
      setNewSubject("");
      // Remove error if subjects are added
      if (formErrors.coreSubjects) {
        setFormErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.coreSubjects;
          return newErrors;
        });
      }
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setCriteriaForm(prev => ({ ...prev, [field]: value }));
    // Remove error when field is changed
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const removeCoreSubject = (index: number) => {
    setCriteriaForm({
      ...criteriaForm,
      coreSubjects: criteriaForm.coreSubjects.filter((_, i) => i !== index)
    });
  };

  const getAwardBadgeColor = (awardName: string) => {
    if (awardName.toLowerCase().includes("excellence")) return "bg-yellow-500";
    if (awardName.toLowerCase().includes("high honor")) return "bg-gray-500";
    if (awardName.toLowerCase().includes("honor")) return "bg-green-500";
    return "bg-gray-500";
  };

  const groupedAwards = awards.reduce((acc, award) => {
    const key = `${award.gradeLevel}-${award.awardName}`;
    if (!acc[key]) {
      acc[key] = {
        gradeLevel: award.gradeLevel,
        awardName: award.awardName,
        count: 0,
        students: []
      };
    }
    acc[key].count++;
    acc[key].students.push(award);
    return acc;
  }, {} as any);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Honor Roll Management</h1>
          <p className="text-gray-600">Manage honor roll criteria and track student achievements</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={calculateHonorRoll} disabled={loading}>
            <Calculator className="h-4 w-4 mr-2" />
            Calculate Honor Roll
          </Button>
          <Dialog open={showCriteriaDialog} onOpenChange={setShowCriteriaDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Criteria
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Honor Roll Criteria</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">
                      Award Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={criteriaForm.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      placeholder="Excellence Award"
                      className={formErrors.name ? 'border-red-500' : ''}
                    />
                    {formErrors.name && <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>}
                  </div>
                  <div>
                    <Label htmlFor="gradeLevel">
                      Grade Level <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      value={criteriaForm.gradeLevel} 
                      onValueChange={(value) => handleFieldChange('gradeLevel', value)}
                    >
                      <SelectTrigger className={formErrors.gradeLevel ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {gradeLevels.map(grade => (
                          <SelectItem key={grade} value={grade}>{GradeLevelLabels[grade]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.gradeLevel && <p className="text-sm text-red-500 mt-1">{formErrors.gradeLevel}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="academicYear">Academic Year</Label>
                    <Select value={criteriaForm.academicYear} onValueChange={(value) => handleFieldChange('academicYear', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {academicYears.map(year => (
                          <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="markingPeriod">Marking Period</Label>
                    <Select value={criteriaForm.markingPeriod} onValueChange={(value) => handleFieldChange('markingPeriod', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {markingPeriods.map(period => (
                          <SelectItem key={period} value={period}>{MarkingPeriodLabels[period]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minGPA">
                      Minimum GPA <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="minGPA"
                      type="number"
                      step="0.1"
                      min="0"
                      max="4"
                      value={criteriaForm.minGPA}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value) && value >= 0 && value <= 4) {
                          handleFieldChange('minGPA', value);
                        }
                      }}
                      className={formErrors.minGPA ? 'border-red-500' : ''}
                    />
                    {formErrors.minGPA && <p className="text-sm text-red-500 mt-1">{formErrors.minGPA}</p>}
                    <p className="text-xs text-gray-500 mt-1">Must be between 0 and 4.0</p>
                  </div>
                  <div>
                    <Label htmlFor="minGrade">
                      Minimum Grade % <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="minGrade"
                      type="number"
                      min="0"
                      max="100"
                      value={criteriaForm.minGrade}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value) && value >= 0 && value <= 100) {
                          handleFieldChange('minGrade', value);
                        }
                      }}
                      className={formErrors.minGrade ? 'border-red-500' : ''}
                    />
                    {formErrors.minGrade && <p className="text-sm text-red-500 mt-1">{formErrors.minGrade}</p>}
                    <p className="text-xs text-gray-500 mt-1">Must be between 0 and 100</p>
                  </div>
                </div>

                <div>
                  <Label>
                    Core Subjects <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {criteriaForm.coreSubjects.map((subject, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="cursor-pointer flex items-center gap-1"
                        onClick={() => removeCoreSubject(index)}
                      >
                        {subject}
                        <X className="h-3 w-3" />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      placeholder="Enter subject name"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCoreSubject();
                        }
                      }}
                      className={formErrors.coreSubjects ? 'border-red-500' : ''}
                    />
                    <Button 
                      type="button"
                      onClick={addCoreSubject}
                      variant="outline"
                      className="bg-gray-600 hover:bg-gray-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  {formErrors.coreSubjects && <p className="text-sm text-red-500 mt-1">{formErrors.coreSubjects}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="requireAll"
                      checked={criteriaForm.requireAllCoreSubjects}
                      onCheckedChange={(checked) => setCriteriaForm({ ...criteriaForm, requireAllCoreSubjects: checked })}
                    />
                    <Label htmlFor="requireAll">Require all core subjects</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="allowD"
                      checked={criteriaForm.allowDGrades}
                      onCheckedChange={(checked) => setCriteriaForm({ ...criteriaForm, allowDGrades: checked })}
                    />
                    <Label htmlFor="allowD">Allow D grades</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="allowF"
                      checked={criteriaForm.allowFGrades}
                      onCheckedChange={(checked) => setCriteriaForm({ ...criteriaForm, allowFGrades: checked })}
                    />
                    <Label htmlFor="allowF">Allow F grades</Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={criteriaForm.description}
                    onChange={(e) => setCriteriaForm({ ...criteriaForm, description: e.target.value })}
                    placeholder="Description of this honor roll award..."
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowCriteriaDialog(false);
                      setFormErrors({});
                      setNewSubject("");
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={createCriteria}
                    disabled={isSubmitting}
                    className="bg-gray-600 hover:bg-gray-700 text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Criteria'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-end">
            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Select value={academicYear} onValueChange={setAcademicYear}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Marking Period</Label>
              <Select value={markingPeriod} onValueChange={setMarkingPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                  <SelectContent>
                    {markingPeriods.map(period => (
                      <SelectItem key={period} value={period}>{MarkingPeriodLabels[period]}</SelectItem>
                    ))}
                  </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Grade Level</Label>
              <Select value={gradeLevel} onValueChange={setGradeLevel}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All grades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All grades</SelectItem>
                  {gradeLevels.map(grade => (
                    <SelectItem key={grade} value={grade}>{GradeLevelLabels[grade]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => { fetchCriteria(); fetchAwards(); }}>
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="awards">Honor Roll Awards</TabsTrigger>
          <TabsTrigger value="criteria">Criteria</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="awards" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.values(groupedAwards).map((group: any) => (
              <Card key={`${group.gradeLevel}-${group.awardName}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{group.awardName}</CardTitle>
                      <p className="text-sm text-gray-600">Grade {group.gradeLevel}</p>
                    </div>
                    <Badge className={getAwardBadgeColor(group.awardName)}>
                      <Award className="h-3 w-3 mr-1" />
                      {group.count}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {group.students.slice(0, 3).map((award: HonorRollAward) => (
                      <div key={award._id} className="flex justify-between items-center text-sm">
                        <span>
                          {award.studentId?.firstName || 'Unknown'} {award.studentId?.lastName || ''}
                        </span>
                        <span className="text-gray-600 font-medium">{award.calculatedGPA?.toFixed(2) || 'N/A'}</span>
                      </div>
                    ))}
                    {group.count > 3 && (
                      <p className="text-xs text-gray-500 text-center">
                        +{group.count - 3} more students
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {awards.length === 0 && !loading && (
            <Card>
              <CardContent className="p-8 text-center">
                <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Honor Roll Awards</h3>
                <p className="text-gray-600 mb-4">No students have earned honor roll awards for the selected period.</p>
                <Button onClick={calculateHonorRoll}>
                  Calculate Honor Roll
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="criteria" className="space-y-4">
          <div className="grid gap-4">
            {criteria.map((criterion) => (
              <Card key={criterion._id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{criterion.name}</CardTitle>
                      <p className="text-sm text-gray-600">
                        Grade {criterion.gradeLevel} • {criterion.academicYear} • {criterion.markingPeriod}
                      </p>
                    </div>
                    <Badge variant={criterion.isActive ? "default" : "secondary"}>
                      {criterion.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Min GPA:</span>
                      <p className="font-medium">{criterion.minGPA}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Min Grade:</span>
                      <p className="font-medium">{criterion.minGrade}%</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Core Subjects:</span>
                      <p className="font-medium">{criterion.coreSubjects.length} subjects</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Requirements:</span>
                      <p className="font-medium">
                        {criterion.requireAllCoreSubjects ? "All subjects" : "Some subjects"}
                      </p>
                    </div>
                  </div>
                  {criterion.description && (
                    <p className="text-sm text-gray-600 mt-3">{criterion.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {criteria.length === 0 && !loading && (
            <Card>
              <CardContent className="p-8 text-center">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Criteria Set</h3>
                <p className="text-gray-600 mb-4">Create honor roll criteria to start tracking student achievements.</p>
                <Button onClick={() => setShowCriteriaDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Criteria
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Total Awards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{awards.length}</div>
                <p className="text-sm text-gray-600">Students recognized</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Average GPA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {awards.length > 0 
                    ? (awards.reduce((sum, award) => sum + award.calculatedGPA, 0) / awards.length).toFixed(2)
                    : "0.00"
                  }
                </div>
                <p className="text-sm text-gray-600">Of awarded students</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Active Criteria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{criteria.length}</div>
                <p className="text-sm text-gray-600">Honor roll types</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Honor Roll Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Award</TableHead>
                    <TableHead>GPA</TableHead>
                    <TableHead>Average Grade</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {awards.map((award) => (
                    <TableRow key={award._id}>
                      <TableCell className="font-medium">
                        {award.studentId?.firstName || 'Unknown'} {award.studentId?.lastName || ''}
                      </TableCell>
                      <TableCell>{award.gradeLevel || 'N/A'}</TableCell>
                      <TableCell>{award.awardName || 'N/A'}</TableCell>
                      <TableCell>{award.calculatedGPA?.toFixed(2) || 'N/A'}</TableCell>
                      <TableCell>{award.averageGrade?.toFixed(1) || 'N/A'}%</TableCell>
                      <TableCell>
                        <Badge variant={award.awardType === 'automatic' || award.awardType === 'excellence' || award.awardType === 'high_honor' || award.awardType === 'honor' ? 'default' : 'secondary'}>
                          {award.awardType === 'manual_override' ? 'Manual' : 'Auto'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
