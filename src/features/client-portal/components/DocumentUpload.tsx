/**
 * Document Upload Component
 * Handles file upload with preview, drag-and-drop, and progress indicators
 */

'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@components/ui/Button';
import Card from '@components/ui/Card';
import { useClientStore } from '../store';

export interface DocumentUploadProps {
  companyId: string;
  onUploadComplete?: (document: any) => void;
}

export default function DocumentUpload({ companyId, onUploadComplete }: DocumentUploadProps) {
  const { uploadDocument, isUploading, uploadProgress } = useClientStore();
  const [dragActive, setDragActive] = React.useState(false);
  const [description, setDescription] = React.useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDrag = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleFiles = React.useCallback(async (files: File[]) => {
    if (files.length === 0 || isUploading) return;

    // For demo, we'll only handle the first file
    const file = files[0];
    
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/csv'
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('Please upload only PDF, Excel, CSV, or image files.');
      return;
    }

    // Validate file size (max 10MB for demo)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB.');
      return;
    }

    try {
      const document = await uploadDocument(file, companyId, description.trim() || undefined);
      if (document) {
        setDescription('');
        onUploadComplete?.(document);
        
        // Show success message
        const event = new CustomEvent('show-toast', {
          detail: {
            title: 'Upload Successful',
            message: `${file.name} has been uploaded successfully.`,
            type: 'success'
          }
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      const event = new CustomEvent('show-toast', {
        detail: {
          title: 'Upload Failed',
          message: 'There was an error uploading your file. Please try again.',
          type: 'error'
        }
      });
      window.dispatchEvent(event);
    }
  }, [uploadDocument, companyId, description, isUploading, onUploadComplete]);

  const handleDrop = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles([...Array.from(e.dataTransfer.files)]);
    }
  }, [handleFiles]);

  const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles([...Array.from(e.target.files)]);
    }
  }, [handleFiles]);

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="p-6" data-testid="document-upload">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-deep-navy mb-2">Upload Documents</h3>
        <p className="text-sm text-deep-navy/70">
          Share PDF reports, Excel files, or images with your accountant
        </p>
      </div>

      {/* Description Input */}
      <div className="mb-4">
        <label htmlFor="description" className="block text-sm font-medium text-deep-navy mb-1">
          Description (Optional)
        </label>
        <input
          id="description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Briefly describe this document..."
          disabled={isUploading}
          className="w-full rounded-xl border border-medium/60 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cobalt disabled:opacity-50"
        />
      </div>

      {/* Upload Area */}
      <div
        className={`
          relative rounded-xl border-2 border-dashed p-8 text-center transition-colors
          ${dragActive 
            ? 'border-cobalt bg-cobalt/5' 
            : isUploading 
              ? 'border-medium/40 bg-medium/10' 
              : 'border-medium/60 hover:border-cobalt hover:bg-cobalt/5'
          }
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={false}
          onChange={handleChange}
          accept=".pdf,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif"
          className="hidden"
          disabled={isUploading}
          data-testid="file-input"
        />

        <AnimatePresence mode="wait">
          {isUploading ? (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="text-4xl">📤</div>
              <div>
                <p className="text-sm font-medium text-deep-navy">Uploading...</p>
                <div className="mt-2 w-full bg-medium/40 rounded-full h-2">
                  <motion.div
                    className="bg-cobalt h-2 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
                <p className="text-xs text-deep-navy/70 mt-1">{uploadProgress}% complete</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="text-4xl">📁</div>
              <div>
                <p className="text-sm font-medium text-deep-navy mb-1">
                  {dragActive ? 'Drop your file here' : 'Drag and drop your file here'}
                </p>
                <p className="text-xs text-deep-navy/70 mb-4">
                  PDF, Excel, CSV, or images (max 10MB)
                </p>
                <Button
                  size="sm"
                  onClick={openFileDialog}
                  disabled={isUploading}
                  data-testid="upload-button"
                >
                  Choose File
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}