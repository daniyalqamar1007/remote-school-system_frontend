"use client"

import { useEffect, useMemo, useState } from "react"
import { feeApi, studentsApi } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { BarChart, Bar, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Download, History, ReceiptText, RotateCcw, Search } from "lucide-react"

export default function FeeManagementPage({ role }: { role: "admin" | "super-admin" }) {
  const [policies, setPolicies] = useState<any[]>([])
  const [discounts, setDiscounts] = useState<any[]>([])
  const [installments, setInstallments] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [studentSearchResults, setStudentSearchResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [reportsLoading, setReportsLoading] = useState(false)
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [studentLookupLoading, setStudentLookupLoading] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState("")
  const [editingPolicyId, setEditingPolicyId] = useState("")
  const [policyMeta, setPolicyMeta] = useState<any>({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [discountMeta, setDiscountMeta] = useState<any>({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [installmentMeta, setInstallmentMeta] = useState<any>({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [policyFilters, setPolicyFilters] = useState({ academicYear: "", className: "", isActive: "", page: 1, limit: 10 })
  const [discountFilters, setDiscountFilters] = useState({ isActive: "", page: 1, limit: 10 })
  const [installmentFilters, setInstallmentFilters] = useState({ academicYear: "", className: "", status: "", page: 1, limit: 10 })
  const [paymentHistory, setPaymentHistory] = useState<any[]>([])
  const [paymentHistoryLoading, setPaymentHistoryLoading] = useState(false)
  const [selectedHistoryInstallmentId, setSelectedHistoryInstallmentId] = useState("")
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null)
  const [receiptLoading, setReceiptLoading] = useState(false)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [mockScenario, setMockScenario] = useState<"success" | "pending" | "failure">("success")
  const [mockPaymentLoading, setMockPaymentLoading] = useState(false)
  const [reportSummary, setReportSummary] = useState<any>(null)
  const [reportAging, setReportAging] = useState<any>(null)
  const [schoolId, setSchoolId] = useState("")
  const [schools, setSchools] = useState<Array<{ _id: string; name: string; code?: string; schoolCode?: string }>>([])
  const [schoolsLoading, setSchoolsLoading] = useState(false)

  const [policyForm, setPolicyForm] = useState({
    academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    className: "",
    baseFee: "",
    currency: "USD",
    installmentFrequency: "monthly",
    academicStartMonth: "1",
    dueDay: "5",
    graceDays: "0",
    lateFeeType: "fixed",
    lateFeeValue: "0",
    fineType: "daily",
    fineValue: "0",
    maxFineCap: "0",
  })

  const [discountForm, setDiscountForm] = useState({
    studentSearchTerm: "",
    feePolicyId: "",
    discountType: "percentage",
    discountValue: "0",
    reason: "",
    effectiveFrom: "",
    effectiveTo: "",
    isActive: true,
  })

  const [generateForm, setGenerateForm] = useState({
    academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    className: "",
    studentId: "",
  })

  const [paymentForm, setPaymentForm] = useState({
    installmentId: "",
    amount: "",
    paymentMode: "manual_cash",
    referenceNo: "",
    note: "",
  })

  const title = useMemo(() => role === "super-admin" ? "Super Admin Fee Management" : "Admin Fee Management", [role])
  const selectedFeePolicy = useMemo(
    () => policies.find((policy) => policy._id === discountForm.feePolicyId),
    [policies, discountForm.feePolicyId],
  )
  const selectedInstallment = useMemo(
    () => installments.find((installment) => installment._id === paymentForm.installmentId),
    [installments, paymentForm.installmentId],
  )
  const normalizeStudentSearchValue = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim()
  const buildStudentSearchIndex = (student: any) => normalizeStudentSearchValue([
    student?.studentId || "",
    student?.firstName || "",
    student?.lastName || "",
    student?.email || "",
    student?.phone || "",
    student?.class || "",
    student?.section || "",
  ].join(" "))
  const matchesStudentSearch = (student: any, lookup: string) => {
    const normalizedLookup = normalizeStudentSearchValue(lookup)
    if (!normalizedLookup) return true

    const searchableText = buildStudentSearchIndex(student)
    return normalizedLookup.split(" ").every((term) => searchableText.includes(term))
  }
  const extractStudentsFromResponse = (payload: any): any[] => {
    const list =
      payload?.data?.students ||
      payload?.data?.data ||
      payload?.students ||
      payload?.data ||
      payload ||
      []
    return Array.isArray(list) ? list : []
  }
  const dedupeStudents = (list: any[]) => {
    const seen = new Set<string>()
    return list.filter((student) => {
      const id = String(student?._id || "")
      if (!id || seen.has(id)) return false
      seen.add(id)
      return true
    })
  }

  const matchedStudent = useMemo(() => {
    if (selectedStudentId) {
      return studentSearchResults.find((student) => student?._id === selectedStudentId) || null
    }
    return null
  }, [studentSearchResults, selectedStudentId])

  useEffect(() => {
    if (role !== "super-admin") return

    const loadSchools = async () => {
      try {
        setSchoolsLoading(true)
        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("accessToken") ||
          localStorage.getItem("authToken") ||
          ""

        if (!token) {
          setSchools([])
          return
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/schools?limit=1000`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          setSchools([])
          return
        }

        const payload = await response.json().catch(() => ({}))
        const list = payload?.data?.schools || payload?.data || payload?.schools || []
        const parsedSchools = Array.isArray(list) ? list : []
        setSchools(parsedSchools)

        const selectedSchoolId = localStorage.getItem("selectedSchoolId") || localStorage.getItem("schoolId") || ""
        const rawUser = localStorage.getItem("userInfo")
        let derivedSchoolId = ""
        if (rawUser) {
          try {
            const parsedUser = JSON.parse(rawUser)
            derivedSchoolId = parsedUser?.selectedSchoolId || parsedUser?.schoolId || ""
          } catch {
            derivedSchoolId = ""
          }
        }

        const preferredSchoolId = selectedSchoolId || derivedSchoolId
        const hasPreferred = preferredSchoolId && parsedSchools.some((s: any) => s?._id === preferredSchoolId)
        const fallbackSchoolId = parsedSchools[0]?._id || ""
        const nextSchoolId = hasPreferred ? preferredSchoolId : fallbackSchoolId

        if (nextSchoolId) {
          setSchoolId(nextSchoolId)
          localStorage.setItem("selectedSchoolId", nextSchoolId)
        }
      } catch {
        setSchools([])
      } finally {
        setSchoolsLoading(false)
      }
    }

    loadSchools()
  }, [role])

  const requireSchoolIdForSuperAdmin = () => {
    if (role !== "super-admin") return true
    if (schoolId.trim()) return true
    toast.error("School ID is required for Super Admin")
    return false
  }

  const loadAll = async () => {
    try {
      setLoading(true)
      if (role === "super-admin" && !schoolId.trim()) {
        setPolicies([])
        setDiscounts([])
        setInstallments([])
        return
      }

      const baseFilters = role === "super-admin" ? { schoolId: schoolId.trim() } : {}
      const [p, d, i] = await Promise.all([
        feeApi.getPolicies({ ...baseFilters, ...policyFilters }),
        feeApi.getDiscounts({ ...baseFilters, ...discountFilters }),
        feeApi.getInstallments({ ...baseFilters, ...installmentFilters }),
      ])
      const nextPolicies = Array.isArray(p) ? p : (p?.data || [])
      const nextDiscounts = Array.isArray(d) ? d : (d?.data || [])
      const nextInstallments = Array.isArray(i) ? i : (i?.data || [])

      setPolicies(nextPolicies)
      setDiscounts(nextDiscounts)
      setInstallments(nextInstallments)
      setPolicyMeta((!Array.isArray(p) && p?.meta) || { page: 1, limit: 10, total: nextPolicies.length, totalPages: 1 })
      setDiscountMeta((!Array.isArray(d) && d?.meta) || { page: 1, limit: 10, total: nextDiscounts.length, totalPages: 1 })
      setInstallmentMeta((!Array.isArray(i) && i?.meta) || { page: 1, limit: 10, total: nextInstallments.length, totalPages: 1 })

      setDiscountForm((current) => {
        if (current.feePolicyId) return current
        if (!Array.isArray(nextPolicies) || nextPolicies.length !== 1) return current
        return { ...current, feePolicyId: nextPolicies[0]?._id || "" }
      })
    } catch (error: any) {
      toast.error(error?.message || "Failed to load fee data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [schoolId, role, policyFilters, discountFilters, installmentFilters])

  useEffect(() => {
    if (role === "super-admin" && !schoolId.trim()) {
      setReportSummary(null)
      setReportAging(null)
      return
    }
    loadReports()
  }, [schoolId, role])

  useEffect(() => {
    const loadPaymentHistory = async () => {
      const targetInstallmentId = selectedHistoryInstallmentId || paymentForm.installmentId
      if (!targetInstallmentId) {
        setPaymentHistory([])
        return
      }

      try {
        setPaymentHistoryLoading(true)
        const result = await feeApi.getInstallmentPayments(targetInstallmentId, { page: 1, limit: 20, sortBy: "createdAt", sortOrder: "desc" })
        setPaymentHistory(result?.data || [])
      } catch {
        setPaymentHistory([])
      } finally {
        setPaymentHistoryLoading(false)
      }
    }

    loadPaymentHistory()
  }, [paymentForm.installmentId, selectedHistoryInstallmentId])

  useEffect(() => {
    const loadStudents = async () => {
      try {
        if (role === "super-admin" && !schoolId.trim()) {
          setStudents([])
          return
        }

        setStudentsLoading(true)
        const baseFilters: Record<string, string | number> = {
          page: 1,
          limit: 1000,
        }

        if (role === "super-admin" && schoolId.trim()) {
          baseFilters.schoolId = schoolId.trim()
        }

        const selectedClassName = selectedFeePolicy?.className?.trim() || ""

        const withClassFilters = selectedClassName ? { ...baseFilters, className: selectedClassName } : { ...baseFilters }
        const response = await studentsApi.getAll(withClassFilters)
        let nextStudents = extractStudentsFromResponse(response)

        // Some schools store class labels with slight format mismatch; fallback to school-wide list.
        if (selectedClassName && nextStudents.length === 0) {
          const fallbackResponse = await studentsApi.getAll(baseFilters)
          nextStudents = extractStudentsFromResponse(fallbackResponse)
        }

        setStudents(nextStudents)

      } catch (error: any) {
        setStudents([])
        toast.error(error?.message || "Failed to load students")
      } finally {
        setStudentsLoading(false)
      }
    }

    loadStudents()
  }, [role, schoolId, selectedFeePolicy?.className])

  useEffect(() => {
    const lookup = discountForm.studentSearchTerm.trim()
    if (!lookup) {
      setStudentSearchResults([])
      setSelectedStudentId("")
      return
    }

    const timer = setTimeout(async () => {
      try {
        setStudentLookupLoading(true)
        const normalizedLookup = normalizeStudentSearchValue(lookup)
        const searchTokens = normalizedLookup.split(" ").filter(Boolean)
        const filters: Record<string, string | number> = {
          page: 1,
          limit: 10,
          search: searchTokens[0] || normalizedLookup,
        }

        if (role === "super-admin" && schoolId.trim()) {
          filters.schoolId = schoolId.trim()
        }

        if (selectedFeePolicy?.className?.trim()) {
          filters.className = selectedFeePolicy.className.trim()
        }

        const response = await studentsApi.getAll(filters)
        let apiResults = extractStudentsFromResponse(response)

        if (apiResults.length === 0 && selectedFeePolicy?.className?.trim()) {
          const fallbackResponse = await studentsApi.getAll({
            page: 1,
            limit: 10,
            search: searchTokens[0] || normalizedLookup,
            ...(role === "super-admin" && schoolId.trim() ? { schoolId: schoolId.trim() } : {}),
          })
          apiResults = extractStudentsFromResponse(fallbackResponse)
        }

        const localResults = students.filter((student) => matchesStudentSearch(student, normalizedLookup))
        const results = dedupeStudents([...apiResults, ...localResults]).filter((student) => matchesStudentSearch(student, normalizedLookup))
        setStudentSearchResults(results)

        const exactMatch = results.find((student) => matchesStudentSearch(student, lookup))

        if (exactMatch) {
          setSelectedStudentId(exactMatch._id)
        } else if (results.length === 1) {
          setSelectedStudentId(results[0]?._id || "")
        } else if (!results.some((student) => student?._id === selectedStudentId)) {
          setSelectedStudentId("")
        }
      } catch {
        setStudentSearchResults([])
        setSelectedStudentId("")
      } finally {
        setStudentLookupLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [discountForm.studentSearchTerm, role, schoolId, selectedFeePolicy?.className, selectedStudentId, students])

  const createPolicy = async () => {
    try {
      if (!requireSchoolIdForSuperAdmin()) return
      const payload = {
        ...policyForm,
        ...(role === "super-admin" ? { schoolId: schoolId.trim() } : {}),
        baseFee: Number(policyForm.baseFee),
        academicStartMonth: Number(policyForm.academicStartMonth),
        dueDay: Number(policyForm.dueDay),
        graceDays: Number(policyForm.graceDays),
        lateFeeValue: Number(policyForm.lateFeeValue),
        fineValue: Number(policyForm.fineValue),
        maxFineCap: Number(policyForm.maxFineCap),
      }

      if (editingPolicyId) {
        await feeApi.updatePolicy(editingPolicyId, payload)
        toast.success("Fee policy updated")
        setEditingPolicyId("")
      } else {
        await feeApi.createPolicy(payload)
        toast.success("Fee policy created")
      }

      setPolicyForm((current) => ({
        ...current,
        className: "",
        baseFee: "",
      }))
      await loadAll()
    } catch (error: any) {
      toast.error(error?.message || "Failed to save policy")
    }
  }

  const saveDiscount = async () => {
    try {
      if (!requireSchoolIdForSuperAdmin()) return
      if (!discountForm.studentSearchTerm.trim()) {
        toast.error("Student name or email is required")
        return
      }

      if (!matchedStudent?._id) {
        toast.error("Select a matching student from the search results")
        return
      }

      if (!discountForm.feePolicyId.trim()) {
        toast.error("Fee policy is required")
        return
      }

      const parsedValue = Number(discountForm.discountValue)
      if (!Number.isFinite(parsedValue) || parsedValue < 0) {
        toast.error("Discount value must be a non-negative number")
        return
      }

      if (discountForm.discountType === "percentage" && parsedValue > 100) {
        toast.error("Percentage discount cannot exceed 100")
        return
      }

      if (discountForm.effectiveFrom && discountForm.effectiveTo && discountForm.effectiveFrom > discountForm.effectiveTo) {
        toast.error("Effective From date must be before Effective To date")
        return
      }

      await feeApi.upsertDiscount({
        ...discountForm,
        studentId: String(matchedStudent._id),
        ...(role === "super-admin" ? { schoolId: schoolId.trim() } : {}),
        discountValue: parsedValue,
        effectiveFrom: discountForm.effectiveFrom || undefined,
        effectiveTo: discountForm.effectiveTo || undefined,
      })
      toast.success("Student discount saved")
      setDiscountForm((current) => ({
        ...current,
        studentSearchTerm: "",
        discountValue: "0",
        reason: "",
        effectiveFrom: "",
        effectiveTo: "",
        isActive: true,
      }))
      await loadAll()
    } catch (error: any) {
      toast.error(error?.message || "Failed to save discount")
    }
  }

  const generateInstallments = async () => {
    try {
      if (!requireSchoolIdForSuperAdmin()) return
      if (!generateForm.academicYear.trim()) {
        toast.error("Academic year is required")
        return
      }
      const payload: any = { academicYear: generateForm.academicYear }
      if (role === "super-admin") payload.schoolId = schoolId.trim()
      if (generateForm.className.trim()) payload.className = generateForm.className.trim()
      if (generateForm.studentId.trim()) payload.studentId = generateForm.studentId.trim()
      await feeApi.generateInstallments(payload)
      toast.success("Installments generated")
      loadAll()
    } catch (error: any) {
      toast.error(error?.message || "Failed to generate installments")
    }
  }

  const runReminders = async () => {
    try {
      if (!requireSchoolIdForSuperAdmin()) return
      await feeApi.runReminders(role === "super-admin" ? { schoolId: schoolId.trim() } : {})
      toast.success("7-day reminders executed")
    } catch (error: any) {
      toast.error(error?.message || "Failed to run reminders")
    }
  }

  const loadReports = async () => {
    try {
      setReportsLoading(true)
      const baseFilters = role === "super-admin" ? { schoolId: schoolId.trim() } : {}
      const [dashboard, summary, aging] = await Promise.all([
        feeApi.getDashboardReport(baseFilters),
        feeApi.getReportSummary(baseFilters),
        feeApi.getReportAging(baseFilters),
      ])
      setDashboardData(dashboard?.data || null)
      setReportSummary(summary?.data || null)
      setReportAging(aging?.data || null)
    } catch {
      setDashboardData(null)
      setReportSummary(null)
      setReportAging(null)
    } finally {
      setReportsLoading(false)
    }
  }

  const recordPayment = async () => {
    try {
      if (!paymentForm.installmentId.trim()) {
        toast.error("Installment ID is required")
        return
      }
      const parsedAmount = Number(paymentForm.amount)
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        toast.error("Payment amount must be greater than 0")
        return
      }
      await feeApi.recordPayment(paymentForm.installmentId, {
        amount: parsedAmount,
        paymentMode: paymentForm.paymentMode,
        referenceNo: paymentForm.referenceNo,
        note: paymentForm.note,
      })
      toast.success("Payment recorded")
      setPaymentForm({ installmentId: "", amount: "", paymentMode: "manual_cash", referenceNo: "", note: "" })
      loadAll()
    } catch (error: any) {
      toast.error(error?.message || "Failed to record payment")
    }
  }

  const simulatePayment = async () => {
    try {
      if (!paymentForm.installmentId.trim()) {
        toast.error("Installment ID is required")
        return
      }

      const parsedAmount = Number(paymentForm.amount)
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        toast.error("Payment amount must be greater than 0")
        return
      }

      setMockPaymentLoading(true)
      const response = await feeApi.mockPayment({
        installmentId: paymentForm.installmentId,
        amount: parsedAmount,
        paymentMode: paymentForm.paymentMode,
        scenario: mockScenario,
        referenceNo: paymentForm.referenceNo,
        note: paymentForm.note,
      })

      toast.success(`Mock payment ${response?.data?.status || "processed"}`)
      setPaymentForm({ installmentId: "", amount: "", paymentMode: "manual_cash", referenceNo: "", note: "" })
      setSelectedHistoryInstallmentId("")
      setHistoryModalOpen(false)
      loadAll()
      loadReports()
    } catch (error: any) {
      toast.error(error?.message || "Failed to simulate payment")
    } finally {
      setMockPaymentLoading(false)
    }
  }

  const openHistoryModal = (installmentId: string) => {
    setSelectedHistoryInstallmentId(installmentId)
    setPaymentForm((current) => ({ ...current, installmentId }))
    setHistoryModalOpen(true)
  }

  const openReceiptModal = async (payment: any) => {
    try {
      setReceiptLoading(true)
      setReceiptModalOpen(true)
      const response = await feeApi.getPaymentReceipt(payment._id)
      setSelectedReceipt(response?.data || response || payment)
    } catch (error: any) {
      setSelectedReceipt(payment)
      toast.error(error?.message || "Failed to load receipt")
    } finally {
      setReceiptLoading(false)
    }
  }

  const clearInstallment = async (installmentId: string, status: "paid" | "waived") => {
    try {
      await feeApi.manualClearance(installmentId, { status, note: `Manual ${status} by ${role}` })
      toast.success(`Installment marked as ${status}`)
      loadAll()
    } catch (error: any) {
      toast.error(error?.message || "Failed to update installment")
    }
  }

  const editPolicy = (policy: any) => {
    setEditingPolicyId(policy?._id || "")
    setPolicyForm({
      academicYear: String(policy?.academicYear || ""),
      className: String(policy?.className || ""),
      baseFee: String(policy?.baseFee || ""),
      currency: String(policy?.currency || "USD"),
      installmentFrequency: policy?.installmentFrequency === "yearly" ? "yearly" : "monthly",
      academicStartMonth: String(policy?.academicStartMonth || 1),
      dueDay: String(policy?.dueDay || 5),
      graceDays: String(policy?.graceDays || 0),
      lateFeeType: policy?.lateFeeType === "percentage" ? "percentage" : "fixed",
      lateFeeValue: String(policy?.lateFeeValue || 0),
      fineType: policy?.fineType === "percentage" || policy?.fineType === "fixed" ? policy.fineType : "daily",
      fineValue: String(policy?.fineValue || 0),
      maxFineCap: String(policy?.maxFineCap || 0),
    })
  }

  const togglePolicyStatus = async (policy: any, shouldActivate: boolean) => {
    try {
      if (shouldActivate) {
        await feeApi.activatePolicy(policy._id)
      } else {
        await feeApi.deactivatePolicy(policy._id)
      }
      toast.success(`Policy ${shouldActivate ? "activated" : "deactivated"}`)
      loadAll()
    } catch (error: any) {
      toast.error(error?.message || "Failed to update policy status")
    }
  }

  const editDiscount = (discount: any) => {
    setDiscountForm({
      studentSearchTerm: String(discount?.studentId?.firstName || discount?.studentId?.email || discount?.studentId?.studentId || ""),
      feePolicyId: String(discount?.feePolicyId?._id || ""),
      discountType: discount?.discountType === "fixed" ? "fixed" : "percentage",
      discountValue: String(discount?.discountValue ?? 0),
      reason: discount?.reason || "",
      effectiveFrom: discount?.effectiveFrom ? new Date(discount.effectiveFrom).toISOString().slice(0, 10) : "",
      effectiveTo: discount?.effectiveTo ? new Date(discount.effectiveTo).toISOString().slice(0, 10) : "",
      isActive: discount?.isActive !== false,
    })
  }

  const toggleDiscountStatus = async (discount: any, shouldActivate: boolean) => {
    try {
      if (shouldActivate) {
        await feeApi.reactivateDiscount(String(discount?._id || ""))
      } else {
        await feeApi.deactivateDiscount(String(discount?._id || ""))
      }
      toast.success(`Discount ${shouldActivate ? "activated" : "deactivated"}`)
      loadAll()
    } catch (error: any) {
      toast.error(error?.message || "Failed to update discount status")
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            Configure class fees, apply student discounts, generate installments, and manage manual fee clearance.
          </CardDescription>
        </CardHeader>
        {role === "super-admin" && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>School (required for Super Admin)</Label>
                <Select
                  value={schoolId}
                  onValueChange={(value) => {
                    setSchoolId(value)
                    localStorage.setItem("selectedSchoolId", value)
                  }}
                  disabled={schoolsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={schoolsLoading ? "Loading schools..." : "Select school"} />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((school) => (
                      <SelectItem key={school._id} value={school._id}>
                        {school.name}{school.schoolCode || school.code ? ` (${school.schoolCode || school.code})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <Tabs defaultValue="policies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="discounts">Discounts</TabsTrigger>
          <TabsTrigger value="installments">Installments</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{editingPolicyId ? "Edit Class Fee Policy" : "Create Class Fee Policy"}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><Label>Academic Year</Label><Input value={policyForm.academicYear} onChange={(e) => setPolicyForm((s) => ({ ...s, academicYear: e.target.value }))} /></div>
              <div><Label>Class Name</Label><Input value={policyForm.className} onChange={(e) => setPolicyForm((s) => ({ ...s, className: e.target.value }))} /></div>
              <div><Label>Base Fee</Label><Input type="number" value={policyForm.baseFee} onChange={(e) => setPolicyForm((s) => ({ ...s, baseFee: e.target.value }))} /></div>
              <div>
                <Label>Installment Frequency</Label>
                <Select value={policyForm.installmentFrequency} onValueChange={(v) => setPolicyForm((s) => ({ ...s, installmentFrequency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Academic Start Month (1-12)</Label><Input type="number" min={1} max={12} value={policyForm.academicStartMonth} onChange={(e) => setPolicyForm((s) => ({ ...s, academicStartMonth: e.target.value }))} /></div>
              <div><Label>Due Day</Label><Input type="number" value={policyForm.dueDay} onChange={(e) => setPolicyForm((s) => ({ ...s, dueDay: e.target.value }))} /></div>
              <div><Label>Grace Days</Label><Input type="number" value={policyForm.graceDays} onChange={(e) => setPolicyForm((s) => ({ ...s, graceDays: e.target.value }))} /></div>
              <div><Label>Late Fee Value</Label><Input type="number" value={policyForm.lateFeeValue} onChange={(e) => setPolicyForm((s) => ({ ...s, lateFeeValue: e.target.value }))} /></div>
              <div><Label>Fine Value</Label><Input type="number" value={policyForm.fineValue} onChange={(e) => setPolicyForm((s) => ({ ...s, fineValue: e.target.value }))} /></div>
              <div><Label>Max Fine Cap</Label><Input type="number" value={policyForm.maxFineCap} onChange={(e) => setPolicyForm((s) => ({ ...s, maxFineCap: e.target.value }))} /></div>
              <div className="md:col-span-3 space-x-2">
                <Button onClick={createPolicy}>{editingPolicyId ? "Update Policy" : "Save Policy"}</Button>
                {editingPolicyId && <Button variant="outline" onClick={() => setEditingPolicyId("")}>Cancel Edit</Button>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Existing Policies</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
                <Input
                  placeholder="Filter academic year"
                  value={policyFilters.academicYear}
                  onChange={(e) => setPolicyFilters((s) => ({ ...s, academicYear: e.target.value, page: 1 }))}
                />
                <Input
                  placeholder="Filter class"
                  value={policyFilters.className}
                  onChange={(e) => setPolicyFilters((s) => ({ ...s, className: e.target.value, page: 1 }))}
                />
                <Select value={policyFilters.isActive || "all"} onValueChange={(v) => setPolicyFilters((s) => ({ ...s, isActive: v === "all" ? "" : v, page: 1 }))}>
                  <SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Academic Year</TableHead>
                    <TableHead>Base Fee</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policies.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">No fee policies found.</TableCell>
                    </TableRow>
                  )}
                  {policies.map((p) => (
                    <TableRow key={p._id}>
                      <TableCell>{p.className}</TableCell>
                      <TableCell>{p.academicYear}</TableCell>
                      <TableCell>{p.baseFee}</TableCell>
                      <TableCell>{p.installmentFrequency}</TableCell>
                      <TableCell><Badge>{p.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                      <TableCell className="space-x-2">
                        <Button size="sm" variant="outline" onClick={() => editPolicy(p)}>Edit</Button>
                        {p.isActive ? (
                          <Button size="sm" variant="destructive" onClick={() => togglePolicyStatus(p, false)}>Deactivate</Button>
                        ) : (
                          <Button size="sm" variant="secondary" onClick={() => togglePolicyStatus(p, true)}>Activate</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Page {policyMeta.page} of {policyMeta.totalPages} ({policyMeta.total} total)</span>
                <div className="space-x-2">
                  <Button size="sm" variant="outline" disabled={policyMeta.page <= 1} onClick={() => setPolicyFilters((s) => ({ ...s, page: Math.max(1, s.page - 1) }))}>Previous</Button>
                  <Button size="sm" variant="outline" disabled={policyMeta.page >= policyMeta.totalPages} onClick={() => setPolicyFilters((s) => ({ ...s, page: s.page + 1 }))}>Next</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discounts" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Apply Student Discount</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label className="flex items-center gap-2"><Search className="h-4 w-4" />Student Name or Email</Label>
                <Input
                  value={discountForm.studentSearchTerm}
                  placeholder={studentsLoading ? "Loading students..." : "Search by name, email, or student ID"}
                  onChange={(e) => {
                    setDiscountForm((s) => ({ ...s, studentSearchTerm: e.target.value }))
                    setSelectedStudentId("")
                  }}
                  disabled={studentsLoading}
                />
                {discountForm.studentSearchTerm.trim() ? (
                  matchedStudent ? (
                    <p className="mt-1 text-xs text-emerald-600">
                      Selected: {matchedStudent.firstName} {matchedStudent.lastName} - {matchedStudent.email || matchedStudent.studentId}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-destructive">{studentLookupLoading ? "Searching students..." : "No student found for this name, email, or student ID."}</p>
                  )
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">Enter a student name, email, or student ID to search.</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Filtered by the selected school{selectedFeePolicy?.className ? ` and class ${selectedFeePolicy.className}` : ""}.
                </p>
                {studentSearchResults.length > 0 && (
                  <div className="mt-2 rounded-md border bg-muted/30 p-2 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Search results</p>
                    {studentSearchResults.slice(0, 5).map((student) => (
                      <button
                        key={student._id}
                        type="button"
                        className={`w-full text-left rounded px-2 py-1 text-sm transition ${selectedStudentId === student._id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                        onClick={() => setSelectedStudentId(student._id)}
                      >
                        {student.firstName} {student.lastName} - {student.email || student.studentId}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Label>Fee Policy</Label>
                <Select value={discountForm.feePolicyId} onValueChange={(v) => setDiscountForm((s) => ({ ...s, feePolicyId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select fee policy" /></SelectTrigger>
                  <SelectContent>
                    {policies.map((p) => (
                      <SelectItem key={p._id} value={p._id}>{p.className} - {p.academicYear}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Discount Type</Label>
                <Select value={discountForm.discountType} onValueChange={(v) => setDiscountForm((s) => ({ ...s, discountType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Discount Value</Label><Input type="number" value={discountForm.discountValue} onChange={(e) => setDiscountForm((s) => ({ ...s, discountValue: e.target.value }))} /></div>
              <div><Label>Effective From</Label><Input type="date" value={discountForm.effectiveFrom} onChange={(e) => setDiscountForm((s) => ({ ...s, effectiveFrom: e.target.value }))} /></div>
              <div><Label>Effective To</Label><Input type="date" value={discountForm.effectiveTo} onChange={(e) => setDiscountForm((s) => ({ ...s, effectiveTo: e.target.value }))} /></div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={discountForm.isActive} onCheckedChange={(checked) => setDiscountForm((s) => ({ ...s, isActive: checked }))} />
                <Label>Active Discount</Label>
              </div>
              <div className="md:col-span-3"><Label>Reason</Label><Input value={discountForm.reason} onChange={(e) => setDiscountForm((s) => ({ ...s, reason: e.target.value }))} /></div>
              <div className="md:col-span-3"><Button onClick={saveDiscount}>Save Discount</Button></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Current Discounts</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Policy</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {discounts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">No discounts found.</TableCell>
                    </TableRow>
                  )}
                  {discounts.map((d) => (
                    <TableRow key={d._id}>
                      <TableCell>{d.studentId?.firstName} {d.studentId?.lastName}</TableCell>
                      <TableCell>{d.feePolicyId?.className} - {d.feePolicyId?.academicYear}</TableCell>
                      <TableCell>{d.discountType}</TableCell>
                      <TableCell>{d.discountValue}</TableCell>
                      <TableCell>
                        {d.effectiveFrom ? new Date(d.effectiveFrom).toLocaleDateString() : "-"}
                        {" to "}
                        {d.effectiveTo ? new Date(d.effectiveTo).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={d.isActive === false ? "secondary" : "default"}>{d.isActive === false ? "Inactive" : "Active"}</Badge>
                      </TableCell>
                      <TableCell>{d.reason || "-"}</TableCell>
                      <TableCell className="space-x-2">
                        <Button size="sm" variant="outline" onClick={() => editDiscount(d)}>Edit</Button>
                        {d.isActive === false ? (
                          <Button size="sm" variant="secondary" onClick={() => toggleDiscountStatus(d, true)}>Activate</Button>
                        ) : (
                          <Button size="sm" variant="destructive" onClick={() => toggleDiscountStatus(d, false)}>Deactivate</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Page {discountMeta.page} of {discountMeta.totalPages} ({discountMeta.total} total)</span>
                <div className="space-x-2">
                  <Button size="sm" variant="outline" disabled={discountMeta.page <= 1} onClick={() => setDiscountFilters((s) => ({ ...s, page: Math.max(1, s.page - 1) }))}>Previous</Button>
                  <Button size="sm" variant="outline" disabled={discountMeta.page >= discountMeta.totalPages} onClick={() => setDiscountFilters((s) => ({ ...s, page: s.page + 1 }))}>Next</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="installments" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Generate Installments</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div><Label>Academic Year</Label><Input value={generateForm.academicYear} onChange={(e) => setGenerateForm((s) => ({ ...s, academicYear: e.target.value }))} /></div>
              <div><Label>Class (optional)</Label><Input value={generateForm.className} onChange={(e) => setGenerateForm((s) => ({ ...s, className: e.target.value }))} /></div>
              <div><Label>Student ID (optional)</Label><Input value={generateForm.studentId} onChange={(e) => setGenerateForm((s) => ({ ...s, studentId: e.target.value }))} /></div>
              <div className="flex items-end"><Button onClick={generateInstallments}>Generate</Button></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Installment Ledger</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                <Input
                  placeholder="Filter academic year"
                  value={installmentFilters.academicYear}
                  onChange={(e) => setInstallmentFilters((s) => ({ ...s, academicYear: e.target.value, page: 1 }))}
                />
                <Input
                  placeholder="Filter class"
                  value={installmentFilters.className}
                  onChange={(e) => setInstallmentFilters((s) => ({ ...s, className: e.target.value, page: 1 }))}
                />
                <Select value={installmentFilters.status || "all"} onValueChange={(v) => setInstallmentFilters((s) => ({ ...s, status: v === "all" ? "" : v, page: 1 }))}>
                  <SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="waived">Waived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>No</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Total Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {installments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">No installments found.</TableCell>
                    </TableRow>
                  )}
                  {installments.map((i) => (
                    <TableRow key={i._id}>
                      <TableCell>{i.studentId?.firstName} {i.studentId?.lastName}</TableCell>
                      <TableCell>{i.installmentNo}</TableCell>
                      <TableCell>{new Date(i.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell>{i.installmentAmount}</TableCell>
                      <TableCell>{i.paidAmount}</TableCell>
                      <TableCell>{i.totalDue}</TableCell>
                      <TableCell><Badge>{i.computedStatus || i.status}</Badge></TableCell>
                      <TableCell className="space-x-2">
                        <Button size="sm" variant="outline" onClick={() => {
                          setPaymentForm((current) => ({ ...current, installmentId: i._id, amount: String(i.totalDue || current.amount || "") }))
                          toast.message("Installment selected for payment")
                        }}>Select</Button>
                        <Button size="sm" variant="secondary" onClick={() => {
                          setSelectedHistoryInstallmentId(i._id)
                          setPaymentForm((current) => ({ ...current, installmentId: i._id }))
                          setHistoryModalOpen(true)
                        }}>
                          <History className="mr-2 h-4 w-4" />
                          History
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => clearInstallment(i._id, "paid")}>Mark Paid</Button>
                        <Button size="sm" variant="destructive" onClick={() => clearInstallment(i._id, "waived")}>Waive</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Page {installmentMeta.page} of {installmentMeta.totalPages} ({installmentMeta.total} total)</span>
                <div className="space-x-2">
                  <Button size="sm" variant="outline" disabled={installmentMeta.page <= 1} onClick={() => setInstallmentFilters((s) => ({ ...s, page: Math.max(1, s.page - 1) }))}>Previous</Button>
                  <Button size="sm" variant="outline" disabled={installmentMeta.page >= installmentMeta.totalPages} onClick={() => setInstallmentFilters((s) => ({ ...s, page: s.page + 1 }))}>Next</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manual Payment Entry</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Select Installment</Label>
                <Select value={paymentForm.installmentId} onValueChange={(v) => setPaymentForm((s) => ({ ...s, installmentId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Pick from ledger" /></SelectTrigger>
                  <SelectContent>
                    {installments.map((installment) => (
                      <SelectItem key={installment._id} value={installment._id}>
                        #{installment.installmentNo} - {installment.studentId?.firstName} {installment.studentId?.lastName} ({installment.computedStatus || installment.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Amount</Label><Input type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm((s) => ({ ...s, amount: e.target.value }))} /></div>
              <div>
                <Label>Payment Mode</Label>
                <Select value={paymentForm.paymentMode} onValueChange={(v) => setPaymentForm((s) => ({ ...s, paymentMode: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual_cash">Manual Cash</SelectItem>
                    <SelectItem value="manual_bank">Manual Bank</SelectItem>
                    <SelectItem value="manual_adjustment">Manual Adjustment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Reference</Label><Input value={paymentForm.referenceNo} onChange={(e) => setPaymentForm((s) => ({ ...s, referenceNo: e.target.value }))} /></div>
              <div className="md:col-span-2"><Label>Note</Label><Input value={paymentForm.note} onChange={(e) => setPaymentForm((s) => ({ ...s, note: e.target.value }))} /></div>
              <div className="md:col-span-3 text-sm text-muted-foreground">
                {selectedInstallment ? `Selected installment due amount: ${selectedInstallment.totalDue}` : "Select an installment to view current due amount."}
              </div>
              <div className="md:col-span-3 space-x-2">
                <Button onClick={recordPayment} disabled={!paymentForm.installmentId.trim() || !paymentForm.amount.trim()}>Record Payment</Button>
                <Button variant="secondary" onClick={simulatePayment} disabled={!paymentForm.installmentId.trim() || !paymentForm.amount.trim() || mockPaymentLoading}>
                  <RotateCcw className={`mr-2 h-4 w-4 ${mockPaymentLoading ? "animate-spin" : ""}`} />
                  {mockPaymentLoading ? "Simulating..." : `Mock ${mockScenario}`}
                </Button>
                <Select value={mockScenario} onValueChange={(value) => setMockScenario(value as any)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Scenario" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failure">Failure</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={runReminders}>Run 7-Day Reminders</Button>
                <Button variant="ghost" onClick={loadAll} disabled={loading}>{loading ? "Refreshing..." : "Refresh Data"}</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {!paymentForm.installmentId && (
                <p className="text-sm text-muted-foreground">Select an installment to view payment history.</p>
              )}
              {paymentForm.installmentId && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Receipt</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!paymentHistoryLoading && paymentHistory.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">No payment history for this installment.</TableCell>
                      </TableRow>
                    )}
                    {paymentHistoryLoading && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">Loading payment history...</TableCell>
                      </TableRow>
                    )}
                    {paymentHistory.map((row) => (
                      <TableRow key={row._id}>
                        <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
                        <TableCell>{row.amount}</TableCell>
                        <TableCell>{row.paymentMode}</TableCell>
                        <TableCell>{row.receiptNo || "-"}</TableCell>
                        <TableCell>{row.referenceNo || "-"}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => openReceiptModal(row)}>Receipt</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fee Reports Overview</CardTitle>
              <CardDescription>Collection, due, and aging snapshots for the selected school scope.</CardDescription>
            </CardHeader>
            <CardContent>
              {reportsLoading && <p className="text-sm text-muted-foreground">Loading reports...</p>}
              {!reportsLoading && !dashboardData && !reportSummary && (
                <p className="text-sm text-muted-foreground">No report data found for current filters.</p>
              )}
              {!reportsLoading && (dashboardData || reportSummary) && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><div className="text-muted-foreground">Total Billed</div><div className="font-semibold">{dashboardData?.summary?.totalBilled ?? reportSummary?.totalBilled ?? 0}</div></div>
                    <div><div className="text-muted-foreground">Total Collected</div><div className="font-semibold">{dashboardData?.summary?.totalCollected ?? reportSummary?.totalCollected ?? 0}</div></div>
                    <div><div className="text-muted-foreground">Total Due</div><div className="font-semibold">{dashboardData?.summary?.totalDue ?? reportSummary?.totalDue ?? 0}</div></div>
                    <div><div className="text-muted-foreground">Overdue Count</div><div className="font-semibold">{dashboardData?.summary?.overdueCount ?? reportSummary?.overdueCount ?? 0}</div></div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border p-3">
                      <div className="mb-2 text-sm font-medium">Monthly Collections</div>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dashboardData?.monthlyCollections || []}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="_id" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="totalCollected" fill="#2563eb" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="rounded-xl border p-3">
                      <div className="mb-2 text-sm font-medium">Class Collections</div>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dashboardData?.classCollections || []}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="_id" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="billed" fill="#16a34a" />
                            <Bar dataKey="collected" fill="#f97316" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                    <div><div className="text-muted-foreground">Current</div><div className="font-semibold">{dashboardData?.aging?.current ?? reportAging?.current ?? 0}</div></div>
                    <div><div className="text-muted-foreground">1-30 Days</div><div className="font-semibold">{dashboardData?.aging?.d1_30 ?? reportAging?.d1_30 ?? 0}</div></div>
                    <div><div className="text-muted-foreground">31-60 Days</div><div className="font-semibold">{dashboardData?.aging?.d31_60 ?? reportAging?.d31_60 ?? 0}</div></div>
                    <div><div className="text-muted-foreground">61-90 Days</div><div className="font-semibold">{dashboardData?.aging?.d61_90 ?? reportAging?.d61_90 ?? 0}</div></div>
                    <div><div className="text-muted-foreground">91+ Days</div><div className="font-semibold">{dashboardData?.aging?.d91_plus ?? reportAging?.d91_plus ?? 0}</div></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aging Buckets</CardTitle>
            </CardHeader>
            <CardContent>
              {!reportsLoading && !reportAging && (
                <p className="text-sm text-muted-foreground">No aging data available.</p>
              )}
              {!reportsLoading && reportAging && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                  <div><div className="text-muted-foreground">Current</div><div className="font-semibold">{reportAging.current ?? 0}</div></div>
                  <div><div className="text-muted-foreground">1-30 Days</div><div className="font-semibold">{reportAging.d1_30 ?? 0}</div></div>
                  <div><div className="text-muted-foreground">31-60 Days</div><div className="font-semibold">{reportAging.d31_60 ?? 0}</div></div>
                  <div><div className="text-muted-foreground">61-90 Days</div><div className="font-semibold">{reportAging.d61_90 ?? 0}</div></div>
                  <div><div className="text-muted-foreground">91+ Days</div><div className="font-semibold">{reportAging.d91_plus ?? 0}</div></div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Payment History</DialogTitle>
            <DialogDescription>
              {selectedHistoryInstallmentId ? `Installment ${selectedHistoryInstallmentId}` : "Selected installment payment trail."}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[420px] overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!paymentHistoryLoading && paymentHistory.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">No payment history for this installment.</TableCell>
                  </TableRow>
                )}
                {paymentHistory.map((row) => (
                  <TableRow key={row._id}>
                    <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{row.amount}</TableCell>
                    <TableCell><Badge>{row.transactionStatus || "captured"}</Badge></TableCell>
                    <TableCell>{row.receiptNo || "-"}</TableCell>
                    <TableCell>{row.referenceNo || "-"}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => openReceiptModal(row)}>
                        <ReceiptText className="mr-2 h-4 w-4" />
                        Receipt
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={receiptModalOpen} onOpenChange={setReceiptModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Receipt Details</DialogTitle>
            <DialogDescription>Receipt data for printing, export, and reconciliation.</DialogDescription>
          </DialogHeader>
          {receiptLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : selectedReceipt ? (
            <div className="grid grid-cols-1 gap-3 rounded-md border p-4 text-sm md:grid-cols-2">
              <div>
                <div className="text-muted-foreground">Receipt No</div>
                <div className="font-medium">{selectedReceipt.receiptNo || "-"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Transaction Status</div>
                <div className="font-medium">{selectedReceipt.transactionStatus || "-"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Amount</div>
                <div className="font-medium">{selectedReceipt.amount ?? "-"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Payment Mode</div>
                <div className="font-medium">{selectedReceipt.paymentMode || "-"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Reference</div>
                <div className="font-medium">{selectedReceipt.referenceNo || selectedReceipt.providerTransactionId || "-"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">External Payment Id</div>
                <div className="font-medium">{selectedReceipt.externalPaymentId || "-"}</div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
