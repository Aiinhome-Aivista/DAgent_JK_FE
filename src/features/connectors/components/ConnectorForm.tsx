import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, Input, Button } from '@/src/ui-kit';
import { Server, Globe, ChevronLeft, Search, FileSpreadsheet, FileCode2, Network, BarChart3 } from 'lucide-react';
import { connectorService } from '@/src/services/connector.service';
import { useConnectorContext } from '../../../context/ConnectorContext';
import { useAuthContext } from '../../../context/AuthContext';

// Import Child Components
import { WebSearchForm } from './connector_form/WebSearchForm';
import { FileUploadForm } from './connector_form/FileUploadForm';
import { DatabaseForm } from './connector_form/DatabaseForm';
import { DAgentAssistant } from './connector_form/DAgentAssistant';
import { FtpForm } from './connector_form/FtpForm';          // ← FTP
import { TallyForm } from './connector_form/TallyForm';        // ← Tally ERP
import { FieldGuide, ConnectorFormData } from '@/src/types/connector';

const GUIDES: Record<string, FieldGuide> = {
  name: {
    title: "Data source Name",
    description: "Give your data source a unique name to identify it later.",
    tip: "Example: 'Production Postgres' or 'Marketing Data Warehouse'"
  },
  host: {
    title: "Server Host",
    description: "The IP address or domain name where your database is hosted.",
    tip: "If you're using a cloud provider, this is usually provided in their dashboard."
  },
  port: {
    title: "Port Number",
    description: "The communication port your database listens on.",
    tip: "Postgres usually uses 5432, MySQL uses 3306, and Snowflake uses 443."
  },
  database: {
    title: "Database Name",
    description: "The specific database you want to connect to within the server.",
    tip: "Make sure the user has permissions to access this specific database."
  },
  username: {
    title: "Username",
    description: "The database user account credentials.",
    tip: "We recommend using a read-only user for security best practices."
  },
  password: {
    title: "Password",
    description: "The password for the specified database user.",
    tip: "Your password is encrypted and stored securely using AES-256."
  },
  search: {
    title: "Web Search Query",
    description: "Enter keywords to search the live web for data and insights.",
    tip: "Use specific queries like 'Market trends for semiconductor industry 2024'"
  },
  schema: {
    title: "Database Schema (Optional)",
    description: "The specific schema to connect to within your database.",
    tip: "If left empty, all schemas are searched. Default schema for PostgreSQL is usually 'public'."
  },
  // ─── FTP guides ───────────────────────────────────────────────────────────
  ftp_host: {
    title: "FTP Server Host",
    description: "The hostname or IP address of the FTP server you want to connect to.",
    tip: "Example: 'ftp.example.com' or '192.168.1.100'"
  },
  ftp_port: {
    title: "FTP Port",
    description: "The port your FTP server listens on. Default is 21.",
    tip: "FTPS (explicit) often uses port 21; SFTP uses 22. Check with your server admin."
  },
  ftp_username: {
    title: "FTP Username",
    description: "The account used to authenticate with the FTP server.",
    tip: "Use a dedicated read-only FTP account for best security."
  },
  ftp_password: {
    title: "FTP Password",
    description: "Password for the FTP account.",
    tip: "Credentials are stored encrypted in the platform database."
  },
  ftp_remote_dir: {
    title: "Remote Directory",
    description: "The directory on the FTP server to fetch files from.",
    tip: "Use '/' for the root directory, or '/data/exports' for a specific folder."
  },
  // ─── Tally ERP guides ─────────────────────────────────────────────────────
  tally_name: {
    title: "Data Source Name",
    description: "A friendly label to identify this Tally connection in your dashboard.",
    tip: "Example: 'My Tally ERP' or 'Production Tally – FY26'"
  },
  tally_host: {
    title: "Tally Server Host",
    description: "The IP address or domain of the machine running Tally ERP with the XML gateway enabled.",
    tip: "Example: '43.kcloud.in' or '192.168.1.50'. Must be reachable from this server."
  },
  tally_port: {
    title: "Tally XML Port",
    description: "The port Tally's XML/HTTP gateway listens on (set in Gateway of Tally → Configuration).",
    tip: "Common values: 9000 (default), 9001, or a custom port like 43087."
  },
  tally_database: {
    title: "Database / Company Name",
    description: "The exact name of the Tally company (database) you want to connect to.",
    tip: "This must match the company name as it appears in Tally's Company Selection screen."
  },
  // ─── SSH guides ───────────────────────────────────────────────────────────
  ssh_host: {
    title: "SSH Host",
    description: "The hostname or IP address of the SSH server.",
    tip: "Example: 'ssh.example.com' or '192.168.1.100'"
  },
  ssh_port: {
    title: "SSH Port",
    description: "The port your SSH server listens on. Default is 22.",
    tip: "Usually 22, but check with your server admin if customized."
  },
  ssh_username: {
    title: "SSH Username",
    description: "The account used to authenticate with the SSH server.",
    tip: "Example: 'ubuntu' or 'ec2-user'"
  },
  ssh_password: {
    title: "SSH Password / Key",
    description: "Password for the SSH account or path to private key.",
    tip: "Will not be saved permanently for security."
  },
};

interface ConnectorFormProps {
  onBack: () => void;
  onTestSuccess?: (connectionName: string, shouldSwitchTab?: boolean) => void;
}

export const ConnectorForm = ({ onBack, onTestSuccess }: ConnectorFormProps) => {
  const { selectedConnector: connector, setSearchTopic } = useConnectorContext();

  const { userId } = useAuthContext();
  const [activeField, setActiveField] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [formData, setFormData] = useState<ConnectorFormData>({
    name: connector?.name || '',
    host: '',
    port: '',
    database: '',
    username: '',
    password: '',
    schema: ''
  });

  // ── FTP-specific form data ──────────────────────────────────────
  const [ftpFormData, setFtpFormData] = useState({
    name: connector?.name || 'FTP Connector',
    host: '',
    port: '21',
    username: '',
    password: '',
    remote_dir: '/',
    passive_mode: true,
  });

  // ── Tally ERP-specific form data ────────────────────────────────
  const [tallyFormData, setTallyFormData] = useState({
    name: '',
    host: '',
    port: '',
    database: '',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasResearched, setHasResearched] = useState(false);
  const [viewResults, setViewResults] = useState(false);
  const [selectedResultIds, setSelectedResultIds] = useState<Set<string>>(new Set());

  // File upload state from Context
  const {
    uploadedFiles, setUploadedFiles,
    isUploading, setIsUploading,
    uploadProgress, setUploadProgress,
    handleFileUploadConnect: handleContextUpload,
    resetConnectorState
  } = useConnectorContext();

  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFocus = (field: string) => setActiveField(field);
  const handleMouseEnter = (field: string) => setActiveField(field);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setErrorMsg('');
    try {
      const isHana = connector?.name?.toLowerCase().includes('hana') || false;
      const hostStr = formData.host?.trim() || '';
      const portNum = Number(formData.port);
      const isHanaCloud = isHana && (hostStr.toLowerCase().includes('hanacloud.ondemand.com') || portNum === 443);

      const payload: any = {
        user_id: userId,
        session_id: localStorage.getItem('DAgent_session_id'),
        name: formData.name?.trim(),
        type: connector?.name ? connector.name.toLowerCase().replace(/\s+/g, '_') : 'mysql',
        host: hostStr,
        port: portNum,
        username: formData.username?.trim(),
        password: formData.password,
        database: formData.database?.trim() || undefined,
        schema: formData.schema?.trim() || undefined,
        encrypt: isHanaCloud ? true : (formData.encrypt || false)
      };

      if (formData.use_ssh) {
        payload.ssh_host = formData.ssh_host;
        if (formData.ssh_port) payload.ssh_port = Number(formData.ssh_port);
        payload.ssh_username = formData.ssh_username;
        payload.ssh_password = formData.ssh_password;
      }

      const response: any = await connectorService.createConnector(payload);

      if (response.status === 'success') {
        onTestSuccess?.(formData.name);
      } else {
        const errorMsg = response.message;
        setErrorMsg(errorMsg || 'Connection failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Connection Error:', error);
      setErrorMsg(error.message || 'An error occurred during connection.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleWebSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setHasResearched(false);
    setViewResults(false);
    setErrorMsg('');
    try {
      const response = await connectorService.searchWeb(searchQuery, localStorage.getItem('DAgent_session_id'));
      if (response.status === 'success') {
        setSearchResults(response.results);
        setHasResearched(true);
        setSearchTopic(searchQuery);

        if (response.search_id) {
          localStorage.setItem('last_search_id', response.search_id);
        }
        if (response.topic) {
          localStorage.setItem('last_search_topic', response.topic);
        }

        const ids = response.results.map((r: any) => r.search_id || r.id || r.url);
        setSelectedResultIds(new Set(ids));

      } else {
        setErrorMsg('Search failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Search Error:', error);
      setErrorMsg(error.message || 'An error occurred during search.');
    } finally {
      setIsSearching(false);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedResultIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedResultIds(next);
  };

  const handleImport = async () => {
    if (selectedResultIds.size > 0) {
      const userId = localStorage.getItem('DAgent_user_id') || '1';
      const lastSearchId = localStorage.getItem('last_search_id') || '';
      const lastSearchTopic = localStorage.getItem('last_search_topic') || searchQuery;
      const selectedResults = searchResults.filter(r => selectedResultIds.has(r.id || r.url));

      try {
        await Promise.all(selectedResults.map(result =>
          connectorService.saveResult({
            user_id: userId,
            session_id: localStorage.getItem('DAgent_session_id') || '',
            search_id: lastSearchId,
            topic: lastSearchTopic,
            brief: result.brief,
            title: result.title,
            url: result.url
          })
        ));

        onTestSuccess?.(connector?.name || formData.name || 'Web Search Context', false);
      } catch (err) {
        console.error('Failed to save results:', err);
        setErrorMsg('Failed to save selected results. Please try again.');
      }
    }
  };

  const isWebSearch = connector?.name === 'Web Search using LLM';
  const isCsvUpload = connector?.name === 'Upload CSV File';
  const isSqlUpload = connector?.name === 'Upload SQL File';
  const isDocUpload = connector?.name === 'Upload Document';
  const isFileUpload = isCsvUpload || isSqlUpload || isDocUpload;
  const isFtp = connector?.name === 'FTP Connector';
  const isTally = connector?.name === 'Tally ERP';       // ← Tally ERP

  const acceptedFileTypes = isCsvUpload ? '.csv' : isSqlUpload ? '.sql' : isDocUpload ? '.pdf,.doc,.docx' : '';

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => {
      if (isCsvUpload) return f.name.endsWith('.csv');
      if (isSqlUpload) return f.name.endsWith('.sql');
      if (isDocUpload) return f.name.endsWith('.pdf') || f.name.endsWith('.doc') || f.name.endsWith('.docx');
      return false;
    });
    if (files.length === 0) {
      setErrorMsg(`Only ${isCsvUpload ? 'CSV' : isSqlUpload ? 'SQL' : 'Document (PDF/DOC/DOCX)'} files are allowed.`);
      return;
    }
    const existingNames = new Set(uploadedFiles.map(f => `${f.name}-${f.size}`));
    const newFiles = files.filter(f => !existingNames.has(`${f.name}-${f.size}`));

    if (newFiles.length < files.length) {
      setErrorMsg('Some duplicate files were skipped.');
      setTimeout(() => setErrorMsg(prev => prev === 'Some duplicate files were skipped.' ? '' : prev), 2000);
    } else {
      setErrorMsg('');
    }

    setUploadedFiles(prev => [...prev, ...newFiles]);

    if (userId && isUploading && newFiles.length > 0) {
      setTimeout(() => handleContextUpload(userId as number), 0);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const existingNames = new Set(uploadedFiles.map(f => `${f.name}-${f.size}`));
    const newFiles = files.filter(f => !existingNames.has(`${f.name}-${f.size}`));

    if (newFiles.length < files.length) {
      setErrorMsg('Some duplicate files were skipped.');
      setTimeout(() => setErrorMsg(prev => prev === 'Some duplicate files were skipped.' ? '' : prev), 2000);
    } else {
      setErrorMsg('');
    }

    setUploadedFiles(prev => [...prev, ...newFiles]);
    e.target.value = '';

    if (userId && isUploading && newFiles.length > 0) {
      setTimeout(() => handleContextUpload(userId as number), 0);
    }
  };

  const removeFile = (idx: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleFileUploadConnect = async () => {
    if (!userId || !localStorage.getItem("DAgent_session_id")) {
      setErrorMsg('Authentication error. Please log in again.');
      return;
    }
    try {
      await handleContextUpload(userId as number);
    } catch (err: any) {
      console.error('Upload Error:', err);
      setErrorMsg(err.message || 'An error occurred during upload.');
    }
  };

  // Reactive Navigation after upload completion
  useEffect(() => {
    if (isFileUpload && !isUploading && uploadedFiles.length > 0) {
      const allDone = uploadedFiles.every(file => (uploadProgress[file.name] || 0) === 100);

      if (allDone) {
        const connName = connector?.name || 'File Upload';
        const timer = setTimeout(() => {
          resetConnectorState();
          onTestSuccess?.(connName, false);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [isUploading, uploadedFiles, uploadProgress, isFileUpload, onTestSuccess, connector?.name, resetConnectorState]);


  const guide = activeField ? GUIDES[activeField] : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start h-full min-h-0 pb-4">
      <div className="lg:col-span-2 flex flex-col h-full min-h-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-4 group shrink-0"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Connectors
        </button>

        <Card className="border-[var(--border)] shadow-xl flex flex-col min-h-0 flex-1">
          <CardHeader className="border-b border-[var(--border)] p-6 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
                {isWebSearch ? (
                  <div className="relative">
                    <Globe className="w-6 h-6" />
                    <Search className="w-3.5 h-3.5 absolute -bottom-1 -right-1" />
                  </div>
                ) : isCsvUpload ? (
                  <FileSpreadsheet className="w-6 h-6" />
                ) : isSqlUpload ? (
                  <FileCode2 className="w-6 h-6" />
                ) : isFtp ? (
                  <Network className="w-6 h-6" />
                ) : isTally ? (
                  <BarChart3 className="w-6 h-6 text-amber-400" />
                ) : (
                  <Server className="w-6 h-6" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {connector ? `Connect to ${connector.name}` : 'New Data source'}
                </h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  {isWebSearch
                    ? 'Identify live data for AI analysis'
                    : isFileUpload
                      ? `Upload ${isCsvUpload ? 'CSV' : isSqlUpload ? 'SQL' : 'Document'} files for AI analysis`
                      : isFtp
                        ? 'Fetch files from an FTP server with scheduled sync'
                        : isTally
                          ? 'Connect to Tally ERP via XML API gateway'
                          : 'Configure your data source settings'}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium text-center">
                {errorMsg}
              </div>
            )}

            {/* Data source name field — hidden for file uploads, FTP and Tally (they manage their own name field) */}
            {!isFileUpload && !isFtp && !isTally && (
              <div onMouseEnter={() => handleMouseEnter('name')} className="mb-6">
                <Input
                  label="Data source Name"
                  placeholder="e.g. Production Postgres"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  onFocus={() => handleFocus('name')}
                  required
                />
              </div>
            )}

            {/* ── Render the right sub-form ─────────────────────── */}
            {isWebSearch ? (
              <WebSearchForm
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                handleFocus={handleFocus}
                handleMouseEnter={handleMouseEnter}
                handleWebSearch={handleWebSearch}
                isSearching={isSearching}
                hasResearched={hasResearched}
                viewResults={viewResults}
                setViewResults={setViewResults}
                setHasResearched={setHasResearched}
                searchResults={searchResults}
                selectedResultIds={selectedResultIds}
                toggleSelect={toggleSelect}
                handleImport={handleImport}
              />
            ) : isFileUpload ? (
              <FileUploadForm
                isCsvUpload={isCsvUpload}
                isSqlUpload={isSqlUpload}
                isDocUpload={isDocUpload}
                isDragging={isDragging}
                setIsDragging={setIsDragging}
                handleFileDrop={handleFileDrop}
                handleFileInput={handleFileInput}
                acceptedFileTypes={acceptedFileTypes}
                uploadedFiles={uploadedFiles}
                setUploadedFiles={setUploadedFiles}
                removeFile={removeFile}
                uploadProgress={uploadProgress}
                handleFileUploadConnect={handleFileUploadConnect}
                isUploading={isUploading}
                onBack={onBack}
              />
            ) : isFtp ? (
              // ── FTP Form ──────────────────────────────────────────
              <FtpForm
                formData={ftpFormData}
                setFormData={setFtpFormData}
                handleFocus={handleFocus}
                handleMouseEnter={handleMouseEnter}
                onBack={onBack}
                userId={userId as number | null}
                sessionId={localStorage.getItem('DAgent_session_id')}
                onConnectSuccess={() => onTestSuccess?.(ftpFormData.name, false)}
              />
            ) : isTally ? (
              // ── Tally ERP Form ────────────────────────────────────
              <TallyForm
                formData={tallyFormData}
                setFormData={setTallyFormData}
                handleFocus={handleFocus}
                handleMouseEnter={handleMouseEnter}
                onBack={onBack}
                userId={userId as number | null}
                sessionId={localStorage.getItem('DAgent_session_id')}
                onConnectSuccess={() => onTestSuccess?.(tallyFormData.name, false)}
              />
            ) : (
              <DatabaseForm
                formData={formData}
                setFormData={setFormData}
                handleFocus={handleFocus}
                handleMouseEnter={handleMouseEnter}
                handleTestConnection={handleTestConnection}
                isTesting={isTesting}
                onBack={onBack}
                isPostgreSQL={connector?.name === 'PostgreSQL'}
                isSnowflake={connector?.name === 'Snowflake'}
                isHana={connector?.name === 'SAP HANA'}
                connectorName={connector?.name}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <DAgentAssistant guide={guide} activeField={activeField} />
    </div>
  );
};
