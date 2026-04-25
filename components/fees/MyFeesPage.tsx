"use client"

import { useEffect, useMemo, useState } from "react"
import { feeApi } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { Download, RotateCw, ReceiptText } from "lucide-react"

function formatCurrency(value: number | string | undefined) {
  const numericValue = Number(value || 0)
  return numericValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function statusTone(status: string) {
  switch (status) {
    case "paid":
      return "default"
    case "partial":
      return "secondary"
    case "overdue":
      return "destructive"
    case "waived":
      return "outline"
    case "failed":
      return "destructive"
    default:
      return "secondary"
  }
}

function asArray(value: any) {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  return []
}

export default function MyFeesPage({ role }: { role: "parent" | "student" }) {
  const [summary, setSummary] = useState<any>(null)
  const [installments, setInstallments] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [paying, setPaying] = useState(false)
  const [filters, setFilters] = useState({ academicYear: "", status: "", dueFrom: "", dueTo: "" })
  const [loadError, setLoadError] = useState("")
  const [historyOpen, setHistoryOpen] = useState(false)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [selectedInstallmentId, setSelectedInstallmentId] = useState("")
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null)
  const [receiptLoading, setReceiptLoading] = useState(false)

  const selectedInstallment = useMemo(
    () => installments.find((installment) => installment._id === selectedInstallmentId) || null,
    [installments, selectedInstallmentId],
  )

  const selectedInstallmentPayments = useMemo(
    () => payments.filter((payment) => String(payment.installmentId?._id || payment.installmentId) === selectedInstallmentId),
    [payments, selectedInstallmentId],
  )

  const load = async () => {
    try {
      setLoading(true)
      setLoadError("")
      const [summaryResult, installmentsResult, paymentsResult] = await Promise.all([
        feeApi.getMySummary(filters.academicYear || undefined),
        feeApi.getMyInstallments({
          academicYear: filters.academicYear || undefined,
          status: filters.status || undefined,
          dueFrom: filters.dueFrom || undefined,
          dueTo: filters.dueTo || undefined,
        }),
        feeApi.getMyPayments({
          academicYear: filters.academicYear || undefined,
          page: 1,
          limit: 100,
          sortBy: "createdAt",
          sortOrder: "desc",
        }),
      ])

      setSummary(summaryResult?.data || summaryResult || null)
      setInstallments(asArray(installmentsResult?.data || installmentsResult))
      setPayments(asArray(paymentsResult?.data || paymentsResult))
    } catch (error: any) {
      const message = error?.message || "Failed to load fee details"
      setLoadError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openHistory = (installmentId: string) => {
    setSelectedInstallmentId(installmentId)
    setHistoryOpen(true)
  }

  const openReceipt = async (payment: any) => {
    try {
      setReceiptLoading(true)
      setReceiptOpen(true)
      const response = await feeApi.getPaymentReceipt(payment._id)
      setSelectedReceipt(response?.data || response || payment)
    } catch (error: any) {
      setSelectedReceipt(payment)
      toast.error(error?.message || "Failed to load receipt")
    } finally {
      setReceiptLoading(false)
    }
  }

  const downloadStatement = () => {
    const rows = [
      ["Type", "Reference", "Date", "Amount", "Status", "Details"],
      ...installments.map((item) => [
        "Installment",
        String(item.installmentNo || ""),
        item.dueDate ? new Date(item.dueDate).toISOString() : "",
        String(item.totalDue ?? item.paidAmount ?? 0),
        String(item.computedStatus || item.status || ""),
        `${item.studentId?.firstName || ""} ${item.studentId?.lastName || ""}`.trim(),
      ]),
      ...payments.map((item) => [
        "Payment",
        String(item.receiptNo || item._id || ""),
        item.createdAt ? new Date(item.createdAt).toISOString() : "",
        String(item.amount ?? 0),
        String(item.transactionStatus || ""),
        `${item.installmentId?.installmentNo || ""}`,
      ]),
    ]

    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `fee-statement-${role}-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <Card className="border-border/60 bg-gradient-to-br from-background to-muted/25">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <CardTitle className="text-2xl">
                {role === "parent" ? "Parent Fee Overview" : "Student Fee Overview"}
              </CardTitle>
              <CardDescription className="mt-1">
                Review your active installments, payment history, receipts, and overdue items in one place.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={downloadStatement} disabled={loading && installments.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Download Statement
              </Button>
              <Button onClick={load} disabled={loading}>
                <RotateCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <div className="rounded-xl border bg-background/70 p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Installments</div>
            <div className="mt-1 text-2xl font-semibold">{summary?.totalInstallments ?? 0}</div>
          </div>
          <div className="rounded-xl border bg-background/70 p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Base</div>
            <div className="mt-1 text-2xl font-semibold">{formatCurrency(summary?.totalBase)}</div>
          </div>
          <div className="rounded-xl border bg-background/70 p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Discount</div>
            <div className="mt-1 text-2xl font-semibold">{formatCurrency(summary?.totalDiscount)}</div>
          </div>
          <div className="rounded-xl border bg-background/70 p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Paid</div>
            <div className="mt-1 text-2xl font-semibold">{formatCurrency(summary?.totalPaid)}</div>
          </div>
          <div className="rounded-xl border bg-background/70 p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Due</div>
            <div className="mt-1 text-2xl font-semibold">{formatCurrency(summary?.totalDue)}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <Input placeholder="Academic year" value={filters.academicYear} onChange={(e) => setFilters((current) => ({ ...current, academicYear: e.target.value }))} />
            <Select value={filters.status || "all"} onValueChange={(value) => setFilters((current) => ({ ...current, status: value === "all" ? "" : value }))}>
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
            <Input type="date" value={filters.dueFrom} onChange={(e) => setFilters((current) => ({ ...current, dueFrom: e.target.value }))} />
            <Input type="date" value={filters.dueTo} onChange={(e) => setFilters((current) => ({ ...current, dueTo: e.target.value }))} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={load} disabled={loading}>
              Apply Filters
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setFilters({ academicYear: "", status: "", dueFrom: "", dueTo: "" })
                setTimeout(load, 0)
              }}
              disabled={loading}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {loadError && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center justify-between gap-3 pt-6 text-sm">
            <span>{loadError}</span>
            <Button size="sm" variant="outline" onClick={load}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="installments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="installments">Installments</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="installments">
          <Card>
            <CardHeader>
              <CardTitle>Installment Details</CardTitle>
              <CardDescription>Use the row actions to review history or receipts without manual id entry.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading && installments.length === 0 ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>No</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Total Due</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!loading && installments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                          No fee installments found.
                        </TableCell>
                      </TableRow>
                    )}
                    {installments.map((installment) => (
                      <TableRow key={installment._id}>
                        <TableCell>
                          <div className="font-medium">
                            {installment.studentId?.firstName} {installment.studentId?.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {installment.studentId?.class} · {installment.studentId?.studentId}
                          </div>
                        </TableCell>
                        <TableCell>{installment.installmentNo}</TableCell>
                        <TableCell>{installment.dueDate ? new Date(installment.dueDate).toLocaleDateString() : "-"}</TableCell>
                        <TableCell>{formatCurrency(installment.installmentAmount)}</TableCell>
                        <TableCell>{formatCurrency(installment.discountAmount)}</TableCell>
                        <TableCell>{formatCurrency(installment.paidAmount)}</TableCell>
                        <TableCell>{formatCurrency(installment.totalDue)}</TableCell>
                        <TableCell>
                          <Badge variant={statusTone(installment.computedStatus || installment.status)}>
                            {installment.computedStatus || installment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => openHistory(installment._id)}>
                              History
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment Timeline</CardTitle>
              <CardDescription>Receipt details, reversals, and timestamps for all captured or pending transactions.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading && payments.length === 0 ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Installment</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Receipt</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!loading && payments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                          No payment history found.
                        </TableCell>
                      </TableRow>
                    )}
                    {payments.map((payment) => (
                      <TableRow key={payment._id}>
                        <TableCell>{payment.createdAt ? new Date(payment.createdAt).toLocaleString() : "-"}</TableCell>
                        <TableCell>
                          #{payment.installmentId?.installmentNo || "-"} · {payment.installmentId?.academicYear || payment.academicYear || "-"}
                        </TableCell>
                        <TableCell>{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>
                          <Badge variant={statusTone(payment.transactionStatus)}>{payment.transactionStatus}</Badge>
                        </TableCell>
                        <TableCell>{payment.receiptNo || "-"}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => openReceipt(payment)}>
                            Receipt
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Installment Payment History</DialogTitle>
            <DialogDescription>
              {selectedInstallment ? `${selectedInstallment.studentId?.firstName} ${selectedInstallment.studentId?.lastName} · Installment #${selectedInstallment.installmentNo}` : "Review payments for the selected installment."}
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
                  <TableHead>External Ref</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedInstallmentPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      No payments found for this installment.
                    </TableCell>
                  </TableRow>
                ) : (
                  selectedInstallmentPayments.map((payment) => (
                    <TableRow key={payment._id}>
                      <TableCell>{payment.createdAt ? new Date(payment.createdAt).toLocaleString() : "-"}</TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={statusTone(payment.transactionStatus)}>{payment.transactionStatus}</Badge>
                      </TableCell>
                      <TableCell>{payment.receiptNo || "-"}</TableCell>
                      <TableCell>{payment.referenceNo || payment.providerTransactionId || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Receipt Details</DialogTitle>
            <DialogDescription>Use this record for printing, sharing, or download workflows.</DialogDescription>
          </DialogHeader>
          {receiptLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-2/3" />
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
                <div className="text-muted-foreground">Payment Status</div>
                <div className="font-medium">{selectedReceipt.transactionStatus || "-"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Amount</div>
                <div className="font-medium">{formatCurrency(selectedReceipt.amount)}</div>
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
                <div className="text-muted-foreground">Recorded By</div>
                <div className="font-medium">
                  {selectedReceipt.recordedBy?.firstName ? `${selectedReceipt.recordedBy.firstName} ${selectedReceipt.recordedBy.lastName || ""}`.trim() : "-"}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Student</div>
                <div className="font-medium">
                  {selectedReceipt.studentId?.firstName ? `${selectedReceipt.studentId.firstName} ${selectedReceipt.studentId.lastName || ""}`.trim() : "-"}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Installment</div>
                <div className="font-medium">#{selectedReceipt.installmentId?.installmentNo || "-"}</div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
