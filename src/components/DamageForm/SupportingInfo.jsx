import React, { useRef, useEffect, useState } from "react";
import { Upload, FileText, X, Paperclip, ExternalLink } from "lucide-react";
<<<<<<< HEAD
import './ButtonHoverEffects.css';
=======
>>>>>>> c2d7396 (big damage issue update)

const ImagePreviewModal = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;

  return (
    <div
<<<<<<< HEAD
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm image-preview-backdrop"
      onClick={onClose}
    >
      <div
        className="relative p-4 bg-transparent max-w-[95vw] max-h-[95vh] overflow-auto image-preview-content"
=======
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
      onClick={onClose}
    >
      <div
        className="relative p-4 bg-transparent max-w-[95vw] max-h-[95vh] overflow-auto"
>>>>>>> c2d7396 (big damage issue update)
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
<<<<<<< HEAD
          className="absolute top-4 right-4 p-2 rounded-full bg-white text-gray-700 hover:bg-gray-200 z-10 shadow-lg transition-transform hover:scale-110"
=======
          className="absolute top-4 right-4 p-2 rounded-full bg-white text-gray-700 hover:bg-gray-200 z-10 shadow-lg"
>>>>>>> c2d7396 (big damage issue update)
          aria-label="Close preview"
        >
          <X size={24} />
        </button>
        <img
          src={imageUrl}
          alt="Preview"
          className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
        />
      </div>
    </div>
  );
};

const MIME_FROM_EXTENSION = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  bmp: 'image/bmp',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  heic: 'image/heic',
  heif: 'image/heif',
};

const extractExtension = (value = '') => {
  if (typeof value !== 'string' || !value.length) {
    return '';
  }
  const cleaned = value.split('?')[0].split('#')[0];
  const match = cleaned.match(/\.([a-z0-9]+)$/i);
  return match ? match[1].toLowerCase() : '';
};

const resolveMimeType = (file = {}) => {
  const candidates = [
    file?.fileObject?.type,
    file?.mimeType,
    file?.mimetype,
    file?.mime_type,
    file?.type,
  ].filter((value) => typeof value === 'string' && value.length);

  if (candidates.length) {
    return candidates[0];
  }

  const fallbackSource = [file?.name, file?.fileName, file?.downloadUrl, file?.previewUrl]
    .find((value) => typeof value === 'string' && value.length);

  if (!fallbackSource) {
    return '';
  }

  const ext = extractExtension(fallbackSource);
  return ext ? MIME_FROM_EXTENSION[ext] || '' : '';
};

const formatFileSize = (size) => {
  if (size === null || size === undefined || size === '') {
    return null;
  }

  const numeric = typeof size === 'number' ? size : parseFloat(size);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }

  const kb = numeric / 1024;
  if (kb >= 1024) {
    return `${(kb / 1024).toFixed(1)} MB`;
  }

  return `${kb.toFixed(1)} KB`;
};

export default function SupportingInfo({
  reason,
  onReasonChange,
  showRemark = true,
  showAttachments = true,
  onAttachmentsChange = () => {},
  isRequired = false,
  attachments = [],
  onAttachmentPreview,
  previewImageUrl,
  onClosePreview,
  readOnly = false,
  status = '',
}) {
  const fileInputRef = useRef(null);
  const [localPreviewImageUrl, setLocalPreviewImageUrl] = useState(null);

  useEffect(() => {
    // Debug how many attachments SupportingInfo receives each render
  }, [attachments, status]);

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const addFiles = (files) => {
    const list = Array.from(files || []);
    if (!list.length) return;
    const newAttachments = list.map(file => ({
      id: `${file.name}-${file.size}-${file.lastModified}`,
      name: file.name,
      size: file.size,
      fileObject: file,
      previewUrl: URL.createObjectURL(file) 
    }));
    onAttachmentsChange([...(attachments || []), ...newAttachments]);
  };

  const handleFileChange = (e) => {
    addFiles(e.target.files);
    e.target.value = null; 
  }

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleRemoveFile = (id) => {
    const fileToRemove = attachments.find(file => file.id === id);
    if (fileToRemove && fileToRemove.previewUrl) {
      URL.revokeObjectURL(fileToRemove.previewUrl); 
    }
    const updated = (attachments || []).filter(file => file.id !== id);
    onAttachmentsChange(updated);
  };

  const handleImageClick = (imageUrl) => {
    if (imageUrl) {
      setLocalPreviewImageUrl(imageUrl);
    }
    // Also call the external handler if provided
    if (typeof onAttachmentPreview === 'function') {
      onAttachmentPreview(imageUrl);
    }
  };

  const handleClosePreview = () => {
    setLocalPreviewImageUrl(null);
    // Also call the external handler if provided
    if (typeof onClosePreview === 'function') {
      onClosePreview();
    }
  };

  const safeAttachments = Array.isArray(attachments) ? attachments.filter(Boolean) : [];
  const isCompleted = status === 'Completed' || status === 'Issued' || status === 'SupervisorIssued';
  const shouldShowRemark = showRemark && !isCompleted;
  const shouldShowAttachments = showAttachments && !isCompleted;
  
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
      <h4 className="text-sm font-semibold text-amber-600 flex items-center gap-2 mb-4">
        <FileText size={16} />
        Supporting Info <span className="font-normal text-xs text-gray-700">(For the whole document)</span>
      </h4>
<<<<<<< HEAD
      
      {/* Remark and Attach Files on one line */}
      {(shouldShowRemark || shouldShowAttachments) && (
        <div className="flex flex-col md:flex-row gap-4">
          {/* Remarks section */}
          {shouldShowRemark && (
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-600 flex items-center gap-2 mb-1">
                Remarks {isRequired && <span className="text-red-500">*</span>}
              </label>
              {readOnly ? (
                <div className="w-full border border-transparent rounded-md px-2 py-2 text-sm bg-transparent text-gray-800 min-h-[3rem] whitespace-pre-wrap">
                  {(reason ?? '').trim() ? reason : <span className="text-gray-400">No remark provided.</span>}
                </div>
              ) : (
                <textarea
                  placeholder="Enter detailed reason..."
                  value={reason || ''}
                  onChange={e => {
                    e.stopPropagation();
                    onReasonChange(e.target.value);
                  }}
                  rows={2}
                  className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm min-h-[3.5rem] bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 resize-y"
                  required={isRequired}
                  onKeyDown={e => e.stopPropagation()}
                ></textarea>
              )}
            </div>
          )}

          {/* Attach Files section */}
          {shouldShowAttachments && (
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-600 flex items-center gap-2 mb-1">
                Attach Files (Multiple allowed)
              </label>
              <input
                type="file"
                ref={fileInputRef}
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
              />
              <div
                onClick={handleUploadClick}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border border-dashed bg-white border-gray-300 rounded-md p-3 flex flex-col items-center justify-center text-gray-500 text-sm hover:bg-gray-100 cursor-pointer min-h-[3.5rem]"
              >
                <Upload size={18} />
                <span className="text-center">Click to Upload or Drag and Drop Multiple Files</span>
              </div>
            </div>
          )}
=======
      {shouldShowRemark && (
        <>
          <label className="text-sm font-medium text-gray-600 flex items-center gap-2 mb-1">
            Remarks {isRequired && <span className="text-red-500">*</span>}
          </label>
          {readOnly ? (
            <div className="w-full border border-transparent rounded-md px-2 py-2 text-sm bg-transparent text-gray-800 min-h-[3rem] whitespace-pre-wrap">
              {(reason ?? '').trim() ? reason : <span className="text-gray-400">No remark provided.</span>}
            </div>
          ) : (
            <textarea
              placeholder="Enter detailed reason..."
              value={reason || ''}
              onChange={e => {
                e.stopPropagation();
                onReasonChange(e.target.value);
              }}
              rows={4}
              className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm min-h-[7rem] bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 resize-y"
              required={isRequired}
              onKeyDown={e => e.stopPropagation()}
            ></textarea>
          )}
        </>
      )}

      {shouldShowAttachments && (
        <div>
          <label className="text-sm font-medium text-gray-600 flex items-center gap-2 mb-1">
            Attach Files (Multiple allowed)
          </label>
          <input
            type="file"
            ref={fileInputRef}
            multiple
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
          />
          <div
            onClick={handleUploadClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border border-dashed bg-white border-gray-300 rounded-md p-3 flex flex-col items-center justify-center text-gray-500 text-sm hover:bg-gray-100 cursor-pointer"
          >
            <Upload size={18} />
            <span>Click to Upload or Drag and Drop Multiple Files</span>
          </div>
>>>>>>> c2d7396 (big damage issue update)
        </div>
      )}

      {/* Show existing attachments even when form is completed */}
      {safeAttachments.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-gray-600 mb-2">Uploaded Files ({safeAttachments.length}):</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {safeAttachments.map(file => {
                  const mimeType = resolveMimeType(file);
                  const isImage = typeof mimeType === 'string' && mimeType.startsWith('image/');
                  const isPdf = mimeType === 'application/pdf';
                  const previewSource = (typeof file?.previewUrl === 'string' && file.previewUrl.length)
                    ? file.previewUrl
                    : (typeof file?.downloadUrl === 'string' && file.downloadUrl.length ? file.downloadUrl : null);
                  const sizeLabel = formatFileSize(file?.size);
                  const resolvedOpenUrl = typeof file?.downloadUrl === 'string' && file.downloadUrl.length
                    ? file.downloadUrl
                    : previewSource;
                  const hasKnownMime = typeof mimeType === 'string' && mimeType.length;
                  const hasLikelyFileExtension = (() => {
                    const source = typeof file?.downloadUrl === 'string' && file.downloadUrl.length
                      ? file.downloadUrl
                      : typeof file?.previewUrl === 'string' && file.previewUrl.length
                        ? file.previewUrl
                        : file?.name;
                    if (typeof source !== 'string' || !source.length) {
                      return false;
                    }
                    const cleaned = source.split('?')[0];
                    const lastSegment = cleaned.split('/').pop() || '';
                    return /\.[a-z0-9]{2,6}$/i.test(lastSegment);
                  })();
                  const hasFileObject = file?.fileObject instanceof File || (!!file?.fileObject && typeof file?.fileObject === 'object' && !!file?.fileObject?.type);
                  const canOpen = typeof resolvedOpenUrl === 'string'
                    && resolvedOpenUrl.length
                    && (hasKnownMime || hasLikelyFileExtension || hasFileObject || resolvedOpenUrl.startsWith('data:'));
                  const openLinkProps = file?.isRemote
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : { download: file?.name || true };

                  return (
                    <div 
                      key={file.id} 
                      className="relative bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col group"
                    >
                      {!isCompleted && (
                        <button 
                          type="button"
                          onClick={() => handleRemoveFile(file.id)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 leading-none opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-600"
                          aria-label={`Remove ${file.name}`}
                        >
                          <X size={14} />
                        </button>
                      )}

                      <div 
                        className={`flex-shrink-0 w-full h-24 bg-gray-100 flex items-center justify-center border-b border-gray-200 ${isImage && previewSource ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                        onClick={() => {
                          if (isImage && previewSource) {
                            handleImageClick(previewSource);
                          }
                        }}
                        title={isImage && previewSource ? 'Click to view full size' : ''}
                      >
                        {isImage && previewSource ? (
                          <img
                            src={previewSource}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        ) : isPdf ? ( 
                          <FileText size={40} className="text-red-500" />
                        ) : ( 
                          <Paperclip size={40} className="text-gray-500" />
                        )}
                      </div>

                      <div className="p-2 flex-grow text-center">
                        {/* File name hidden as per user request */}
                      </div>
                      {canOpen && (
                        <div className="border-t border-gray-200">
                          <a
                            href={resolvedOpenUrl}
                            className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                            {...openLinkProps}
                          >
                            <ExternalLink size={14} />
                            <span>{file?.isRemote ? 'Open file' : 'Download file'}</span>
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

      {/* Image Preview Modal - Show when there's a preview image */}
      <ImagePreviewModal
        imageUrl={localPreviewImageUrl || previewImageUrl}
        onClose={handleClosePreview}
      />
    </div>
  );
}