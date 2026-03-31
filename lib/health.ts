import axios from "axios"
import { getAuthHeaders } from './token'

const API = process.env.NEXT_PUBLIC_SRS_SERVER

export const getStudents = async (page = 1, limit = 50) => {
  try {
    // Use school-scoped nurse endpoint to get students from User schema
    const { data } = await axios.get(`${API}/nurse/students`, {
      params: { page, limit },
      headers: getAuthHeaders(),
    })
    return data
  } catch (error) {
    console.error('Error fetching students from nurse endpoint:', error)
    // Fallback to original student endpoint if needed
    try {
      const { data: fallbackData } = await axios.get(`${API}/student`, {
        params: { page, limit },
        headers: getAuthHeaders(),
      })
      return fallbackData
    } catch (fallbackError) {
      console.error('Fallback student endpoint also failed:', fallbackError)
      return { data: [] }
    }
  }
}

export const getStudentById = async (id: string) => {
  try {
    // Use school-scoped nurse endpoint to get student from User schema
    const { data } = await axios.get(`${API}/nurse/student/${id}`, {
      headers: getAuthHeaders(),
    })
    return data
  } catch (error) {
    console.error('Error fetching student from nurse endpoint:', error)
    // Fallback to original student endpoint if needed
    try {
      const { data: fallbackData } = await axios.get(`${API}/student/${id}`, { 
        withCredentials: true 
      })
      return fallbackData
    } catch (fallbackError) {
      console.error('Fallback student endpoint also failed:', fallbackError)
      throw fallbackError
    }
  }
}

// Health profile
export const getHealthProfile = async (studentId: string) => {
  const { data } = await axios.get(`${API}/health/profile/${studentId}`, { 
    headers: getAuthHeaders() 
  })
  return data
}

export const upsertHealthProfile = async (studentId: string, payload: { medicalConditions?: string[] }) => {
  const { data } = await axios.put(`${API}/health/profile/${studentId}`, payload, { 
    headers: getAuthHeaders() 
  })
  return data
}

// Allergies
export const getAllergies = async (studentId: string) => {
  const { data } = await axios.get(`${API}/health/allergies/${studentId}`, { 
    headers: getAuthHeaders() 
  })
  return data
}

export const updateAllergies = async (studentId: string, allergies: string[]) => {
  const { data } = await axios.put(`${API}/health/allergies/${studentId}`, { allergies }, { 
    headers: getAuthHeaders() 
  })
  return data
}

// Batch allergies function for multiple students
export const getAllergiesForMany = async (studentIds: string[]) => {
  try {
    const allergiesPromises = studentIds.map(id => getAllergies(id).catch(() => ({ allergies: [] })))
    const allergiesResults = await Promise.all(allergiesPromises)
    
    const allergiesMap: { [key: string]: string[] } = {}
    studentIds.forEach((id, index) => {
      allergiesMap[id] = allergiesResults[index]?.allergies || []
    })
    
    return allergiesMap
  } catch (error) {
    console.error('Error fetching allergies for multiple students:', error)
    return {}
  }
}

// Immunizations
export const getImmunizations = async (studentId: string) => {
  const { data } = await axios.get(`${API}/health/immunizations/${studentId}`, { 
    headers: getAuthHeaders() 
  })
  return data
}

export const addImmunization = async (
  studentId: string,
  payload: { vaccineName: string; date: string; lotNumber?: string; fileUrl?: string },
) => {
  const { data } = await axios.post(`${API}/health/immunizations/${studentId}`, payload, { 
    headers: getAuthHeaders() 
  })
  return data
}

// Medication logs
export const getMedicationLogs = async (studentId: string) => {
  const { data } = await axios.get(`${API}/health/medications/${studentId}`, { 
    headers: getAuthHeaders() 
  })
  return data
}

export const addMedicationLog = async (
  studentId: string,
  payload: {
    medication: string
    description: string
    dosage: string
    frequency: string
    administeredBy: string
    startDate: string
    endDate: string
    storageMethod?: string
    authorizedBy?: string
    dateTime: string
  },
) => {
  const { data } = await axios.post(`${API}/health/medications/${studentId}`, payload, { 
    headers: getAuthHeaders() 
  })
  return data
}

// Nurse visits
export const getNurseVisits = async (studentId: string) => {
  const { data } = await axios.get(`${API}/health/visits/${studentId}`, { 
    headers: getAuthHeaders() 
  })
  return data
}

export const addNurseVisit = async (
  studentId: string,
  payload: {
    visitDateTime: string
    reason: string
    actionTaken: string
    logoutTime?: string
    disposition: string
    parentContacted: boolean
    contactMethod?: string
    notes?: string
  },
) => {
  try {
    const { data } = await axios.post(`${API}/health/visits/${studentId}`, payload, {
      headers: getAuthHeaders(),
    })
    return data
  } catch (error) {
    console.error('Error adding nurse visit:', error)
    throw error
  }
}

// Medical Documents - Parent Portal APIs
export const getMedicalDocuments = async (studentId: string) => {
  const { data } = await axios.get(`${API}/health/medical-documents/${studentId}`, { 
    headers: getAuthHeaders() 
  })
  return data
}

export const getMedicalDocumentsByType = async (studentId: string, type: string) => {
  const { data } = await axios.get(`${API}/health/medical-documents/${studentId}/type/${type}`, { 
    headers: getAuthHeaders() 
  })
  return data
}

export const createMedicalDocument = async (payload: any) => {
  const { data } = await axios.post(`${API}/health/medical-documents`, payload, { 
    headers: getAuthHeaders() 
  })
  return data
}

export const updateMedicalDocument = async (documentId: string, payload: any) => {
  const { data } = await axios.put(`${API}/health/medical-documents/${documentId}`, payload, { 
    headers: getAuthHeaders() 
  })
  return data
}

// Health Conditions - Parent Portal APIs
export const getHealthConditions = async (studentId: string) => {
  const { data } = await axios.get(`${API}/health/conditions/${studentId}`, { 
    headers: getAuthHeaders() 
  })
  return data
}

export const addHealthCondition = async (studentId: string, condition: string) => {
  const { data } = await axios.post(`${API}/health/conditions/${studentId}`, { condition }, { 
    headers: getAuthHeaders() 
  })
  return data
}

// Parent-specific endpoints
export const getMedicalDocumentsByParent = async (parentId: string) => {
  const { data } = await axios.get(`${API}/health/parent/${parentId}/medical-documents`, { 
    headers: getAuthHeaders() 
  })
  return data
}

// Reports
export const fetchVisitsReport = async (date?: string) => {
  const { data } = await axios.get(`${API}/health/reports/visits`, {
    params: { date },
    headers: getAuthHeaders(),
  })
  return data
}

export const fetchMedicationsReport = async (date?: string) => {
  const { data } = await axios.get(`${API}/health/reports/medications`, {
    params: { date },
    headers: getAuthHeaders(),
  })
  return data
}

export const fetchImmunizationsReport = async () => {
  const { data } = await axios.get(`${API}/health/reports/immunizations`, { 
    headers: getAuthHeaders() 
  })
  return data
}


