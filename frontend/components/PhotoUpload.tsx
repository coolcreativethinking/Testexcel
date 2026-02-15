'use client'

import { useState, useRef } from 'react'

interface PhotoUploadProps {
  onPhotoSelected: (file: File, preview: string) => void
}

export default function PhotoUpload({ onPhotoSelected }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setPreview(dataUrl)
      onPhotoSelected(file, dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleInputChange}
      />

      {preview ? (
        <div className="relative rounded-2xl overflow-hidden">
          <img
            src={preview}
            alt="Your yard"
            className="w-full h-56 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <button
            onClick={() => {
              setPreview(null)
              if (fileInputRef.current) fileInputRef.current.value = ''
            }}
            className="absolute top-3 right-3 bg-black/50 text-white rounded-full p-2 backdrop-blur-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <p className="absolute bottom-3 left-3 text-sm text-white/80">
            Photo uploaded — ready to design
          </p>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer
            ${isDragging ? 'border-green-400 bg-green-500/10' : 'border-white/20 hover:border-white/40'}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
          <p className="text-white font-medium mb-1">Tap to upload your yard photo</p>
          <p className="text-white/40 text-sm">or drag and drop an image here</p>
          <p className="text-white/30 text-xs mt-2">JPG, PNG up to 10MB</p>
        </div>
      )}
    </div>
  )
}
