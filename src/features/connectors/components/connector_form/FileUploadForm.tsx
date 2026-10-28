import { useRef } from 'react';
import { motion } from 'motion/react';
import { FileSpreadsheet, FileCode2, Upload, X, Loader2, FileText } from 'lucide-react';
import { Button } from '@/src/ui-kit';

interface FileUploadFormProps {
  isCsvUpload: boolean;
  isSqlUpload?: boolean;
  isDocUpload?: boolean;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  handleFileDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  handleFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  acceptedFileTypes: string;
  uploadedFiles: File[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  removeFile: (idx: number) => void;
  handleFileUploadConnect: () => void;
  uploadProgress: Record<string, number>;
  
  isUploading: boolean;
  onBack: () => void;
}

export const FileUploadForm = ({
  isCsvUpload,
  isSqlUpload,
  isDocUpload,
  isDragging,
  setIsDragging,
  handleFileDrop,
  handleFileInput,
  acceptedFileTypes,
  uploadedFiles,
  setUploadedFiles,
  removeFile,
  handleFileUploadConnect,
  uploadProgress,
  isUploading,
  onBack
}: FileUploadFormProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      {/* Label */}
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
        Upload Files
      </p>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleFileDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-3 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all
          ${isDragging
            ? 'border-[var(--accent)] bg-[var(--accent)]/20 scale-[1.01]'
            : 'border-[var(--accent)]/60 bg-[var(--accent)]/5'
          }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedFileTypes}
          className="hidden"
          onChange={handleFileInput}
        />
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-colors bg-[var(--accent)]/20 text-[var(--accent)]">
          {isDocUpload ? <FileText className="w-7 h-7" /> : isCsvUpload ? <FileSpreadsheet className="w-7 h-7" /> : <FileCode2 className="w-7 h-7" />}
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {isDragging ? 'Drop files here' : 'Drag & drop files here'}
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            or <span className="text-[var(--accent)] font-medium">browse</span> to choose files
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-bold">
          <Upload className="w-3 h-3" />
          Upload Multiple Files
        </div>
      </div>

      {/* File list */}
      {uploadedFiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">
              {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} selected
            </p>
            {!isUploading && (
              <button
                onClick={() => setUploadedFiles([])}
                className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
          {uploadedFiles.map((file, idx) => {
            const progress = uploadProgress[file.name] || 0;
            const isComplete = progress === 100;
            
            return (
              <div
                key={`${file.name}-${idx}`}
                className="flex flex-col gap-2 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-hover)]/40 group relative overflow-hidden"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
                    {isCsvUpload ? <FileSpreadsheet className="w-4 h-4" /> : <FileCode2 className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-[10px] text-[var(--text-secondary)]">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • {progress}% {progress > 0 && progress < 100 ? '(Uploading...)' : progress === 0 ? '(Queued)' : '(Completed)'}
                    </p>
                  </div>
                  {progress === 0 && (
                    <button
                      onClick={() => removeFile(idx)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 hover:text-red-500 text-[var(--text-secondary)] transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {isComplete && (
                    <div className="text-emerald-500">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    </div>
                  )}
                </div>
                {/* Individual progress bar */}
                <div className="h-1 w-full bg-[var(--border)]/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-[var(--accent)]"
                  />
                </div>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Overall Progress */}
      {isUploading && (
        <div className="space-y-2">
          {(() => {
            const values = Object.values(uploadProgress);
            const overallProgress = values.length > 0 
              ? Math.round(values.reduce((a, b) => a + b, 0) / uploadedFiles.length)
              : 0;
            return (
              <>
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                  <span>Overall Progress</span>
                  <span>{overallProgress}%</span>
                </div>
                <div className="h-2 w-full bg-[var(--border)]/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${overallProgress}%` }}
                    className="h-full bg-[var(--accent)]"
                  />
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Connect button */}
      <div className="pt-4 flex justify-end gap-4">
        <Button variant="outline" onClick={onBack} disabled={isUploading}>Cancel</Button>
        <Button
          className="px-8"
          onClick={handleFileUploadConnect}
          disabled={uploadedFiles.length === 0 || isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload & Connect
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
