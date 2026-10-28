import { Connector } from '../types';
import { ConnectorCard } from './ConnectorCard';
import { Input } from '@/src/ui-kit';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { useConnectorContext } from '../../../context/ConnectorContext';
import { SUPPORTED_CONNECTORS } from '../constants';

interface ConnectorListProps {
  onSelect?: (connector: any) => void;
}

export const ConnectorList = ({ onSelect }: ConnectorListProps = {}) => {
  const [search, setSearch] = useState('');
  const { setSelectedConnector } = useConnectorContext();

  const checkConnectorAllowed = (connectorName: string, allowedStr: string) => {
    // Pricing checks bypassed
    return true;
  };

  const isPlanUnlimited = true;

  const filtered = SUPPORTED_CONNECTORS.map(c => {
    const isAllowed = checkConnectorAllowed(c.name, '');
    // If the plan grants all connectors (Gold/Custom/Unlimited),
    // override the hardcoded `disabled: true` from constants
    const isDisabled = isPlanUnlimited ? false : (c.disabled || !isAllowed);
    return {
      ...c,
      disabled: isDisabled,
      isPlanRestricted: !isPlanUnlimited && !c.disabled && !isAllowed // show "Upgrade Plan" badge
    };
  }).filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="">
      <div className="flex flex-col md:flex-row gap-3 items-end justify-end">
        <div className="w-full md:max-w-xs">
          <Input 
         
            placeholder="Search by name or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
          <div className="relative -top-8 left-3 w-4 h-4 text-[var(--text-secondary)]">
            <Search className="w-4 h-4" />
          </div>
        </div>
        
        {/* <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs font-medium hover:bg-[var(--surface-hover)] transition-colors">
            <Filter className="w-3 h-3" />
            Filter
          </button>
        </div> */}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((connector) => (
          <ConnectorCard 
            key={connector.id} 
            connector={connector as any} 
            onClick={() => {
              setSelectedConnector(connector as any);
              onSelect?.(connector as any);
            }}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed border-[var(--border)] rounded-2xl">
          <p className="text-[var(--text-secondary)]">No connectors found matching your search.</p>
        </div>
      )}
    </div>
  );
};
