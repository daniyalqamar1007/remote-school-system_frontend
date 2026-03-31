import axios from "axios"

export interface AWSUploadResult {
  awsUrl: string
  key: string
  fileName: string
}

export interface UploadProgressCallback {
  (progress: number): void
}

/**
 * Professional AWS file upload utility
 * Uploads files to AWS S3 using signed URLs
 * 
 * @param file - The file to upload
 * @param setUploadProgress - Optional callback for upload progress (0-100)
 * @param onSuccess - Optional callback on successful upload
 * @param onError - Optional callback on upload error
 * @returns Promise with AWS URL and key
 */
export const uploadImageToAWS = async (
  file: File,
  setUploadProgress?: UploadProgressCallback,
  onSuccess?: (result: AWSUploadResult) => void,
  onError?: (error: Error) => void
): Promise<AWSUploadResult> => {
  try {
    console.log(`📤 Starting AWS upload for file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`)

    // Step 1: Get signed URL from backend
    const getSignedUrlResponse = await axios.get(
      `${process.env.NEXT_PUBLIC_AWS_SERVER}/aws/signed-url?fileName=${file.name}&contentType=${file.type}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    )

    if (!getSignedUrlResponse.data?.msg?.url) {
      throw new Error("Failed to get signed URL from server")
    }

    const signedUrl = getSignedUrlResponse.data.msg.url
    const key = getSignedUrlResponse.data.msg.key

    console.log(`✅ Received signed URL for: ${file.name}`)

    // Step 2: Upload file to S3 using signed URL
    const uploadResponse = await axios.put(signedUrl, file, {
      headers: {
        "Content-Type": file.type,
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && setUploadProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(progress)
        }
      },
    })

    if (uploadResponse.status !== 200) {
      throw new Error("AWS upload failed with non-200 status")
    }

    // Extract the URL without query parameters
    const awsUrl = signedUrl.split("?")[0]

    const result: AWSUploadResult = {
      awsUrl,
      key,
      fileName: file.name
    }

    console.log(`✅ Successfully uploaded to AWS: ${awsUrl}`)
    
    if (onSuccess) {
      onSuccess(result)
    }

    return result

  } catch (error: any) {
    console.error("❌ Error uploading file to AWS:", error)
    
    const errorMessage = error?.response?.data?.message || error?.message || "Failed to upload file to AWS"
    const uploadError = new Error(errorMessage)

    if (onError) {
      onError(uploadError)
    }

    throw uploadError
  }
}

/**
 * Upload multiple files to AWS
 * 
 * @param files - Array of files to upload
 * @param setUploadProgress - Optional callback for overall progress
 * @returns Promise with array of AWS URLs
 */
export const uploadMultipleFilesToAWS = async (
  files: File[],
  setUploadProgress?: UploadProgressCallback
): Promise<AWSUploadResult[]> => {
  const results: AWSUploadResult[] = []
  const totalFiles = files.length

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    console.log(`📤 Uploading file ${i + 1}/${totalFiles}: ${file.name}`)

    try {
      const result = await uploadImageToAWS(file, (progress) => {
        if (setUploadProgress) {
          // Calculate overall progress across all files
          const fileProgress = (i / totalFiles) * 100
          const currentFileProgress = (progress / totalFiles)
          const overallProgress = Math.round(fileProgress + currentFileProgress)
          setUploadProgress(overallProgress)
        }
      })

      results.push(result)
    } catch (error) {
      console.error(`❌ Failed to upload file ${file.name}:`, error)
      throw error
    }
  }

  console.log(`✅ Successfully uploaded ${results.length}/${totalFiles} files`)
  return results
}

/**
 * Delete file from AWS S3
 * 
 * @param filename - The filename/key to delete from S3
 * @returns Promise with deletion result
 */
export const deleteFromAWS = async (filename: string): Promise<any> => {
  try {
    console.log(`🗑️  Deleting file from AWS: ${filename}`)

    const response = await axios.delete(
      `${process.env.NEXT_PUBLIC_AWS_SERVER}/aws/${filename}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    console.log(`✅ Successfully deleted file: ${filename}`)
    return response.data

  } catch (error: any) {
    console.error(`❌ Error deleting file from AWS: ${filename}`, error)
    
    const errorMessage = error?.response?.data?.message || error?.message || "Failed to delete file from AWS"
    throw new Error(errorMessage)
  }
}

/**
 * Delete multiple files from AWS
 * 
 * @param filenames - Array of filenames/keys to delete
 * @returns Promise with deletion results
 */
export const deleteMultipleFromAWS = async (filenames: string[]): Promise<any[]> => {
  const results: any[] = []
  
  for (const filename of filenames) {
    try {
      const result = await deleteFromAWS(filename)
      results.push(result)
    } catch (error) {
      console.error(`❌ Failed to delete ${filename}:`, error)
      // Continue with other deletions even if one fails
    }
  }

  return results
}
