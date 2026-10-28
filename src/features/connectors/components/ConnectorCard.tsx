import { Connector } from '../types';
import { Card, CardContent, Badge, Button } from '@/src/ui-kit';
import { Database, Server, Share2, ArrowUpRight, Globe, Search, FileSpreadsheet, FileCode2, Upload, Network, BarChart3, FileText } from 'lucide-react';

const getBrandIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('postgres'))     return 'https://cdn.simpleicons.org/postgresql';
  if (lower.includes('mysql'))        return 'https://cdn.simpleicons.org/mysql';
  if (lower.includes('snowflake'))    return 'https://cdn.simpleicons.org/snowflake';
  if (lower.includes('google sheets'))return 'https://cdn.simpleicons.org/googlesheets';
  if (lower.includes('hana') || lower.includes('sap')) return 'https://cdn.simpleicons.org/sap';
  return null;
};

interface ConnectorCardProps {
  connector: Connector;
  key?: string | number;
  onClick?: (connector: Connector) => void;
}

export const ConnectorCard = ({ connector, onClick }: ConnectorCardProps) => {
  const Icon = connector.type === 'Database' ? Database :
    connector.type === 'Data Warehouse' ? Server :
      connector.type === 'File Upload' ? Upload : Share2;
  const brandIcon = getBrandIcon(connector.name);

  return (
    <Card
      hoverable={!connector.disabled}
      className={`group ${connector.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={() => !connector.disabled && onClick?.(connector)}
    >
      <CardContent className="flex flex-col h-full p-4">
        <div className="flex-1 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] group-hover:border-[var(--accent)]/50 transition-colors shrink-0">
            {connector.name.includes('Web Search') ? (
              <div className="relative text-[var(--accent)]">
                <Globe className="w-5 h-5" />
                <div className="absolute -bottom-1 -right-1 bg-[var(--surface-hover)] rounded-full pt-[1px] pl-[1px]">
                  <Search className="w-2.5 h-2.5" />
                </div>
              </div>
            ) : connector.name === 'Upload CSV File' ? (
              <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
            ) : connector.name === 'Upload SQL File' ? (
              <FileCode2 className="w-5 h-5 text-blue-500" />
            ) : connector.name === 'Upload Document' ? (
              // ── Document icon ──────────────────────────────────────────────
              <FileText className="w-5 h-5 text-rose-500" />
            ) : connector.name === 'FTP Connector' ? (
              // ── FTP icon ───────────────────────────────────────────────────
              <Network className="w-5 h-5 text-violet-500" />
            ) : connector.name === 'Tally ERP' ? (
              // ── Tally ERP icon ───────────────────────────────────────────
              <BarChart3 className="w-5 h-5 text-amber-400" />
            ) : brandIcon ? (
              <img src={brandIcon} alt={connector.name} className="w-5 h-5 object-contain" />
            ) : (
              <Icon className="w-5 h-5 text-[var(--accent)]" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-1">
              <h3 className="text-base font-bold group-hover:text-[var(--accent)] transition-colors">
                {connector.name}
              </h3>
              <Badge variant={connector.status === 'connected' ? 'success' : 'secondary'} className="text-[10px] py-0 px-1.5 shrink-0 ml-2">
                {connector.status}
              </Badge>
            </div>
            <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
              {connector.description}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]/60">
            {connector.type}
          </span>
          <Button variant="ghost" size="sm" className="group/btn h-8 text-xs" disabled={connector.disabled}>
            {(connector as any).isPlanRestricted ? 'Upgrade Plan' : connector.disabled ? 'Coming Soon' : 'Connect'} 
            {!connector.disabled && <ArrowUpRight className="w-3 h-3 ml-1 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
