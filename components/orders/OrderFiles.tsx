'use client'

import { UploadedFile } from '@/types'
import { File, Image, Archive, FileText, Download, ExternalLink } from 'lucide-react'

interface OrderFilesProps {
  files: UploadedFile[]
}

export function OrderFiles({ files }: OrderFilesProps) {
  if (!files || files.length === 0) {
    return null
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />
    if (type === 'application/zip') return <Archive className="h-4 w-4" />
    if (type === 'application/pdf') return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleDownload = (file: UploadedFile) => {
    const link = document.createElement('a')
    link.href = file.url
    link.download = file.name
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="mt-3">
      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
        <File className="h-4 w-4 mr-1" />
        Attached Files ({files.length})
      </h4>
      <div className="space-y-2">
        {files.map((file, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              {getFileIcon(file.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => window.open(file.url, '_blank')}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="View file"
              >
                <ExternalLink className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDownload(file)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Download file"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
