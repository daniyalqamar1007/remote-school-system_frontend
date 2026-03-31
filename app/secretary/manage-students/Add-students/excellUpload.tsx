"use client"

import type React from "react"

import { useState } from "react"
import { Loader2, Upload, X, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BulkImportErrorModal } from "@/components/BulkImportErrorModal"
import axios from "axios"
import { toast } from 'sonner'
import { downloadTemplate } from '@/lib/downloadTemplate'

interface ExcelUploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onClose: () => void
  refetch: () => void
}

export function ExcelUploadModal({ open, onOpenChange, onClose, refetch }: ExcelUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadComplete, setUploadComplete] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [importResults, setImportResults] = useState<{
    insertedCount: number
    skippedCount: number
    errors: string[] | null
  } | null>(null)

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
      await downloadTemplate('admin/students/template', 'student_bulk_upload_template.csv');
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
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/students/import`,
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
  
      // Handle response - check both response.data.data and response.data structures
      const responseData = response.data?.data || response.data;
      
      if (responseData) {
        const insertedCount = responseData.insertedCount || 0;
        const skippedCount = responseData.skippedCount || 0;
        const errors = responseData.errors || null;
        const hasConflicts = responseData.hasConflicts;
        const message = responseData.message;
        
        // Debug logging
        console.log('Parsed response:', { insertedCount, skippedCount, errors, hasConflicts, message });
        
        // Store results for error modal
        const results = {
          insertedCount: insertedCount,
          skippedCount: skippedCount,
          errors: errors,
        };
        
        // Check if we have errors array or just skippedCount
        const hasErrors = (errors && Array.isArray(errors) && errors.length > 0) || 
                         (errors && typeof errors === 'string' && errors.trim() !== '');
        
        console.log('Error check - hasErrors:', hasErrors, 'skippedCount:', skippedCount);
        
        // ALWAYS show error modal if there are skipped records (even if errors array is missing)
        // This ensures users can see what went wrong even if backend didn't provide detailed errors
        if (skippedCount > 0) {
          // If no detailed errors, create a generic error message
          if (!hasErrors) {
            results.errors = [
              `Row information unavailable: ${skippedCount} record(s) were skipped during import. Please check your file for validation errors such as missing required fields, invalid data formats, or duplicate records.`
            ];
          }
          
          console.log('Setting import results:', results);
          setImportResults(results);
          
          console.log('Opening error modal now...');
          // Always show error modal when there are skipped records (even on success)
          // Use setTimeout to ensure state is set properly
          setTimeout(() => {
            setShowErrorModal(true);
            console.log('Error modal should now be open. showErrorModal:', true);
          }, 100);
        } else {
          // No skipped records, set results for consistency
          setImportResults(results);
        }
        
        // Define constants for use in messages
        const finalInsertedCount = insertedCount || 0;
        const finalSkippedCount = skippedCount || 0;
        
        // Show success message
        if (finalInsertedCount > 0) {
          if (finalSkippedCount > 0) {
            // Partial success with skipped records - show warning toast
            toast.warning(
              `Successfully uploaded ${finalInsertedCount} student(s). ${finalSkippedCount} record(s) skipped with errors.`,
              { 
                autoClose: 5000,
                onClick: () => setShowErrorModal(true)
              }
            );
          } else {
            // Complete success - no skipped records
            toast.success(
              `Successfully uploaded ${finalInsertedCount} student(s).`,
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
          if (finalSkippedCount > 0) {
            toast.error(
              `No students were uploaded. ${finalSkippedCount} record(s) had errors.`,
              {
                autoClose: 5000,
                onClick: () => setShowErrorModal(true)
              }
            );
          } else {
            toast.error('No students were uploaded. Please check your file for errors.');
          }
        }
        
        // Refresh the list if any records were inserted
        if (finalInsertedCount > 0) {
          setFile(null);
          refetch();
          // Don't close upload modal if there are skipped records - let user review errors
          if (finalSkippedCount === 0) {
            setTimeout(() => {
              onOpenChange(false);
            }, 100);
          }
        }
        // If no records inserted, keep upload modal open so user can see errors
      } else if (response.data.statusCode === 409 || response.data.status === 409) {
        toast.error(response.data.message || response.data.msg || "Conflict: Student already exists.");
      } else {
        // Fallback: treat as success if no data structure
        toast.success(response.data.message || "Upload Successful!");
        setFile(null);
        refetch();
        setTimeout(() => {
          onOpenChange(false);
        }, 100);
      }
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
          setImportResults({
            insertedCount,
            skippedCount,
            errors: hasErrors 
              ? (Array.isArray(errors) ? errors : [String(errors)])
              : skippedCount > 0 
                ? [`${skippedCount} record(s) were skipped but no detailed error messages are available.`]
                : null,
          });
          
          // Always show error modal if there are skipped records
          if (skippedCount > 0) {
            setShowErrorModal(true);
          }
          
          // Show toast notification
          if (insertedCount > 0) {
            toast.warning(
              `${insertedCount} student(s) imported, but ${skippedCount} record(s) had errors. `,
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
        toast.error("Conflict: One or more students already exist in the database.");
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
      setImportResults(null)
      setShowErrorModal(false)

      setTimeout(() => {
        setUploadComplete(false)
      }, 300)
    }
  }

  const handleErrorModalClose = (closed: boolean) => {
    setShowErrorModal(closed)
    // If error modal is closed and we had successful imports, close the upload modal too
    if (!closed && importResults && importResults.insertedCount > 0) {
      setTimeout(() => {
        onOpenChange(false)
      }, 100)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleModalChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Upload Excel File</DialogTitle>
            <DialogDescription>Upload Excel/CSV file with student data. Download template for required column names.</DialogDescription>
            <div className="mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Student Template
              </Button>
            </div>
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

      {/* Error Details Modal */}
      {importResults && (
        <BulkImportErrorModal
          open={showErrorModal}
          onOpenChange={handleErrorModalClose}
          insertedCount={importResults.insertedCount}
          skippedCount={importResults.skippedCount}
          errors={importResults.errors}
          fileName={file?.name}
        />
      )}
    </>
  )
}

