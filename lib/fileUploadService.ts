import { supabase } from './supabase'
import { UploadedFile } from '@/types'

export class FileUploadService {
  private static readonly BUCKET_NAME = 'order-files'
  private static readonly MAX_FILE_SIZE = 16 * 1024 * 1024 // 16MB

  static async uploadFiles(orderId: string, files: File[]): Promise<UploadedFile[]> {
    if (files.length === 0) return []

    const uploadedFiles: UploadedFile[] = []

    for (const file of files) {
      try {
        // Generate unique filename
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `${orderId}/${fileName}`

        // Upload file to Supabase Storage
        const { data, error } = await supabase.storage
          .from(this.BUCKET_NAME)
          .upload(filePath, file)

        if (error) {
          console.error('Error uploading file:', error)
          throw new Error(`Failed to upload ${file.name}: ${error.message}`)
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(this.BUCKET_NAME)
          .getPublicUrl(filePath)

        const uploadedFile: UploadedFile = {
          id: data.path,
          name: file.name,
          size: file.size,
          type: file.type,
          url: urlData.publicUrl,
          uploaded_at: new Date().toISOString()
        }

        uploadedFiles.push(uploadedFile)
      } catch (error) {
        console.error('Error uploading file:', error)
        throw error
      }
    }

    return uploadedFiles
  }

  static async deleteFile(filePath: string): Promise<void> {
    const { error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .remove([filePath])

    if (error) {
      console.error('Error deleting file:', error)
      throw new Error(`Failed to delete file: ${error.message}`)
    }
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  static getFileIcon(type: string): string {
    if (type.startsWith('image/')) return '🖼️'
    if (type === 'application/zip') return '📦'
    if (type === 'application/pdf') return '📄'
    return '📁'
  }

  static validateFile(file: File): string | null {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return `File "${file.name}" is too large. Maximum size is ${this.formatFileSize(this.MAX_FILE_SIZE)}.`
    }

    // Check file type
    const allowedTypes = ['image/png', 'image/jpeg', 'application/zip', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return `File "${file.name}" has an unsupported format. Allowed types: PNG, JPG, ZIP, PDF.`
    }

    return null
  }
}
