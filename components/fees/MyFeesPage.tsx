"use client"

import { useEffect, useState } from "react"
import { feeApi } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

export default function MyFeesPage({ role }: { role: "parent" | "student" }) {
  const [summary, setSummary] = useState<any>(null)
  const [installments, setInstallments] = useState<any[]>([])

  const load = async () => {
    try {
      const [s, i] = await Promise.all([feeApi.getMySummary(), feeApi.getMyInstallments()])
      setSummary(s?.data || s || null)
      setInstallments(i?.data || i || [])
    } catch (error: any) {
      toast.error(error?.message || "Failed to load fee details")
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="p-4 md:p-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{role === "parent" ? "Parent Fee Overview" : "Student Fee Overview"}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
          <div><div className="text-muted-foreground">Installments</div><div className="font-semibold">{summary?.totalInstallments ?? 0}</div></div>
          <div><div className="text-muted-foreground">Total Base</div><div className="font-semibold">{summary?.totalBase ?? 0}</div></div>
          <div><div className="text-muted-foreground">Total Discount</div><div className="font-semibold">{summary?.totalDiscount ?? 0}</div></div>
          <div><div className="text-muted-foreground">Total Paid</div><div className="font-semibold">{summary?.totalPaid ?? 0}</div></div>
          <div><div className="text-muted-foreground">Total Due</div><div className="font-semibold">{summary?.totalDue ?? 0}</div></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Installment Details</CardTitle>
        </CardHeader>
        <CardContent>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {installments.map((i) => (
                <TableRow key={i._id}>
                  <TableCell>{i.studentId?.firstName} {i.studentId?.lastName}</TableCell>
                  <TableCell>{i.installmentNo}</TableCell>
                  <TableCell>{new Date(i.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell>{i.installmentAmount}</TableCell>
                  <TableCell>{i.discountAmount}</TableCell>
                  <TableCell>{i.paidAmount}</TableCell>
                  <TableCell>{i.totalDue}</TableCell>
                  <TableCell><Badge>{i.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
