import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Edit2, Trash2, X, Save, Eye, EyeOff, Key, Play,
  Cpu, Globe, Brain, Check, ChevronDown, ChevronUp,
  Network, MessageSquare, BarChart2, Layers, Zap,
  Search, Activity, FileSearch, Loader2, Building2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { llmService } from '../../../services/llm.service';
import { companyService } from '../../../services/company.service';
import { Captcha } from '../../../ui-kit';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LLMProvider {
  id: number;
  name: string;
  provider: string;
  api_key: string;
  model_name: string;
  base_url: string;
  is_active: boolean;
}

export interface ScenarioAssignment {
  scenario: string;
  provider_id: number | null;
  temperature: number;
  max_tokens: number;
  timeout?: number;
}

// ─── Scenarios ────────────────────────────────────────────────────────────────

const SCENARIOS = [
  { key: 'rag_chat', label: 'RAG Chat', icon: <MessageSquare className="w-3 h-3" /> },
  { key: 'analysis', label: 'Analysis', icon: <BarChart2 className="w-3 h-3" /> },
  { key: 'visualization', label: 'Visualisation', icon: <Layers className="w-3 h-3" /> },
  { key: 'intent_routing', label: 'Intent Routing', icon: <Network className="w-3 h-3" /> },
  { key: 'insights', label: 'Insights', icon: <Zap className="w-3 h-3" /> },
  { key: 'query_branch', label: 'Query Branch', icon: <Activity className="w-3 h-3" /> },
  { key: 'web_search', label: 'Web Search', icon: <Search className="w-3 h-3" /> },
  { key: 'agent_planner', label: 'Agent Planner', icon: <FileSearch className="w-3 h-3" /> },
];

const BLANK: Omit<LLMProvider, 'id'> = {
  name: '', provider: '', api_key: '', model_name: '', base_url: '', is_active: true,
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface ManageLLMProps {
  searchQuery: string;
  isCreatingLLM: boolean;
  setIsCreatingLLM: (val: boolean) => void;
  isCreatingCompanyConfig?: boolean;
  setIsCreatingCompanyConfig?: (val: boolean) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ManageLLM: React.FC<ManageLLMProps> = ({
  searchQuery,
  isCreatingLLM,
  setIsCreatingLLM,
  isCreatingCompanyConfig,
  setIsCreatingCompanyConfig
}) => {
  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [globalAssignments, setGlobalAssignments] = useState<ScenarioAssignment[]>([]);
  const [companyAssignments, setCompanyAssignments] = useState<any[]>([]); // all company assignments

  const groupedCompanyAssignments = React.useMemo(() => {
    const groups: Record<number, any[]> = {};
    companyAssignments.forEach(a => {
      if (a.company_id == null) return;
      if (!groups[a.company_id]) groups[a.company_id] = [];
      groups[a.company_id].push(a);
    });
    return groups;
  }, [companyAssignments]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState<number | null>(null);

  // Companies
  const [companies, setCompanies] = useState<{ id: number; company_name: string }[]>([]);

  // modal (Add Provider)
  const [form, setForm] = useState<Omit<LLMProvider, 'id'>>(BLANK);
  const [editId, setEditId] = useState<number | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState<LLMProvider | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isCaptchaValid, setIsCaptchaValid] = useState(false);
  const [expandedProvider, setExpandedProvider] = useState<number | null>(null);

  // modal (Add Company Config) - Fallbacks if not provided by parent
  const [localIsCreatingComp, setLocalIsCreatingComp] = useState(false);
  const _isCreatingCompanyConfig = isCreatingCompanyConfig ?? localIsCreatingComp;
  const _setIsCreatingCompanyConfig = setIsCreatingCompanyConfig ?? setLocalIsCreatingComp;

  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [newCompanyAssignments, setNewCompanyAssignments] = useState<ScenarioAssignment[]>([]);
  const [activeTab, setActiveTab] = useState<'global' | 'company'>('global');

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [provRes, globalAssRes, companyAssRes] = await Promise.all([
        llmService.getProviders(), // global providers
        llmService.getAssignments(), // global assignments
        llmService.getAssignments('all'), // all company assignments
      ]);

      if (provRes.status) {
        setProviders(provRes.providers.map((p: any) => ({ ...p, provider: p.provider_type })));
      }

      if (globalAssRes.status) {
        const fetched = globalAssRes.assignments;
        const merged = SCENARIOS.map(s => {
          const found = fetched.find((a: any) => a.scenario === s.key);
          return found || { scenario: s.key, provider_id: null, temperature: 0.3, max_tokens: 4096 };
          if (found) return found;
          return { scenario: s.key, provider_id: null, temperature: 0.3, max_tokens: 4096, timeout: 90 };
        });
        setGlobalAssignments(merged);
      }

      if (companyAssRes.status) {
        setCompanyAssignments(companyAssRes.assignments || []);
      }
    } catch {
      toast.error('Failed to load LLM config');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load companies on mount
  React.useEffect(() => {
    companyService.getCompanies().then((res: any) => {
      const list = res?.data ?? [];
      setCompanies(Array.isArray(list) ? list : []);
    }).catch(() => { });
  }, []);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  // ── helpers ──────────────────────────────────────────────────────────────

  const closeModal = () => { setForm(BLANK); setEditId(null); setShowKey(false); setIsCreatingLLM(false); };

  const openEdit = (p: LLMProvider) => {
    setForm({ name: p.name, provider: p.provider, api_key: p.api_key, model_name: p.model_name, base_url: p.base_url, is_active: p.is_active });
    setEditId(p.id); setShowKey(false); setIsCreatingLLM(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.provider.trim() || !form.model_name.trim()) {
      toast.error('Name, Provider & Model are required.'); return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        provider_type: form.provider,
        api_key: form.api_key,
        model_name: form.model_name,
        base_url: form.base_url,
        is_active: form.is_active,
      };

      if (editId !== null) {
        await llmService.updateProvider(editId, payload);
        toast.success('Provider updated!');
      } else {
        await llmService.createProvider(payload);
        toast.success('Provider added!');
      }
      closeModal();
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await llmService.deleteProvider(id);
      toast.success('Provider removed.');
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Delete failed');
    }
  };

  const handleTest = async (p: LLMProvider) => {
    setTestingId(p.id);
    const toastId = toast.loading(`Testing ${p.name}...`);
    try {
      const res = await llmService.testProvider(p.id);
      if (res.status) {
        toast.success(`Test Passed!`, { id: toastId, duration: 5000 });
      } else {
        toast.error(res.msg, { id: toastId });
      }
    } catch (e: any) {
      toast.error(e.message || 'Error', { id: toastId });
    } finally {
      setTestingId(null);
    }
  };

  const handleToggleActive = async (p: LLMProvider) => {
    try {
      await llmService.updateProvider(p.id, { is_active: !p.is_active });
      setProviders(prev => prev.map(x => x.id === p.id ? { ...x, is_active: !x.is_active } : x));
    } catch {
      toast.error('Failed to update status');
    }
  };

  const patchAssignment = async (scenario: string, patch: Partial<ScenarioAssignment>) => {
    const updatedAssignments = globalAssignments.map(a => a.scenario === scenario ? { ...a, ...patch } : a);
    setGlobalAssignments(updatedAssignments);
    try {
      const target = updatedAssignments.find(a => a.scenario === scenario);
      if (target) {
        toast.promise(llmService.updateAssignments([target], null), {
          loading: 'Saving changes...',
          success: 'Updated successfully!',
          error: 'Failed to update',
        }, { id: 'save-assignment' });
      }
    } catch {
      toast.error('Failed to update assignment');
      fetchData();
    }
  };

  const filtered = providers.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.model_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const inp = 'w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] placeholder:text-[var(--text-secondary)]/40 transition-colors';
  const lbl = 'block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wide';

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-[var(--accent)]" />
        <span className="ml-2 text-sm text-[var(--text-secondary)]">Loading LLM configuration...</span>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-6 mb-6 border-b border-[var(--border)]">
        <button
          onClick={() => setActiveTab('global')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all ${activeTab === 'global' ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer'}`}
        >
          Global Configuration
        </button>
        <button
          onClick={() => setActiveTab('company')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all ${activeTab === 'company' ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer'}`}
        >
          Company-wise Routing
        </button>
      </div>

      {activeTab === 'global' && (
        <div className="space-y-4">
          {/* ── Providers Table ─────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-[var(--border)] overflow-hidden bg-[var(--surface)]">

            {/* Header row */}
            <div className="grid grid-cols-[8%_22%_13%_20%_13%_24%] border-b border-[var(--border)] bg-[var(--bg)]/50">
              {['SL NO', 'Provider', 'Type', 'Model', 'Status', 'Actions'].map(h => (
                <div key={h} className="px-6 py-4 text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider text-left flex items-center">
                  {h}
                </div>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="py-16 text-center text-[var(--text-secondary)]">
                <Cpu className="w-8 h-8 mx-auto mb-2 opacity-25" />
                <p className="text-sm">No providers found.</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {filtered.map((p, idx) => {
                  const isExpanded = expandedProvider === p.id;
                  const scenariosForProvider = globalAssignments.filter(a => a.provider_id === p.id);

                  return (
                    <motion.div key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>

                      {/* Main row */}
                      <div className="grid grid-cols-[8%_22%_13%_20%_13%_24%] items-center hover:bg-[var(--surface-hover)] transition-colors border-b border-[var(--border)] last:border-0">

                        {/* SL NO */}
                        <div className="px-6 py-4 text-sm font-medium text-[var(--text-secondary)] flex items-center">
                          {idx + 1}
                        </div>

                        {/* Name */}
                        <div className="px-6 py-4 flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] shrink-0">
                            <Cpu className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[var(--text-primary)] truncate">{p.name}</p>
                            {p.base_url && <p className="text-xs text-[var(--text-secondary)] truncate font-mono">{p.base_url}</p>}
                          </div>
                        </div>

                        {/* Provider type */}
                        <div className="px-6 py-4 flex items-center">
                          <span className="inline-flex items-center justify-center px-3 rounded-md bg-[var(--bg)] border border-[var(--border)] text-[11px] font-mono text-[var(--text-secondary)] w-fit h-6">
                            {p.provider}
                          </span>
                        </div>

                        {/* Model */}
                        <div className="px-6 py-4 flex items-center gap-1.5 min-w-0">
                          <Brain className="w-3.5 h-3.5 shrink-0 text-[var(--text-secondary)]" />
                          <span className="font-mono text-xs text-[var(--text-secondary)] truncate">{p.model_name}</span>
                        </div>

                        {/* Status */}
                        <div className="px-6 py-4 flex items-center">
                          <button
                            onClick={() => handleToggleActive(p)}
                            className={`inline-flex items-center justify-center gap-1.5 px-3 rounded-full text-[11px] font-medium transition-colors cursor-pointer h-6 w-fit ${p.is_active
                              ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                              : 'bg-[var(--border)]/60 text-[var(--text-secondary)] hover:bg-[var(--border)]'
                              }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${p.is_active ? 'bg-emerald-500' : 'bg-[var(--text-secondary)]/40'}`} />
                            {p.is_active ? 'Active' : 'Inactive'}
                          </button>
                        </div>

                        {/* Actions */}
                        <div className="px-3 py-4 flex items-center gap-1 flex-nowrap shrink-0">
                          <button title="Test Connection" onClick={() => handleTest(p)} disabled={testingId === p.id}
                            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors cursor-pointer disabled:opacity-50">
                            {testingId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                          </button>
                          <button title="Scenario routing" onClick={() => setExpandedProvider(isExpanded ? null : p.id)}
                            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors cursor-pointer">
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => openEdit(p)}
                            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors cursor-pointer">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => {
                            setProviderToDelete(p);
                            setDeleteConfirmationText("");
                            setIsCaptchaValid(false);
                          }} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded scenario routing */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                            <div className="px-5 py-4 border-t border-[var(--border)] bg-[var(--accent)]/[0.02]">
                              <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-3">
                                Scenarios using <span className="text-[var(--accent)]">{p.name}</span> — click to toggle
                              </p>
                              <div className="flex flex-wrap gap-2 mb-4">
                                {SCENARIOS.map(s => {
                                  const a = globalAssignments.find(x => x.scenario === s.key)!;
                                  const mine = a.provider_id === p.id;
                                  return (
                                    <button key={s.key}
                                      onClick={() => patchAssignment(s.key, { provider_id: mine ? null : p.id })}
                                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${mine
                                        ? 'bg-[var(--accent)]/15 border-[var(--accent)]/40 text-[var(--accent)]'
                                        : 'bg-[var(--bg)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]/30 hover:text-[var(--text-primary)]'
                                        }`}>
                                      {s.icon} {s.label}
                                      {mine && <Check className="w-3 h-3" />}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Temp / tokens for assigned scenarios */}
                              {scenariosForProvider.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                  {scenariosForProvider.map(a => {
                                    const s = SCENARIOS.find(x => x.key === a.scenario)!;
                                    return (
                                      <div key={a.scenario} className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-2">
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)]">
                                          {s.icon} {s.label}
                                        </div>
                                        <div>
                                          <label className="text-[10px] text-[var(--text-secondary)] font-medium uppercase">
                                            Temp <span className="text-[var(--accent)] font-bold">{a.temperature}</span>
                                          </label>
                                          <input type="range" min={0} max={1} step={0.05} value={a.temperature}
                                            onChange={e => patchAssignment(a.scenario, { temperature: parseFloat(e.target.value) })}
                                            className="w-full accent-[var(--accent)] cursor-pointer h-1.5 mt-1" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <label className="text-[10px] text-[var(--text-secondary)] font-medium uppercase">Max Tokens</label>
                                            <input type="number" min={128} max={32768} step={128} value={a.max_tokens === undefined ? '' : a.max_tokens}
                                              onChange={e => patchAssignment(a.scenario, { max_tokens: (e.target.value === '' ? '' : parseInt(e.target.value)) as any })}
                                              className={inp + ' mt-1 py-1 text-xs'} />
                                          </div>
                                          <div>
                                            <label className="text-[10px] text-[var(--text-secondary)] font-medium uppercase">Timeout (s)</label>
                                            <input type="number" min={5} max={3600} step={1} value={a.timeout === undefined ? '' : a.timeout}
                                              onChange={e => patchAssignment(a.scenario, { timeout: (e.target.value === '' ? '' : parseInt(e.target.value)) as any })}
                                              className={inp + ' mt-1 py-1 text-xs'} />
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>


          {/* ── Scenario Overview Grid ───────────────────────────────────────────── */}
          <div className="mt-4 rounded-2xl border border-[var(--border)] overflow-hidden bg-[var(--surface)]">
            <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--bg)] flex items-center gap-2">
              <Network className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
              <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Scenario Routing Overview</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-px bg-[var(--border)]">
              {SCENARIOS.map(s => {
                const a = globalAssignments.find(x => x.scenario === s.key)!;
                const prov = providers.find(p => p.id === a.provider_id);
                return (
                  <div key={s.key} className="bg-[var(--surface)] px-4 py-3">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] mb-1">{s.icon} {s.label}</div>
                    <p className={`text-xs font-semibold truncate ${prov ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]/40'}`}>
                      {prov ? prov.name : 'Unassigned'}
                    </p>
                    {prov && (
                      <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 font-mono">
                        Temp: {a.temperature} · Tokens: {a.max_tokens} · Timeout: {a.timeout || 90}s
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'company' && (
        <div className="space-y-4" id="company-routing-table">
          {/* ── Company Configurations Table ──────────────────────────────────────── */}
          <h3 className="text-lg font-bold text-[var(--text-primary)] px-1 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[var(--accent)]" />
            Company-wise Routing
          </h3>

          {companies.length === 0 ? (
            <div className="py-16 text-center text-[var(--text-secondary)] flex flex-col items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
              <Building2 className="w-8 h-8 mb-3 opacity-20" />
              <p className="text-sm">No companies available.</p>
            </div>
          ) : (
            companies.map(c => {
              const isExpanded = selectedCompanyId === c.id;
              const isConfigured = !!groupedCompanyAssignments[c.id];

              return (
                <div key={c.id} className="rounded-2xl border border-[var(--border)] overflow-hidden bg-[var(--surface)]">
                  <div
                    onClick={() => {
                      if (isExpanded) {
                        setSelectedCompanyId(null);
                      } else {
                        setSelectedCompanyId(c.id);
                        setNewCompanyAssignments(groupedCompanyAssignments[c.id] || SCENARIOS.map(s => ({ scenario: s.key, provider_id: null, temperature: 0.3, max_tokens: 4096, timeout: 90 })));
                      }
                    }}
                    className="px-5 py-4 flex items-center justify-between bg-[var(--bg)] cursor-pointer hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-[var(--text-primary)]">{c.company_name}</span>
                      {isConfigured && (
                        <span className="px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-[10px] font-bold uppercase tracking-wide">
                          Configured
                        </span>
                      )}
                    </div>
                    <div className="text-[var(--text-secondary)] flex items-center gap-2">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-5 border-t border-[var(--border)] bg-[var(--surface)]">
                          <div className="border border-[var(--border)] rounded-xl overflow-hidden divide-y divide-[var(--border)]">
                            <div className="grid grid-cols-[25%_30%_15%_15%_15%] bg-[var(--bg)]/50 px-4 py-3 text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                              <div>Scenario</div>
                              <div>Provider</div>
                              <div>Temperature</div>
                              <div>Max Tokens</div>
                              <div>Timeout</div>
                            </div>
                            {SCENARIOS.map(s => {
                              const a = newCompanyAssignments.find(x => x.scenario === s.key) || { scenario: s.key, provider_id: null, temperature: 0.3, max_tokens: 4096, timeout: 90 };
                              const globalA = globalAssignments.find(x => x.scenario === s.key) || { temperature: 0.3, max_tokens: 4096, timeout: 90 };

                              return (
                                <div key={s.key} className="grid grid-cols-[25%_30%_15%_15%_15%] items-center px-4 py-3 hover:bg-[var(--surface-hover)] transition-colors">
                                  <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                                    {s.icon} {s.label}
                                  </div>
                                  <div className="pr-4">
                                    <select
                                      value={a.provider_id ?? ''}
                                      onChange={e => {
                                        const val = e.target.value ? Number(e.target.value) : null;
                                        setNewCompanyAssignments(prev => {
                                          const next = [...prev];
                                          const idx = next.findIndex(x => x.scenario === s.key);
                                          if (idx >= 0) next[idx] = { ...next[idx], provider_id: val };
                                          else next.push({ scenario: s.key, provider_id: val, temperature: 0.3, max_tokens: 4096, timeout: 90 });
                                          return next;
                                        });
                                      }}
                                      className={inp + ' py-1'}
                                    >
                                      <option value="">Global Default</option>
                                      {providers.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="pr-4">
                                    {a.provider_id ? (
                                      <input type="number" min={0} max={1} step={0.1} value={a.temperature}
                                        onChange={e => {
                                          const val = parseFloat(e.target.value);
                                          setNewCompanyAssignments(prev => {
                                            const next = [...prev];
                                            const idx = next.findIndex(x => x.scenario === s.key);
                                            if (idx >= 0) next[idx] = { ...next[idx], temperature: val };
                                            else next.push({ scenario: s.key, provider_id: a.provider_id, temperature: val, max_tokens: a.max_tokens, timeout: a.timeout });
                                            return next;
                                          });
                                        }}
                                        className={inp + ' py-1 text-xs'} />
                                    ) : (
                                      <input type="number" disabled value={globalA.temperature} title="Using Global Default" className={inp + ' py-1 text-xs opacity-50 cursor-not-allowed bg-transparent'} />
                                    )}
                                  </div>
                                  <div className="pr-4">
                                    {a.provider_id ? (
                                      <input type="number" step={128} value={a.max_tokens}
                                        onChange={e => {
                                          const val = parseInt(e.target.value);
                                          setNewCompanyAssignments(prev => {
                                            const next = [...prev];
                                            const idx = next.findIndex(x => x.scenario === s.key);
                                            if (idx >= 0) next[idx] = { ...next[idx], max_tokens: val };
                                            else next.push({ scenario: s.key, provider_id: a.provider_id, temperature: a.temperature, max_tokens: val, timeout: a.timeout });
                                            return next;
                                          });
                                        }}
                                        className={inp + ' py-1 text-xs'} />
                                    ) : (
                                      <input type="number" disabled value={globalA.max_tokens} title="Using Global Default" className={inp + ' py-1 text-xs opacity-50 cursor-not-allowed bg-transparent'} />
                                    )}
                                  </div>
                                  <div className="pr-4">
                                    {a.provider_id ? (
                                      <input type="number" step={1} value={a.timeout || 90}
                                        onChange={e => {
                                          const val = parseInt(e.target.value);
                                          setNewCompanyAssignments(prev => {
                                            const next = [...prev];
                                            const idx = next.findIndex(x => x.scenario === s.key);
                                            if (idx >= 0) next[idx] = { ...next[idx], timeout: val };
                                            else next.push({ scenario: s.key, provider_id: a.provider_id, temperature: a.temperature, max_tokens: a.max_tokens, timeout: val });
                                            return next;
                                          });
                                        }}
                                        className={inp + ' py-1 text-xs'} />
                                    ) : (
                                      <input type="number" disabled value={globalA.timeout || 90} title="Using Global Default" className={inp + ' py-1 text-xs opacity-50 cursor-not-allowed bg-transparent'} />
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex justify-end gap-3 pt-4">
                            <button
                              onClick={async () => {
                                if (!isConfigured) return;
                                if (window.confirm("Are you sure you want to delete routing for this company?")) {
                                  try {
                                    await llmService.deleteAssignments(c.id);
                                    toast.success("Routing deleted");
                                    setSelectedCompanyId(null);
                                    fetchData();
                                  } catch (e: any) {
                                    toast.error(e.message || "Failed to delete");
                                  }
                                }
                              }}
                              disabled={!isConfigured}
                              title={!isConfigured ? "No custom routing to delete" : "Delete entire company routing"}
                              className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors flex items-center gap-2 ${isConfigured ? 'border-[var(--border)] text-rose-500 hover:bg-rose-500/10 cursor-pointer' : 'border-[var(--border)]/50 text-[var(--text-secondary)]/30 cursor-not-allowed'}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete Routing
                            </button>
                            <button
                              onClick={async () => {
                                setSaving(true);
                                try {
                                  await llmService.updateAssignments(newCompanyAssignments, c.id);
                                  toast.success("Company routing saved!");
                                  fetchData();
                                } catch (e: any) {
                                  toast.error(e.message || "Failed to save");
                                } finally {
                                  setSaving(false);
                                }
                              }}
                              disabled={saving}
                              className="px-5 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent)]/90 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                              Save Changes
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Add / Edit Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isCreatingLLM && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={closeModal}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="w-full max-w-lg bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-2xl pointer-events-auto overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
                      <Cpu className="w-4 h-4 text-[var(--accent)]" />
                    </div>
                    <h3 className="font-semibold text-[var(--text-primary)]">
                      {editId !== null ? 'Edit Provider' : 'Add LLM Provider'}
                    </h3>
                  </div>
                  <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] transition-colors cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={lbl}>Display Name *</label>
                      <input className={inp} placeholder="e.g. Gemini Flash" value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div>
                      <label className={lbl}>Provider Type *</label>
                      <input className={inp} placeholder="gemini / mistral_cloud / ollama" value={form.provider}
                        onChange={e => setForm(f => ({ ...f, provider: e.target.value }))} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={lbl}>Model Name *</label>
                      <div className="relative">
                        <Brain className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-secondary)]" />
                        <input className={inp + ' pl-8'} placeholder="gemini-2.5-flash" value={form.model_name}
                          onChange={e => setForm(f => ({ ...f, model_name: e.target.value }))} />
                      </div>
                    </div>
                    <div>
                      <label className={lbl}>Base URL <span className="text-[var(--text-secondary)] normal-case font-normal">(optional)</span></label>
                      <div className="relative">
                        <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-secondary)]" />
                        <input className={inp + ' pl-8'} placeholder="http://localhost:11434" value={form.base_url}
                          onChange={e => setForm(f => ({ ...f, base_url: e.target.value }))} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={lbl}>API Key <span className="text-[var(--text-secondary)] normal-case font-normal">(blank for local)</span></label>
                    <div className="relative">
                      <Key className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-secondary)]" />
                      <input
                        className={inp + ' pl-8 pr-9 font-mono'}
                        type={showKey ? 'text' : 'password'}
                        placeholder="••••••••••••••••"
                        value={form.api_key}
                        onChange={e => setForm(f => ({ ...f, api_key: e.target.value }))}
                      />
                      <button type="button" onClick={() => setShowKey(v => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors">
                        {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={form.is_active}
                        onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                      <div className="w-10 h-5 bg-[var(--border)] rounded-full peer peer-checked:bg-[var(--accent)] transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                    </label>
                    <span className="text-sm text-[var(--text-secondary)]">Active</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-[var(--border)] bg-[var(--bg)]">
                  <button onClick={closeModal}
                    className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer font-medium">
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="px-5 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent)]/90 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    {editId !== null ? 'Update' : 'Save Provider'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Delete Confirmation Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {providerToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xl max-w-md w-full mx-4"
            >
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                Delete Provider
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">
                Are you sure you want to delete this provider? This action
                cannot be undone. Please type{" "}
                <span className="font-bold text-[var(--text-primary)] select-all">
                  {providerToDelete.name}
                </span>{" "}
                to confirm.
              </p>

              <input
                autoFocus
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] mb-4"
                placeholder={`Type '${providerToDelete.name}' here...`}
              />

              <div className="mb-6">
                <Captcha onValidate={setIsCaptchaValid} expireTimeMs={60000} />
              </div>

              <div className="flex justify-between items-center">
                <button
                  onClick={() => {
                    setProviderToDelete(null);
                    setDeleteConfirmationText("");
                    setIsCaptchaValid(false);
                  }}
                  className="px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleDelete(providerToDelete.id);
                    setProviderToDelete(null);
                    setDeleteConfirmationText("");
                    setIsCaptchaValid(false);
                  }}
                  disabled={
                    deleteConfirmationText !== providerToDelete.name ||
                    !isCaptchaValid
                  }
                  className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </>
  );
};
