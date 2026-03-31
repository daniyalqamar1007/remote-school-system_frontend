"use client"

import type React from "react"

import { useState } from "react"
import { Loader2, Upload, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import axios from "axios"
import { toast } from 'sonner'

interface ExcelUploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onClose: () => void
  refetch: () => void
}

export function TeachersExcelUploadModal({ open, onOpenChange, onClose, refetch }: ExcelUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadComplete, setUploadComplete] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
  }

  const handleUpload = async () => {
    if (!file) return;
  
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
  
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/teachers/import`,
        formData
      );
  
      setUploadComplete(true);
  
      if (response.data.status == 409) {
              toast.error(response.data.msg);
      } else {
        toast.success(response.data.message || "Upload Successful!");
        setFile(null);
        refetch();
  
        setTimeout(() => {
          onOpenChange(false);
        }, 100);
      }
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error("Teacher is already registered.");
      } else {
        toast.error("Error uploading file. Please try again.");
      }
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleModalChange = (isOpen: boolean) => {
    onOpenChange(isOpen)

    if (!isOpen) {
      onClose()

      setTimeout(() => {
        setUploadComplete(false)
      }, 300)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleModalChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Upload Excel File</DialogTitle>
          <DialogDescription>Upload up to 1000 teachers at once</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {!file ? (
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-gray-300 p-12 text-center hover:bg-gray-50 cursor-pointer"
            >
              <div className="rounded-full bg-primary/10 p-3">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Click to upload</span>
                <span className="text-xs text-muted-foreground">or drag and drop</span>
              </div>
              <input
                id="file-upload"
                type="file"
                accept=".xlsx, .xls"
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>
          ) : (
            <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-primary/10 p-2">
                  <Upload className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{file.name}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleRemoveFile} className="h-8 w-8">
                <X className="h-4 w-4" />
                <span className="sr-only">Remove file</span>
              </Button>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
