/**
 * Document List Component
 * Displays uploaded documents with preview, status, and delete functionality
 */

'use client';

import * as React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@components/ui/Button';
import Card from '@components/ui/Card';
import { useClientStore } from '../store';
import type { ClientDocument } from '../repository';

export interface DocumentListProps {
  companyId: string;
}

// File type icons mapping
const getFileIcon = (fileType: string): string => {
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('excel') || fileType.includes('spreadsheet') || fileType.includes('csv')) return '📊';
  if (fileType.includes('image')) return '🖼️';
  return '📁';
};

// File size formatter
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// Status badge component
const StatusBadge: React.FC<{ status: 'pending' | 'reviewed' }> = ({ status }) => {
  const config = {
    pending: { 
      label: 'Pending Review', 
      className: 'bg-amber-100 text-amber-800 border-amber-200' 
    },
    reviewed: { 
      label: 'Reviewed', 
      className: 'bg-green-100 text-green-800 border-green-200' 
    }
  };

  const { label, className } = config[status];

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${className}`}>
      {label}
    </span>
  );
};

// Document card component
const DocumentCard: React.FC<{
  document: ClientDocument;
  onDelete: (id: string) => void;
  onPreview: (document: ClientDocument) => void;
}> = ({ document, onDelete, onPreview }) => {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (isDeleting) return;
    
    if (!window.confirm(`Are you sure you want to delete "${document.fileName}"?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(document.id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-xl border border-medium/20 p-4 hover:shadow-soft transition-shadow"
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl mt-1">
          {getFileIcon(document.fileType)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-deep-navy truncate" title={document.fileName}>
                {document.fileName}
              </h4>
              <p className="text-xs text-deep-navy/60 mt-1">
                {formatFileSize(document.fileSize)} • 
                Uploaded {new Date(document.uploadedAt).toLocaleDateString()}
              </p>
              {document.description && (
                <p className="text-sm text-deep-navy/70 mt-1 line-clamp-2">
                  {document.description}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <StatusBadge status={document.status} />
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              {document.fileContent && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onPreview(document)}
                  className="text-xs"
                >
                  Preview
                </Button>
              )}
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-xs text-coral hover:text-coral hover:bg-coral/10"
              data-testid={`delete-document-${document.id}`}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function DocumentList({ companyId }: DocumentListProps) {
  const { documents, documentsLoading, loadDocuments, deleteDocument } = useClientStore();
  const [previewDocument, setPreviewDocument] = React.useState<ClientDocument | null>(null);

  // Load documents on mount and company change
  React.useEffect(() => {
    if (companyId) {
      loadDocuments(companyId);
    }
  }, [companyId, loadDocuments]);

  const handleDelete = React.useCallback(async (documentId: string) => {
    const success = await deleteDocument(documentId);
    if (success) {
      const event = new CustomEvent('show-toast', {
        detail: {
          title: 'Document Deleted',
          message: 'The document has been successfully deleted.',
          type: 'success'
        }
      });
      window.dispatchEvent(event);
    } else {
      const event = new CustomEvent('show-toast', {
        detail: {
          title: 'Delete Failed',
          message: 'There was an error deleting the document. Please try again.',
          type: 'error'
        }
      });
      window.dispatchEvent(event);
    }
  }, [deleteDocument]);

  const handlePreview = (document: ClientDocument) => {
    setPreviewDocument(document);
  };

  const closePreview = () => {
    setPreviewDocument(null);
  };

  if (documentsLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="h-24 animate-pulse bg-medium/20" />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-4xl mb-3">📂</div>
        <h3 className="text-lg font-semibold text-deep-navy mb-2">No documents yet</h3>
        <p className="text-deep-navy/70">
          Upload your first document to share with your accountant.
        </p>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4" data-testid="documents-list">
        <AnimatePresence>
          {documents.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              onDelete={handleDelete}
              onPreview={handlePreview}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewDocument && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            >
              <div className="p-4 border-b border-medium/20">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-deep-navy">
                    {previewDocument.fileName}
                  </h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={closePreview}
                    className="text-deep-navy/60 hover:text-deep-navy"
                  >
                    ✕
                  </Button>
                </div>
              </div>
              
              <div className="p-4 max-h-96 overflow-y-auto">
                {previewDocument.fileType.includes('image') ? (
                  <div className="relative w-full h-auto">
                    <Image
                      src={`data:${previewDocument.fileType};base64,${previewDocument.fileContent}`}
                      alt={previewDocument.fileName}
                      width={1200}
                      height={800}
                      className="w-full h-auto rounded-lg"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">
                      {getFileIcon(previewDocument.fileType)}
                    </div>
                    <p className="text-deep-navy/70">
                      Preview not available for this file type.
                    </p>
                    <p className="text-sm text-deep-navy/50 mt-2">
                      File size: {formatFileSize(previewDocument.fileSize)}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-medium/20 flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={closePreview}>
                  Close
                </Button>
                {previewDocument.fileContent && (
                  <Button
                    size="sm"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = `data:${previewDocument.fileType};base64,${previewDocument.fileContent}`;
                      link.download = previewDocument.fileName;
                      link.click();
                    }}
                  >
                    Download
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}