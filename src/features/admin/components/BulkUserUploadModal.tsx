import React, { useState, useRef } from "react";
import { Download, Upload, AlertCircle, CheckCircle2, X, FileSpreadsheet, Loader2, Key } from "lucide-react";
import toast from "react-hot-toast";

interface ValidationError {
  row: number;
  field: string;
  value: string;
  reason: string;
}

interface CreatedUser {
  id: number;
  name: string;
  email: string;
  designation: string;
  rank_id: number;
  zone_code: string;
  region_code: string;
  territory_code: string;
  temp_password?: string;
}

interface BulkUserUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BulkUserUploadModal: React.FC<BulkUserUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [createdUsers, setCreatedUsers] = useState<CreatedUser[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch("/api/admin/download-user-template");
      if (!response.ok) throw new Error("Failed to download template");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "JK_User_Import_Template.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Excel template downloaded successfully");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Could not download template");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setValidationErrors([]);
      setCreatedUsers([]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const name = file.name.toLowerCase();
      if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv")) {
        setSelectedFile(file);
        setValidationErrors([]);
        setCreatedUsers([]);
      } else {
        toast.error("Please drop an .xlsx, .xls, or .csv file");
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select an Excel file first");
      return;
    }

    setIsUploading(true);
    setValidationErrors([]);
    setCreatedUsers([]);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("/api/admin/import-users-excel", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && (data.status === "success" || data.status === "partial_success")) {
        if (data.status === "partial_success") {
          toast.success(data.message || `Imported ${data.total_imported} users (${data.failed_count} skipped).`);
        } else {
          toast.success(data.message || "Users imported successfully!");
        }
        setCreatedUsers(data.users || []);
        if (data.errors && Array.isArray(data.errors)) {
          setValidationErrors(data.errors);
        }
        onSuccess();
      } else {
        if (data.errors && Array.isArray(data.errors)) {
          setValidationErrors(data.errors);
          toast.error(`Validation failed with ${data.errors.length} error(s).`);
        } else {
          toast.error(data.message || "Upload failed");
        }
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.message || "Failed to process import file.");
    } finally {
      setIsUploading(false);
    }
  };

  const resetAll = () => {
    setSelectedFile(null);
    setValidationErrors([]);
    setCreatedUsers([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--bg)]/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Bulk User Import (Excel)
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Onboard users & map Zone / Region hierarchy access automatically
              </p>
            </div>
          </div>
          <button
            onClick={resetAll}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Download Sample Banner */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/60 text-slate-700">
            <div className="text-xs">
              <span className="font-semibold text-indigo-900 block">Need the standard template?</span>
              <span className="text-slate-500 text-[11px]">
                Pre-formatted 7 columns with SAP Zone/Region codes and Rank guide
              </span>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              disabled={isDownloading}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              Download Template
            </button>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
              isDragOver
                ? "border-indigo-500 bg-indigo-50/30 scale-[0.99]"
                : selectedFile
                ? "border-emerald-400 bg-emerald-50/20"
                : "border-[var(--border)] hover:border-indigo-400 bg-[var(--surface)] hover:bg-[var(--surface-hover)]"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            <div className="p-3 rounded-full bg-indigo-50 text-indigo-600">
              <Upload className="w-6 h-6" />
            </div>
            <div className="text-center">
              {selectedFile ? (
                <div>
                  <span className="text-sm font-semibold text-emerald-700 block">
                    {selectedFile.name}
                  </span>
                  <span className="text-xs text-slate-400">
                    {(selectedFile.size / 1024).toFixed(1)} KB — Click to change file
                  </span>
                </div>
              ) : (
                <div>
                  <span className="text-sm font-semibold text-[var(--text-primary)] block">
                    Choose Excel file or drag & drop here
                  </span>
                  <span className="text-xs text-[var(--text-secondary)]">
                    Supports .xlsx, .xls, and .csv
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Validation Errors Box */}
          {validationErrors.length > 0 && (
            <div className="border border-red-200 bg-red-50/70 rounded-xl p-4 space-y-2.5 animate-in fade-in">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bold">
                  {createdUsers.length > 0
                    ? `Skipped Rows (${validationErrors.length} Errors Found) — Valid users were created successfully. Please fix and re-upload only the skipped rows below:`
                    : `Validation Failed (${validationErrors.length} Errors Found) — No users were created:`}
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-red-200 bg-white">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-red-100/60 text-red-900 text-[11px] font-semibold uppercase sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Row</th>
                      <th className="py-2 px-3">Field</th>
                      <th className="py-2 px-3">Value</th>
                      <th className="py-2 px-3">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-100 font-mono text-[11px]">
                    {validationErrors.map((err, i) => (
                      <tr key={i} className="hover:bg-red-50/50">
                        <td className="py-2 px-3 font-bold text-red-700">{err.row}</td>
                        <td className="py-2 px-3 text-slate-900">{err.field}</td>
                        <td className="py-2 px-3 text-slate-600">{err.value || "—"}</td>
                        <td className="py-2 px-3 font-sans text-red-600 font-medium">{err.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Created Users Success Summary */}
          {createdUsers.length > 0 && (
            <div className="border border-emerald-200 bg-emerald-50/70 rounded-xl p-4 space-y-2.5 animate-in fade-in">
              <div className="flex items-center gap-2 text-emerald-800">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bold">
                  Successfully Imported {createdUsers.length} Users! Credentials dispatched via email.
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-emerald-200 bg-white">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-emerald-100/60 text-emerald-900 text-[11px] font-semibold uppercase sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Name</th>
                      <th className="py-2 px-3">Email</th>
                      <th className="py-2 px-3">Designation</th>
                      <th className="py-2 px-3">Scope (Zone/Reg)</th>
                      <th className="py-2 px-3">Temp Password</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-100 text-[11px]">
                    {createdUsers.map((u, i) => (
                      <tr key={i} className="hover:bg-emerald-50/50">
                        <td className="py-2 px-3 font-medium text-slate-900">{u.name}</td>
                        <td className="py-2 px-3 text-slate-600">{u.email}</td>
                        <td className="py-2 px-3 text-slate-600">{u.designation}</td>
                        <td className="py-2 px-3 font-mono font-semibold text-indigo-700">
                          {u.zone_code} / {u.region_code}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-800">
                          {u.temp_password || "••••••••"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)] bg-[var(--bg)]/40">
          <button
            type="button"
            onClick={resetAll}
            className="px-4 py-2 text-xs font-medium rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          >
            {createdUsers.length > 0 ? "Done" : "Cancel"}
          </button>
          {createdUsers.length === 0 && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Validating & Importing...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  Upload & Import Users
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
