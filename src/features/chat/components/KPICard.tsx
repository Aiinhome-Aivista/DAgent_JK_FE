import React from 'react';

const safeStringify = (val: any): string => {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    // e.g. { Gold: 5, PLATINUM: 2, Silver: 8 } → "Gold: 5 | PLATINUM: 2 | Silver: 8"
    return Object.entries(val)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' | ');
  }
  return String(val);
};

export const KPICard = ({ kpi, index }: { kpi: any, index: number }) => {
  const displayValue = safeStringify(kpi.value);
  const displayTitle = safeStringify(kpi.title);
  const displayDescription = typeof kpi.description === 'string' ? kpi.description : '';

  return (
    <div className="border border-[var(--border)] shadow-sm bg-[var(--surface)] rounded-xl overflow-hidden">
      <div className="p-4 flex flex-col gap-1">
        <span className="text-xs text-[var(--text-secondary)] font-medium uppercase tracking-wider">{displayTitle}</span>
        <span className="text-2xl font-bold text-[var(--text-primary)] break-words">{displayValue}</span>
        {displayDescription && <span className="text-xs text-[var(--text-secondary)]">{displayDescription}</span>}
      </div>
    </div>
  );
};
