import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { defaultConfig, API_ENDPOINTS } from '../../../services/api.config';
import { Loader2, Database, CheckSquare, Square } from 'lucide-react';

interface StagedKnowledge {
  id: number;
  chat_id: string;
  question: string;
  answer: string;
  kg_status?: string;
  kg_reason?: string | null;
  created_at?: string;
  kg_file_path?: string;
}

export const AdminPendingKnowledge: React.FC = () => {
  const [stagedFiles, setStagedFiles] = useState<StagedKnowledge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStagedKnowledge();
  }, []);

  const fetchStagedKnowledge = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${defaultConfig.baseUrl}${API_ENDPOINTS.ADMIN.GET_STAGED_KNOWLEDGE}`);
      if (!res.ok) throw new Error('Failed to fetch staged knowledge');
      const json = await res.json();
      if (json.status === 'success' && Array.isArray(json.data)) {
        setStagedFiles(json.data);
      } else {
        setStagedFiles([]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load knowledge files');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status?: string, reason?: string | null) => {
    if (status === 'indexed') {
      return (
        <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
          Done
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span 
          className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20 cursor-help"
          title={reason || 'No reason provided'}
        >
          Rejected
        </span>
      );
    }
    // Default or 'staged'
    return (
      <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
        Pending
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  if (stagedFiles.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-[var(--border)] rounded-xl opacity-60">
        <p className="text-sm text-[var(--text-secondary)]">No knowledge graph history found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Knowledge Graph History</h2>
          <p className="text-sm text-[var(--text-secondary)]">Review all previously pushed files and their current indexing status.</p>
        </div>
      </div>
      
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 p-4 border-b border-[var(--border)] bg-[var(--bg)]/50 items-center">
          <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Content</div>
          <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider text-center w-24">Status</div>
          <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider text-right w-24">Date</div>
        </div>

        <div className="divide-y divide-[var(--border)]/50">
          {stagedFiles.map((file, idx) => (
            <div 
              key={file.id || file.chat_id || idx} 
              className="grid grid-cols-[1fr_auto_auto] gap-4 p-4 items-start transition-colors hover:bg-[var(--bg)]/30"
            >
              
              <div className="space-y-2 overflow-hidden">
                <div className="text-sm font-medium text-[var(--text-primary)] truncate" title={file.question}>
                  <span className="opacity-50 mr-2">Q:</span>{file.question}
                </div>
                {file.answer && (
                  <div className="text-[13px] text-[var(--text-secondary)] line-clamp-2" title={file.answer}>
                    <span className="opacity-50 mr-2">A:</span>{file.answer}
                  </div>
                )}
                {file.kg_file_path && (
                  <div className="text-xs font-mono text-[var(--text-secondary)] opacity-60">
                    File: {file.kg_file_path.split('/').pop() || file.kg_file_path.split('\\').pop()}
                  </div>
                )}
              </div>

              <div className="flex justify-center w-24 mt-0.5">
                {getStatusBadge(file.kg_status, file.kg_reason)}
              </div>

              <div className="text-xs text-[var(--text-secondary)] whitespace-nowrap text-right w-24 mt-1">
                {file.created_at ? new Date(file.created_at).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
