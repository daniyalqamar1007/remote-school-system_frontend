"use client"

import React from "react"
import { X, AlertCircle, Download, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

interface ImportError {
  row: number
  errors: string[]
}

interface BulkImportErrorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  insertedCount: number
  skippedCount: number
  errors: string[] | null
  fileName?: string
  entityType?: string // e.g., "student", "teacher"
}

export function BulkImportErrorModal({
  open,
  onOpenChange,
  insertedCount,
  skippedCount,
  errors,
  fileName,
  entityType = "student",
}: BulkImportErrorModalProps) {
  const entityName = entityType || "student"
  const entityNameCapitalized = entityName.charAt(0).toUpperCase() + entityName.slice(1)
  // Parse errors into structured format
  const parsedErrors: ImportError[] = React.useMemo(() => {
    if (!errors || !Array.isArray(errors)) return []

    return errors.map((errorStr, index) => {
      const errorString = String(errorStr).trim()
      
      // Parse format: "Row X: Error message" or "Row X: Error1; Error2"
      const rowMatch = errorString.match(/^Row\s+(\d+):\s*(.+)$/i)
      if (rowMatch) {
        const rowNum = parseInt(rowMatch[1], 10)
        const errorMessages = rowMatch[2].split(';').map(e => e.trim()).filter(Boolean)
        return {
          row: rowNum,
          errors: errorMessages.length > 0 ? errorMessages : [rowMatch[2]],
        }
      }

      // Try alternative format: "Row X - Error message"
      const altRowMatch1 = errorString.match(/^Row\s+(\d+)\s*[-–]\s*(.+)$/i)
      if (altRowMatch1) {
        const rowNum = parseInt(altRowMatch1[1], 10)
        const errorMessages = altRowMatch1[2].split(';').map(e => e.trim()).filter(Boolean)
        return {
          row: rowNum,
          errors: errorMessages.length > 0 ? errorMessages : [altRowMatch1[2]],
        }
      }

      // Try format: "X: Error message" (just number at start)
      const altRowMatch2 = errorString.match(/^(\d+)\s*:\s*(.+)$/)
      if (altRowMatch2) {
        const rowNum = parseInt(altRowMatch2[1], 10)
        const errorMessages = altRowMatch2[2].split(';').map(e => e.trim()).filter(Boolean)
        return {
          row: rowNum,
          errors: errorMessages.length > 0 ? errorMessages : [altRowMatch2[2]],
        }
      }

      // Fallback: try to find any number that might be a row number
      const numberMatch = errorString.match(/\b(\d+)\b/)
      if (numberMatch) {
        return {
          row: parseInt(numberMatch[1], 10),
          errors: [errorString],
        }
      }

      // Last fallback: use index + 2 (assuming row 1 is header, so first error is row 2)
      return {
        row: index + 2,
        errors: [errorString],
      }
    })
  }, [errors])

  // Group errors by row
  const errorsByRow = React.useMemo(() => {
    const grouped: { [key: number]: string[] } = {}
    parsedErrors.forEach((error) => {
      if (!grouped[error.row]) {
        grouped[error.row] = []
      }
      grouped[error.row].push(...error.errors)
    })
    return grouped
  }, [parsedErrors])

  const errorRows = Object.keys(errorsByRow)
    .map(Number)
    .sort((a, b) => a - b)

  // Export errors to CSV
  const exportErrorsToCSV = () => {
    if (!errors || errors.length === 0) return

    const csvContent = [
      ["Row Number", "Error Message"],
      ...parsedErrors.map((err) => [err.row.toString(), err.errors.join("; ")]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `import-errors-${fileName || "students"}-${new Date().toISOString().split("T")[0]}.csv`
    )
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {insertedCount > 0 ? (
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              ) : (
                <AlertCircle className="h-6 w-6 text-orange-600" />
              )}
              <div>
                <DialogTitle className="text-xl font-semibold">
                  Import Results
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {insertedCount > 0
                    ? `${insertedCount} ${entityName}(s) imported successfully`
                    : `No ${entityName}s were imported`}
                  {skippedCount > 0 && ` • ${skippedCount} record(s) skipped`}
                </DialogDescription>
              </div>
            </div>
            {/* {errors && errors.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={exportErrorsToCSV}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export Errors
              </Button>
            )} */}
          </div>
        </DialogHeader>

        {errors && errors.length > 0 ? (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 rounded-md">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                    {errors.length} error(s) found in your import file
                  </p>
                  <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                    Please review the errors below, fix them in your Excel/CSV file, and
                    re-import. Only the records with errors were skipped.
                  </p>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 border rounded-md">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-24">Row #</TableHead>
                    <TableHead>Error Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {errorRows.length > 0 ? (
                    errorRows.map((rowNum) => (
                      <TableRow key={rowNum} className="hover:bg-muted/50">
                        <TableCell className="font-medium text-center">
                          <Badge variant="outline" className="font-mono">
                            {rowNum}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {errorsByRow[rowNum].map((errorMsg, idx) => (
                              <div
                                key={idx}
                                className="text-sm text-red-700 dark:text-red-400 flex items-start gap-2"
                              >
                                <span className="text-red-500 mt-0.5">•</span>
                                <span className="flex-1">{errorMsg}</span>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                        No errors to display
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>

            <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-muted-foreground">
              <div>
                <p>
                  <strong>Tip:</strong> Row numbers correspond to Excel row numbers (including
                  header row). Row 2 = first data row.
                </p>
              </div>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
              All records imported successfully!
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {insertedCount} {entityName}(s) have been added to the system.
            </p>
            <Button
              className="mt-6"
              onClick={() => {
                onOpenChange(false)
              }}
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

