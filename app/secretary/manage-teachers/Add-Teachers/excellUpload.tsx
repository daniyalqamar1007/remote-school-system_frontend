"use client"

import type React from "react"

import { useState } from "react"
import { Loader2, Upload, X, Download } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import axios from "axios"
import { toast } from 'sonner'
import { downloadTemplate } from '@/lib/downloadTemplate'

interface ExcelUploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onClose: () => void
  refetch: () => void
  onImportComplete?: (results: {
    insertedCount: number
    skippedCount: number
    errors: string[] | null
  }, fileName?: string) => void
}

export function TeachersExcelUploadModal({ open, onOpenChange, onClose, refetch, onImportComplete }: ExcelUploadModalProps) {
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

  const handleDownloadTemplate = async () => {
    try {
      await downloadTemplate('admin/teachers/template', 'teacher_bulk_upload_template.csv');
      toast.success('Template downloaded successfully');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to download template');
    }
  }

  const handleUpload = async () => {
    if (!file) return;
  
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
  
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/teachers/import`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          }
        }
      );
  
      setUploadComplete(true);
  
      // Debug: Log full response
      console.log('Full response:', response);
      console.log('Response data:', response.data);
      console.log('Response data.data:', response.data?.data);
      console.log('Response data.success:', response.data?.success);
  
      // Handle response - check both response.data.data and response.data structures
      // The backend uses customResponse which wraps data in { success, message, data }
      const responseData = response.data?.data || response.data;
      
      // Extract values with proper fallbacks
      const insertedCount = responseData?.insertedCount ?? 0;
      const skippedCount = responseData?.skippedCount ?? 0;
      const errors = responseData?.errors || null;
      const message = responseData?.message || response.data?.message;
      
      // Debug logging
      console.log('Parsed response:', { insertedCount, skippedCount, errors, message });
      console.log('Response structure check:', {
        hasData: !!responseData,
        hasInsertedCount: insertedCount !== undefined,
        hasSkippedCount: skippedCount !== undefined,
        hasErrors: !!errors,
        errorsType: Array.isArray(errors) ? 'array' : typeof errors,
        errorsLength: Array.isArray(errors) ? errors.length : 'N/A'
      });
      
      // Check if we have errors array
      const hasErrors = (errors && Array.isArray(errors) && errors.length > 0) || 
                       (errors && typeof errors === 'string' && errors.trim() !== '');
      
      console.log('Error check - hasErrors:', hasErrors, 'skippedCount:', skippedCount);
      
      // Store results for error modal - ALWAYS set this when we have response data
      const results = {
        insertedCount: insertedCount,
        skippedCount: skippedCount,
        errors: hasErrors 
          ? (Array.isArray(errors) ? errors : [String(errors)])
          : skippedCount > 0 
            ? [`${skippedCount} record(s) were skipped but no detailed error messages are available.`]
            : null,
      };
      
      console.log('Final results object:', results);
      
      // Notify parent component about import results (parent will handle modal display)
      if (onImportComplete) {
        onImportComplete(results, file?.name);
      }
      
      // Show toast notifications
      if (insertedCount > 0) {
        if (skippedCount > 0) {
          // Partial success with skipped records - show warning toast
          toast.warning(
            `Successfully uploaded ${insertedCount} teacher(s). ${skippedCount} record(s) skipped with errors.`,
            { 
              autoClose: 5000,
              onClick: () => {
                console.log('Toast clicked - opening error modal');
                setShowErrorModal(true);
              }
            }
          );
        } else {
          // Complete success - no skipped records
          toast.success(
            `Successfully uploaded ${insertedCount} teacher(s).`,
            { autoClose: 5000 }
          );
          // Close upload modal on complete success
          setFile(null);
          refetch();
          setTimeout(() => {
            onOpenChange(false);
          }, 100);
        }
      } else {
        // No records inserted
        if (skippedCount > 0) {
          toast.error(
            `No teachers were uploaded. ${skippedCount} record(s) had errors.`,
            {
              autoClose: 5000,
              onClick: () => {
                console.log('Error toast clicked - opening error modal');
                setShowErrorModal(true);
              }
            }
          );
        } else {
          toast.error('No teachers were uploaded. Please check your file for errors.');
        }
      }
      
      // Refresh the list if any records were inserted
      if (insertedCount > 0) {
        setFile(null);
        refetch();
        // Don't close upload modal if there are skipped records - let user review errors
        if (skippedCount === 0) {
          setTimeout(() => {
            onOpenChange(false);
          }, 100);
        }
      }
      // If no records inserted, keep upload modal open so user can see errors
    } catch (error: any) {
      console.error('Upload error:', error);
      
      // Handle detailed error response
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Check if there's structured error data in the response
        if (errorData.data && (errorData.data.errors || errorData.data.skippedCount > 0)) {
          const errors = errorData.data.errors;
          const insertedCount = errorData.data.insertedCount || 0;
          const skippedCount = errorData.data.skippedCount || 0;
          const hasErrors = (errors && Array.isArray(errors) && errors.length > 0) || 
                           (errors && typeof errors === 'string' && errors.trim() !== '');
          
          // Store results for error modal
          const errorResults = {
            insertedCount,
            skippedCount,
            errors: hasErrors 
              ? (Array.isArray(errors) ? errors : [String(errors)])
              : skippedCount > 0 
                ? [`${skippedCount} record(s) were skipped but no detailed error messages are available.`]
                : null,
          };
          
          // Notify parent component about import results (parent will handle modal display)
          if (onImportComplete) {
            onImportComplete(errorResults, file?.name);
          }
          
          // Show toast notification
          if (insertedCount > 0) {
            toast.warning(
              `${insertedCount} teacher(s) imported, but ${skippedCount} record(s) had errors. `,
              { 
                autoClose: 5000,
                onClick: () => setShowErrorModal(true)
              }
            );
          } else {
            toast.error(
              `Import failed. ${skippedCount} record(s) had errors.`,
              {
                autoClose: 5000,
                onClick: () => setShowErrorModal(true)
              }
            );
          }
        } else {
          // Generic error without structured data
          toast.error(errorData.message || errorData.msg || "Error uploading file. Please check your file format and try again.");
        }
      } else if (error.response?.status === 409) {
        toast.error("Conflict: One or more teachers already exist in the database.");
      } else {
        toast.error("Error uploading file. Please check your file format and try again.");
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
    <>
      <Dialog open={open} onOpenChange={handleModalChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Upload Excel File</DialogTitle>
            <DialogDescription>Upload Excel/CSV file with teacher data. Download template for required column names.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadTemplate}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
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
                  accept=".xlsx, .xls, .csv"
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

    </>
  )
}
