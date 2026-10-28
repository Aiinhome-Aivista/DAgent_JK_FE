import { useEffect, useState } from 'react';
import { Connector } from '../../connectors/types';
import { connectorService } from '@/src/services/connector.service';
import { Button, Badge } from '@/src/ui-kit';
import { Loader2, AlertCircle } from 'lucide-react';

interface IngestDataViewProps {
  activeConnector: Connector | null;
  isImporting?: boolean;
  connectorResults?: any;
  sessionSources?: any;
  onGoToDataSource: () => void;
  onContinue?: () => void;
  isAnalyzing?: boolean;
  importError?: string | null;
}

export const IngestDataView = ({
  activeConnector,
  isImporting,
  connectorResults,
  sessionSources,
  onGoToDataSource,
  onContinue,
  isAnalyzing,
  importError
}: IngestDataViewProps) => {
  // Handle potential nested results array - be very defensive
  const results = connectorResults?.results || (Array.isArray(connectorResults) ? connectorResults : []);

  // Handle potential nested data property and inconsistent keys for DB views
  const data = connectorResults?.data || connectorResults || {};
  let summary = data?.summary;
  let rawTables = data?.tables || [];
  // We will compute tables and dataSize after fallback

  const databases = sessionSources?.external_databases?.databases ||
    sessionSources?.databases ||
    (Array.isArray(sessionSources?.external_databases) ? sessionSources?.external_databases : []);
  const topics = sessionSources?.web_topics?.topics ||
    sessionSources?.topics ||
    (Array.isArray(sessionSources?.web_topics) ? sessionSources?.web_topics : []);

  const isSummaryEmpty = !summary || Object.keys(summary).length === 0;
  const isTablesEmpty = rawTables.length === 0;

  // Fallback to history summary if live summary is missing/empty or tables are empty
  if ((isSummaryEmpty || isTablesEmpty) && databases.length > 0) {
    let t_rows = 0;
    let t_cols = 0;
    let t_size = 0;
    let allTables: string[] = [];
    databases.forEach((db: any) => {
      if (db.summary) {
        t_rows += db.summary.total_rows || 0;
        t_cols += db.summary.total_columns || 0;
        t_size += db.summary.data_size_mb || 0;
      }
      if (db.tables) {
        allTables = [...allTables, ...db.tables];
      }
    });
    if (t_rows > 0 || t_cols > 0 || allTables.length > 0) {
      summary = {
        total_rows: t_rows,
        total_columns: t_cols,
        data_size_mb: Number(t_size.toFixed(2))
      };

      // Deduplicate properly whether they are strings or objects
      const uniqueTables = new Map();
      allTables.forEach((t: any) => {
        const tableName = typeof t === 'string' ? t : t.table;
        if (!uniqueTables.has(tableName)) {
          uniqueTables.set(tableName, {
            table: tableName,
            rows: (typeof t === 'object' && t.rows !== undefined) ? t.rows : 'N/A',
            columns: (typeof t === 'object' && t.columns !== undefined) ? t.columns : 'N/A',
            role: typeof t === 'object' ? t.role : undefined,
            primary_keys: typeof t === 'object' ? t.primary_keys : undefined,
            foreign_keys: typeof t === 'object' ? t.foreign_keys : undefined
          });
        }
      });
      rawTables = Array.from(uniqueTables.values());
    }
  }

  // Deduplicate tables by name (keeping the latest occurrence)
  const tables = Array.from(new Map(rawTables.map((t: any) => [t.table, t])).values()) as any[];
  const dataSize = summary?.data_size_mb || summary?.['data size mb'] || 0;

  const isHana = !!(
    activeConnector?.name?.toLowerCase().includes('hana') ||
    activeConnector?.name?.toLowerCase().includes('sap')
  );

  // ── SAP HANA: poll the metadata-only KGraph build status ──────────────────
  const hanaInfo = data?.hana;
  const hanaSessionId: string | undefined = hanaInfo?.session_id;
  const [kgStatus, setKgStatus] = useState<{ state: string; nodes?: number; edges?: number; error?: string | null }>({
    state: hanaInfo?.kgraph?.status || 'queued',
  });

  useEffect(() => {
    if (!isHana || !hanaSessionId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      try {
        const res: any = await connectorService.getHanaKgraphStatus(hanaSessionId);
        if (cancelled) return;
        const rows: any[] = res?.data || [];
        const state: string = res?.kgraph_status || 'building';
        setKgStatus({
          state,
          nodes: rows.reduce((n, r) => n + (Number(r.node_count) || 0), 0),
          edges: rows.reduce((n, r) => n + (Number(r.edge_count) || 0), 0),
          error: rows.find((r) => r.status === 'error')?.error || null,
        });
        if (state === 'building' || state === 'queued') {
          timer = setTimeout(poll, 4000);
        }
      } catch {
        if (!cancelled) timer = setTimeout(poll, 8000);
      }
    };
    if (kgStatus.state === 'building' || kgStatus.state === 'queued') {
      poll();
    }
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [isHana, hanaSessionId]);

  const renderKgStatus = () => {
    if (kgStatus.state === 'ready') {
      return <span className="text-emerald-400">Ready · {kgStatus.nodes ?? 0} nodes · {kgStatus.edges ?? 0} edges</span>;
    }
    if (kgStatus.state === 'error') {
      return <span className="text-red-400" title={kgStatus.error || ''}>Failed</span>;
    }
    if (kgStatus.state === 'not_started') {
      return <span className="text-zinc-400">Pending (On Continue)</span>;
    }
    return (
      <span className="text-blue-400 inline-flex items-center gap-1.5">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Building...
      </span>
    );
  };

  return (
    <div className="space-y-8">
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg)]/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">
            {activeConnector ? `${activeConnector.name} Details` : 'Database Details'}
          </h3>
          {activeConnector && (
            <div className="flex items-center gap-2">
              {isHana && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-widest border border-blue-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  Metadata Only
                </div>
              )}
              <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Connected
              </div>
            </div>
          )}
        </div>

        {(!activeConnector && databases.length === 0 && topics.length === 0) ? (
          <div className="text-center py-6">
            <p className="text-sm text-[var(--text-secondary)]">No active data source. Please connect a data source first.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={onGoToDataSource}>
              Go to Data source
            </Button>
          </div>
        ) : (() => {
          const isWebSource = activeConnector?.type === 'Integration' ||
            activeConnector?.name?.toLowerCase().includes('web') ||
            activeConnector?.name?.toLowerCase().includes('search');
          const isWebSearch = isWebSource;
          const isCsvSource = activeConnector?.name?.toLowerCase().includes('csv');
          const isSqlSource = activeConnector?.name?.toLowerCase().includes('sql') && !activeConnector?.name?.toLowerCase().includes('postgre');

          if (isImporting) {
            return (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-[var(--accent)]" />
                <div className="text-center max-w-lg mx-auto">
                  <p className="text-sm font-bold text-[var(--text-primary)]">Importing your data...</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    {(() => {
                      const name = activeConnector?.name || 'data';
                      const isMultiple = name.includes(',');
                      if (isMultiple) {
                        return `Reading multiple files and extracting data structures`;
                      }
                      const displayName = name.length > 40 ? name.substring(0, 40) + '...' : name;
                      return `Reading ${displayName} data and extracting data structures`;
                    })()}
                  </p>
                </div>
              </div>
            );
          }

          if (importError) {
            return (
              <div className="flex flex-col items-center justify-center py-12 gap-5">
                <div className="text-center max-w-lg mx-auto bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-6 shadow-sm">
                  <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
                  <p className="text-base font-bold text-red-700 dark:text-red-400 mb-2">Import Failed</p>
                  <p className="text-sm text-red-600 dark:text-red-400/90 break-words font-mono bg-white/50 dark:bg-black/20 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
                    {importError}
                  </p>
                </div>
                <Button variant="primary" size="sm" onClick={onGoToDataSource}>
                  Try Different Source
                </Button>
              </div>
            );
          }

          const importedFiles = connectorResults?.imported_files || [];

          if ((isCsvSource || isSqlSource || importedFiles.length > 0) && tables.length === 0) {
            return (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">Imported Files</h4>
                    <Badge variant="outline" className="text-[10px]">{importedFiles.length} items</Badge>
                  </div>

                  <div className="grid gap-3">
                    {importedFiles.length > 0 ? (
                      importedFiles.map((file: string, idx: number) => (
                        <div key={idx} className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors group">
                          <div className="flex justify-between items-start mb-1">
                            <h5 className="text-sm font-bold group-hover:text-[var(--accent)] transition-colors">{file}</h5>
                          </div>
                          <p className="text-xs text-[var(--text-secondary)]">Injected into session context</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center border-2 border-dashed border-[var(--border)] rounded-2xl">
                        <p className="text-sm text-[var(--text-secondary)]">No files imported in this session.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          }

          if (isWebSearch) {
            return (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">Saved Sources</h4>
                    <Badge variant="outline" className="text-[10px]">{results.length} items</Badge>
                  </div>

                  <div className="grid gap-3">
                    {results.length > 0 ? (
                      results.map((item: any, idx: number) => (
                        <div key={item.saved_id || item.search_id || item.id || item.url || idx} className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors group">
                          <div className="flex justify-between items-start mb-1">
                            <h5 className="text-sm font-bold group-hover:text-[var(--accent)] transition-colors line-clamp-1">{item.title}</h5>
                          </div>
                          <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{item.brief}</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center border-2 border-dashed border-[var(--border)] rounded-2xl">
                        <p className="text-sm text-[var(--text-secondary)]">No saved results found for this research.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          }

          return (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                  <div className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-1">
                    {isHana ? 'Row Count (Metadata)' : 'Total Rows'}
                  </div>
                  <div className="text-2xl font-bold font-mono">
                    {summary?.total_rows?.toLocaleString() || '0'}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                  <div className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-1">Total Columns</div>
                  <div className="text-2xl font-bold font-mono">
                    {summary?.total_columns?.toLocaleString() || '0'}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                  <div className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-1">
                    {isHana ? 'Data Copied' : 'Data Size'}
                  </div>
                  <div className="text-2xl font-bold font-mono">
                    {isHana ? <span className="text-base text-emerald-400">None ✓</span> : `${dataSize} MB`}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                  <div className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-1">
                    {isHana ? 'KGraph' : 'Last Sync'}
                  </div>
                  <div className="text-sm font-bold mt-2">
                    {isHana ? renderKgStatus() : (summary?.last_sync || 'Never')}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-3">
                  {isHana ? 'SAP HANA Views (Schema Only)' : 'Tables'}
                </h4>
                <div className="space-y-2">
                  {tables.length > 0 ? (
                    tables.map((t: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors">
                        <span className="font-mono text-sm flex items-center gap-2">
                          {t.table}
                          {isHana && t.role && (
                            <span className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border ${t.role === 'master' ? 'text-purple-400 border-purple-500/30 bg-purple-500/10' : 'text-amber-400 border-amber-500/30 bg-amber-500/10'}`}>
                              {t.role === 'master' ? 'Master' : 'Transaction'}
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-[var(--text-secondary)]">{typeof t.rows === 'number' ? t.rows.toLocaleString() : t.rows} rows • {t.columns} cols{isHana && Array.isArray(t.primary_keys) ? ` • PK: ${t.primary_keys.length ? t.primary_keys.join(', ') : '—'} • ${t.foreign_keys ?? 0} FK` : ''}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center border border-dashed border-[var(--border)] rounded-lg text-sm text-[var(--text-secondary)]">
                      No tables detected yet
                    </div>
                  )}
                </div>
              </div>
            </>
          );
        })()}
      </div>

      {(databases.length > 0 || topics.length > 0) && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-[var(--border)]" />
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] whitespace-nowrap">
              Import History
            </h3>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {databases.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Connected Databases</h4>
                {databases.map((db: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl bg-[var(--surface)]/30 border border-[var(--border)] space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold truncate">{db.external_database}</span>
                      {db.table_count > 0 && (
                        <span className="text-[10px] text-[var(--text-secondary)] bg-[var(--bg)] px-2 py-1 rounded-full border border-[var(--border)]">{db.table_count} tables</span>
                      )}
                    </div>
                    <div className="flex justify-between text-[10px] text-[var(--text-secondary)]">
                      <span>{db.new_user_db}</span>
                      <span>{db.last_sync}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {topics.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Web Research History</h4>
                {topics.map((topic: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl bg-[var(--surface)]/30 border border-[var(--border)] space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold truncate">{topic.topic}</span>
                      <Badge variant="outline" className="text-[9px]">{topic.result_count} articles</Badge>
                    </div>
                    <div className="text-[10px] text-[var(--text-secondary)]">
                      Saved: {topic.last_saved}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Continue to Process button at the exact bottom */}
      {!isImporting && (activeConnector || databases.length > 0 || topics.length > 0) && (results.length > 0 || summary || tables.length > 0 || (connectorResults?.imported_files?.length > 0) || (topics.length > 0 || databases.length > 0)) && onContinue && (
        <div className="mt-12 pt-8 border-t border-[var(--border)] flex justify-end">
          <Button
            onClick={onContinue}
            disabled={isAnalyzing}
            variant="primary"
            size="sm"
            className="px-8 shadow-lg shadow-[var(--accent)]/20 min-w-[200px]"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Continue to Process'
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
