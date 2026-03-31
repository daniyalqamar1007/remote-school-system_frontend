// app/parent/context/StudentContext.tsx
"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

export interface Student {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dob: string;
    address: string;
    class: string;
    section: string;
    enrollDate: string;
    expectedGraduation: string;
    emergencyContact: string;
    profilePhoto: string;
    parents: Array<{
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      address: string;
    }>;
   
  }

interface StudentContextType {
  students: Student[];
  isLoading: boolean;
  selectedStudent: Student | null;
  setSelectedStudent: (student: Student) => void;
  refreshStudents: () => void;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export const StudentProvider = ({ children }: { children: React.ReactNode }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStudents = async () => {
    console.log('🔍 StudentContext Debug - fetchStudents called');
    
    // Get auth token - backend will extract parent ID from JWT token
    const authToken = typeof window !== "undefined" ? localStorage.getItem("authToken") || localStorage.getItem("accessToken") : null;
    
    console.log('🔍 AuthToken from localStorage:', authToken ? 'Present' : 'Missing');
    
    if (!authToken) {
      console.warn('⚠️ Authentication token missing, not fetching students');
      setStudents([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      // Use the unified auth endpoint - backend gets parent ID from JWT token
      const apiUrl = `${process.env.NEXT_PUBLIC_SRS_SERVER}/auth/parent/children`;
      console.log('📡 Fetching children from URL:', apiUrl);
      
      const res = await axios.get(apiUrl, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true,
      });
      
      console.log('✅ Children data received:', res.data);
      // Handle both array response and wrapped response
      const studentsFromApi = Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.children || []);
      setStudents(studentsFromApi);
      
      if (!selectedStudent && studentsFromApi.length > 0) {
        console.log('🎯 Setting first student as selected:', studentsFromApi[0]);
        setSelectedStudent(studentsFromApi[0]);
      }
    } catch (err: any) {
      console.error('❌ Error fetching children:', err);
      console.error('❌ Error details:', err.response?.data);
      
      // If authentication failed, clear localStorage and don't keep trying
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.warn('🔓 Authentication failed - clearing localStorage');
        localStorage.removeItem('parentId');
        localStorage.removeItem('authToken');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userProfile');
        localStorage.removeItem('role');
        localStorage.removeItem('id');
        // Redirect to login if we're in the browser
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
      
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if we have authentication token
    const checkAndFetch = () => {
      const authToken = typeof window !== "undefined" ? localStorage.getItem("authToken") || localStorage.getItem("accessToken") : null;
      
      if (authToken) {
        fetchStudents();
      } else {
        console.warn('⚠️ Authentication token missing in StudentContext');
        setStudents([]);
        setIsLoading(false);
      }
    };

    // Initial check
    checkAndFetch();

    // Set up a much less frequent interval - only check every 5 minutes
    const authCheckInterval = setInterval(checkAndFetch, 300000); // Check every 5 minutes (300000ms)

    return () => clearInterval(authCheckInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshStudents = () => {
    const authToken = typeof window !== "undefined" ? localStorage.getItem("authToken") || localStorage.getItem("accessToken") : null;
    
    if (authToken) {
      fetchStudents();
    } else {
      console.warn('⚠️ Cannot refresh students - authentication token missing');
    }
  };

  return (
    <StudentContext.Provider
      value={{
        students,
        isLoading,
        selectedStudent,
        setSelectedStudent,
        refreshStudents,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
};

export const useStudent = () => {
  const context = useContext(StudentContext);
  if (!context)
    throw new Error("useStudent must be used within StudentProvider");
  return context;
};