"use client"

import { useState } from "react"
import { Download } from 'lucide-react'
import * as XLSX from "xlsx"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  onExport: (limit: number) => Promise<any[]>
  currentFilters: {
    reportType: string
    gradeLevel: string
    startDate: string
    endDate: string
  }
}

export default function ExportModal({ isOpen, onClose, onExport, currentFilters }: ExportModalProps) {
  const [limit, setLimit] = useState<number>(100)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async () => {
    setLoading(true)
    setError(null)

    try {
      // Call the export function with the selected limit
      const data = await onExport(limit)
      
      // Create a worksheet from the data
      const worksheet = XLSX.utils.json_to_sheet(data)
      
      // Create column widths based on content
      const columnWidths = [
        { wch: 10 }, // Roll No
        { wch: 20 }, // Name
        { wch: 8 }, // Class
        { wch: 8 }, // Section
        { wch: 10 }, // Gender
        { wch: 30 }, // Email
        { wch: 15 }, // Phone
        { wch: 15 }, // Enroll Date
        { wch: 30 }, // Guardian
      ]
      
      worksheet['!cols'] = columnWidths
      
      // Create a workbook and add the worksheet
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Students")
      
      // Generate report name based on filters
      const reportName = `Student_Report_${currentFilters.gradeLevel || 'All'}_${new Date().toISOString().split('T')[0]}`
      
      // Export to XLSX file
      XLSX.writeFile(workbook, `${reportName}.xlsx`)
      
      // Close the modal
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export data")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Student Report</DialogTitle>
          <DialogDescription>
            Select the maximum number of records to export. The data will be downloaded as an Excel file.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="limit">Record Limit</Label>
              <span className="text-sm font-medium">{limit} records</span>
            </div>
            <Slider
              id="limit"
              min={1}
              max={1000}
              step={1}
              value={[limit]}
              onValueChange={(value) => setLimit(value[0])}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1</span>
              <span>500</span>
              <span>1000</span>
            </div>
          </div>
          
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          )}
          
          <div className="text-sm text-muted-foreground">
            <p>Current filters:</p>
            <ul className="list-disc list-inside mt-1">
              {currentFilters.reportType && (
                <li>Report Type: {currentFilters.reportType}</li>
              )}
              {currentFilters.gradeLevel && (
                <li>Grade Level: {currentFilters.gradeLevel}</li>
              )}
              {currentFilters.startDate && (
                <li>Start Date: {currentFilters.startDate}</li>
              )}
              {currentFilters.endDate && (
                <li>End Date: {currentFilters.endDate}</li>
              )}
            </ul>
          </div>
        </div>
        
        <DialogFooter className="flex space-x-2 sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={loading}
            className="bg-black text-white hover:bg-gray-800"
          >
            {loading ? (
              <span className="animate-pulse">Exporting...</span>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
