"use client"

import { useEffect, useMemo, useState } from "react"
import { feeApi } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

export default function FeeManagementPage({ role }: { role: "admin" | "super-admin" }) {
  const [policies, setPolicies] = useState<any[]>([])
  const [discounts, setDiscounts] = useState<any[]>([])
  const [installments, setInstallments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [schoolId, setSchoolId] = useState("")
  const [schools, setSchools] = useState<Array<{ _id: string; name: string; code?: string; schoolCode?: string }>>([])
  const [schoolsLoading, setSchoolsLoading] = useState(false)

  const [policyForm, setPolicyForm] = useState({
    academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    className: "",
    baseFee: "",
    currency: "USD",
    installmentFrequency: "monthly",
    dueDay: "5",
    graceDays: "0",
    lateFeeType: "fixed",
    lateFeeValue: "0",
    fineType: "daily",
    fineValue: "0",
    maxFineCap: "0",
  })

  const [discountForm, setDiscountForm] = useState({
    studentId: "",
    feePolicyId: "",
    discountType: "percentage",
    discountValue: "0",
    reason: "",
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

      const filters = role === "super-admin" ? { schoolId: schoolId.trim() } : {}
      const [p, d, i] = await Promise.all([
        feeApi.getPolicies(filters),
        feeApi.getDiscounts(filters),
        feeApi.getInstallments(filters),
      ])
      setPolicies(p?.data || p || [])
      setDiscounts(d?.data || d || [])
      setInstallments(i?.data || i || [])
    } catch (error: any) {
      toast.error(error?.message || "Failed to load fee data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [schoolId, role])

  const createPolicy = async () => {
    try {
      if (!requireSchoolIdForSuperAdmin()) return
      await feeApi.createPolicy({
        ...policyForm,
        ...(role === "super-admin" ? { schoolId: schoolId.trim() } : {}),
        baseFee: Number(policyForm.baseFee),
        dueDay: Number(policyForm.dueDay),
        graceDays: Number(policyForm.graceDays),
        lateFeeValue: Number(policyForm.lateFeeValue),
        fineValue: Number(policyForm.fineValue),
        maxFineCap: Number(policyForm.maxFineCap),
      })
      toast.success("Fee policy created")
      loadAll()
    } catch (error: any) {
      toast.error(error?.message || "Failed to create policy")
    }
  }

  const saveDiscount = async () => {
    try {
      if (!requireSchoolIdForSuperAdmin()) return
      await feeApi.upsertDiscount({
        ...discountForm,
        ...(role === "super-admin" ? { schoolId: schoolId.trim() } : {}),
        discountValue: Number(discountForm.discountValue),
      })
      toast.success("Student discount saved")
      loadAll()
    } catch (error: any) {
      toast.error(error?.message || "Failed to save discount")
    }
  }

  const generateInstallments = async () => {
    try {
      if (!requireSchoolIdForSuperAdmin()) return
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

  const recordPayment = async () => {
    try {
      if (!paymentForm.installmentId.trim()) {
        toast.error("Installment ID is required")
        return
      }
      await feeApi.recordPayment(paymentForm.installmentId, {
        amount: Number(paymentForm.amount),
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

  const clearInstallment = async (installmentId: string, status: "paid" | "waived") => {
    try {
      await feeApi.manualClearance(installmentId, { status, note: `Manual ${status} by ${role}` })
      toast.success(`Installment marked as ${status}`)
      loadAll()
    } catch (error: any) {
      toast.error(error?.message || "Failed to update installment")
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
        </TabsList>

        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Class Fee Policy</CardTitle>
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
              <div><Label>Due Day</Label><Input type="number" value={policyForm.dueDay} onChange={(e) => setPolicyForm((s) => ({ ...s, dueDay: e.target.value }))} /></div>
              <div><Label>Grace Days</Label><Input type="number" value={policyForm.graceDays} onChange={(e) => setPolicyForm((s) => ({ ...s, graceDays: e.target.value }))} /></div>
              <div><Label>Late Fee Value</Label><Input type="number" value={policyForm.lateFeeValue} onChange={(e) => setPolicyForm((s) => ({ ...s, lateFeeValue: e.target.value }))} /></div>
              <div><Label>Fine Value</Label><Input type="number" value={policyForm.fineValue} onChange={(e) => setPolicyForm((s) => ({ ...s, fineValue: e.target.value }))} /></div>
              <div><Label>Max Fine Cap</Label><Input type="number" value={policyForm.maxFineCap} onChange={(e) => setPolicyForm((s) => ({ ...s, maxFineCap: e.target.value }))} /></div>
              <div className="md:col-span-3">
                <Button onClick={createPolicy}>Save Policy</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Existing Policies</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Academic Year</TableHead>
                    <TableHead>Base Fee</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policies.map((p) => (
                    <TableRow key={p._id}>
                      <TableCell>{p.className}</TableCell>
                      <TableCell>{p.academicYear}</TableCell>
                      <TableCell>{p.baseFee}</TableCell>
                      <TableCell>{p.installmentFrequency}</TableCell>
                      <TableCell><Badge>{p.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discounts" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Apply Student Discount</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><Label>Student ID</Label><Input value={discountForm.studentId} onChange={(e) => setDiscountForm((s) => ({ ...s, studentId: e.target.value }))} /></div>
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
              <div className="md:col-span-2"><Label>Reason</Label><Input value={discountForm.reason} onChange={(e) => setDiscountForm((s) => ({ ...s, reason: e.target.value }))} /></div>
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
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {discounts.map((d) => (
                    <TableRow key={d._id}>
                      <TableCell>{d.studentId?.firstName} {d.studentId?.lastName}</TableCell>
                      <TableCell>{d.feePolicyId?.className} - {d.feePolicyId?.academicYear}</TableCell>
                      <TableCell>{d.discountType}</TableCell>
                      <TableCell>{d.discountValue}</TableCell>
                      <TableCell>{d.reason || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                        <Button size="sm" variant="secondary" onClick={() => clearInstallment(i._id, "paid")}>Mark Paid</Button>
                        <Button size="sm" variant="destructive" onClick={() => clearInstallment(i._id, "waived")}>Waive</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manual Payment Entry</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><Label>Installment ID</Label><Input value={paymentForm.installmentId} onChange={(e) => setPaymentForm((s) => ({ ...s, installmentId: e.target.value }))} /></div>
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
              <div className="md:col-span-3 space-x-2">
                <Button onClick={recordPayment}>Record Payment</Button>
                <Button variant="outline" onClick={runReminders}>Run 7-Day Reminders</Button>
                <Button variant="ghost" onClick={loadAll} disabled={loading}>{loading ? "Refreshing..." : "Refresh Data"}</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
