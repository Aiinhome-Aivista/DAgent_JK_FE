import { useState } from 'react';
import { Input, Button } from '@/src/ui-kit';
import { Loader2, CheckCircle2, XCircle, BarChart3 } from 'lucide-react';
import { connectorService } from '@/src/services/connector.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TallyFormData {
    name: string;
    host: string;
    port: string;
    database: string;
}

interface TallyFormProps {
    formData: TallyFormData;
    setFormData: (d: TallyFormData) => void;
    handleFocus: (field: string) => void;
    handleMouseEnter: (field: string) => void;
    onBack: () => void;
    userId: number | null;
    sessionId: string | null;
    onConnectSuccess: () => void;
}

// ─── TallyForm ────────────────────────────────────────────────────────────────

export const TallyForm = ({
    formData, setFormData,
    handleFocus, handleMouseEnter,
    onBack, userId, sessionId, onConnectSuccess,
}: TallyFormProps) => {

    const [isConnecting, setIsConnecting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // ── Validation ─────────────────────────────────────────────────────────────

    const validate = (): string | null => {
        if (!formData.name.trim()) return 'Data source name is required.';
        if (!formData.host.trim()) return 'Tally server host is required.';
        const portNum = Number(formData.port);
        if (!formData.port || isNaN(portNum) || portNum < 1 || portNum > 65535)
            return 'Please enter a valid port number (1 – 65535).';
        if (!formData.database.trim()) return 'Database / Company name is required.';
        return null;
    };

    // ── Connect ─────────────────────────────────────────────────────────────────

    const handleConnect = async () => {
        const err = validate();
        if (err) { setErrorMsg(err); return; }

        setIsConnecting(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const payload = {
                user_id: userId,
                session_id: sessionId,
                name: formData.name.trim(),
                type: 'tally',          // matched by elif db_type == 'tally' in connector_controllers.py
                host: formData.host.trim(),
                port: Number(formData.port),
                database: formData.database.trim(),
            };

            const response: any = await connectorService.createConnector(payload);

            if (response?.status === 'success') {
                setSuccessMsg('Connected to Tally ERP successfully!');
                setTimeout(() => onConnectSuccess(), 1000);
            } else {
                setErrorMsg(response?.message || 'Connection failed. Please check your Tally server settings.');
            }
        } catch (error: any) {
            console.error('Tally Connect Error:', error);
            setErrorMsg(error?.message || 'An error occurred while connecting to Tally ERP.');
        } finally {
            setIsConnecting(false);
        }
    };

    // ── Render ──────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">

            {/* ── Tally ERP info banner ─────────────────────────────────────────── */}
            <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-400/30 bg-amber-500/5">
                <BarChart3 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-semibold text-amber-300 mb-0.5">Tally ERP XML Gateway</p>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        Make sure Tally is running and the XML server is enabled on the specified host and port.
                        The <span className="text-amber-300 font-medium">TDL/TCP XML gateway</span> must be active.
                    </p>
                </div>
            </div>

            {/* ── Status messages ───────────────────────────────────────────────── */}
            {errorMsg && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-400/30 text-red-400 rounded-xl text-xs font-medium">
                    <XCircle className="w-4 h-4 shrink-0" />
                    {errorMsg}
                </div>
            )}
            {successMsg && (
                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-400/30 text-emerald-400 rounded-xl text-xs font-medium">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    {successMsg}
                </div>
            )}

            {/* ── Form fields ───────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Data source name — spans full width */}
                <div className="md:col-span-2" onMouseEnter={() => handleMouseEnter('tally_name')}>
                    <Input
                        label="Data Source Name"
                        placeholder="My Tally ERP"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        onFocus={() => handleFocus('tally_name')}
                        required
                    />
                </div>

                {/* Host */}
                <div onMouseEnter={() => handleMouseEnter('tally_host')}>
                    <Input
                        label="Tally Server Host"
                        placeholder="43.kcloud.in"
                        value={formData.host}
                        onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                        onFocus={() => handleFocus('tally_host')}
                        required
                    />
                </div>

                {/* Port */}
                <div onMouseEnter={() => handleMouseEnter('tally_port')}>
                    <Input
                        label="Port"
                        placeholder="43087"
                        type="number"
                        value={formData.port}
                        onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                        onFocus={() => handleFocus('tally_port')}
                        required
                    />
                </div>

                {/* Database / Company */}
                <div className="md:col-span-2" onMouseEnter={() => handleMouseEnter('tally_database')}>
                    <Input
                        label="Database / Company Name"
                        placeholder="Test"
                        value={formData.database}
                        onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                        onFocus={() => handleFocus('tally_database')}
                        required
                    />
                </div>
            </div>



            {/* ── Action buttons ────────────────────────────────────────────────── */}
            <div className="pt-2 flex justify-end gap-4">
                <Button variant="outline" onClick={onBack} disabled={isConnecting}>
                    Cancel
                </Button>
                <Button
                    className="px-8"
                    onClick={handleConnect}
                    disabled={isConnecting}
                >
                    {isConnecting ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Connecting…
                        </>
                    ) : (
                        'Connect to Tally ERP'
                    )}
                </Button>
            </div>
        </div>
    );
};
