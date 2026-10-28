import { useState, useEffect, useRef } from 'react';
import { Input, Button } from '@/src/ui-kit';
import {
  Loader2, FolderOpen, Play, Calendar, Trash2,
  CheckCircle2, XCircle, AlertCircle, Clock, Eye, EyeOff
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FtpFormData {
  name:        string;
  host:        string;
  port:        string;
  username:    string;
  password:    string;
  remote_dir:  string;
  passive_mode: boolean;
}

interface ProgressEvent {
  type:     string;
  message?: string;
  file?:    string;
  size?:    number;
  current?: number;
  total?:   number;
  percent?: number;
  fetched?: any[];
  failed?:  any[];
  error?:   string;
  ts?:      string;
}

interface FtpFormProps {
  formData:         FtpFormData;
  setFormData:      (d: FtpFormData) => void;
  handleFocus:      (field: string) => void;
  handleMouseEnter: (field: string) => void;
  onBack:           () => void;
  userId:           number | null;
  sessionId:        string | null;
  onConnectSuccess: () => void;
}

// ─── Schedule options ─────────────────────────────────────────────────────────

const SCHEDULE_OPTIONS = [
  { label: 'Every 30 minutes', value: '30m',  type: 'interval' },
  { label: 'Every hour',       value: '1h',   type: 'interval' },
  { label: 'Every 6 hours',    value: '6h',   type: 'interval' },
  { label: 'Every 24 hours',   value: '24h',  type: 'interval' },
  { label: 'Daily at midnight', value: '0 0 * * *', type: 'cron' },
];

// ─── FtpForm ──────────────────────────────────────────────────────────────────

export const FtpForm = ({
  formData, setFormData,
  handleFocus, handleMouseEnter,
  onBack, userId, sessionId, onConnectSuccess,
}: FtpFormProps) => {

  const [phase, setPhase] = useState<'form' | 'connected'>('form');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isConnecting,   setIsConnecting]   = useState(false);
  const [isFetching,     setIsFetching]     = useState(false);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [isDeletingSchedule, setIsDeletingSchedule] = useState(false);
  const [errorMsg,       setErrorMsg]       = useState('');
  const [successMsg,     setSuccessMsg]     = useState('');

  // Progress
  const [progressEvents, setProgressEvents] = useState<ProgressEvent[]>([]);
  const [overallPercent, setOverallPercent] = useState(0);
  const [fetchDone,      setFetchDone]      = useState(false);
  const progressEndRef = useRef<HTMLDivElement>(null);

  // Schedule
  const [scheduleType,  setScheduleType]  = useState('interval');
  const [scheduleValue, setScheduleValue] = useState('1h');
  const [currentSchedule, setCurrentSchedule] = useState<any>(null);

  const BASE = 'http://122.163.121.176:3019';

  // Auto-scroll progress log
  useEffect(() => {
    progressEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [progressEvents]);

  // Load existing schedule on mount if already connected
  useEffect(() => {
    if (phase === 'connected' && userId && sessionId) {
      loadSchedule();
    }
  }, [phase]);

  // ── Helpers ────────────────────────────────────────────────────

  const loadSchedule = async () => {
    try {
      const res = await fetch(
        `${BASE}/ftp/schedule?user_id=${userId}&session_id=${sessionId}`
      );
      const json = await res.json();
      if (json.status === 'success' && json.schedule?.has_schedule) {
        setCurrentSchedule(json.schedule);
        setScheduleType(json.schedule.schedule_type  || 'interval');
        setScheduleValue(json.schedule.schedule_value || '1h');
      }
    } catch { /* silent */ }
  };

  // ── Connect ────────────────────────────────────────────────────

  const handleConnect = async () => {
    const newErrors: Record<string, string> = {};
    if (!formData.host?.trim()) newErrors.host = "FTP Host is required";
    if (!formData.username?.trim()) newErrors.username = "Username is required";
    if (!formData.password?.trim()) newErrors.password = "Password is required";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    
    setErrorMsg('');
    setIsConnecting(true);
    try {
      const res  = await fetch(`${BASE}/ftp/connect`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          user_id:      userId,
          session_id:   sessionId,
          name:         formData.name,
          host:         formData.host,
          port:         Number(formData.port) || 21,
          username:     formData.username,
          password:     formData.password,
          remote_dir:   formData.remote_dir || '/',
          passive_mode: formData.passive_mode,
        }),
      });
      const json = await res.json();
      if (json.status === 'success') {
        setPhase('connected');
        setSuccessMsg('FTP connector created successfully.');
        onConnectSuccess();
      } else {
        setErrorMsg(json.message || 'Connection failed.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Network error.');
    } finally {
      setIsConnecting(false);
    }
  };

  // ── Fetch (immediate) ──────────────────────────────────────────

  const handleFetch = async () => {
    setErrorMsg('');
    setProgressEvents([]);
    setOverallPercent(0);
    setFetchDone(false);
    setIsFetching(true);

    try {
      // 1. Trigger fetch → get job_id
      const res  = await fetch(`${BASE}/ftp/fetch`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ user_id: userId, session_id: sessionId }),
      });
      const json = await res.json();
      if (json.status !== 'success') {
        setErrorMsg(json.message || 'Failed to start fetch.');
        setIsFetching(false);
        return;
      }

      // 2. Open SSE stream
      const source = new EventSource(`${BASE}/ftp/progress/${json.job_id}`);
      source.onmessage = (e) => {
        try {
          const ev: ProgressEvent = JSON.parse(e.data);
          setProgressEvents(prev => [...prev, ev]);

          if (ev.percent !== undefined) {
            setOverallPercent(ev.percent);
          }
          if (ev.type === 'done') {
            setOverallPercent(100);
            setFetchDone(true);
            setIsFetching(false);
            source.close();
          }
          if (ev.type === 'error') {
            setErrorMsg(ev.message || 'Fetch error.');
            setIsFetching(false);
            source.close();
          }
        } catch { /* ignore malformed */ }
      };
      source.onerror = () => {
        setIsFetching(false);
        source.close();
      };
    } catch (e: any) {
      setErrorMsg(e.message || 'Network error.');
      setIsFetching(false);
    }
  };

  // ── Save Schedule ──────────────────────────────────────────────

  const handleSaveSchedule = async () => {
    setErrorMsg('');
    setIsSavingSchedule(true);
    try {
      const opt = SCHEDULE_OPTIONS.find(o => o.value === scheduleValue);
      const res = await fetch(`${BASE}/ftp/schedule`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          user_id:        userId,
          session_id:     sessionId,
          schedule_type:  opt?.type  || scheduleType,
          schedule_value: scheduleValue,
        }),
      });
      const json = await res.json();
      if (json.status === 'success') {
        setSuccessMsg(`Schedule saved. Next run: ${json.next_run || 'soon'}`);
        await loadSchedule();
      } else {
        setErrorMsg(json.message || 'Failed to save schedule.');
      }
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setIsSavingSchedule(false);
    }
  };

  // ── Delete Schedule ────────────────────────────────────────────

  const handleDeleteSchedule = async () => {
    setIsDeletingSchedule(true);
    try {
      await fetch(`${BASE}/ftp/schedule`, {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ user_id: userId, session_id: sessionId }),
      });
      setCurrentSchedule(null);
      setSuccessMsg('Schedule removed.');
    } catch { /* silent */ } finally {
      setIsDeletingSchedule(false);
    }
  };

  // ── Progress icon ──────────────────────────────────────────────

  const EventIcon = ({ type }: { type: string }) => {
    if (type === 'done')        return <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />;
    if (type === 'error' || type === 'file_error')
                                return <XCircle      className="w-3.5 h-3.5 text-red-500 shrink-0" />;
    if (type === 'warning')     return <AlertCircle  className="w-3.5 h-3.5 text-yellow-500 shrink-0" />;
    return                             <Clock        className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />;
  };

  // ─────────────────────────────────────────────────────────────────
  // RENDER: Form phase
  // ─────────────────────────────────────────────────────────────────

  if (phase === 'form') {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Host */}
          <div onMouseEnter={() => handleMouseEnter('ftp_host')}>
            <Input
              label="FTP Host"
              placeholder="ftp.example.com"
              value={formData.host}
              onChange={e => {
                setFormData({ ...formData, host: e.target.value });
                if (errors.host) setErrors(prev => ({ ...prev, host: '' }));
              }}
              onFocus={() => handleFocus('ftp_host')}
              error={errors.host}
              required
            />
          </div>

          {/* Port */}
          <div onMouseEnter={() => handleMouseEnter('ftp_port')}>
            <Input
              label="Port"
              placeholder="21"
              value={formData.port}
              onChange={e => setFormData({ ...formData, port: e.target.value })}
              onFocus={() => handleFocus('ftp_port')}
            />
          </div>

          {/* Username */}
          <div onMouseEnter={() => handleMouseEnter('ftp_username')}>
            <Input
              label="Username"
              placeholder="ftp_user"
              value={formData.username}
              onChange={e => {
                setFormData({ ...formData, username: e.target.value });
                if (errors.username) setErrors(prev => ({ ...prev, username: '' }));
              }}
              onFocus={() => handleFocus('ftp_username')}
              error={errors.username}
              required
            />
          </div>

          {/* Password */}
          <div onMouseEnter={() => handleMouseEnter('ftp_password')}>
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={formData.password}
              onChange={e => {
                setFormData({ ...formData, password: e.target.value });
                if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
              }}
              onFocus={() => handleFocus('ftp_password')}
              error={errors.password}
              required
              endIcon={
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
          </div>

          {/* Remote Dir */}
          <div className="md:col-span-2" onMouseEnter={() => handleMouseEnter('ftp_remote_dir')}>
            <Input
              label="Remote Directory"
              placeholder="/data/exports"
              value={formData.remote_dir}
              onChange={e => setFormData({ ...formData, remote_dir: e.target.value })}
              onFocus={() => handleFocus('ftp_remote_dir')}
            />
          </div>

          {/* Passive mode toggle */}
          <div className="md:col-span-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, passive_mode: !formData.passive_mode })}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                formData.passive_mode ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform transition-transform ${
                  formData.passive_mode ? 'translate-x-4' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm text-[var(--text-secondary)]">Passive mode (recommended)</span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium text-center">
            {errorMsg}
          </div>
        )}

        <div className="pt-2 flex justify-end gap-4">
          <Button variant="outline" onClick={onBack} disabled={isConnecting}>Cancel</Button>
          <Button className="px-8" onClick={handleConnect} disabled={isConnecting}>
            {isConnecting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Connecting…</>
            ) : (
              <><FolderOpen className="w-4 h-4 mr-2" />Connect to FTP</>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // RENDER: Connected phase — fetch + schedule
  // ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">

      {/* Success banner */}
      {successMsg && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium text-center">
          {errorMsg}
        </div>
      )}

      {/* ── Fetch Now ─────────────────────────────────────────── */}
      <div className="rounded-xl border border-[var(--border)] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Fetch Files Now</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Immediately pull all files from <code className="font-mono">{formData.remote_dir || '/'}</code>
            </p>
          </div>
          <Button
            onClick={handleFetch}
            disabled={isFetching}
            className="px-5 shrink-0"
          >
            {isFetching ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Fetching…</>
            ) : (
              <><Play className="w-4 h-4 mr-2" />Fetch Now</>
            )}
          </Button>
        </div>

        {/* Progress bar */}
        {(isFetching || fetchDone) && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-[var(--text-secondary)]">
              <span>{fetchDone ? 'Complete' : 'Downloading…'}</span>
              <span>{overallPercent}%</span>
            </div>
            <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  fetchDone ? 'bg-green-500' : 'bg-[var(--accent)]'
                }`}
                style={{ width: `${overallPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Progress log */}
        {progressEvents.length > 0 && (
          <div className="max-h-48 overflow-y-auto rounded-lg bg-[var(--surface-secondary,#f8f8f8)] border border-[var(--border)] p-3 space-y-1.5">
            {progressEvents.map((ev, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <EventIcon type={ev.type} />
                <span className={`flex-1 leading-snug ${
                  ev.type === 'error' || ev.type === 'file_error' ? 'text-red-600'
                  : ev.type === 'done' ? 'text-green-700 font-medium'
                  : 'text-[var(--text-secondary)]'
                }`}>
                  {ev.message || ev.file || ev.type}
                  {ev.size !== undefined && (
                    <span className="ml-1 text-[var(--text-secondary)]">
                      ({_formatBytes(ev.size)})
                    </span>
                  )}
                </span>
              </div>
            ))}
            <div ref={progressEndRef} />
          </div>
        )}
      </div>

      {/* ── Scheduler ─────────────────────────────────────────── */}
      <div className="rounded-xl border border-[var(--border)] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[var(--accent)]" />
          <p className="text-sm font-semibold">Recurring Schedule</p>
          {currentSchedule?.is_active && (
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
              Active
            </span>
          )}
        </div>

        {currentSchedule?.is_active && (
          <div className="text-xs text-[var(--text-secondary)] bg-[var(--surface-secondary,#f8f8f8)] rounded-lg p-3 border border-[var(--border)]">
            <span className="font-medium">Next run:</span>{' '}
            {currentSchedule.next_run
              ? new Date(currentSchedule.next_run).toLocaleString()
              : '—'}{' '}
            &nbsp;·&nbsp;
            <span className="font-medium">Interval:</span>{' '}
            {currentSchedule.schedule_value}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {SCHEDULE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setScheduleValue(opt.value); setScheduleType(opt.type); }}
              className={`text-left px-4 py-2.5 rounded-lg border text-sm transition-all ${
                scheduleValue === opt.value
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)] font-medium'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]/50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex gap-3 pt-1">
          <Button
            className="flex-1"
            onClick={handleSaveSchedule}
            disabled={isSavingSchedule}
          >
            {isSavingSchedule ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
            ) : (
              <><Calendar className="w-4 h-4 mr-2" />Save Schedule</>
            )}
          </Button>

          {currentSchedule?.is_active && (
            <Button
              variant="outline"
              className="px-4 text-red-500 border-red-200 hover:bg-red-50"
              onClick={handleDeleteSchedule}
              disabled={isDeletingSchedule}
            >
              {isDeletingSchedule
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Trash2 className="w-4 h-4" />
              }
            </Button>
          )}
        </div>
      </div>

      <div className="flex justify-start">
        <Button variant="outline" onClick={onBack}>Back to Connectors</Button>
      </div>
    </div>
  );
};

// ── Util ──────────────────────────────────────────────────────────────────────

function _formatBytes(bytes: number): string {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1048576)    return `${(bytes / 1024).toFixed(1)} KB`;
  return                         `${(bytes / 1048576).toFixed(1)} MB`;
}
