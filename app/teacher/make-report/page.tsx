"use client"

import * as React from "react"
import { Calendar, Download, FileSpreadsheet } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const classes = [
  { value: "math101", label: "Mathematics 101" },
  { value: "eng201", label: "English 201" },
  { value: "sci301", label: "Science 301" },
]

export default function ReportsPage() {
  const [selectedClass, setSelectedClass] = React.useState("")
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")

  const handleExportAttendance = () => {
    console.log("Exporting attendance report for:", selectedClass, startDate, endDate)
    // Here you would typically generate and download the attendance report
  }

  const handleExportGrades = () => {
    console.log("Exporting grades report for:", selectedClass, startDate, endDate)
    // Here you would typically generate and download the grades report
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Reports</h1>

      <Card>
        <CardHeader>
          <CardTitle>Generate Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <Label htmlFor="class-select">Select Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger id="class-select">
                  <SelectValue placeholder="Select class..." />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                type="date"
                id="start-date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                type="date"
                id="end-date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Report</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={handleExportAttendance} className="w-full">
                  <Calendar className="mr-2 h-4 w-4" />
                  Export Attendance Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Grades Report</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={handleExportGrades} className="w-full">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export Grades Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}