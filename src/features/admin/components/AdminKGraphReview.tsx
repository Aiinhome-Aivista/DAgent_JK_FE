import React, { useState, useEffect } from 'react';
import { Network, Search, X, Loader2, ExternalLink } from 'lucide-react';
import { apiService } from '../../../services/api.service';
import { API_ENDPOINTS } from '../../../services/api.config';

interface KGraph {
  id: number;
  session_name: string;
  graph_url: string;
  created_at: string;
}

export const AdminKGraphReview: React.FC = () => {
  const [graphs, setGraphs] = useState<KGraph[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedGraph, setSelectedGraph] = useState<KGraph | null>(null);

  useEffect(() => {
    fetchGraphs();
  }, []);

  const fetchGraphs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.get(API_ENDPOINTS.KGRAPH.GET_ALL) as any;
      if (response && response.status === 'success') {
        setGraphs(response.graphs);
      } else {
        throw new Error(response.message || 'Failed to fetch graphs');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load K-Graphs');
    } finally {
      setLoading(false);
    }
  };

  const filteredGraphs = graphs.filter(g => 
    g.session_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString(undefined, {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Unknown Date';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header and Search */}
      <div className="flex-shrink-0 flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Network className="w-5 h-5 text-[var(--accent)]" />
            K-Graph Review
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">Review generated Knowledge Graphs across sessions</p>
        </div>
        
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Search by session name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex gap-4">
        {/* List of Graphs */}
        <div className="w-1/3 flex flex-col bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="p-3 border-b border-[var(--border)] bg-[var(--bg)]">
            <h3 className="text-sm font-medium text-[var(--text-primary)]">Available Graphs</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-32 gap-2 text-[var(--text-secondary)]">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--accent)]" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : error ? (
              <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-lg text-center">
                {error}
              </div>
            ) : filteredGraphs.length === 0 ? (
              <div className="text-center p-4 text-sm text-[var(--text-secondary)]">
                No graphs found
              </div>
            ) : (
              filteredGraphs.map(graph => (
                <div 
                  key={graph.id}
                  onClick={() => setSelectedGraph(graph)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedGraph?.id === graph.id 
                      ? 'border-[var(--accent)] bg-[var(--accent)]/5' 
                      : 'border-[var(--border)] hover:border-[var(--text-secondary)] hover:bg-[var(--bg)]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Network className={`w-4 h-4 ${selectedGraph?.id === graph.id ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`} />
                    <span className="text-sm font-medium text-[var(--text-primary)] truncate" title={graph.session_name}>
                      {graph.session_name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-[var(--text-secondary)]">
                      {graph.created_at ? formatDate(graph.created_at) : 'Unknown Date'}
                    </span>
                    {graph.graph_url && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 font-medium">Ready</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Graph Viewer */}
        <div className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl flex flex-col overflow-hidden relative">
          {selectedGraph ? (
            <>
              <div className="p-3 border-b border-[var(--border)] bg-[var(--bg)] flex items-center justify-between">
                <h3 className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {selectedGraph.session_name}
                </h3>
                <div className="flex items-center gap-2">
                  <a 
                    href={selectedGraph.graph_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-1.5 rounded-md hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button 
                    onClick={() => setSelectedGraph(null)}
                    className="p-1.5 rounded-md hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 bg-white relative">
                {selectedGraph.graph_url ? (
                  <iframe 
                    src={selectedGraph.graph_url} 
                    className="w-full h-full border-0 absolute inset-0" 
                    title={`K-Graph for ${selectedGraph.session_name}`}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center flex-col text-[var(--text-secondary)] bg-[var(--bg)]">
                    <Network className="w-12 h-12 mb-3 opacity-20" />
                    <p>Graph URL not available</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-secondary)] bg-[var(--bg)]">
              <Network className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-sm font-medium">Select a session to view its K-Graph</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
