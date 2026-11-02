import React, { useState, useEffect } from 'react';
import {
  Network, Search, X, Loader2, ExternalLink,
  Database, RotateCcw, Trash2, Plus, CheckCircle2,
  Clock, Layers, ShieldCheck, AlertTriangle,
  Maximize2, Minimize2, Eye, Activity, Sparkles, PanelLeftClose, PanelLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiService } from '../../../services/api.service';
import { defaultConfig, API_ENDPOINTS } from '../../../services/api.config';

interface KGraph {
  id: string | number;
  session_name: string;
  graph_url: string;
  created_at: string;
  is_active?: boolean;
  in_use?: boolean;
  badge?: string;
  nodes_count?: number;
  edges_count?: number;
  description?: string;
  workspace_name?: string;
}

interface KGraphBackup {
  _key?: string;
  backup_name: string;
  nodes_collection?: string;
  edges_collection?: string;
  nodes_count?: number;
  edges_count?: number;
  created_at?: string;
  created_date?: string;
  workspace_arango_db?: string;
  description?: string;
}

export const AdminKGraphReview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'visualizer' | 'backups'>('visualizer');

  // Backups State
  const [backups, setBackups] = useState<KGraphBackup[]>([]);
  const [loadingBackups, setLoadingBackups] = useState<boolean>(true);
  const [creatingBackup, setCreatingBackup] = useState<boolean>(false);
  const [restoringBackupName, setRestoringBackupName] = useState<string | null>(null);
  const [deletingBackupName, setDeletingBackupName] = useState<string | null>(null);
  const [confirmRestoreName, setConfirmRestoreName] = useState<string | null>(null);
  const [workspaceDb, setWorkspaceDb] = useState<string>('');

  // Graph Visualizer State
  const [graphs, setGraphs] = useState<KGraph[]>([]);
  const [loadingGraphs, setLoadingGraphs] = useState<boolean>(false);
  const [errorGraphs, setErrorGraphs] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGraph, setSelectedGraph] = useState<KGraph | null>(null);
  const [activeGraphInfo, setActiveGraphInfo] = useState<KGraph | null>(null);
  const [activeDbName, setActiveDbName] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showSidebar, setShowSidebar] = useState<boolean>(true);

  useEffect(() => {
    fetchBackups();
    fetchGraphs();
  }, []);

  // Handle ESC key for fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const fetchBackups = async () => {
    setLoadingBackups(true);
    try {
      const response = await apiService.get(API_ENDPOINTS.KGRAPH.BACKUPS) as any;
      if (response && response.status === 'success') {
        setBackups(response.backups || []);
        if (response.workspace_arango_db) {
          setWorkspaceDb(response.workspace_arango_db);
        }
      }
    } catch (err: any) {
      console.error('Failed to load backups:', err);
      toast.error('Failed to load K-Graph backups');
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    try {
      const response = await apiService.post(API_ENDPOINTS.KGRAPH.BACKUP, {}) as any;
      if (response && response.status === 'success') {
        const bName = response.backup?.backup_name || 'backup';
        toast.success(`K-Graph backup '${bName}' created successfully!`);
        await fetchBackups();
        await fetchGraphs();
      } else {
        throw new Error(response.message || 'Failed to create backup');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create backup');
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async (backupName: string) => {
    setRestoringBackupName(backupName);
    try {
      const response = await apiService.post(API_ENDPOINTS.KGRAPH.RESTORE, { backup_name: backupName }) as any;
      if (response && response.status === 'success') {
        toast.success(`K-Graph restored from '${backupName}' successfully! (${response.restored_nodes} nodes, ${response.restored_edges} edges)`);
        setConfirmRestoreName(null);
        await fetchBackups();
        await fetchGraphs();
      } else {
        throw new Error(response.message || 'Failed to restore backup');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to restore backup');
    } finally {
      setRestoringBackupName(null);
    }
  };

  const handleDeleteBackup = async (backupName: string) => {
    if (!window.confirm(`Are you sure you want to delete backup '${backupName}'?`)) return;
    setDeletingBackupName(backupName);
    try {
      const response = await apiService.post(API_ENDPOINTS.KGRAPH.DELETE_BACKUP, { backup_name: backupName }) as any;
      if (response && response.status === 'success') {
        toast.success(`Backup '${backupName}' deleted successfully.`);
        await fetchBackups();
        await fetchGraphs();
      } else {
        throw new Error(response.message || 'Failed to delete backup');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete backup');
    } finally {
      setDeletingBackupName(null);
    }
  };

  const fetchGraphs = async () => {
    setLoadingGraphs(true);
    setErrorGraphs(null);
    try {
      const response = await apiService.get(API_ENDPOINTS.KGRAPH.GET_ALL) as any;
      if (response && response.status === 'success') {
        const fetchedGraphs: KGraph[] = response.graphs || [];
        setGraphs(fetchedGraphs);

        if (response.active_db) {
          setActiveDbName(response.active_db);
        }
        if (response.active_graph) {
          setActiveGraphInfo(response.active_graph);
          // If no graph selected, auto-select active graph
          setSelectedGraph((prev) => prev || response.active_graph);
        } else if (fetchedGraphs.length > 0) {
          setSelectedGraph((prev) => prev || fetchedGraphs[0]);
        }
      } else {
        throw new Error(response.message || 'Failed to fetch graphs');
      }
    } catch (err: any) {
      setErrorGraphs(err.message || 'Failed to load visual graphs');
    } finally {
      setLoadingGraphs(false);
    }
  };

  const filteredGraphs = graphs.filter(g =>
    g.session_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.badge?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Active Now';
    const s = String(dateString).trim();
    if (
      s === 'Live Graph' ||
      s.toLowerCase().includes('live') ||
      s.toLowerCase().includes('active') ||
      s.toLowerCase().includes('legacy') ||
      s.toLowerCase().includes('historical') ||
      s.toLowerCase().includes('snapshot')
    ) {
      return s;
    }
    try {
      const date = new Date(s);
      if (isNaN(date.getTime())) {
        return s;
      }
      return date.toLocaleString(undefined, {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return s;
    }
  };

  const getFullGraphUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = (defaultConfig.baseUrl || '').replace(/\/+$/, '');
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${base}${path}`;
  };

  const viewBackupInVisualizer = (backupName: string) => {
    // Look for matching graph in graphs list
    const found = graphs.find(g => g.session_name.includes(backupName) || g.id === backupName);
    if (found) {
      setSelectedGraph(found);
    } else {
      // Create ad-hoc graph entry
      const adhoc: KGraph = {
        id: backupName,
        session_name: `Backup: ${backupName}`,
        graph_url: `/api/kgraph/visualize/${backupName}?node_col=nodes_${backupName}&edge_col=edges_${backupName}`,
        created_at: new Date().toISOString(),
        badge: 'SNAPSHOT BACKUP'
      };
      setSelectedGraph(adhoc);
    }
    setActiveTab('visualizer');
  };

  return (
    <div className="h-full flex flex-col space-y-3 min-h-0">
      {/* Top Header & Tab Navigation */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-[var(--border)]">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Network className="w-5 h-5 text-[var(--accent)]" />
            Knowledge Graph Management
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Explore live and snapshot ArangoDB knowledge graphs, restore previous snapshots, or inspect connections.
            {(activeDbName || workspaceDb) && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-mono text-[11px]">
                DB: {activeDbName || workspaceDb}
              </span>
            )}
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 bg-[var(--surface)] p-1 rounded-xl border border-[var(--border)] shadow-xs">
          <button
            onClick={() => setActiveTab('visualizer')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'visualizer'
                ? 'bg-[var(--accent)] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            Visual Explorer ({graphs.length})
          </button>
          <button
            onClick={() => setActiveTab('backups')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'backups'
                ? 'bg-[var(--accent)] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Backups & Restore ({backups.length})
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Restore */}
      {confirmRestoreName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-500">
              <div className="p-2 rounded-xl bg-amber-500/10">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">Restore Knowledge Graph?</h3>
            </div>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Restoring from <strong className="text-[var(--text-primary)] font-mono">{confirmRestoreName}</strong> will overwrite the live knowledge graph in ArangoDB (<span className="font-mono text-emerald-600">{activeDbName || workspaceDb}</span>) with this snapshot version.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmRestoreName(null)}
                className="px-4 py-2 text-xs font-medium rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRestoreBackup(confirmRestoreName)}
                disabled={restoringBackupName === confirmRestoreName}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 flex items-center gap-2 cursor-pointer shadow-sm"
              >
                {restoringBackupName === confirmRestoreName ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Restoring...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    Confirm Restore
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN OVERLAY MODAL */}
      {isFullscreen && selectedGraph && (
        <div className="fixed inset-0 z-[9999] bg-[#0b1120] flex flex-col">
          {/* Fullscreen Header */}
          <div className="h-14 px-5 bg-[#0f172a] border-b border-slate-800 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Network className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">
                    {selectedGraph.session_name}
                  </span>
                  {selectedGraph.is_active || selectedGraph.in_use ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      CURRENTLY IN USE
                    </span>
                  ) : selectedGraph.badge === 'SNAPSHOT BACKUP' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/40">
                      SNAPSHOT BACKUP
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/40">
                      WORKSPACE GRAPH
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
                  {selectedGraph.nodes_count !== undefined && (
                    <span>
                      <strong className="text-slate-200">{selectedGraph.nodes_count}</strong> nodes &bull; <strong className="text-slate-200">{selectedGraph.edges_count}</strong> edges
                    </span>
                  )}
                  <span>DB: {activeDbName || workspaceDb}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={getFullGraphUrl(selectedGraph.graph_url)}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-700"
                title="Open in new window"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                New Tab
              </a>
              <button
                onClick={() => setIsFullscreen(false)}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Exit Fullscreen (or press Esc)"
              >
                <Minimize2 className="w-4 h-4" />
                Exit Fullscreen (Esc)
              </button>
            </div>
          </div>

          {/* Fullscreen Iframe */}
          <div className="flex-1 w-full h-full relative bg-[#0f172a]">
            {selectedGraph.graph_url ? (
              <iframe
                src={getFullGraphUrl(selectedGraph.graph_url)}
                className="w-full h-full border-0 absolute inset-0" style={{ width: "100%", height: "100%", minHeight: "600px", border: "none" }}
                title={`Full K-Graph for ${selectedGraph.session_name}`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                Graph URL not available
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 1: VISUAL EXPLORER */}
      {activeTab === 'visualizer' && (
        <div className="flex-1 flex flex-col min-h-0 space-y-3">
          {/* Top Active Graph Banner */}
          <div className="flex-shrink-0 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Network className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                    Currently Active in System
                  </span>
                  <span className="text-xs font-bold text-[var(--text-primary)]">
                    {activeGraphInfo?.session_name || 'Active System Graph (Live)'}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 flex items-center gap-2">
                  <span>Database: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{activeDbName || workspaceDb || 'jk_sales_workspace_arango_db'}</strong></span>
                  {activeGraphInfo?.nodes_count !== undefined && (
                    <span className="font-mono text-[var(--text-secondary)]">
                      &bull; {activeGraphInfo.nodes_count} nodes &bull; {activeGraphInfo.edges_count} edges
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activeGraphInfo && selectedGraph?.id !== activeGraphInfo.id && (
                <button
                  onClick={() => setSelectedGraph(activeGraphInfo)}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Active Graph
                </button>
              )}
            </div>
          </div>

          {/* Main Visualizer Columns */}
          <div className="flex-1 flex gap-4 w-full" style={{ minHeight: "750px", height: "calc(100vh - 180px)" }}>
            {/* Left Sidebar: List of Available Graphs */}
            {showSidebar && (
              <div className="w-60 lg:w-64 shrink-0 flex flex-col bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs" style={{ height: "100%" }}>
              <div className="p-3 border-b border-[var(--border)] bg-[var(--bg)]/50 flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                    Available Graphs
                  </h3>
                  <span className="text-[10px] text-[var(--text-secondary)]">
                    {filteredGraphs.length} knowledge graphs found
                  </span>
                </div>
                <div className="relative w-36">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-secondary)]" />
                  <input
                    type="text"
                    placeholder="Search graphs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-7 pr-2 py-1 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2.5 space-y-2 custom-scrollbar">
                {loadingGraphs ? (
                  <div className="flex flex-col items-center justify-center h-40 gap-2 text-[var(--text-secondary)]">
                    <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
                    <span className="text-xs">Loading graphs...</span>
                  </div>
                ) : errorGraphs ? (
                  <div className="p-3 text-xs text-red-500 bg-red-500/10 rounded-lg text-center">
                    {errorGraphs}
                  </div>
                ) : filteredGraphs.length === 0 ? (
                  <div className="text-center p-6 text-xs text-[var(--text-secondary)]">
                    No matching graphs found.
                  </div>
                ) : (
                  filteredGraphs.map(graph => {
                    const isSelected = selectedGraph?.id === graph.id;
                    const isLive = graph.is_active || graph.in_use;
                    const isBackup = graph.badge === 'SNAPSHOT BACKUP';

                    return (
                      <div
                        key={graph.id}
                        onClick={() => setSelectedGraph(graph)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[var(--accent)] bg-[var(--accent)]/10 shadow-xs ring-1 ring-[var(--accent)]/30'
                            : 'border-[var(--border)] hover:border-[var(--text-secondary)] hover:bg-[var(--bg)]/60'
                        }`}
                      >
                        {/* Status Badge Tag */}
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          {isLive ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1 uppercase tracking-wide">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              CURRENTLY IN USE
                            </span>
                          ) : isBackup ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 uppercase tracking-wide">
                              SNAPSHOT BACKUP
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 uppercase tracking-wide">
                              WORKSPACE GRAPH
                            </span>
                          )}

                          {graph.graph_url && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-500/10 text-[var(--text-secondary)] font-mono">
                              Interactive
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <div className="flex items-center gap-2 mb-1">
                          <Network className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`} />
                          <span className="text-xs font-bold text-[var(--text-primary)] truncate" title={graph.session_name}>
                            {graph.session_name}
                          </span>
                        </div>

                        {/* Description or details */}
                        {graph.description && (
                          <p className="text-[11px] text-[var(--text-secondary)] truncate mb-1 opacity-80">
                            {graph.description}
                          </p>
                        )}

                        {/* Stats Row */}
                        <div className="flex items-center justify-between pt-1 text-[10px] text-[var(--text-secondary)] border-t border-[var(--border)]/40 mt-1.5">
                          <div className="flex items-center gap-2 font-mono">
                            {graph.nodes_count !== undefined && (
                              <span className="text-[var(--text-primary)] font-semibold">
                                {graph.nodes_count} nodes &bull; {graph.edges_count} edges
                              </span>
                            )}
                          </div>
                          <span>{graph.created_at ? formatDate(graph.created_at) : ''}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              </div>
            )}

            {/* Right Main Area: Large Visual Graph Viewer */}
            <div className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl flex flex-col overflow-hidden relative shadow-xs" style={{ minHeight: "700px", height: "100%" }}>
              {selectedGraph ? (
                <>
                  {/* Viewer Header Bar */}
                  <div className="p-3 border-b border-[var(--border)] bg-[var(--bg)]/50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="p-1.5 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] shrink-0">
                        <Network className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-bold text-[var(--text-primary)] truncate" title={selectedGraph.session_name}>
                            {selectedGraph.session_name}
                          </h3>
                          {selectedGraph.is_active || selectedGraph.in_use ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              CURRENTLY IN USE
                            </span>
                          ) : selectedGraph.badge === 'SNAPSHOT BACKUP' ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/15 text-purple-600 border border-purple-500/30">
                              SNAPSHOT BACKUP
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/15 text-blue-600 border border-blue-500/30">
                              WORKSPACE GRAPH
                            </span>
                          )}
                        </div>
                        {selectedGraph.nodes_count !== undefined && (
                          <p className="text-[10px] text-[var(--text-secondary)] font-mono mt-0.5">
                            {selectedGraph.nodes_count} Nodes &bull; {selectedGraph.edges_count} Edges
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Toggle Sidebar Button */}
                      <button
                        onClick={() => setShowSidebar(!showSidebar)}
                        className="px-2.5 py-1.5 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                        title={showSidebar ? "Hide graphs sidebar for wider view" : "Show graphs sidebar"}
                      >
                        {showSidebar ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeft className="w-3.5 h-3.5 text-[var(--accent)]" />}
                        <span className="hidden md:inline">{showSidebar ? "Expand Width (Hide List)" : "Show List"}</span>
                      </button>

                      {/* Fullscreen Button */}
                      <button
                        onClick={() => setIsFullscreen(true)}
                        className="px-2.5 py-1.5 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                        title="Expand to Fullscreen"
                      >
                        <Maximize2 className="w-3.5 h-3.5 text-[var(--accent)]" />
                        <span className="hidden sm:inline">Fullscreen</span>
                      </button>

                      {/* Open New Tab */}
                      <a
                        href={getFullGraphUrl(selectedGraph.graph_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                        title="Open in new window"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>

                      {/* Close */}
                      <button
                        onClick={() => setSelectedGraph(null)}
                        className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-red-500 transition-colors cursor-pointer"
                        title="Deselect"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Viewer Body (Iframe) */}
                  <div className="flex-1 bg-[#0f172a] relative w-full" style={{ minHeight: "600px", height: "100%" }}>
                    {selectedGraph.graph_url ? (
                      <iframe
                        src={getFullGraphUrl(selectedGraph.graph_url)}
                        className="w-full h-full border-0 absolute inset-0" style={{ width: "100%", height: "100%", minHeight: "600px", border: "none" }}
                        title={`K-Graph for ${selectedGraph.session_name}`}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center flex-col text-[var(--text-secondary)] bg-[var(--bg)]">
                        <Network className="w-12 h-12 mb-3 opacity-20" />
                        <p className="text-xs">Graph visualization URL is not available</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-secondary)] bg-[var(--bg)]/30 space-y-3">
                  <div className="p-4 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)]">
                    <Network className="w-10 h-10 opacity-70" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-[var(--text-primary)]">No Knowledge Graph Selected</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">Select any graph from the list on the left to preview its visual network.</p>
                  </div>
                  {activeGraphInfo && (
                    <button
                      onClick={() => setSelectedGraph(activeGraphInfo)}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Open Active Knowledge Graph
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BACKUPS & RESTORE */}
      {activeTab === 'backups' && (
        <div className="flex-1 flex flex-col min-h-0 space-y-4">
          {/* Action Row */}
          <div className="flex items-center justify-between bg-[var(--surface)] border border-[var(--border)] p-4 rounded-xl shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Snapshot Backups
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Backups store nodes and edges directly into ArangoDB with format: <span className="font-mono text-[var(--text-primary)] font-bold">kg-DDMMYY-OK</span>
              </p>
            </div>
            <button
              onClick={handleCreateBackup}
              disabled={creatingBackup}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 transition-all flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {creatingBackup ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Backup...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Backup
                </>
              )}
            </button>
          </div>

          {/* Backups Table / List */}
          <div className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden flex flex-col shadow-xs">
            <div className="grid grid-cols-[1.5fr_1fr_1fr_1.5fr_auto] gap-4 p-3 border-b border-[var(--border)] bg-[var(--bg)]/50 text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              <div>Backup Name</div>
              <div>Nodes</div>
              <div>Edges</div>
              <div>Created Date</div>
              <div className="text-right pr-2">Actions</div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[var(--border)]/50 custom-scrollbar">
              {loadingBackups ? (
                <div className="flex flex-col items-center justify-center h-48 gap-2 text-[var(--text-secondary)]">
                  <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
                  <span className="text-xs">Loading backups...</span>
                </div>
              ) : backups.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-[var(--text-secondary)] space-y-2">
                  <Database className="w-10 h-10 opacity-30" />
                  <p className="text-sm font-medium">No backups found.</p>
                  <p className="text-xs opacity-75">Click "Create Backup" above to create your first snapshot.</p>
                </div>
              ) : (
                backups.map((bkp, idx) => (
                  <div
                    key={bkp._key || bkp.backup_name || idx}
                    className="grid grid-cols-[1.5fr_1fr_1fr_1.5fr_auto] gap-4 p-3.5 items-center hover:bg-[var(--bg)]/30 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="p-1.5 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] shrink-0">
                        <Database className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <span className="font-mono text-xs font-bold text-[var(--text-primary)]">
                          {bkp.backup_name}
                        </span>
                        {bkp.description && (
                          <p className="text-[11px] text-[var(--text-secondary)] truncate opacity-75">
                            {bkp.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-[var(--text-primary)]">
                      <Layers className="w-3.5 h-3.5 text-[var(--text-secondary)] opacity-70" />
                      <span className="font-semibold">{bkp.nodes_count ?? 0}</span>
                      <span className="text-[var(--text-secondary)] text-[10px]">nodes</span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-[var(--text-primary)]">
                      <Network className="w-3.5 h-3.5 text-[var(--text-secondary)] opacity-70" />
                      <span className="font-semibold">{bkp.edges_count ?? 0}</span>
                      <span className="text-[var(--text-secondary)] text-[10px]">edges</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                      <Clock className="w-3.5 h-3.5 opacity-60" />
                      <span>{bkp.created_date || (bkp.created_at ? formatDate(bkp.created_at) : 'N/A')}</span>
                    </div>

                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => viewBackupInVisualizer(bkp.backup_name)}
                        className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all flex items-center gap-1 cursor-pointer"
                        title="View this snapshot in visual graph explorer"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </button>

                      <button
                        onClick={() => setConfirmRestoreName(bkp.backup_name)}
                        disabled={restoringBackupName === bkp.backup_name}
                        className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all flex items-center gap-1 cursor-pointer"
                        title="Restore live graph from this backup"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Restore
                      </button>

                      <button
                        onClick={() => handleDeleteBackup(bkp.backup_name)}
                        disabled={deletingBackupName === bkp.backup_name}
                        className="p-1.5 text-xs font-semibold rounded-lg hover:bg-rose-500/10 text-[var(--text-secondary)] hover:text-rose-500 transition-all cursor-pointer"
                        title="Delete this backup"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
