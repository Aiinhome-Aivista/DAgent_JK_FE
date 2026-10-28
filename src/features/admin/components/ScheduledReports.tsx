import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Mail, Trash2, Send, FileText, X, Plus, Edit2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { scheduleService, ScheduledReport, Recipient, Workspace } from '../../../services/schedule.service';
import { Captcha } from '../../../ui-kit';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface ScheduledReportsProps {
    searchQuery: string;
    isModalOpen: boolean;
    setIsModalOpen: (open: boolean) => void;
}

export const ScheduledReports: React.FC<ScheduledReportsProps> = ({ searchQuery, isModalOpen, setIsModalOpen }) => {
    // State
    const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]); // Store all users
    const [recipients, setRecipients] = useState<any[]>([]); // This will now hold either all users or filtered users
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const mockReports = scheduleService.getReportOptions();

    // Form State
    const getCurrentTime = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 5);
        return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    };

    const getCurrentDay = () => {
        const today = new Date();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[today.getDay()];
    };

    const [selectedRecipientId, setSelectedRecipientId] = useState('');
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
    const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
    const [selectedDays, setSelectedDays] = useState<string[]>([getCurrentDay()]);
    const [time, setTime] = useState(getCurrentTime());
    const [editId, setEditId] = useState<number | null>(null);
    const [isReportsDropdownOpen, setIsReportsDropdownOpen] = useState(false);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [scheduleToDelete, setScheduleToDelete] = useState<number | null>(null);
    const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
    const [isCaptchaValid, setIsCaptchaValid] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [schedulesRes, workspacesRes, usersRes] = await Promise.all([
                scheduleService.getSchedules(),
                scheduleService.getWorkspaces(),
                scheduleService.getAllUsers()
            ]);
            if (schedulesRes.status === 'success') setScheduledReports(schedulesRes.data || []);
            
            if (usersRes.status === 'success' && usersRes.users) {
                const filteredUsers = usersRes.users.filter((u: any) => u.id !== 1);
                setAllUsers(filteredUsers);
                if (!selectedWorkspaceId) setRecipients(filteredUsers);
            }

            if (workspacesRes.status === 'success') setWorkspaces(workspacesRes.workspaces || workspacesRes.data || []);
        } catch (error) {
            toast.error('Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredSchedules = scheduledReports.filter(s => {
        if (s.recipient_id === 1) return false; // Hide schedules assigned to admin
        
        const email = s.recipient_email || '';
        const workspaceName = s.workspace_name || workspaces?.find(w => w.id === s.workspace_id)?.name || '';
        return email?.toLowerCase().includes(searchQuery?.toLowerCase() || '') ||
            workspaceName?.toLowerCase().includes(searchQuery?.toLowerCase() || '');
    });

    // Fetch users when a workspace is selected
    useEffect(() => {
        if (selectedWorkspaceId) {
            scheduleService.getWorkspaceUsers(parseInt(selectedWorkspaceId)).then(res => {
                const usersList = res.users || res.assigned_users;
                if (res.status === 'success' && usersList) {
                    setRecipients(usersList.filter((u: any) => u.id !== 1));
                } else {
                    setRecipients([]);
                }
            }).catch(() => setRecipients([]));
        } else {
            setRecipients(allUsers);
        }
    }, [selectedWorkspaceId, allUsers]);

    const handleToggleDay = (day: string) => {
        setSelectedDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const handleAddSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitAttempted(true);
        if (!selectedRecipientId || !selectedWorkspaceId || selectedDays.length === 0 || !time) {
            return;
        }

        setIsSubmitting(true);
        try {
            if (editId) {
                const res = await scheduleService.updateSchedule(editId, {
                    recipient_id: parseInt(selectedRecipientId),
                    workspace_id: parseInt(selectedWorkspaceId),
                    report_ids: selectedReportIds,
                    days: selectedDays,
                    time
                });

                if (res.status === 'success') {
                    toast.success('Schedule updated successfully');
                    fetchData(); // reload
                    closeModal();
                } else {
                    toast.error(res.message || 'Failed to update schedule');
                }
            } else {
                const res = await scheduleService.addSchedule({
                    recipient_id: parseInt(selectedRecipientId),
                    workspace_id: parseInt(selectedWorkspaceId),
                    report_ids: selectedReportIds,
                    days: selectedDays,
                    time
                });

                if (res.status === 'success') {
                    toast.success('Schedule created successfully');
                    fetchData(); // reload
                    closeModal();
                } else {
                    toast.error(res.message || 'Failed to create schedule');
                }
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || `Failed to ${editId ? 'update' : 'create'} schedule`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (schedule: ScheduledReport) => {
        setSelectedRecipientId(schedule.recipient_id.toString());
        setSelectedWorkspaceId(schedule.workspace_id ? schedule.workspace_id.toString() : '');
        setSelectedReportIds(Array.isArray(schedule.report_ids) ? schedule.report_ids : []);
        setSelectedDays(schedule.days);
        setTime(schedule.time || '09:00');
        setEditId(schedule.id);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedRecipientId('');
        setSelectedWorkspaceId('');
        setSelectedReportIds([]);
        setSelectedDays([getCurrentDay()]);
        setTime(getCurrentTime());
        setEditId(null);
        setIsModalOpen(false);
        setIsReportsDropdownOpen(false);
        setSubmitAttempted(false);
    };

    const handleDeleteSchedule = async () => {
        if (!scheduleToDelete) return;
        try {
            const res = await scheduleService.deleteSchedule(scheduleToDelete);
            if (res.status === 'success') {
                setScheduledReports(prev => prev.filter(s => s.id !== scheduleToDelete));
                toast.success('Schedule removed');
            } else {
                toast.error(res.message || 'Failed to delete schedule');
            }
        } catch (error) {
            toast.error('Failed to delete schedule');
        } finally {
            setScheduleToDelete(null);
            setDeleteConfirmationText("");
            setIsCaptchaValid(false);
        }
    };

    const getReportName = (id: string, name?: string) => name || mockReports.find(r => r.id === id)?.name || 'Unknown Report';
    const getRecipientEmail = (id: number, email?: string) => email || 'Unknown Email';
    const getRecipientName = (id: number, name?: string) => name || 'Unknown Name';

    const formatTimeToAMPM = (timeStr?: string) => {
        if (!timeStr) return '';
        const [hours, minutes] = timeStr.split(':');
        let h = parseInt(hours, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12; // '0' becomes '12'
        return `${h.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    };

    return (
        <div className="space-y-4">
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm">
                <DataTable
                    value={filteredSchedules}
                    paginator
                    rows={5}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    emptyMessage={<div className="p-8 text-center text-[var(--text-secondary)]">{isLoading ? 'Loading...' : 'No data found.'}</div>}
                    className="w-full text-left"
                    pt={{
                        thead: { className: 'bg-[var(--bg)] border-b border-[var(--border)]' },
                        tbody: { className: 'bg-[var(--surface)]' },
                        bodyRow: { className: 'hover:bg-[var(--surface-hover)] transition-colors border-b border-[var(--border)]' },
                        paginator: {
                            root: { className: '!bg-[var(--surface)] !border-t !border-[var(--border)] !py-3 !px-4 !flex !items-center !justify-center !gap-1' },
                            pages: { className: '!flex !items-center !gap-1' },
                            firstPageButton: ({ context }: any) => ({
                                className: `!w-9 !h-9 !rounded-lg !border !border-transparent !transition-colors !flex !items-center !justify-center ${context.disabled ? '!opacity-50 !cursor-not-allowed !text-[var(--text-secondary)]' : 'hover:!bg-[var(--surface-hover)] hover:!text-[var(--text-primary)] !text-[var(--text-secondary)] hover:!border-[var(--border)]'}`,
                            }),
                            prevPageButton: ({ context }: any) => ({
                                className: `!w-9 !h-9 !rounded-lg !border !border-transparent !transition-colors !flex !items-center !justify-center ${context.disabled ? '!opacity-50 !cursor-not-allowed !text-[var(--text-secondary)]' : 'hover:!bg-[var(--surface-hover)] hover:!text-[var(--text-primary)] !text-[var(--text-secondary)] hover:!border-[var(--border)]'}`,
                            }),
                            nextPageButton: ({ context }: any) => ({
                                className: `!w-9 !h-9 !rounded-lg !border !border-transparent !transition-colors !flex !items-center !justify-center ${context.disabled ? '!opacity-50 !cursor-not-allowed !text-[var(--text-secondary)]' : 'hover:!bg-[var(--surface-hover)] hover:!text-[var(--text-primary)] !text-[var(--text-secondary)] hover:!border-[var(--border)]'}`,
                            }),
                            lastPageButton: ({ context }: any) => ({
                                className: `!w-9 !h-9 !rounded-lg !border !border-transparent !transition-colors !flex !items-center !justify-center ${context.disabled ? '!opacity-50 !cursor-not-allowed !text-[var(--text-secondary)]' : 'hover:!bg-[var(--surface-hover)] hover:!text-[var(--text-primary)] !text-[var(--text-secondary)] hover:!border-[var(--border)]'}`,
                            }),
                            pageButton: ({ context }: any) => ({
                                className: `!w-9 !h-9 !rounded-lg !transition-colors !flex !items-center !justify-center text-sm ${context.active
                                    ? '!bg-[var(--accent)] !text-white !font-semibold'
                                    : 'hover:!bg-[var(--surface-hover)] hover:!text-[var(--text-primary)] !text-[var(--text-secondary)] hover:!border-[var(--border)] !border !border-transparent'
                                    }`
                            }),
                            RPPDropdown: {
                                root: { className: '!bg-[var(--surface)] !border !border-[var(--border)] hover:!border-[var(--accent)] !rounded-lg !px-2 !py-1 text-sm !text-[var(--text-primary)] !flex !items-center !gap-1.5 !cursor-pointer !outline-none !transition-colors' },
                                input: { className: '!px-1 !font-medium' },
                                trigger: { className: '!w-5 !text-[var(--text-secondary)] !flex !items-center !justify-center' },
                                panel: { className: '!bg-[var(--surface)] !border border-[var(--border)] !rounded-lg !shadow-lg !py-1 !mt-1 !z-50' },
                                item: ({ context }: any) => ({
                                    className: `!px-4 !py-2 text-sm !cursor-pointer !transition-colors ${context.selected
                                        ? '!bg-[var(--accent)] !text-white !font-semibold'
                                        : 'hover:!bg-[var(--surface-hover)] !text-[var(--text-primary)]'
                                        }`
                                })
                            }
                        }
                    }}
                >
                    <Column
                        header="SL No"
                        headerClassName="p-4 font-semibold text-xs text-[var(--text-secondary)] uppercase tracking-wider bg-[var(--bg)]/50"
                        className="p-4 text-sm text-[var(--text-secondary)] font-medium"
                        body={(rowData: any, options: any) => options.rowIndex + 1}
                        style={{ width: '10%' }}
                    />
                    <Column
                        header="Report"
                        headerClassName="p-4 font-semibold text-xs text-[var(--text-secondary)] uppercase tracking-wider bg-[var(--bg)]/50"
                        className="p-4 text-sm font-medium text-[var(--text-primary)]"
                        style={{ width: '25%' }}
                        body={(schedule: ScheduledReport) => (
                            (schedule.report_ids || []).length > 0
                                ? schedule.report_ids.map(id => mockReports.find(r => r.id === id)?.name || id).join(', ')
                                : <span className="text-gray-400 italic">No reports selected</span>
                        )}
                    />
                    <Column
                        header="Recipient"
                        headerClassName="p-4 font-semibold text-xs text-[var(--text-secondary)] uppercase tracking-wider bg-[var(--bg)]/50"
                        className="p-4 text-sm text-[var(--text-secondary)]"
                        style={{ width: '25%' }}
                        body={(schedule: ScheduledReport) => (
                            <div className="flex flex-col justify-center">
                                <span className="font-medium text-[var(--text-primary)] truncate">{getRecipientName(schedule.recipient_id, schedule.recipient_name)}</span>
                                <div className="text-xs">
                                    <span className="truncate">{getRecipientEmail(schedule.recipient_id, schedule.recipient_email)}</span>
                                </div>
                            </div>
                        )}
                    />
                    <Column
                        header="Schedule"
                        headerClassName="p-4 font-semibold text-xs text-[var(--text-secondary)] uppercase tracking-wider bg-[var(--bg)]/50"
                        className="p-4 text-sm text-[var(--text-secondary)] text-xs space-y-1"
                        style={{ width: '25%' }}
                        body={(schedule: ScheduledReport) => (
                            <>
                                <div className="font-medium text-[var(--text-primary)] mb-1">
                                    {formatTimeToAMPM(schedule.time)}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {schedule.days.map(day => (
                                        <span key={day} className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--bg)] border border-[var(--border)]">
                                            {day.substring(0, 3)}
                                        </span>
                                    ))}
                                </div>
                            </>
                        )}
                    />
                    <Column
                        header="Actions"
                        headerClassName="p-4 font-semibold text-xs text-[var(--text-secondary)] uppercase tracking-wider bg-[var(--bg)]/50 text-right"
                        className="p-4 text-sm text-right"
                        style={{ width: '15%' }}
                        body={(schedule: ScheduledReport) => (
                            <div className="flex gap-1 justify-end">
                                <button
                                    onClick={() => handleEditClick(schedule)}
                                    className="p-1.5 text-[var(--text-secondary)] hover:text-blue-500 rounded-lg hover:bg-blue-500/10 transition-colors"
                                    title="Edit Schedule"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => {
                                        setScheduleToDelete(schedule.id);
                                        setDeleteConfirmationText("");
                                        setIsCaptchaValid(false);
                                    }}
                                    className="p-1.5 text-rose-500 rounded-lg hover:bg-rose-500/10 transition-colors"
                                    title="Delete Schedule"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    />
                </DataTable>
            </div>

            {/* Create Schedule Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-3xl my-8">
                        <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
                            <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                                <Plus className="w-5 h-5 text-[var(--accent)]" />
                                {editId ? 'Edit Schedule' : 'Create New Schedule'}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors text-[var(--text-secondary)]"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddSchedule} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Select Workspace */}
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-semibold text-[var(--text-primary)]">Select Target Workspace <span className="text-rose-500">*</span></label>
                                    <select
                                        value={selectedWorkspaceId}
                                        onChange={(e) => {
                                            setSelectedWorkspaceId(e.target.value);
                                            setSelectedRecipientId(''); // Reset user when workspace changes
                                        }}
                                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                                    >
                                        <option value="" disabled>Choose a workspace...</option>
                                        {workspaces.map(w => (
                                            <option key={w.id} value={w.id}>{w.name}</option>
                                        ))}
                                    </select>
                                    {workspaces.length === 0 && (
                                        <p className="text-xs text-amber-500 mt-1">No workspaces found.</p>
                                    )}
                                    {submitAttempted && !selectedWorkspaceId && (
                                        <p className="text-xs text-rose-500 mt-1">Please select a workspace.</p>
                                    )}
                                </div>

                                {/* Select Recipient */}
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-semibold text-[var(--text-primary)]">Select User (Recipient) <span className="text-rose-500">*</span></label>
                                    <select
                                        value={selectedRecipientId}
                                        onChange={(e) => setSelectedRecipientId(e.target.value)}
                                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                                    >
                                        <option value="" disabled>Choose a user...</option>
                                        {recipients.map((r: any) => (
                                            <option key={r.id} value={r.id}>{r.username || r.name} ({r.email})</option>
                                        ))}
                                        {/* Fallback option if the selected user is not in the workspace users list but exists in allUsers */}
                                        {selectedRecipientId && !recipients.some((r: any) => r.id.toString() === selectedRecipientId.toString()) && (
                                            (() => {
                                                const u = allUsers.find((u: any) => u.id.toString() === selectedRecipientId.toString());
                                                return u ? <option key={u.id} value={u.id}>{u.username || u.name} ({u.email})</option> : null;
                                            })()
                                        )}
                                    </select>
                                    {recipients.length === 0 && (
                                        <p className="text-xs text-amber-500 mt-1">
                                            {selectedWorkspaceId ? "No users found for this workspace." : "No users found."}
                                        </p>
                                    )}
                                    {submitAttempted && !selectedRecipientId && (
                                        <p className="text-xs text-rose-500 mt-1">Please select a user.</p>
                                    )}
                                </div>

                                {/* Select Reports */}
                                <div className="space-y-1.5 relative">
                                    <label className="block text-sm font-semibold text-[var(--text-primary)]">Select Reports</label>

                                    <div
                                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] cursor-pointer flex justify-between items-center"
                                        onClick={() => setIsReportsDropdownOpen(!isReportsDropdownOpen)}
                                    >
                                        <span className="truncate">
                                            {!Array.isArray(selectedReportIds) || selectedReportIds.length === 0
                                                ? "Choose reports..."
                                                : `${selectedReportIds.length} report(s) selected`}
                                        </span>
                                        <svg className={`w-4 h-4 transition-transform ${isReportsDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </div>

                                    {isReportsDropdownOpen && (
                                        <div className="absolute z-10 w-full mt-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                            <div className="p-2 space-y-1">
                                                {mockReports.map(report => (
                                                    <label key={report.id} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-[var(--surface-hover)] transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            className="w-4 h-4 accent-[var(--accent)] rounded border-[var(--border)]"
                                                            checked={Array.isArray(selectedReportIds) && selectedReportIds.includes(report.id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedReportIds(prev => Array.isArray(prev) ? [...prev, report.id] : [report.id]);
                                                                } else {
                                                                    setSelectedReportIds(prev => Array.isArray(prev) ? prev.filter(id => id !== report.id) : []);
                                                                }
                                                            }}
                                                        />
                                                        <span className="text-sm text-[var(--text-primary)]">{report.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Select Time */}
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-semibold text-[var(--text-primary)]">Delivery Time (IST) <span className="text-rose-500">*</span></label>
                                    <input
                                        type="time"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                                    />
                                    {submitAttempted && !time && (
                                        <p className="text-xs text-rose-500 mt-1">Please select a delivery time.</p>
                                    )}
                                </div>

                                {/* Select Days */}
                                <div className="space-y-2 md:col-span-2">
                                    <label className="block text-sm font-semibold text-[var(--text-primary)]">Select Days <span className="text-rose-500">*</span></label>
                                    <div className="flex flex-wrap gap-2">
                                        {DAYS_OF_WEEK.map(day => {
                                            const isSelected = selectedDays.includes(day);
                                            return (
                                                <button
                                                    type="button"
                                                    key={day}
                                                    onClick={() => handleToggleDay(day)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${isSelected
                                                            ? 'bg-[var(--accent)]/10 border-[var(--accent)]/30 text-[var(--accent)]'
                                                            : 'bg-[var(--bg)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]'
                                                        }`}
                                                >
                                                    {day}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {submitAttempted && selectedDays.length === 0 && (
                                        <p className="text-xs text-rose-500 mt-1">Please select at least one day.</p>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 flex items-center gap-3 border-t border-[var(--border)]">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-[2] py-2.5 text-sm font-medium rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />)}
                                    {editId ? 'Update Schedule' : 'Create Schedule'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {scheduleToDelete !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xl max-w-md w-full mx-4">
                        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                            Delete Schedule
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">
                            Are you sure you want to delete this schedule? This action cannot be undone. Please type{" "}
                            <span className="font-bold text-[var(--text-primary)] select-all">DELETE</span>{" "}
                            to confirm.
                        </p>

                        <input
                            autoFocus
                            type="text"
                            value={deleteConfirmationText}
                            onChange={(e) => setDeleteConfirmationText(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] mb-4"
                            placeholder={`Type 'DELETE' here...`}
                        />

                        <div className="mb-6">
                            <Captcha onValidate={setIsCaptchaValid} expireTimeMs={60000} />
                        </div>

                        <div className="flex justify-between items-center">
                            <button
                                onClick={() => {
                                    setScheduleToDelete(null);
                                    setDeleteConfirmationText("");
                                    setIsCaptchaValid(false);
                                }}
                                className="px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteSchedule}
                                disabled={
                                    deleteConfirmationText !== "DELETE" ||
                                    !isCaptchaValid
                                }
                                className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
