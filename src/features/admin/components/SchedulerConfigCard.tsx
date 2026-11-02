import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Clock, Save, Loader2, RefreshCw, AlertCircle, X } from "lucide-react";
import { adminService } from "../../../services/admin.service";

export const SchedulerConfigCard = () => {
  const [scheduleTime, setScheduleTime] = useState("19:00");
  const [frequency, setFrequency] = useState("daily");
  const [isActive, setIsActive] = useState(true);
  const [statusInfo, setStatusInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  // Auto-refresh status if sync is currently running in background
  useEffect(() => {
    if (statusInfo?.last_run_status === "running") {
      const interval = setInterval(() => {
        fetchConfig();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [statusInfo?.last_run_status]);

  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getSchedulerConfig();
      if (res?.status === "success" && res?.data) {
        const d = res.data;
        setScheduleTime(d.schedule_time || "19:00");
        setFrequency(d.frequency || "daily");
        setIsActive(d.is_active ?? true);
        setStatusInfo(d);
      }
    } catch (err) {
      console.error("Failed to load scheduler config", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerSyncNow = async () => {
    setIsSyncing(true);
    const toastId = toast.loading("Triggering live data synchronization in background...");
    try {
      const res = await adminService.runSchedulerNow();
      if (res?.status === "success") {
        toast.success("Live data sync triggered! Refreshing status...", { id: toastId });
        setTimeout(() => {
          fetchConfig();
        }, 2000);
      } else {
        toast.error(res?.message || "Failed to trigger sync", { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to trigger live sync", { id: toastId });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSave = async () => {
    if (!scheduleTime.trim()) {
      toast.error("Please enter a valid schedule time (HH:MM)");
      return;
    }
    setIsSaving(true);
    try {
      const res = await adminService.updateSchedulerConfig({
        schedule_time: scheduleTime,
        frequency,
        is_active: isActive
      });
      if (res?.status === "success") {
        toast.success("Scheduler configuration saved!");
        fetchConfig();
      } else {
        toast.error(res?.message || "Failed to update scheduler");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save scheduler settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Configuration Card */}
      <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-sm flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Key Metrics & Analytics Scheduler
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Automatically calculates heavy SAP HANA analytical views in the background and stores results in MySQL. Dashboard loads instantly (&lt;5ms) for all users without hitting live HANA on page mount.
              </p>
            </div>
          </div>

          <button
            onClick={fetchConfig}
            className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
            title="Refresh Status"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Schedule Time */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Daily Scheduled Time (24H)
            </label>
            <input
              type="time"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-sm font-mono text-[var(--text-primary)] focus:border-[var(--accent)] outline-none"
            />

          </div>

          {/* Frequency */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Execution Frequency
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-sm text-[var(--text-primary)] focus:border-[var(--accent)] outline-none cursor-pointer"
            >
              <option value="daily">Once a day (At Scheduled Time)</option>
              <option value="twice_daily">Twice a day (Every 12 Hours)</option>
              <option value="thrice_daily">3 times a day (Every 8 Hours)</option>
              <option value="hourly">Hourly (Every 60 Minutes)</option>
            </select>
            <span className="text-[11px] text-[var(--text-secondary)]">
              Controls how many times calculations run in background.
            </span>
          </div>

          {/* Active Switch */}
          <div className="flex flex-col gap-1.5 justify-center">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Scheduler Status
            </label>
            <div className="flex items-center gap-3 pt-1">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
              <span className={`text-xs font-semibold ${isActive ? "text-emerald-600" : "text-slate-400"}`}>
                {isActive ? "Active (Running)" : "Paused"}
              </span>
            </div>
          </div>
        </div>

          {/* Actions: Manual Trigger & Save Schedule */}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
            <button
              onClick={handleTriggerSyncNow}
              disabled={isSyncing}
              title="Trigger live data calculations immediately and refresh MySQL cache"
              className="px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/20 text-xs font-semibold transition-all flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Sync Live Data Now
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] text-xs font-semibold transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Schedule
            </button>
          </div>
        </div>

        {/* Live Status Summary Card */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Job Status with clickable error view */}
          <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] shadow-sm flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Job Status
            </span>
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${statusInfo?.last_run_status === "success" ? "bg-emerald-500" : statusInfo?.last_run_status === "failed" ? "bg-red-500" : statusInfo?.last_run_status === "running" ? "bg-blue-500 animate-pulse" : "bg-amber-400"}`}></span>
                  <span className="text-sm font-bold text-[var(--text-primary)] capitalize flex items-center gap-1.5">
                    {statusInfo?.last_run_status === "running" ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                        <span>Syncing (In Progress)...</span>
                      </>
                    ) : (
                      statusInfo?.last_run_status || "Idle"
                    )}
                  </span>
                </div>
                {statusInfo?.last_run_status === "failed" && (
                  <button
                    onClick={() => setShowErrorModal(true)}
                    className="text-[11px] text-red-600 hover:text-red-700 underline font-semibold flex items-center gap-1 cursor-pointer"
                    title="Click to view detailed error message"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                    View Log
                  </button>
                )}
              </div>
            </div>

            <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] shadow-sm flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Last Synced At
              </span>
              <span className="text-sm font-medium text-[var(--text-primary)] mt-1">
                {statusInfo?.last_run_at || "Never synced"}
              </span>
            </div>

            <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] shadow-sm flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Execution Duration
              </span>
              <span className="text-sm font-medium text-[var(--text-primary)] mt-1">
                {statusInfo?.last_run_duration_sec ? `${statusInfo.last_run_duration_sec}s` : "0.0s"}
              </span>
            </div>

            <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] shadow-sm flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Next Scheduled Run
              </span>
              <span className="text-sm font-medium text-[var(--accent)] mt-1">
                {statusInfo?.next_run_at || `Today at ${scheduleTime}`}
              </span>
            </div>
          </div>

          {/* Error Details Card / Modal when Failed */}
          {showErrorModal && (
            <div className="bg-red-50/80 border border-red-200 rounded-2xl p-5 flex flex-col gap-3 shadow-sm animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  Scheduler Sync Error Log
                </div>
                <button
                  onClick={() => setShowErrorModal(false)}
                  className="p-1 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-100 transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="bg-white/90 p-4 rounded-xl border border-red-100 font-mono text-xs text-red-950 overflow-x-auto max-h-60 whitespace-pre-wrap leading-relaxed">
                {statusInfo?.error_message || "Execution encountered an error during sync. Please verify server PM2 logs."}
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowErrorModal(false)}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
        );
};
