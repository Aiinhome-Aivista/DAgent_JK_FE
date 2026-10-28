import { AgentData } from '../types';
import { Database, Server, BarChart3, MessageSquare, Sparkles, Loader2 } from 'lucide-react';

export const getAgentIcon = (iconName: string) => {
  switch (iconName) {
    case 'database': return <Database className="w-5 h-5" />;
    case 'server': return <Server className="w-5 h-5" />;
    case 'bar-chart': return <BarChart3 className="w-5 h-5" />;
    case 'message-square': return <MessageSquare className="w-5 h-5" />;
    default: return <Sparkles className="w-5 h-5" />;
  }
};

interface AgentStepperProps {
  agents: AgentData[];
  selectedAgentId: string;
  onSelectAgent: (agentId: string) => void;
}

export const AgentStepper = ({ agents, selectedAgentId, onSelectAgent }: AgentStepperProps) => {
  return (
    <div className="flex flex-row w-full pb-4 border-b border-[var(--border)] gap-4 shrink-0">
      {agents.filter(a => a.id !== 'query').map((agent, index, filtered) => (
        <div key={agent.id} className="flex-1 flex items-center relative">
          <button
            onClick={() => onSelectAgent(agent.id)}
            className={`
              flex-1 flex items-center gap-3 p-3 rounded-xl transition-all text-left whitespace-nowrap group
              ${selectedAgentId === agent.id
                ? 'bg-[var(--accent)] text-white shadow-xl shadow-[var(--accent)]/30 scale-[1.01] ring-2 ring-[var(--accent)]/10'
                : 'bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]'}
            `}
          >
            <div className={`
              w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105
              ${selectedAgentId === agent.id ? 'bg-white/20' : 'bg-[var(--accent)]/10 text-[var(--accent)]'}
            `}>
              {agent.history.some(h => h.status === 'processing') ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                getAgentIcon(agent.icon)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-black text-base tracking-tight truncate">{agent.name}</div>
              <div className={`text-[10px] uppercase tracking-[0.2em] font-bold truncate ${selectedAgentId === agent.id ? 'text-white/70' : 'text-[var(--text-secondary)]/60'}`}>
                {agent.history.length} Activities
              </div>
            </div>
          </button>
          {index < filtered.length - 1 && (
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-[2px] bg-[var(--border)] z-10" />
          )}
        </div>
      ))}
    </div>
  );
};
