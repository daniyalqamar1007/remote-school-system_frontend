"use client"

import * as React from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface WeightageModalProps {
  isOpen: boolean
  onClose: () => void
  weightages: {
    quiz: number
    midTerm: number
    project: number
    finalTerm: number
  }
  onSave: (weightages: {
    quiz: number
    midTerm: number
    project: number
    finalTerm: number
  }) => void
}

export function WeightageModal({ isOpen, onClose, weightages, onSave }: WeightageModalProps) {
  const [localWeightages, setLocalWeightages] = React.useState(weightages)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    setLocalWeightages(weightages)
  }, [weightages])

  const handleChange = (field: keyof typeof weightages, value: string) => {
    const numValue = value === "" ? "" : Number(value)
    setLocalWeightages((prev) => ({
      ...prev,
      [field]: numValue,
    }))
  }

  const handleSave = () => {
    // Validate that weightages sum to 100
    const total = Object.values(localWeightages).reduce((sum, val) => sum + val, 0)

    if (Math.abs(total - 100) > 0.01) {
      setError(`Total weightage must equal 100%. Current total: ${total}%`)
      return
    }

    onSave(localWeightages)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <Button variant="ghost" size="icon" className="absolute right-2 top-2" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>

        <h2 className="text-xl font-bold mb-4">Edit Assessment Weightages</h2>
        <p className="text-sm text-gray-500 mb-4">
          Adjust the weightage percentages for each assessment. The total must equal 100%.
        </p>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quiz-weightage">Quiz Weightage (%)</Label>
              <Input
                id="quiz-weightage"
                type="number"
                value={localWeightages.quiz}
                onChange={(e) => handleChange("quiz", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="midterm-weightage">Midterm Weightage (%)</Label>
              <Input
                id="midterm-weightage"
                type="number"
             
                value={localWeightages.midTerm}
                onChange={(e) => handleChange("midTerm", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-weightage">Project Weightage (%)</Label>
              <Input
                id="project-weightage"
                type="number"
             
                value={localWeightages.project}
                onChange={(e) => handleChange("project", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="final-weightage">Final Exam Weightage (%)</Label>
              <Input
                id="final-weightage"
                type="number"
    
                value={localWeightages.finalTerm}
                onChange={(e) => handleChange("finalTerm", e.target.value)}
              />
            </div>
          </div>

          <div className="pt-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Total:</span>
              <span
                className={`text-sm font-bold ${Math.abs(Object.values(localWeightages).reduce((sum, val) => sum + val, 0) - 100) > 0.01 ? "text-red-500" : "text-green-500"}`}
              >
                {Object.values(localWeightages).reduce((sum, val) => sum + val, 0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-black h-2.5 rounded-full"
                style={{
                  width: `${Math.min(
                    100,
                    Object.values(localWeightages).reduce((sum, val) => sum + val, 0),
                  )}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button className="bg-black text-white hover:bg-black/80" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
