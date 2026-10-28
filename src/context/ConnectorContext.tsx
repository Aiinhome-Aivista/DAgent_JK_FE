import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Connector } from '../features/connectors/types';
import { uploadCsvFile } from '../services/fileUpload/chunkUploadService';

interface ConnectorContextType {
  selectedConnector: Connector | null;
  setSelectedConnector: (connector: Connector | null) => void;
  connectorResults: any | null;
  setConnectorResults: (results: any | null) => void;
  isImporting: boolean;
  setIsImporting: (isImporting: boolean) => void;
  searchTopic: string;
  setSearchTopic: (topic: string) => void;
  sessionSources: any | null;
  setSessionSources: (sources: any | null) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  importError: string | null;
  setImportError: (error: string | null) => void;
  resetConnectorState: () => void;
  clearAnalysisResults: () => void;
  
  // Upload States & Actions
  uploadedFiles: File[];
  setUploadedFiles: (files: File[] | ((prev: File[]) => File[])) => void;
  isUploading: boolean;
  setIsUploading: (isUploading: boolean) => void;
  uploadProgress: Record<string, number>;
  setUploadProgress: (progress: Record<string, number>) => void;
  handleFileUploadConnect: (userId: number) => Promise<void>;
}

const ConnectorContext = createContext<ConnectorContextType | undefined>(undefined);

export const ConnectorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedConnector, setSelectedConnectorState] = useState<Connector | null>(() => {
    try {
      const sessionId = localStorage.getItem('DAgent_session_id');
      if (sessionId) {
        const stored = localStorage.getItem(`selected_connector_${sessionId}`);
        return (stored && stored !== 'undefined') ? JSON.parse(stored) : null;
      }
    } catch (e) {
      console.error('Failed to parse stored selected connector', e);
    }
    return null;
  });
  const [connectorResults, setConnectorResultsState] = useState<any | null>(() => {
    try {
      const sessionId = localStorage.getItem('DAgent_session_id');
      if (sessionId) {
        const stored = localStorage.getItem(`connector_results_${sessionId}`);
        return (stored && stored !== 'undefined') ? JSON.parse(stored) : null;
      }
    } catch (e) {
      console.error('Failed to parse stored connector results', e);
    }
    return null;
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [searchTopic, setSearchTopic] = useState('');
  
  // Persistent Upload States
  const [uploadedFiles, setUploadedFilesState] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgressState] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem('uploadProgress');
      return (stored && stored !== 'undefined') ? JSON.parse(stored) : {};
    } catch (e) {
      console.error('Failed to parse stored upload progress', e);
      return {};
    }
  });

  // Worker Refs for background queuing
  const filesRef = useRef<File[]>([]);
  const progressRef = useRef<Record<string, number>>({});
  const isWorkerRunning = useRef(false);

  // Sync refs with state
  useEffect(() => {
    filesRef.current = uploadedFiles;
  }, [uploadedFiles]);

  useEffect(() => {
    progressRef.current = uploadProgress;
  }, [uploadProgress]);

  const [sessionSources, setSessionSourcesState] = useState<any | null>(() => {
    try {
      const sessionId = localStorage.getItem('DAgent_session_id');
      if (sessionId) {
        const stored = localStorage.getItem(`session_sources_${sessionId}`);
        return stored ? JSON.parse(stored) : null;
      }
    } catch (e) {
      console.error('Failed to parse stored session sources', e);
    }
    return null;
  });
  const setSelectedConnector = (connector: Connector | null) => {
    setSelectedConnectorState(connector);
    try {
      const sessionId = localStorage.getItem('DAgent_session_id');
      if (sessionId) {
        if (connector) {
          localStorage.setItem(`selected_connector_${sessionId}`, JSON.stringify(connector));
        } else {
          localStorage.removeItem(`selected_connector_${sessionId}`);
        }
      }
    } catch (e) {
      console.error('Failed to store selected connector', e);
    }
  };

  const setConnectorResults = (results: any | null) => {
    setConnectorResultsState(results);
    try {
      const sessionId = localStorage.getItem('DAgent_session_id');
      if (sessionId) {
        if (results) {
          localStorage.setItem(`connector_results_${sessionId}`, JSON.stringify(results));
        } else {
          localStorage.removeItem(`connector_results_${sessionId}`);
        }
      }
    } catch (e) {
      console.error('Failed to store connector results', e);
    }
  };

  const setSessionSources = (sources: any | null) => {
    setSessionSourcesState(sources);
    try {
      const sessionId = localStorage.getItem('DAgent_session_id');
      if (sessionId && sources) {
        localStorage.setItem(`session_sources_${sessionId}`, JSON.stringify(sources));
      }
    } catch (e) {
      console.error('Failed to store session sources', e);
    }
  };

  const clearAnalysisResults = () => {
    try {
      const sessionId = localStorage.getItem('DAgent_session_id');
      if (sessionId) {
        localStorage.removeItem(`connector_results_${sessionId}`);
      }
    } catch (e) {
      console.error('Failed to clear analysis results from storage', e);
    }
    setConnectorResultsState(null);
  };

  const resetConnectorState = () => {
    try {
      const sessionId = localStorage.getItem('DAgent_session_id');
      if (sessionId) {
        localStorage.removeItem(`connector_results_${sessionId}`);
        localStorage.removeItem(`session_sources_${sessionId}`);
      }
    } catch (e) {
      console.error('Failed to clear storage on reset', e);
    }

    setSelectedConnector(null);
    setConnectorResultsState(null);
    setIsImporting(false);
    setIsAnalyzing(false);
    setImportError(null);
    setSearchTopic('');
    setSessionSourcesState(null);
    
    // Clear upload state
    setUploadedFilesState([]);
    setIsUploading(false);
    setUploadProgressState({});
    localStorage.removeItem('uploadProgress');
    localStorage.removeItem('uploadedFilesMetadata');
  };

  // Load file metadata from localStorage on mount (for display only after refresh)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('uploadedFilesMetadata');
      if (stored && uploadedFiles.length === 0) {
        // We can't restore the actual File object, but we could show placeholders if needed.
        // For now, we just sync the progress.
      }
    } catch (e) {}
  }, []);

  const handleFileUploadConnect = async (userId: number) => {
    const sessionId = localStorage.getItem("DAgent_session_id") || "";
    if (!userId || !sessionId) return;

    if (isWorkerRunning.current) return;
    isWorkerRunning.current = true;
    setIsUploading(true);

    try {
      let currentIndex = 0;
      
      // Keep processing while there are pending files in the queue
      while (currentIndex < filesRef.current.length) {
        const file = filesRef.current[currentIndex];
        const status = progressRef.current[file.name] || 0;

        if (status < 100) {
          try {
            await uploadCsvFile(
              file,
              userId,
              sessionId,
              (progress) => {
                setUploadProgress(prev => ({
                  ...prev,
                  [file.name]: progress
                }));
              }
            );
          } catch (err) {
            console.error(`Failed to upload file ${file.name}:`, err);
            // We keep going to the next file
          }
        }
        
        currentIndex++;
        // The loop will automatically pick up any files added to filesRef.current
        // while the previous file was uploading.
      }
    } finally {
      setIsUploading(false);
      isWorkerRunning.current = false;
    }
  };

  const setUploadedFiles = (files: File[] | ((prev: File[]) => File[])) => {
    if (typeof files === 'function') {
      setUploadedFilesState(prev => {
        const next = files(prev);
        try {
          const metadata = next.map(f => ({ name: f.name, size: f.size }));
          localStorage.setItem('uploadedFilesMetadata', JSON.stringify(metadata));
        } catch (e) {}
        return next;
      });
    } else {
      setUploadedFilesState(files);
      try {
        const metadata = files.map(f => ({ name: f.name, size: f.size }));
        localStorage.setItem('uploadedFilesMetadata', JSON.stringify(metadata));
      } catch (e) {}
    }
  };

  const setUploadProgress = (progress: Record<string, number> | ((prev: Record<string, number>) => Record<string, number>)) => {
    if (typeof progress === 'function') {
      setUploadProgressState(prev => {
        const next = progress(prev);
        localStorage.setItem("uploadProgress", JSON.stringify(next));
        return next;
      });
    } else {
      setUploadProgressState(progress);
      localStorage.setItem("uploadProgress", JSON.stringify(progress));
    }
  };

  return (
    <ConnectorContext.Provider value={{
      selectedConnector,
      setSelectedConnector,
      connectorResults,
      setConnectorResults,
      isImporting,
      setIsImporting,
      searchTopic,
      setSearchTopic,
      sessionSources,
      setSessionSources,
      isAnalyzing,
      setIsAnalyzing,
      importError,
      setImportError,
      resetConnectorState,
      clearAnalysisResults,
      uploadedFiles,
      setUploadedFiles,
      isUploading,
      setIsUploading,
      uploadProgress,
      setUploadProgress,
      handleFileUploadConnect
    }}>
      {children}
    </ConnectorContext.Provider>
  );
};

export const useConnectorContext = () => {
  const context = useContext(ConnectorContext);
  if (context === undefined) {
    throw new Error('useConnectorContext must be used within a ConnectorProvider');
  }
  return context;
};
