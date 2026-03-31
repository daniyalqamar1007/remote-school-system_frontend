"use client"

import type React from "react"

import { useState } from "react"
import { Loader2, Upload, X, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BulkImportErrorModal } from "@/components/BulkImportErrorModal"
import axios from "axios"
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
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

  const validateAndFilterExcelFile = async (file: File): Promise<{ 
    filteredFile: File | null; 
    errors: string[]; 
    validRowCount: number;
    invalidRowCount: number;
  }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          if (jsonData.length === 0) {
            resolve({ filteredFile: null, errors: ['Excel file is empty'], validRowCount: 0, invalidRowCount: 0 });
            return;
          }
          
          // Find header row (first row with data)
          const headerRow = jsonData[0] || [];
          
          // Find Student ID column
          const studentIdIndex = headerRow.findIndex((cell: any) => {
            if (!cell) return false;
            const normalized = String(cell).toLowerCase().replace(/\s+/g, '').replace(/_/g, '');
            return normalized.includes('studentid') || 
                   normalized === 'studentid' ||
                   normalized.includes('student_id') ||
                   normalized.includes('id');
          });
          
          // Find Student Password column
          const studentPasswordIndex = headerRow.findIndex((cell: any) => {
            if (!cell) return false;
            const normalized = String(cell).toLowerCase().replace(/\s+/g, '').replace(/_/g, '');
            return normalized.includes('studentpassword') || 
                   normalized === 'studentpassword' ||
                   normalized.includes('student_password') ||
                   (normalized.includes('password') && normalized.includes('student')) ||
                   (normalized === 'password' && studentIdIndex !== -1); // Fallback: if only one password column
          });
          
          // Find Parent Password column
          const parentPasswordIndex = headerRow.findIndex((cell: any) => {
            if (!cell) return false;
            const normalized = String(cell).toLowerCase().replace(/\s+/g, '').replace(/_/g, '');
            return normalized.includes('parentpassword') || 
                   normalized === 'parentpassword' ||
                   normalized.includes('parent_password') ||
                   (normalized.includes('password') && normalized.includes('parent')) ||
                   (normalized.includes('guardianpassword')) ||
                   (normalized.includes('guardian_password'));
          });
          
          // Check for required columns
          const missingColumns: string[] = [];
          if (studentIdIndex === -1) {
            missingColumns.push('Student ID');
          }
          if (studentPasswordIndex === -1) {
            missingColumns.push('Student Password');
          }
          if (parentPasswordIndex === -1) {
            missingColumns.push('Parent Password');
          }
          
          if (missingColumns.length > 0) {
            resolve({ 
              filteredFile: null, 
              errors: [`Required columns not found in Excel file: ${missingColumns.join(', ')}. Please ensure your file has all required columns.`], 
              validRowCount: 0, 
              invalidRowCount: 0 
            });
            return;
          }
          
          const errors: string[] = [];
          const validRows: any[][] = [headerRow]; // Start with header row
          let validCount = 0;
          let invalidCount = 0;
          
          // Check each data row (skip header row)
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            const studentId = row[studentIdIndex];
            const studentPassword = row[studentPasswordIndex];
            const parentPassword = row[parentPasswordIndex];
            
            const rowErrors: string[] = [];
            
            // Check if Student ID is missing or empty
            if (!studentId || String(studentId).trim() === '') {
              rowErrors.push('Student ID is required');
            }
            
            // Check if Student Password is missing or empty
            if (!studentPassword || String(studentPassword).trim() === '') {
              rowErrors.push('Student Password is required');
            } else if (String(studentPassword).trim().length < 8) {
              rowErrors.push('Student Password must be at least 8 characters');
            }
            
            // Check if Parent Password is missing or empty
            if (!parentPassword || String(parentPassword).trim() === '') {
              rowErrors.push('Parent Password is required');
            } else if (String(parentPassword).trim().length < 8) {
              rowErrors.push('Parent Password must be at least 8 characters');
            }
            
            if (rowErrors.length > 0) {
              errors.push(`Row ${i + 1}: ${rowErrors.join(', ')}`);
              invalidCount++;
            } else {
              // Valid row - add to validRows
              validRows.push(row);
              validCount++;
            }
          }
          
          // If all rows are invalid, return error
          if (validCount === 0 && invalidCount > 0) {
            resolve({ 
              filteredFile: null, 
              errors, 
              validRowCount: 0, 
              invalidRowCount: invalidCount 
            });
            return;
          }
          
          // Create new workbook with only valid rows
          const newWorkbook = XLSX.utils.book_new();
          const newWorksheet = XLSX.utils.aoa_to_sheet(validRows);
          XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, firstSheetName);
          
          // Convert workbook to blob
          const wbout = XLSX.write(newWorkbook, { type: 'array', bookType: 'xlsx' });
          const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          
          // Create new File object with filtered data
          const filteredFile = new File([blob], file.name, { type: file.type });
          
          resolve({ 
            filteredFile: invalidCount > 0 ? filteredFile : file, // Use original if no invalid rows
            errors, 
            validRowCount: validCount, 
            invalidRowCount: invalidCount 
          });
        } catch (error) {
          resolve({ 
            filteredFile: null, 
            errors: ['Error reading Excel file: ' + (error as Error).message], 
            validRowCount: 0, 
            invalidRowCount: 0 
          });
        }
      };
      
      reader.onerror = () => {
        resolve({ filteredFile: null, errors: ['Error reading file'], validRowCount: 0, invalidRowCount: 0 });
      };
      
      reader.readAsArrayBuffer(file);
    });
  };

  const handleUpload = async () => {
    if (!file) return;
  
    setIsUploading(true);
    
    // Validate and filter Excel file - remove rows with missing Student ID
    const validation = await validateAndFilterExcelFile(file);
    const frontendErrors = validation.errors || [];
    const validRowCount = validation.validRowCount || 0;
    const invalidRowCount = validation.invalidRowCount || 0;
    
    // If no valid rows, show error and stop
    if (!validation.filteredFile || validRowCount === 0) {
      setIsUploading(false);
      if (frontendErrors.length > 0) {
        setImportResults({
          insertedCount: 0,
          skippedCount: invalidRowCount,
          errors: frontendErrors,
        });
        setShowErrorModal(true);
        toast.error('No valid records to import. All records have missing Student ID.', {
          duration: 5000,
        });
      }
      return;
    }
    
    const formData = new FormData();
    formData.append("file", validation.filteredFile); // Use filtered file (only valid rows)
  
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
        const backendErrors = responseData.errors || null;
        const hasConflicts = responseData.hasConflicts;
        const message = responseData.message;
        
        // Debug logging
        console.log('Parsed response:', { insertedCount, skippedCount, backendErrors, hasConflicts, message });
        
        // Combine frontend validation errors with backend errors
        const allErrors: string[] = [];
        
        // Add frontend validation errors (Student ID missing)
        if (frontendErrors.length > 0) {
          allErrors.push(...frontendErrors);
        }
        
        // Add backend errors
        if (backendErrors) {
          if (Array.isArray(backendErrors)) {
            allErrors.push(...backendErrors);
          } else if (typeof backendErrors === 'string' && backendErrors.trim() !== '') {
            allErrors.push(backendErrors);
          }
        }
        
        // Calculate total skipped (frontend errors + backend skipped)
        const totalSkipped = frontendErrors.length + skippedCount;
        const hasErrors = allErrors.length > 0 || totalSkipped > 0;
        
        // Store results for error modal
        const results = {
          insertedCount: insertedCount,
          skippedCount: totalSkipped,
          errors: allErrors.length > 0 ? allErrors : null,
        };
        
        console.log('Error check - hasErrors:', hasErrors, 'totalSkipped:', totalSkipped, 'frontendErrors:', frontendErrors.length);
        
        // ALWAYS show error modal if there are any errors (frontend or backend)
        if (hasErrors) {
          // If no detailed errors but we have skipped records, create a generic error message
          if (allErrors.length === 0 && totalSkipped > 0) {
            results.errors = [
              `Row information unavailable: ${totalSkipped} record(s) were skipped during import. Please check your file for validation errors such as missing required fields, invalid data formats, or duplicate records.`
            ];
          }
          
          console.log('Setting import results:', results);
          setImportResults(results);
          
          console.log('Opening error modal now...');
          // Always show error modal when there are errors (even on partial success)
          // Use setTimeout to ensure state is set properly
          setTimeout(() => {
            setShowErrorModal(true);
            console.log('Error modal should now be open. showErrorModal:', true);
          }, 100);
        } else {
          // No errors, set results for consistency
          setImportResults(results);
        }
        
        // Define constants for use in messages
        const finalInsertedCount = insertedCount || 0;
        const finalSkippedCount = totalSkipped || 0;
        
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
            const backendErrors = errorData.data.errors;
            const insertedCount = errorData.data.insertedCount || 0;
            const skippedCount = errorData.data.skippedCount || 0;
            
            // Combine frontend and backend errors
            const allErrors: string[] = [];
            if (frontendErrors.length > 0) {
              allErrors.push(...frontendErrors);
            }
            if (backendErrors) {
              if (Array.isArray(backendErrors)) {
                allErrors.push(...backendErrors);
              } else if (typeof backendErrors === 'string' && backendErrors.trim() !== '') {
                allErrors.push(backendErrors);
              }
            }
            
            const totalSkipped = frontendErrors.length + skippedCount;
            const hasErrors = allErrors.length > 0 || totalSkipped > 0;
            
            // Store results for error modal
            setImportResults({
              insertedCount,
              skippedCount: totalSkipped,
              errors: hasErrors 
                ? (allErrors.length > 0 ? allErrors : [`${totalSkipped} record(s) were skipped but no detailed error messages are available.`])
                : null,
            });
            
            // Always show error modal if there are any errors
            if (hasErrors) {
              setShowErrorModal(true);
            }
            
            // Show toast notification
            if (insertedCount > 0) {
              toast.warning(
                `${insertedCount} student(s) imported, but ${totalSkipped} record(s) had errors. `,
                { 
                  autoClose: 5000,
                  onClick: () => setShowErrorModal(true)
                }
              );
            } else {
              toast.error(
                `Import failed. ${totalSkipped} record(s) had errors.`,
                {
                  autoClose: 5000,
                  onClick: () => setShowErrorModal(true)
                }
              );
            }
          } else {
            // Combine frontend errors even if backend didn't return structured errors
            if (frontendErrors.length > 0) {
              setImportResults({
                insertedCount: 0,
                skippedCount: frontendErrors.length,
                errors: frontendErrors,
              });
              setShowErrorModal(true);
            }
            // Generic error without structured data
            toast.error(errorData.message || errorData.msg || "Error uploading file. Please check your file format and try again.");
          }
        } else if (error.response?.status === 409) {
          // Show frontend errors if any
          if (frontendErrors.length > 0) {
            setImportResults({
              insertedCount: 0,
              skippedCount: frontendErrors.length,
              errors: frontendErrors,
            });
            setShowErrorModal(true);
          }
          toast.error("Conflict: One or more students already exist in the database.");
        } else {
          // Show frontend errors if any
          if (frontendErrors.length > 0) {
            setImportResults({
              insertedCount: 0,
              skippedCount: frontendErrors.length,
              errors: frontendErrors,
            });
            setShowErrorModal(true);
          }
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

