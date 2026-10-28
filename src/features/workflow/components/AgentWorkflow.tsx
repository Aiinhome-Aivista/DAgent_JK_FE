// import { useState, useEffect, useRef } from 'react';
// import { AgentData, AgentHistoryItem } from '../types';
// import { Card, CardContent, CardHeader, Badge, Button } from '@/src/ui-kit';
// import { motion, AnimatePresence } from 'motion/react';
// import { Database, Server, BarChart3, MessageSquare, Sparkles, CheckCircle2, Loader2, Clock, Play, RotateCcw, ArrowRight, ChevronRight, Globe, Search, Trash2 } from 'lucide-react';
// import { agentService } from '@/src/services/agent.service';

// import { ConnectorList } from '../../connectors/components/ConnectorList';
// import { Connector } from '../../connectors/types';
// import { ChatWindow } from '../../chat/components/ChatWindow';
// import { useConnectorContext } from '../../../context/ConnectorContext';
// import { useAuthContext } from '../../../context/AuthContext';
// import { connectorService } from '@/src/services/connector.service';

// interface AgentWorkflowProps {
//   onComplete: () => void;
//   compact?: boolean;
//   defaultAgentId?: string;
//   onChangeTab?: (tabId: string) => void;
//   onNewConnector?: () => void;
//   onForwardWithContext?: (agentId: string, context: string) => void;
//   onCreateWorkspaceFromSummary?: (summary: string) => void;
//   onNewSessionCreated?: () => void;
//   initialChatMessage?: string;
//   sessionId?: string;
//   workspaceName?: string;
// }

// import { HistoryItemCard } from './HistoryItemCard';
// import { AgentStepper, getAgentIcon } from './AgentStepper';
// import { IngestDataView } from './IngestDataView';
// import { DashboardKPIs, graphPanelItems, GraphSidePanel, DashboardGraphs } from '../../dashboard/components/DashboardCharts';

// const formatInsightsText = (text: string) => {
//   if (typeof text !== 'string') return JSON.stringify(text, null, 2);

//   let processed = text.replace(
//     /\[([^\]]+)\]\(([^)]+)\)/g,
//     '<a href="$2" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-[var(--accent)] hover:underline"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-link"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>$1</a>'
//   );

//   processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-[var(--text-primary)]">$1</strong>');
//   processed = processed.replace(/^TITLE:\s*(.*)$/gim, '<h2 class="text-base font-bold text-[var(--text-primary)] mt-2 mb-4 pb-2 border-b border-[var(--border)]">$1</h2>');
//   processed = processed.replace(/^### (.*$)/gim, '<h4 class="text-md font-bold text-[var(--text-primary)] mt-4 mb-2">$1</h4>');
//   processed = processed.replace(/^## (.*$)/gim, '<h3 class="text-lg font-bold text-[var(--text-primary)] mt-5 mb-3">$1</h3>');

//   let html = '';
//   const lines = processed.split('\n');
//   let inList = false;

//   for (let i = 0; i < lines.length; i++) {
//     const line = lines[i];
//     const trimmed = line.trim();

//     const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ');
//     const isNumbered = /^\d+\.\s/.test(trimmed);

//     if (isBullet || isNumbered) {
//       if (!inList) {
//         html += `<ul class="space-y-3 my-4 ml-2">`;
//         inList = true;
//       }

//       let itemContent = trimmed;
//       if (isBullet) {
//         itemContent = `<div class="flex items-start gap-3"><div class="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-2 shrink-0"></div><div class="flex-1 leading-relaxed">${trimmed.substring(2)}</div></div>`;
//       } else {
//         const match = trimmed.match(/^(\d+)\.\s(.*)/);
//         if (match) {
//           itemContent = `<div class="flex items-start gap-3"><div class="font-bold text-[var(--accent)] min-w-4 text-right pt-0.5">${match[1]}.</div><div class="flex-1 leading-relaxed">${match[2]}</div></div>`;
//         }
//       }
//       html += `<li>${itemContent}</li>`;
//     } else {
//       if (inList) {
//         html += `</ul>`;
//         inList = false;
//       }
//       if (trimmed === '') {
//         html += `<div class="h-2"></div>`;
//       } else {
//         // Only wrap in p if it's not a header we just injected
//         if (trimmed.startsWith('<h')) {
//           html += trimmed;
//         } else {
//           html += `<p class="mb-2 leading-relaxed">${trimmed}</p>`;
//         }
//       }
//     }
//   }

//   if (inList) {
//     html += `</ul>`;
//   }

//   return html;
// };

// export const AgentWorkflow = ({
//   onComplete,
//   compact = false,
//   defaultAgentId = 'connect',
//   onChangeTab,
//   onNewConnector,
//   onForwardWithContext,
//   onCreateWorkspaceFromSummary,
//   onNewSessionCreated,
//   initialChatMessage,
//   sessionId,
//   workspaceName
// }: AgentWorkflowProps) => {
//   const {
//     selectedConnector: activeConnector,
//     setSelectedConnector,
//     connectorResults,
//     setConnectorResults,
//     isImporting,
//     setIsImporting,
//     searchTopic,
//     sessionSources,
//     setSessionSources,
//     isAnalyzing,
//     setIsAnalyzing,
//     importError,
//     setImportError,
//     clearAnalysisResults
//   } = useConnectorContext();
//   const { userId } = useAuthContext();
//   const [agents, setAgents] = useState<AgentData[]>([]);
//   const [selectedAgentId, setSelectedAgentId] = useState<string>(defaultAgentId);
//   const [isLoading, setIsLoading] = useState(true);
//   const [activeGraphId, setActiveGraphId] = useState<string | null>(null);
//   const [chatCollapsed, setChatCollapsed] = useState(true);

//   useEffect(() => {
//     setSelectedAgentId(defaultAgentId);
//   }, [defaultAgentId]);

//   useEffect(() => {
//     const fetchAgents = async () => {
//       setIsLoading(true);
//       const data = await agentService.getAgents(userId, defaultAgentId === 'connect');
//       setAgents(data);
//       setIsLoading(false);
//     };
//     fetchAgents();
//   }, [userId, defaultAgentId]);

//   // Re-fetch agents and session sources when switching to ingest tab
//   useEffect(() => {
//     if (selectedAgentId === 'ingest' && userId) {
//       const fetchData = async () => {
//         const agentsData = await agentService.getAgents(userId);
//         setAgents(agentsData);

//         // Fetch session sources
//         const activeSessionId = localStorage.getItem('DAgent_session_id') || (activeConnector as any)?.session_id;
//         if (activeSessionId) {
//           const sources = await connectorService.getSessionSources(activeSessionId);
//           setSessionSources(sources);
//         }
//       };
//       fetchData();
//     }
//   }, [selectedAgentId, userId]);

//   // Handle specialized saved results fetch for Web Search in Ingest (Import) tab
//   useEffect(() => {
//     const activeUserId = userId?.toString() || '1';
//     if (selectedAgentId === 'ingest' && activeConnector?.name === 'Web Search using LLM' && activeUserId && !connectorResults?.results) {
//       const getResults = async () => {
//         setIsImporting(true);
//         setImportError(null);
//         try {
//           const savedResults = await connectorService.getSavedResults(activeUserId, searchTopic);
//           if (savedResults) {
//             setConnectorResults(savedResults);
//           }
//         } catch (err) {
//           console.error('Failed to fetch saved results:', err);
//           setImportError('Failed to fetch saved results. Please try again.');
//         } finally {
//           setIsImporting(false);
//         }
//       };
//       getResults();
//     }
//   }, [selectedAgentId, activeConnector, userId, setConnectorResults, connectorResults?.results, setIsImporting]);

//   // Poll for updates if there are any processing items to handle tab-switching state sync
//   useEffect(() => {
//     const hasProcessing = agents.some(a => a.history.some(h => h.status === 'processing'));

//     if (hasProcessing) {
//       const interval = setInterval(async () => {
//         // We set fetchFromApi to false here so that we don't spam the connection_history
//         // API every 1 second while waiting for simulated local processing to finish.
//         const updatedAgents = await agentService.getAgents(userId, false);
//         setAgents(updatedAgents);
//       }, 1000);
//       return () => clearInterval(interval);
//     }
//   }, [agents, selectedAgentId, userId]);

//   const selectedAgent = agents.find(a => a.id === selectedAgentId);
//   const AGENT_SEQUENCE = ['connect', 'ingest', 'analyze', 'query'];

//   // Auto-trigger session analysis when entering 'analyze' tab if results are missing
//   useEffect(() => {
//     const triggerAutoAnalysis = async () => {
//       // Only run if we are on 'analyze' tab and no report exists and not already analyzing
//       if (selectedAgentId === 'analyze' && !connectorResults?.description && !isAnalyzing) {

//         const sessionId = localStorage.getItem('DAgent_session_id') || (activeConnector as any)?.session_id;
//         if (!sessionId) return;

//         let currentSources = sessionSources;
//         if (!currentSources) {
//           try {
//             currentSources = await connectorService.getSessionSources(sessionId);
//             setSessionSources(currentSources);
//           } catch (err) {
//             console.error('Failed to fetch session sources for auto-analysis:', err);
//             return;
//           }
//         }

//         const topics = currentSources?.web_topics?.topics?.map((t: any) => t.topic) || [];

//         let databases = currentSources?.external_databases?.databases?.map((db: any) => db.external_database) || [];

//         // As per the workspace requirement, we process all data sources under the current session simultaneously.
//         // We ensure we don't pass generic names like 'sql_upload' or 'csv_upload'.
//         databases = databases.filter((db: string) => db && db !== 'sql_upload' && db !== 'csv_upload');

//         // If we have data to analyze, trigger the API
//         if (topics.length > 0 || databases.length > 0) {
//           setIsAnalyzing(true);

//           // Update history status if possible to show processing in UI
//           const historyItem = selectedAgent?.history[selectedAgent.history.length - 1];
//           if (historyItem && historyItem.status !== 'processing') {
//             try {
//               await agentService.updateHistoryItem(selectedAgent.id, historyItem.id, {
//                 status: 'processing',
//                 details: 'Data details verified. Initiating multi-source session analysis...',
//                 activities: ['Gathering all session sources...', 'Extracting topics and database schemas...', 'Initializing analysis pipeline...']
//               });
//             } catch (e) {
//               console.warn('Failed to update history status, continuing analysis anyway');
//             }
//           }

//           try {
//             const response = await connectorService.processSessionAnalysis({
//               session_id: sessionId,
//               topics,
//               databases
//             });

//             if (response) {
//               const report = response.report || response.description || response.report_content || (typeof response === 'string' ? response : null);
//               const errorMessage = (response.status === 'partial' || response.status === 'error') ? response.message : null;
//               const displayContent = report || errorMessage || "Analysis completed but no insights were generated.";

//               setConnectorResults(prev => ({
//                 ...prev,
//                 description: displayContent
//               }));
//             } else {
//               setConnectorResults(prev => ({
//                 ...prev,
//                 description: "Analysis failed to return a valid response."
//               }));
//             }
//           } catch (err) {
//             console.error('Auto session analysis failed:', err);
//             setConnectorResults(prev => ({
//               ...prev,
//               description: "Analysis failed. Please check the backend connection or logs."
//             }));
//           } finally {
//             setIsAnalyzing(false);
//           }
//         }
//       }
//     };

//     triggerAutoAnalysis();
//   }, [selectedAgentId, connectorResults?.description, isAnalyzing, sessionSources, activeConnector, selectedAgent]);


//   const forwardToNextAgent = async (currentAgentId: string, contextData: string, connectionName?: string) => {
//     const currentIndex = AGENT_SEQUENCE.indexOf(currentAgentId);

//     if (currentIndex !== -1 && currentIndex < AGENT_SEQUENCE.length - 1) {
//       const nextAgentId = AGENT_SEQUENCE[currentIndex + 1];

//       let nextAction = 'Incoming Task';
//       let nextDetails = `Received updated data from ${agents.find(a => a.id === currentAgentId)?.name || 'previous agent'}.`;
//       let nextPrompt = 'How would you like to proceed?';
//       let nextOptions = ['Continue', 'Skip'];
//       let nextActivities = ['Analyzing incoming payload...', 'Preparing environment...'];
//       let nextCustomInputType: 'table_selection' | undefined = undefined;
//       let nextCustomInputData: any = undefined;

//       if (currentAgentId === 'connect') {
//         // Skip creating history item for ingest as per user request to remove history section
//         setSelectedAgentId('ingest');
//         const freshAgents = await agentService.getAgents(userId, false);
//         setAgents(freshAgents);

//         if (onChangeTab) {
//           onChangeTab('collection');
//         }
//         return;
//       } else if (currentAgentId === 'ingest') {
//         nextAction = 'Process Pending';
//         nextDetails = `Data successfully ingested and cached (${contextData}).`;
//         nextPrompt = `What is your primary focus for analyzing this new dataset?`;
//         nextOptions = ['Revenue Growth', 'User Retention', 'Anomalies', 'General Summary'];
//         nextActivities = ['Loading cached data...', 'Initializing statistical models...', 'Scanning for patterns...'];
//       } else if (currentAgentId === 'analyze') {
//         nextAction = 'Query Engine Ready';
//         nextDetails = `Analysis complete. Embeddings generated (${contextData}).`;
//         nextPrompt = `DAgent is ready to answer your questions!`;
//         nextOptions = ["Yes, let's go!"];
//         nextActivities = ['Loading embeddings into memory...', 'Warming up query engine...', 'Ready for chat.'];
//       }

//       setAgents(await agentService.getAgents(userId, nextAgentId === 'connect'));
//       setSelectedAgentId(nextAgentId);

//       // Sync sidebar with stepper
//       if (onChangeTab) {
//         const tabMap: Record<string, string> = {
//           connect: 'connectors',
//           ingest: 'collection',
//           analyze: 'analysis',
//           query: 'chat'
//         };
//         if (tabMap[nextAgentId]) {
//           onChangeTab(tabMap[nextAgentId] as any);
//         }
//       }

//       const processingTime = (nextActivities?.length || 2) * 1000 + 500;
//       setTimeout(async () => {
//         // We no longer update local state; we wait for the API to reflect the change
//         console.log(`Phase transition complete, awaiting server sync for ${nextAgentId}`);
//       }, processingTime);
//     } else if (currentAgentId === 'query') {
//       onComplete();
//     }
//   };

//   const handleContinueToProcess = async () => {
//     // Find the history item specific to the active connector, fallback to last item
//     const historyItem = selectedAgent?.history.find(h => h.connectorId === activeConnector?.id) ||
//       selectedAgent?.history[selectedAgent.history.length - 1];
//     if (!selectedAgent) return;

//     const sessionId = localStorage.getItem('DAgent_session_id') || (historyItem as any)?.session_id;

//     if (!sessionId) {
//       console.error("Missing session_id for session analysis");
//       return;
//     }

//     try {
//       // 1. Update history item status to processing if it exists
//       if (historyItem) {
//         await agentService.updateHistoryItem(selectedAgent.id, historyItem.id, {
//           status: 'processing',
//           details: 'Data details verified. Initiating multi-source session analysis...',
//           activities: ['Gathering all session sources...', 'Extracting topics and database schemas...', 'Initializing analysis pipeline...']
//         });
//       }

//       // 2. Extract topics and databases from sessionSources
//       const topics = sessionSources?.web_topics?.topics?.map((t: any) => t.topic) || [];
//       let databases = sessionSources?.external_databases?.databases?.map((db: any) => db.external_database) || [];

//       // As per the workspace requirement, we process all data sources under the current session simultaneously.
//       databases = databases.filter((db: string) => db && db !== 'sql_upload' && db !== 'csv_upload');

//       setIsAnalyzing(true);
//       // We no longer clear results here to allow the Import tab to keep showing its data

//       // 3. Switch to analyze tab IMMEDIATELY
//       await forwardToNextAgent(selectedAgent.id, 'Session Analysis Started', historyItem?.connectionName);

//       // 4. Run Session Analysis API in background
//       try {
//         const response = await connectorService.processSessionAnalysis({
//           session_id: sessionId,
//           topics,
//           databases
//         });

//         if (response) {
//           const report = response.report || response.description || response.report_content || (typeof response === 'string' ? response : null);
//           const errorMessage = (response.status === 'partial' || response.status === 'error') ? response.message : null;
//           const displayContent = report || errorMessage;

//           if (displayContent) {
//             setConnectorResults(prev => ({
//               ...prev,
//               description: displayContent
//             }));
//           }
//         }
//       } catch (err) {
//         console.error('Failed session analysis:', err);
//       } finally {
//         setIsAnalyzing(false);
//       }
//     } catch (error) {
//       console.error('Failed to continue to process:', error);
//     }
//   };

//   const handleAction = async (historyItem: AgentHistoryItem, option?: string) => {
//     if (!selectedAgent) return;

//     const isWebSearch = activeConnector?.name === 'Web Search using LLM' || activeConnector?.name === 'Web Search';

//     if (selectedAgentId === 'ingest' && (option === 'Continue' || !option)) {
//       await handleContinueToProcess();
//       return;
//     }

//     if (selectedAgentId === 'connect' && (option === 'Continue' || !option)) {
//       if (!userId || !historyItem.connectorId) {
//         console.error("Missing userId or connectorId to continue import");
//         return;
//       }

//       // 1. Reconstruct connector from history and always update selected connector
//       // This ensures that switching between types (e.g. Web Search vs Database) from history works correctly.
//       const isWebSearch = historyItem.db_type === 'saved_web_result' ||
//         historyItem.db_type === 'web_search' ||
//         historyItem.connectionName === 'Web Search' ||
//         historyItem.action?.startsWith('Saved Research:');

//       setSelectedConnector({
//         id: historyItem.connectorId || '',
//         name: isWebSearch ? 'Web Search using LLM' : (historyItem.connectionName || 'Data source'),
//         description: historyItem.details || '',
//         type: isWebSearch ? 'Integration' : 'Database',
//         icon: isWebSearch ? 'globe' : 'database',
//         status: 'connected'
//       });

//       // 2. Set importing state and clear previous results
//       setIsImporting(true);
//       setConnectorResults(null);
//       setImportError(null);

//       // 3. Update history to show processing (this will be picked up by polling)
//       const newActivities = historyItem.activities
//         ? [...historyItem.activities, 'Initiating import process...']
//         : ['Initiating import process...'];

//       await agentService.updateHistoryItem(selectedAgent.id, historyItem.id, {
//         status: 'processing',
//         details: 'Triggering data import from data source...',
//         activities: newActivities
//       });

//       // 4. Forward IMMEDIATELY to switch tabs
//       await forwardToNextAgent(selectedAgent.id, 'Import Triggered', historyItem.connectionName);

//       // 5. Run API call in background
//       (async () => {
//         try {
//           let response;
//           if (historyItem.db_type === 'saved_web_result') {
//             response = await connectorService.getSavedResults(userId.toString(), historyItem.topic || '');
//           } else if (historyItem.db_type === 'csv_upload' || historyItem.db_type === 'csv_chunk_upload') {
//             response = await connectorService.importCsvData({
//               user_id: Number(userId),
//               connection_id: Number(historyItem.id),
//               session_id: historyItem.session_id || ''
//             });
//           } else if (historyItem.db_type === 'sql_upload' || historyItem.db_type === 'sql_chunk_upload') {
//             response = await connectorService.importSqlData({
//               user_id: Number(userId),
//               connection_id: Number(historyItem.id),
//               session_id: historyItem.session_id || ''
//             });
//           } else {
//             response = await connectorService.continueToImport({
//               user_id: userId.toString(),
//               connection_id: historyItem.connectorId || '',
//               session_id: historyItem.session_id
//             });
//           }

//           if (response) {
//             if (response.status === "error") {
//               // ✅ Show API error message in UI
//               setImportError(response.message || "Something went wrong");
//               setConnectorResults(null);
//             } else {
//               // ✅ Success case
//               setConnectorResults(response);
//               setImportError(null);

//               if (historyItem.session_id) {
//                 const sources = await connectorService.getSessionSources(historyItem.session_id);
//                 setSessionSources(sources);
//               }
//             }
//           } else {
//             setConnectorResults(null);
//           }

//           // The polling mechanism will eventually update the agent history
//         } catch (error) {
//           console.error("Import failed:", error);
//           setConnectorResults(null); // Clear previous data on failure
//           setImportError('Failed to import data from your database. Please check your connection.');
//           // The polling mechanism will eventually update the agent history
//         } finally {
//           setIsImporting(false);
//         }
//       })();

//       return;
//     }


//     if (option && option.startsWith('SESSION_ANALYSIS:')) {
//       const payloadStr = option.replace('SESSION_ANALYSIS:', '');
//       try {
//         const payload = JSON.parse(payloadStr);
//         if (!historyItem.session_id) {
//           console.error("Missing session_id for session analysis");
//           return;
//         }

//         setIsAnalyzing(true);
//         // We no longer clear results here to allow the Import tab to keep showing its data
//         await agentService.updateHistoryItem(selectedAgent.id, historyItem.id, {
//           status: 'processing',
//           details: 'Initiating session analysis with selected topics and databases...',
//           activities: ['Gathering selected items...', 'Sending to analysis engine...', 'Awaiting insights...']
//         });

//         await forwardToNextAgent(selectedAgent.id, 'Session Analysis Triggered', historyItem.connectionName);

//         // Run API call in background
//         const response = await connectorService.processSessionAnalysis({
//           session_id: historyItem.session_id,
//           topics: payload.topics,
//           databases: payload.databases
//         });

//         if (response) {
//           const report = response.report || response.description || response.report_content || (typeof response === 'string' ? response : null);
//           const errorMessage = (response.status === 'partial' || response.status === 'error') ? response.message : null;
//           const displayContent = report || errorMessage;

//           if (displayContent) {
//             setConnectorResults(prev => ({
//               ...prev,
//               description: displayContent
//             }));
//           }
//         }

//         // The polling mechanism will eventually update the agent history
//       } catch (error) {
//         console.error("Session analysis failed:", error);
//         // The polling mechanism will eventually update the agent history
//       } finally {
//         setIsAnalyzing(false);
//       }
//       return;
//     }

//     const newActivities = historyItem.activities
//       ? [...historyItem.activities, `Executing: ${option || 'Continue'}`]
//       : [`Executing: ${option || 'Continue'}`];

//     // Simulate processing an action
//     await agentService.updateHistoryItem(selectedAgent.id, historyItem.id, {
//       status: 'processing',
//       details: option ? `Processing option: ${option}...` : 'Processing...',
//       activities: newActivities
//     });

//     // Simulate completion
//     setTimeout(async () => {
//       // The polling mechanism will eventually update the history item status
//       // Automatically forward to next agent
//       await forwardToNextAgent(selectedAgent.id, option || historyItem.action, historyItem.connectionName);
//     }, 2000);
//   };

//   const handleScenarioConfirm = async (scenario: string) => {
//     if (!selectedAgent) return;

//     // Add a history item for the scenario selection
//     // No-op: awaiting API sync for ingestion status
//     console.log('Ingestion requested, awaiting server sync.');

//     setAgents(await agentService.getAgents(userId, selectedAgent.id === 'connect'));

//     // Forward to next agent
//     await forwardToNextAgent('ingest', scenario, activeConnector?.name);
//   };

//   if (isLoading) {
//     return (
//       <div className="flex justify-center items-center py-20">
//         <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
//       </div>
//     );
//   }

//   const handleStepperClick = (agentId: string) => {
//     // Clear transient results when moving away from the intake/process flow
//     if (agentId === 'connect' || agentId === 'query') {
//       clearAnalysisResults();
//     }

//     setSelectedAgentId(agentId);
//     if (onChangeTab) {
//       const tabMap: Record<string, string> = {
//         connect: 'connectors',
//         ingest: 'collection',
//         analyze: 'analysis',
//         query: 'chat'
//       };
//       if (tabMap[agentId]) {
//         onChangeTab(tabMap[agentId] as any);
//       }
//     }
//   };

//   return (
//     <div className="w-full flex-col h-full py-1 flex gap-4">
//       {/* Stepper - Agent List (hidden on Query tab) */}
//       {selectedAgentId !== 'query' && (
//         <AgentStepper
//           agents={agents}
//           selectedAgentId={selectedAgentId}
//           onSelectAgent={handleStepperClick}
//         />
//       )}

//       {/* Main Content - Agent History & Actions */}
//       <div className="flex-1 flex flex-col min-h-0">
//         {selectedAgent && (
//           <Card className={`flex-1 flex flex-col ${(compact || selectedAgent.id === 'query') ? 'border-none shadow-none bg-transparent' : 'border-[var(--border)] shadow-xl overflow-hidden bg-[var(--surface)]/50'}`}>
//             {selectedAgent.id !== 'query' && (
//               <CardHeader className={`${compact ? 'px-0 pt-1 pb-3' : 'bg-[var(--surface)] p-4 border-b border-[var(--border)]'} shrink-0`}>
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-3">
//                     <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] border border-[var(--accent)]/20 relative">
//                       {selectedAgent.id === 'ingest' && activeConnector?.name === 'Web Search using LLM' ? (
//                         <div className="relative">
//                           <Globe className="w-5 h-5" />
//                           <Search className="w-3 h-3 absolute -bottom-1 -right-1" />
//                         </div>
//                       ) : (
//                         getAgentIcon(selectedAgent.icon)
//                       )}
//                     </div>
//                     <div>
//                       <h2 className="text-lg font-bold">{selectedAgent.name}</h2>
//                       <p className="text-xs text-[var(--text-secondary)]">{selectedAgent.description}</p>
//                     </div>
//                   </div>
//                 </div>
//               </CardHeader>
//             )}

//             <CardContent className={`flex-1 ${selectedAgent.id === 'query' ? 'flex flex-col p-0 overflow-hidden' : compact ? 'px-0 overflow-visible space-y-4' : 'overflow-y-auto p-4 space-y-4'}`}>
//               {(isAnalyzing && selectedAgent.id === 'analyze') ? (
//                 <div className="flex flex-col items-center justify-center py-24 gap-6">
//                   <motion.div
//                     initial={{ scale: 0.8, opacity: 0 }}
//                     animate={{ scale: 1, opacity: 1 }}
//                     className="relative"
//                   >
//                     <div className="absolute inset-0 bg-[var(--accent)]/20 blur-2xl rounded-full scale-150 animate-pulse" />
//                     <Loader2 className="w-12 h-12 animate-spin text-[var(--accent)] relative z-10" />
//                   </motion.div>
//                   <div className="text-center z-10">
//                     <p className="text-lg font-bold text-[var(--text-primary)] mb-2">Analyzing your data...</p>
//                     <p className="text-sm text-[var(--text-secondary)]">Generating session analysis reports</p>
//                     <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-md">
//                       {['', '', ''].map((tag, idx) => (
//                         <span key={idx} className="px-3 py-1 rounded-full bg-[var(--surface-hover)] border border-[var(--border)] text-[10px] text-[var(--text-secondary)] animate-pulse" style={{ animationDelay: `${idx * 200}ms` }}>
//                           {tag}
//                         </span>
//                       ))}
//                     </div>
//                   </div>
//                 </div>
//               ) : (
//                 <>
//                   {selectedAgent.id === 'ingest' && (
//                     <IngestDataView
//                       activeConnector={activeConnector}
//                       connectorResults={connectorResults}
//                       sessionSources={sessionSources}
//                       isImporting={isImporting}
//                       isAnalyzing={isAnalyzing}
//                       importError={importError}
//                       onGoToDataSource={() => handleStepperClick('connect')}
//                       onContinue={handleContinueToProcess}
//                     />
//                   )}

//                   {selectedAgent.id === 'connect' && (
//                     <div className="mb-12">
//                       <div className="flex items-center justify-between mb-6">
//                         <div>
//                           <h3 className="text-lg font-bold">Available Connectors</h3>
//                           <p className="text-sm text-[var(--text-secondary)]">Choose from our list of supported data sources</p>
//                         </div>
//                         {onNewConnector && (
//                           <Button variant="outline" size="sm" onClick={onNewConnector}>
//                             <Play className="w-4 h-4 mr-2" />
//                             Custom Data source
//                           </Button>
//                         )}
//                       </div>
//                       <ConnectorList onSelect={() => onChangeTab?.('new-connector')} />
//                     </div>
//                   )}

//                   {selectedAgent.id === 'query' ? (
//                     <div className="flex-1 flex overflow-hidden">
//                       {/* Left Side: Split into Charts (upper) and Chat (lower) */}
//                       <div className="flex-1 min-w-0 flex flex-col min-h-0">
//                         {/* Upper portion: Charts */}
//                         <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-0 bg-[var(--surface)]/30 border-b border-[var(--border)]">
//                           <DashboardGraphs />
//                         </div>
//                         {/* Lower portion: Chat */}
//                         <div className={`shrink-0 flex flex-col transition-all duration-300 ${chatCollapsed ? '' : 'h-[45%] min-h-[350px]'}`}>
//                           <ChatWindow
//                             initialMode="chat"
//                             initialMessage={initialChatMessage}
//                             onOpenDataSource={onChangeTab ? () => onChangeTab('connectors') : undefined}
//                             onNewSessionCreated={onNewSessionCreated}
//                             sessionId={sessionId}
//                             workspaceName={workspaceName}
//                             onCollapseChange={setChatCollapsed}
//                           />
//                         </div>
//                       </div>

//                       {/* Right side strip - scrollable KPIs + Graph buttons */}
//                       {!activeGraphId && (
//                         <div className="w-52 shrink-0 border-l border-[var(--border)] bg-[var(--bg)] flex flex-col overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
//                           <div className="p-3 flex flex-col h-full">
//                           {/* KPIs */}
//                           <DashboardKPIs />

//                           {/* Divider */}
//                           {/* <div className="flex items-center gap-2 pt-1">
//                             <div className="flex-1 h-px bg-slate-200" />
//                             <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Charts</span>
//                             <div className="flex-1 h-px bg-slate-200" />
//                           </div> */}

//                           {/* Graph icon buttons */}
//                           {/* <div className="space-y-1.5">
//                             {graphPanelItems.map(item => (
//                               <button
//                                 key={item.id}
//                                 onClick={() => setActiveGraphId(item.id)}
//                                 className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border transition-all duration-200 cursor-pointer group ${
//                                   activeGraphId === item.id
//                                     ? 'border-[var(--accent)]/30 bg-[var(--accent)]/5 shadow-sm'
//                                     : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm'
//                                 }`}
//                               >
//                                 <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${item.color}`}>
//                                   <item.icon className="w-3.5 h-3.5" />
//                                 </div>
//                                 <span className="text-[11px] font-semibold text-slate-700 group-hover:text-slate-900 truncate">
//                                   {item.name}
//                                 </span>
//                               </button>
//                             ))}
//                           </div> */}
//                         </div>
//                         </div>
//                       )}
//                       {/* Graph Side Panel overlay */}
//                       <GraphSidePanel activeGraphId={activeGraphId} onClose={() => setActiveGraphId(null)} inline={true} />
//                     </div>
//                   ) : (
//                     (() => {
//                       const isIngest = selectedAgent.id === 'ingest';
//                       const isAnalyze = selectedAgent.id === 'analyze';

//                       if (isIngest) return null; // Handled above

//                       const filteredHistory = isAnalyze ? [] : selectedAgent.history;
//                       const shouldShowHistoryHeader = !isAnalyze && filteredHistory.length > 0;

//                       return (
//                         <>
//                           {shouldShowHistoryHeader && (
//                             <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-4">
//                               {selectedAgent.name} History
//                             </h3>
//                           )}
//                           {isAnalyze && !isAnalyzing && !selectedAgent.history.some(h => h.status === 'processing') && !connectorResults?.description && (
//                             <motion.div
//                               initial={{ opacity: 0 }} animate={{ opacity: 1 }}
//                               className="text-center py-12 border-2 border-dashed border-[var(--border)] rounded-2xl"
//                             >
//                               <BarChart3 className="w-8 h-8 text-[var(--text-secondary)] mx-auto mb-3 opacity-50" />
//                               <p className="text-[var(--text-secondary)] font-medium">No analysis process found.</p>
//                               <p className="text-xs text-[var(--text-secondary)]/60 mt-1">Start a new analysis from the Import tab.</p>
//                             </motion.div>
//                           )}

//                           {isAnalyze && !isAnalyzing && connectorResults?.description && (
//                             <>
//                               <motion.div
//                                 initial={{ opacity: 0, y: 10 }}
//                                 animate={{ opacity: 1, y: 0 }}
//                                 className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
//                               >
//                                 <div className="prose prose-sm max-w-none text-[var(--text-primary)] leading-relaxed prose-a:text-[var(--accent)] hover:prose-a:underline">
//                                   {typeof connectorResults.description === 'string'
//                                     ? <div dangerouslySetInnerHTML={{ __html: formatInsightsText(connectorResults.description) }} />
//                                     : JSON.stringify(connectorResults.description, null, 2)}
//                                 </div>
//                               </motion.div>

//                               {/* Navigation button to Query section */}
//                               <div className="mt-12 pt-8 border-t border-[var(--border)] flex justify-end">
//                                 <Button
//                                   onClick={() => {
//                                     if (onCreateWorkspaceFromSummary && connectorResults?.description) {
//                                       const summaryText = typeof connectorResults.description === 'string'
//                                         ? connectorResults.description
//                                         : JSON.stringify(connectorResults.description);
//                                       onCreateWorkspaceFromSummary(summaryText);
//                                     } else {
//                                       handleStepperClick('query');
//                                     }
//                                   }}
//                                   variant="primary"
//                                   size="sm"
//                                   className="px-8 shadow-lg shadow-[var(--accent)]/20"
//                                 >
//                                   Want to know more?
//                                 </Button>
//                               </div>
//                             </>
//                           )}

//                           {!isAnalyze && (
//                             <AnimatePresence mode="popLayout">
//                               {filteredHistory.length === 0 ? (
//                                 isIngest ? null : (
//                                   <motion.div
//                                     initial={{ opacity: 0 }} animate={{ opacity: 1 }}
//                                     className="text-center py-12 border-2 border-dashed border-[var(--border)] rounded-2xl"
//                                   >
//                                     <Clock className="w-8 h-8 text-[var(--text-secondary)] mx-auto mb-3 opacity-50" />
//                                     <p className="text-[var(--text-secondary)]">No history found for this agent.</p>
//                                   </motion.div>
//                                 )
//                               ) : (
//                                 filteredHistory.map((item) => (
//                                   <HistoryItemCard
//                                     key={item.id}
//                                     item={item}
//                                     agent={selectedAgent}
//                                     onAction={handleAction}
//                                     onForward={forwardToNextAgent}
//                                     onScenarioConfirm={handleScenarioConfirm}
//                                   />
//                                 ))
//                               )}
//                             </AnimatePresence>
//                           )}
//                         </>
//                       );
//                     })()
//                   )}
//                 </>
//               )}
//             </CardContent>
//           </Card>
//         )}
//       </div>
//     </div>
//   );
// };

import { useState, useEffect, useRef } from 'react';
import { AgentData, AgentHistoryItem } from '../types';
import { Card, CardContent, CardHeader, Badge, Button } from '@/src/ui-kit';
import { motion, AnimatePresence } from 'motion/react';
import { Database, Server, BarChart3, MessageSquare, Sparkles, CheckCircle2, Loader2, Clock, Play, RotateCcw, ArrowRight, ChevronRight, Globe, Search, Trash2 } from 'lucide-react';
import { agentService } from '@/src/services/agent.service';

import { ConnectorList } from '../../connectors/components/ConnectorList';
import { Connector } from '../../connectors/types';
import { ChatWindow } from '../../chat/components/ChatWindow';
import { useConnectorContext } from '../../../context/ConnectorContext';
import { useAuthContext } from '../../../context/AuthContext';
import { connectorService } from '@/src/services/connector.service';

interface AgentWorkflowProps {
  onComplete: () => void;
  compact?: boolean;
  defaultAgentId?: string;
  onChangeTab?: (tabId: string) => void;
  onNewConnector?: () => void;
  onForwardWithContext?: (agentId: string, context: string) => void;
  onCreateWorkspaceFromSummary?: (summary: string) => void;
  onNewSessionCreated?: () => void;
  initialChatMessage?: string;
  sessionId?: string;
  workspaceName?: string;
  workspaceType?: string;
  chatKey?: number;
  isWorkspacesLoading?: boolean;
}

import { HistoryItemCard } from './HistoryItemCard';
import { AgentStepper, getAgentIcon } from './AgentStepper';
import { IngestDataView } from './IngestDataView';
import { DashboardKPIs, graphPanelItems, GraphSidePanel, DashboardGraphs } from '../../dashboard/components/DashboardCharts';
import { GenericDashboardGraphs } from '../../dashboard/components/graphs/GenericDashboardGraphs';
import { GenericDashboardKPIs } from '../../dashboard/components/graphs/GenericDashboardKPIs';
import { QueryViewGeneric } from './QueryViewGeneric';
import { QueryViewSales } from './QueryViewSales';

const formatInsightsText = (text: string) => {
  if (typeof text !== 'string') return JSON.stringify(text, null, 2);

  let processed = text.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-[var(--accent)] hover:underline"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-link"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>$1</a>'
  );

  processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-[var(--text-primary)]">$1</strong>');
  processed = processed.replace(/^TITLE:\s*(.*)$/gim, '<h2 class="text-base font-bold text-[var(--text-primary)] mt-2 mb-4 pb-2 border-b border-[var(--border)]">$1</h2>');
  processed = processed.replace(/^### (.*$)/gim, '<h4 class="text-md font-bold text-[var(--text-primary)] mt-4 mb-2">$1</h4>');
  processed = processed.replace(/^## (.*$)/gim, '<h3 class="text-lg font-bold text-[var(--text-primary)] mt-5 mb-3">$1</h3>');

  let html = '';
  const lines = processed.split('\n');
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ');
    const isNumbered = /^\d+\.\s/.test(trimmed);

    if (isBullet || isNumbered) {
      if (!inList) {
        html += `<ul class="space-y-3 my-4 ml-2">`;
        inList = true;
      }

      let itemContent = trimmed;
      if (isBullet) {
        itemContent = `<div class="flex items-start gap-3"><div class="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-2 shrink-0"></div><div class="flex-1 leading-relaxed">${trimmed.substring(2)}</div></div>`;
      } else {
        const match = trimmed.match(/^(\d+)\.\s(.*)/);
        if (match) {
          itemContent = `<div class="flex items-start gap-3"><div class="font-bold text-[var(--accent)] min-w-4 text-right pt-0.5">${match[1]}.</div><div class="flex-1 leading-relaxed">${match[2]}</div></div>`;
        }
      }
      html += `<li>${itemContent}</li>`;
    } else {
      if (inList) {
        html += `</ul>`;
        inList = false;
      }
      if (trimmed === '') {
        html += `<div class="h-2"></div>`;
      } else {
        // Only wrap in p if it's not a header we just injected
        if (trimmed.startsWith('<h')) {
          html += trimmed;
        } else {
          html += `<p class="mb-2 leading-relaxed">${trimmed}</p>`;
        }
      }
    }
  }

  if (inList) {
    html += `</ul>`;
  }

  return html;
};

export const AgentWorkflow = ({
  onComplete,
  compact = false,
  defaultAgentId = 'connect',
  onChangeTab,
  onNewConnector,
  onForwardWithContext,
  onCreateWorkspaceFromSummary,
  onNewSessionCreated,
  initialChatMessage,
  sessionId,
  workspaceName,
  workspaceType,
  chatKey,
  isWorkspacesLoading
}: AgentWorkflowProps) => {
  const {
    selectedConnector: activeConnector,
    setSelectedConnector,
    connectorResults,
    setConnectorResults,
    isImporting,
    setIsImporting,
    searchTopic,
    sessionSources,
    setSessionSources,
    isAnalyzing,
    setIsAnalyzing,
    importError,
    setImportError,
    clearAnalysisResults
  } = useConnectorContext();
  const { userId } = useAuthContext();
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(defaultAgentId);
  const [isLoading, setIsLoading] = useState(true);
  const [activeGraphId, setActiveGraphId] = useState<string | null>(null);
  const [chatCollapsed, setChatCollapsed] = useState(true);
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<Set<string>>(new Set());
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [selectedHistoryItems, setSelectedHistoryItems] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isForwardingToQuery, setIsForwardingToQuery] = useState(false);

  useEffect(() => {
    setSelectedAgentId(defaultAgentId);
  }, [defaultAgentId]);

  useEffect(() => {
    const fetchAgents = async () => {
      setIsLoading(true);
      const data = await agentService.getAgents(userId, defaultAgentId === 'connect');
      setAgents(data);
      setIsLoading(false);
    };
    fetchAgents();
  }, [userId, defaultAgentId]);

  // Re-fetch agents and session sources when switching to ingest, analyze, or query tabs
  useEffect(() => {
    if (['ingest', 'analyze', 'query'].includes(selectedAgentId) && userId) {
      const fetchData = async () => {
        const agentsData = await agentService.getAgents(userId);
        setAgents(agentsData);

        // Fetch session sources
        const activeSessionId = localStorage.getItem('DAgent_session_id') || (activeConnector as any)?.session_id;
        if (activeSessionId) {
          const sources = await connectorService.getSessionSources(activeSessionId);
          setSessionSources(sources);
        }
      };
      fetchData();
    }
  }, [selectedAgentId, userId]);

  // Handle specialized saved results fetch for Web Search in Ingest (Import) tab
  useEffect(() => {
    const activeUserId = userId?.toString() || '1';
    if (selectedAgentId === 'ingest' && activeConnector?.name === 'Web Search using LLM' && activeUserId && !connectorResults?.results) {
      const getResults = async () => {
        setIsImporting(true);
        setImportError(null);
        try {
          const savedResults = await connectorService.getSavedResults(activeUserId, searchTopic);
          if (savedResults) {
            setConnectorResults(savedResults);
          }
        } catch (err) {
          console.error('Failed to fetch saved results:', err);
          setImportError('Failed to fetch saved results. Please try again.');
        } finally {
          setIsImporting(false);
        }
      };
      getResults();
    }
  }, [selectedAgentId, activeConnector, userId, setConnectorResults, connectorResults?.results, setIsImporting]);

  // Poll for updates if there are any processing items to handle tab-switching state sync
  useEffect(() => {
    const hasProcessing = agents.some(a => a.history.some(h => h.status === 'processing'));

    if (hasProcessing) {
      const interval = setInterval(async () => {
        // We set fetchFromApi to true here because the processing is done in the backend
        // and we need to get the updated status from connection_history
        const updatedAgents = await agentService.getAgents(userId, true);
        setAgents(updatedAgents);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [agents, selectedAgentId, userId]);

  const selectedAgent = agents.find(a => a.id === selectedAgentId);
  const AGENT_SEQUENCE = ['connect', 'ingest', 'analyze', 'query'];

  // Auto-trigger session analysis when entering 'analyze' tab if results are missing
  useEffect(() => {
    const triggerAutoAnalysis = async () => {
      // Only run if we are on 'analyze' tab and no report exists and not already analyzing
      if (selectedAgentId === 'analyze' && !connectorResults?.description && !isAnalyzing) {

        const sessionId = localStorage.getItem('DAgent_session_id') || (activeConnector as any)?.session_id;
        if (!sessionId) return;

        let currentSources = sessionSources;
        if (!currentSources) {
          try {
            currentSources = await connectorService.getSessionSources(sessionId);
            setSessionSources(currentSources);
          } catch (err) {
            console.error('Failed to fetch session sources for auto-analysis:', err);
            return;
          }
        }

        const topics = currentSources?.web_topics?.topics?.map((t: any) => t.topic) || [];

        let databases = currentSources?.external_databases?.databases?.map((db: any) => db.external_database) || [];

        // As per the workspace requirement, we process all data sources under the current session simultaneously.
        // We ensure we don't pass generic names like 'sql_upload' or 'csv_upload'.
        databases = databases.filter((db: string) => db && db !== 'sql_upload' && db !== 'csv_upload');

        // If we have data to analyze, trigger the API
        if (topics.length > 0 || databases.length > 0) {
          setIsAnalyzing(true);

          // Update history status if possible to show processing in UI
          const historyItem = selectedAgent?.history[selectedAgent.history.length - 1];
          if (historyItem && historyItem.status !== 'processing') {
            try {
              await agentService.updateHistoryItem(selectedAgent.id, historyItem.id, {
                status: 'processing',
                details: 'Data details verified. Initiating multi-source session analysis...',
                activities: ['Gathering all session sources...', 'Extracting topics and database schemas...', 'Initializing analysis pipeline...']
              });
            } catch (e) {
              console.warn('Failed to update history status, continuing analysis anyway');
            }
          }

          try {
            const response = await connectorService.processSessionAnalysis({
              session_id: sessionId,
              topics,
              databases
            });

            if (response) {
              const report = response.report || response.description || response.report_content || (typeof response === 'string' ? response : null);
              const errorMessage = (response.status === 'partial' || response.status === 'error') ? response.message : null;
              const displayContent = report || errorMessage || "Analysis completed but no insights were generated.";

              setConnectorResults(prev => ({
                ...prev,
                description: displayContent,
                report_content: response.report_content || null
              }));
            } else {
              setConnectorResults(prev => ({
                ...prev,
                description: "Analysis failed to return a valid response."
              }));
            }
          } catch (err) {
            console.error('Auto session analysis failed:', err);
            setConnectorResults(prev => ({
              ...prev,
              description: "Analysis failed. Please check the backend connection or logs."
            }));
          } finally {
            setIsAnalyzing(false);
          }
        }
      }
    };

    triggerAutoAnalysis();
  }, [selectedAgentId, connectorResults?.description, isAnalyzing, sessionSources, activeConnector, selectedAgent]);


  const forwardToNextAgent = async (currentAgentId: string, contextData: string, connectionName?: string) => {
    const currentIndex = AGENT_SEQUENCE.indexOf(currentAgentId);

    if (currentIndex !== -1 && currentIndex < AGENT_SEQUENCE.length - 1) {
      const nextAgentId = AGENT_SEQUENCE[currentIndex + 1];

      let nextAction = 'Incoming Task';
      let nextDetails = `Received updated data from ${agents.find(a => a.id === currentAgentId)?.name || 'previous agent'}.`;
      let nextPrompt = 'How would you like to proceed?';
      let nextOptions = ['Continue', 'Skip'];
      let nextActivities = ['Analyzing incoming payload...', 'Preparing environment...'];
      let nextCustomInputType: 'table_selection' | undefined = undefined;
      let nextCustomInputData: any = undefined;

      if (currentAgentId === 'connect') {
        // Skip creating history item for ingest as per user request to remove history section
        setSelectedAgentId('ingest');
        const freshAgents = await agentService.getAgents(userId, false);
        setAgents(freshAgents);

        if (onChangeTab) {
          onChangeTab('collection');
        }
        return;
      } else if (currentAgentId === 'ingest') {
        nextAction = 'Process Pending';
        nextDetails = `Data successfully ingested and cached (${contextData}).`;
        nextPrompt = `What is your primary focus for analyzing this new dataset?`;
        nextOptions = ['Revenue Growth', 'User Retention', 'Anomalies', 'General Summary'];
        nextActivities = ['Loading cached data...', 'Initializing statistical models...', 'Scanning for patterns...'];
      } else if (currentAgentId === 'analyze') {
        nextAction = 'Query Engine Ready';
        nextDetails = `Analysis complete. Embeddings generated (${contextData}).`;
        nextPrompt = `DAgent is ready to answer your questions!`;
        nextOptions = ["Yes, let's go!"];
        nextActivities = ['Loading embeddings into memory...', 'Warming up query engine...', 'Ready for chat.'];
      }

      setAgents(await agentService.getAgents(userId, nextAgentId === 'connect'));
      setSelectedAgentId(nextAgentId);

      // Sync sidebar with stepper
      if (onChangeTab) {
        const tabMap: Record<string, string> = {
          connect: 'connectors',
          ingest: 'collection',
          analyze: 'analysis',
          query: 'chat'
        };
        if (tabMap[nextAgentId]) {
          onChangeTab(tabMap[nextAgentId] as any);
        }
      }

      const processingTime = (nextActivities?.length || 2) * 1000 + 500;
      setTimeout(async () => {
        // We no longer update local state; we wait for the API to reflect the change
        console.log(`Phase transition complete, awaiting server sync for ${nextAgentId}`);
      }, processingTime);
    } else if (currentAgentId === 'query') {
      onComplete();
    }
  };

  const handleContinueToProcess = async () => {
    // Find the history item specific to the active connector, fallback to last item
    const historyItem = selectedAgent?.history.find(h => h.connectorId === activeConnector?.id) ||
      selectedAgent?.history[selectedAgent.history.length - 1];
    if (!selectedAgent) return;

    const sessionId = localStorage.getItem('DAgent_session_id') || (historyItem as any)?.session_id;

    if (!sessionId) {
      console.error("Missing session_id for session analysis");
      return;
    }

    try {
      // 1. Update history item status to processing if it exists
      if (historyItem) {
        await agentService.updateHistoryItem(selectedAgent.id, historyItem.id, {
          status: 'processing',
          details: 'Data details verified. Initiating multi-source session analysis...',
          activities: ['Gathering all session sources...', 'Extracting topics and database schemas...', 'Initializing analysis pipeline...']
        });
      }

      // 2. Extract topics and databases from sessionSources
      const topics = sessionSources?.web_topics?.topics?.map((t: any) => t.topic) || [];
      let databases = sessionSources?.external_databases?.databases?.map((db: any) => db.external_database) || [];

      // As per the workspace requirement, we process all data sources under the current session simultaneously.
      databases = databases.filter((db: string) => db && db !== 'sql_upload' && db !== 'csv_upload');

      setIsAnalyzing(true);
      // We no longer clear results here to allow the Import tab to keep showing its data

      // 3. Switch to analyze tab IMMEDIATELY
      await forwardToNextAgent(selectedAgent.id, 'Session Analysis Started', historyItem?.connectionName);

      // 4. Run Session Analysis API in background
      try {
        const response = await connectorService.processSessionAnalysis({
          session_id: sessionId,
          topics,
          databases
        });

        if (response) {
          const report = response.report || response.description || response.report_content || (typeof response === 'string' ? response : null);
          const errorMessage = (response.status === 'partial' || response.status === 'error') ? response.message : null;
          const displayContent = report || errorMessage;

          if (displayContent) {
            setConnectorResults(prev => ({
              ...prev,
              description: displayContent,
              report_content: response.report_content || null
            }));
          }
        }
      } catch (err) {
        console.error('Failed session analysis:', err);
      } finally {
        setIsAnalyzing(false);
      }
    } catch (error) {
      console.error('Failed to continue to process:', error);
    }
  };

  const handleAction = async (historyItem: AgentHistoryItem, option?: string) => {
    if (!selectedAgent) return;

    const isWebSearch = activeConnector?.name === 'Web Search using LLM' || activeConnector?.name === 'Web Search';

    if (selectedAgentId === 'ingest' && (option === 'Continue' || !option)) {
      await handleContinueToProcess();
      return;
    }

    if (selectedAgentId === 'connect' && (option === 'Continue' || !option)) {
      if (!userId || !historyItem.connectorId) {
        console.error("Missing userId or connectorId to continue import");
        return;
      }

      // 1. Reconstruct connector from history and always update selected connector
      // This ensures that switching between types (e.g. Web Search vs Database) from history works correctly.
      const isWebSearch = historyItem.db_type === 'saved_web_result' ||
        historyItem.db_type === 'web_search' ||
        historyItem.connectionName === 'Web Search' ||
        historyItem.action?.startsWith('Saved Research:');

      // Calculate unique names first for dynamic display
      const allSessionConnectors = selectedAgent.history.filter(h => h.session_id === historyItem.session_id && h.db_type !== 'saved_web_result' && h.db_type !== 'web_search');
      const uniqueConnectionNames = Array.from(new Set(allSessionConnectors.map(h => h.connectionName || 'data source'))).filter(Boolean).join(', ') || 'Data source';

      setSelectedConnector({
        id: historyItem.connectorId || '',
        name: isWebSearch ? 'Web Search using LLM' : uniqueConnectionNames,
        description: historyItem.details || '',
        type: isWebSearch ? 'Integration' : 'Database',
        icon: isWebSearch ? 'globe' : 'database',
        status: 'connected'
      });

      // 2. Set importing state and clear previous results
      setIsImporting(true);
      setConnectorResults(null);
      setImportError(null);

      // 3. Update history to show processing (this will be picked up by polling)

      const newActivities = historyItem.activities
        ? [...historyItem.activities, `Initiating import process for ${uniqueConnectionNames}...`]
        : [`Initiating import process for ${uniqueConnectionNames}...`];

      await agentService.updateHistoryItem(selectedAgent.id, historyItem.id, {
        status: 'processing',
        details: `Triggering data import from ${uniqueConnectionNames}...`,
        activities: newActivities
      });

      // 4. Forward IMMEDIATELY to switch tabs
      await forwardToNextAgent(selectedAgent.id, 'Import Triggered', historyItem.connectionName);

      // 5. Run API call in background
      (async () => {
        try {
          let response;
          if (historyItem.db_type === 'saved_web_result') {
            response = await connectorService.getSavedResults(userId.toString(), historyItem.topic || '');
          } else if (historyItem.db_type === 'csv_upload' || historyItem.db_type === 'csv_chunk_upload') {
            const allCsvItems = selectedAgent.history.filter(h => h.db_type === 'csv_upload' || h.db_type === 'csv_chunk_upload');
            const connectionIds = allCsvItems.length > 0 ? allCsvItems.map(h => Number(h.id)) : [Number(historyItem.id)];

            response = await connectorService.importCsvData({
              user_id: Number(userId),
              connection_ids: connectionIds,
              session_id: historyItem.session_id || ''
            });
          } else if (historyItem.db_type === 'sql_upload' || historyItem.db_type === 'sql_chunk_upload') {
            response = await connectorService.importSqlData({
              user_id: Number(userId),
              connection_id: Number(historyItem.id),
              session_id: historyItem.session_id || ''
            });
          } else {
            const connectionIds = allSessionConnectors.length > 0 
                ? allSessionConnectors.map(h => h.connectorId || h.id).filter(Boolean).map(String) 
                : [historyItem.connectorId || ''];

            response = await connectorService.continueToImport({
              user_id: userId.toString(),
              connection_ids: connectionIds,
              session_id: historyItem.session_id
            });
          }

          if (response) {
            if (response.status === "error") {
              // ✅ Show API error message in UI
              setImportError(response.message || response.error || response.details || "Import failed due to an unknown error");
              setConnectorResults(null);
            } else {
              // ✅ Success case
              setConnectorResults(response);
              setImportError(null);

              if (historyItem.session_id) {
                const sources = await connectorService.getSessionSources(historyItem.session_id);
                setSessionSources(sources);
              }
            }
          } else {
            setConnectorResults(null);
          }

          // The polling mechanism will eventually update the agent history
        } catch (error: any) {
          console.error("Import failed:", error);
          setConnectorResults(null); // Clear previous data on failure

          const errorMsg = error.response?.data?.message
            || error.response?.data?.error
            || error.message
            || 'Failed to import data from your database. Please check your connection.';

          setImportError(errorMsg);
          // The polling mechanism will eventually update the agent history
        } finally {
          setIsImporting(false);
        }
      })();

      return;
    }


    if (option && option.startsWith('SESSION_ANALYSIS:')) {
      const payloadStr = option.replace('SESSION_ANALYSIS:', '');
      try {
        const payload = JSON.parse(payloadStr);
        if (!historyItem.session_id) {
          console.error("Missing session_id for session analysis");
          return;
        }

        setIsAnalyzing(true);
        // We no longer clear results here to allow the Import tab to keep showing its data
        await agentService.updateHistoryItem(selectedAgent.id, historyItem.id, {
          status: 'processing',
          details: 'Initiating session analysis with selected topics and databases...',
          activities: ['Gathering selected items...', 'Sending to analysis engine...', 'Awaiting insights...']
        });

        await forwardToNextAgent(selectedAgent.id, 'Session Analysis Triggered', historyItem.connectionName);

        // Run API call in background
        const response = await connectorService.processSessionAnalysis({
          session_id: historyItem.session_id,
          topics: payload.topics,
          databases: payload.databases
        });

        if (response) {
          const report = response.report || response.description || response.report_content || (typeof response === 'string' ? response : null);
          const errorMessage = (response.status === 'partial' || response.status === 'error') ? response.message : null;
          const displayContent = report || errorMessage;

          if (displayContent) {
            setConnectorResults(prev => ({
              ...prev,
              description: displayContent,
              report_content: response.report_content || null
            }));
          }
        }

        // The polling mechanism will eventually update the agent history
      } catch (error) {
        console.error("Session analysis failed:", error);
        // The polling mechanism will eventually update the agent history
      } finally {
        setIsAnalyzing(false);
      }
      return;
    }

    const newActivities = historyItem.activities
      ? [...historyItem.activities, `Executing: ${option || 'Continue'}`]
      : [`Executing: ${option || 'Continue'}`];

    // Simulate processing an action
    await agentService.updateHistoryItem(selectedAgent.id, historyItem.id, {
      status: 'processing',
      details: option ? `Processing option: ${option}...` : 'Processing...',
      activities: newActivities
    });

    // Simulate completion
    setTimeout(async () => {
      // The polling mechanism will eventually update the history item status
      // Automatically forward to next agent
      await forwardToNextAgent(selectedAgent.id, option || historyItem.action, historyItem.connectionName);
    }, 2000);
  };

  const handleScenarioConfirm = async (scenario: string) => {
    if (!selectedAgent) return;

    // Add a history item for the scenario selection
    // No-op: awaiting API sync for ingestion status
    console.log('Ingestion requested, awaiting server sync.');

    setAgents(await agentService.getAgents(userId, selectedAgent.id === 'connect'));

    // Forward to next agent
    await forwardToNextAgent('ingest', scenario, activeConnector?.name);
  };

  const handleDeleteHistoryItem = async (item: AgentHistoryItem) => {
    try {
      const activeSessionId = localStorage.getItem('DAgent_session_id') || (activeConnector as any)?.session_id || item.session_id;
      if (!activeSessionId) {
        console.error('Session ID is missing, cannot delete.');
        return;
      }

      // Show loader while deleting
      setIsImporting(true);
      setConnectorResults(null);
      setImportError(null);

      const res = await connectorService.deleteConnectionHistory(item.id, activeSessionId);
      if (res && res.status === 'success') {
        // Refresh agents to get updated history
        let freshAgents = agents;
        if (userId) {
          freshAgents = await agentService.getAgents(userId, selectedAgentId === 'connect');
          setAgents(freshAgents);
        }

        // Find remaining connections for this session and re-import
        const connectAgent = freshAgents.find((a: any) => a.id === 'connect');
        const remainingConnections = connectAgent?.history?.filter(
          (h: any) => h.session_id === activeSessionId && h.id !== item.id
        ) || [];

        if (remainingConnections.length > 0) {
          // Re-trigger import for remaining connections
          const remainingIds = remainingConnections.map((h: any) => h.connectorId || h.id).filter(Boolean).map(String);
          try {
            const response = await connectorService.continueToImport({
              user_id: userId!.toString(),
              connection_ids: remainingIds,
              session_id: activeSessionId
            });
            if (response && response.status !== 'error') {
              setConnectorResults(response);
            }
          } catch (reimportErr) {
            console.error('Re-import after delete failed:', reimportErr);
          }
        }

        // Refresh session sources
        if (activeSessionId) {
          const sources = await connectorService.getSessionSources(activeSessionId);
          setSessionSources(sources);
        }
      }
    } catch (err) {
      console.error('Failed to delete history item:', err);
    } finally {
      setIsImporting(false);
    }
  };

  const handleToggleSelectHistory = (id: string, selected: boolean) => {
    setSelectedHistoryItems(prev => {
      const newSet = new Set(prev);
      if (selected) newSet.add(id);
      else newSet.delete(id);
      return newSet;
    });
  };

  const handleBulkDeleteHistory = async () => {
    if (selectedHistoryItems.size === 0) return;
    setIsBulkDeleting(true);
    setIsImporting(true);
    setConnectorResults(null);
    setImportError(null);
    try {
      const activeSessionId = localStorage.getItem('DAgent_session_id') || (activeConnector as any)?.session_id;
      if (!activeSessionId) return;

      const promises = Array.from(selectedHistoryItems).map(id =>
        connectorService.deleteConnectionHistory(id, activeSessionId)
      );
      await Promise.all(promises);

      setSelectedHistoryItems(new Set());
      
      let freshAgents = agents;
      if (userId) {
        freshAgents = await agentService.getAgents(userId, selectedAgentId === 'connect');
        setAgents(freshAgents);
      }

      // Find remaining connections for this session and re-import
      const connectAgent = freshAgents.find((a: any) => a.id === 'connect');
      const remainingConnections = connectAgent?.history?.filter(
        (h: any) => h.session_id === activeSessionId && !selectedHistoryItems.has(h.id)
      ) || [];

      if (remainingConnections.length > 0) {
        const remainingIds = remainingConnections.map((h: any) => h.connectorId || h.id).filter(Boolean).map(String);
        try {
          const response = await connectorService.continueToImport({
            user_id: userId!.toString(),
            connection_ids: remainingIds,
            session_id: activeSessionId
          });
          if (response && response.status !== 'error') {
            setConnectorResults(response);
          }
        } catch (reimportErr) {
          console.error('Re-import after bulk delete failed:', reimportErr);
        }
      }

      // Refresh session sources
      if (activeSessionId) {
        const sources = await connectorService.getSessionSources(activeSessionId);
        setSessionSources(sources);
      }
    } catch (err) {
      console.error('Failed to bulk delete history items:', err);
    } finally {
      setIsBulkDeleting(false);
      setIsImporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  const handleStepperClick = (agentId: string) => {
    // Clear transient results when moving away from the intake/process flow
    if (agentId === 'connect' || agentId === 'query') {
      clearAnalysisResults();
    }

    setSelectedAgentId(agentId);
    if (onChangeTab) {
      const tabMap: Record<string, string> = {
        connect: 'connectors',
        ingest: 'collection',
        analyze: 'analysis',
        query: 'chat'
      };
      if (tabMap[agentId]) {
        onChangeTab(tabMap[agentId] as any);
      }
    }
  };

  return (
    <div className="w-full flex-col h-full py-1 flex gap-4">
      {/* Stepper - Agent List (hidden on Query tab) */}
      {selectedAgentId !== 'query' && (
        <AgentStepper
          agents={agents}
          selectedAgentId={selectedAgentId}
          onSelectAgent={handleStepperClick}
        />
      )}

      {/* Main Content - Agent History & Actions */}
      <div className="flex-1 flex flex-col min-h-0">
        {selectedAgent && (
          <Card className={`flex-1 flex flex-col ${(compact || selectedAgent.id === 'query') ? 'border-none shadow-none bg-transparent' : 'border-[var(--border)] shadow-xl overflow-hidden bg-[var(--surface)]/50'}`}>
            {selectedAgent.id !== 'query' && (
              <CardHeader className={`${compact ? 'px-0 pt-1 pb-3' : 'bg-[var(--surface)] p-4 border-b border-[var(--border)]'} shrink-0`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] border border-[var(--accent)]/20 relative">
                      {selectedAgent.id === 'ingest' && activeConnector?.name === 'Web Search using LLM' ? (
                        <div className="relative">
                          <Globe className="w-5 h-5" />
                          <Search className="w-3 h-3 absolute -bottom-1 -right-1" />
                        </div>
                      ) : (
                        getAgentIcon(selectedAgent.icon)
                      )}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">{selectedAgent.name}</h2>
                      <p className="text-xs text-[var(--text-secondary)]">{selectedAgent.description}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
            )}

            <CardContent className={`flex-1 ${selectedAgent.id === 'query' ? 'flex flex-col p-0 overflow-hidden' : compact ? 'px-0 overflow-visible space-y-4' : 'overflow-y-auto p-4 space-y-4'}`}>
              {(isAnalyzing && selectedAgent.id === 'analyze') ? (
                <div className="flex flex-col items-center justify-center py-24 gap-6">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative"
                  >
                    <div className="absolute inset-0 bg-[var(--accent)]/20 blur-2xl rounded-full scale-150 animate-pulse" />
                    <Loader2 className="w-12 h-12 animate-spin text-[var(--accent)] relative z-10" />
                  </motion.div>
                  <div className="text-center z-10">
                    <p className="text-lg font-bold text-[var(--text-primary)] mb-2">Analyzing your data...</p>
                    <p className="text-sm text-[var(--text-secondary)]">Generating session analysis reports</p>
                    <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-md">
                      {['', '', ''].map((tag, idx) => (
                        <span key={idx} className="px-3 py-1 rounded-full bg-[var(--surface-hover)] border border-[var(--border)] text-[10px] text-[var(--text-secondary)] animate-pulse" style={{ animationDelay: `${idx * 200}ms` }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {selectedAgent.id === 'ingest' && (
                    <IngestDataView
                      activeConnector={activeConnector}
                      connectorResults={connectorResults}
                      sessionSources={sessionSources}
                      isImporting={isImporting}
                      isAnalyzing={isAnalyzing}
                      importError={importError}
                      onGoToDataSource={() => handleStepperClick('connect')}
                      onContinue={handleContinueToProcess}
                    />
                  )}

                  {selectedAgent.id === 'connect' && (
                    <div className="mb-12">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-bold">Available Connectors</h3>
                          <p className="text-sm text-[var(--text-secondary)]">Choose from our list of supported data sources</p>
                        </div>
                        {onNewConnector && (
                          <Button variant="outline" size="sm" onClick={onNewConnector}>
                            <Play className="w-4 h-4 mr-2" />
                            Custom Data source
                          </Button>
                        )}
                      </div>
                      <ConnectorList onSelect={() => onChangeTab?.('new-connector')} />
                    </div>
                  )}

                  {selectedAgent.id === 'query' ? (
                    (() => {
                      if (!workspaceType) {
                        return null; // Prevent rendering anything until workspaceType is known
                      }

                      const isDefaultChat = localStorage.getItem('is_default_chat') === 'true';

                      if (workspaceType === 'Generic') {
                        return (
                          <QueryViewGeneric
                            sessionId={sessionId}
                            workspaceName={workspaceName}
                            workspaceType={workspaceType}
                            chatCollapsed={chatCollapsed}
                            setChatCollapsed={setChatCollapsed}
                            chatKey={chatKey}
                            initialChatMessage={initialChatMessage}
                            onChangeTab={onChangeTab}
                            onNewSessionCreated={onNewSessionCreated}
                            isWorkspacesLoading={isWorkspacesLoading}
                          />
                        );
                      }

                      return (
                        <QueryViewSales
                          sessionId={sessionId}
                          workspaceName={workspaceName}
                          workspaceType={workspaceType}
                          chatCollapsed={chatCollapsed}
                          setChatCollapsed={setChatCollapsed}
                          chatKey={chatKey}
                          initialChatMessage={initialChatMessage}
                          onChangeTab={onChangeTab}
                          onNewSessionCreated={onNewSessionCreated}
                          activeGraphId={activeGraphId}
                          setActiveGraphId={setActiveGraphId}
                          isWorkspacesLoading={isWorkspacesLoading}
                        />
                      );
                    })()
                  ) : (
                    (() => {
                      const isIngest = selectedAgent.id === 'ingest';
                      const isAnalyze = selectedAgent.id === 'analyze';

                      if (isIngest) return null; // Handled above

                      const filteredHistory = isAnalyze ? [] : selectedAgent.history;
                      const shouldShowHistoryHeader = !isAnalyze && filteredHistory.length > 0;

                      return (
                        <>
                          {shouldShowHistoryHeader && (
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                                {selectedAgent.name} History
                              </h3>

                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs h-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                  onClick={() => {
                                    if (selectedHistoryItems.size === filteredHistory.length) {
                                      setSelectedHistoryItems(new Set());
                                    } else {
                                      setSelectedHistoryItems(new Set(filteredHistory.map(h => h.id)));
                                    }
                                  }}
                                >
                                  {selectedHistoryItems.size === filteredHistory.length ? 'Deselect All' : 'Select All'}
                                </Button>

                                {selectedHistoryItems.size > 0 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10 text-xs h-8"
                                    onClick={() => setShowBulkDeleteModal(true)}
                                    disabled={isBulkDeleting}
                                  >
                                    {isBulkDeleting ? (
                                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                    )}
                                    Delete Selected ({selectedHistoryItems.size})
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                          {isAnalyze && !isAnalyzing && !selectedAgent.history.some(h => h.status === 'processing') && !connectorResults?.description && (
                            <motion.div
                              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                              className="text-center py-12 border-2 border-dashed border-[var(--border)] rounded-2xl"
                            >
                              <BarChart3 className="w-8 h-8 text-[var(--text-secondary)] mx-auto mb-3 opacity-50" />
                              <p className="text-[var(--text-secondary)] font-medium">No analysis process found.</p>
                              <p className="text-xs text-[var(--text-secondary)]/60 mt-1">Start a new analysis from the Import tab.</p>
                            </motion.div>
                          )}

                          {isAnalyze && !isAnalyzing && connectorResults?.description && (
                            <>
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
                              >
                                <div className="prose prose-sm max-w-none text-[var(--text-primary)] leading-relaxed prose-a:text-[var(--accent)] hover:prose-a:underline">
                                  {typeof connectorResults.description === 'string'
                                    ? <div dangerouslySetInnerHTML={{ __html: formatInsightsText(connectorResults.description) }} />
                                    : JSON.stringify(connectorResults.description, null, 2)}
                                </div>
                              </motion.div>

                              {/* Navigation button to Query section */}
                              <div className="mt-12 pt-8 border-t border-[var(--border)] flex justify-end">
                                <Button
                                  onClick={() => {
                                    setIsForwardingToQuery(true);
                                    setTimeout(() => {
                                      setIsForwardingToQuery(false);
                                      if (onCreateWorkspaceFromSummary && connectorResults?.description) {
                                        let summaryText = typeof connectorResults.description === 'string'
                                          ? connectorResults.description
                                          : JSON.stringify(connectorResults.description);

                                        // VERY IMPORTANT: If we have full report_content (with charts/kpis), save THAT to history!
                                        if (connectorResults.report_content) {
                                          summaryText = typeof connectorResults.report_content === 'object'
                                            ? JSON.stringify(connectorResults.report_content)
                                            : connectorResults.report_content;
                                        }

                                        onCreateWorkspaceFromSummary(summaryText);
                                      } else {
                                        handleStepperClick('query');
                                      }
                                    }, 800);
                                  }}
                                  variant="primary"
                                  size="sm"
                                  className="px-8 shadow-lg shadow-[var(--accent)]/20"
                                  disabled={isForwardingToQuery}
                                >
                                  {isForwardingToQuery ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Loading...
                                    </>
                                  ) : (
                                    'Want to know more?'
                                  )}
                                </Button>
                              </div>
                            </>
                          )}

                          {!isAnalyze && (
                            <AnimatePresence mode="popLayout">
                              {filteredHistory.length === 0 ? (
                                isIngest ? null : (
                                  <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="text-center py-12 border-2 border-dashed border-[var(--border)] rounded-2xl"
                                  >
                                    <Clock className="w-8 h-8 text-[var(--text-secondary)] mx-auto mb-3 opacity-50" />
                                    <p className="text-[var(--text-secondary)]">No history found for this agent.</p>
                                  </motion.div>
                                )
                              ) : (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  className="space-y-4"
                                >
                                  {filteredHistory.map((item) => (
                                    <HistoryItemCard
                                      key={item.id}
                                      item={item}
                                      agent={selectedAgent}
                                      onAction={handleAction}
                                      onForward={forwardToNextAgent}
                                      onScenarioConfirm={handleScenarioConfirm}
                                      onDelete={handleDeleteHistoryItem}
                                      isSelected={selectedHistoryItems.has(item.id)}
                                      onSelect={handleToggleSelectHistory}
                                    />
                                  ))}
                                  {selectedAgent.id === 'connect' && (
                                    <div className="mt-4 pt-4 border-t border-[var(--border)] flex justify-end">
                                      <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => handleAction(filteredHistory[filteredHistory.length - 1], 'Continue')}
                                        disabled={filteredHistory.some(h => h.status?.toLowerCase() === 'processing')}
                                        className="shadow-lg shadow-[var(--accent)]/20"
                                      >
                                        Continue to Import
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                      </Button>
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          )}
                        </>
                      );
                    })()
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <AnimatePresence>
        {showBulkDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xl max-w-md w-full mx-4"
            >
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 whitespace-normal">
                Delete {selectedHistoryItems.size} Selected Items
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed whitespace-normal">
                Are you sure you want to delete the selected items? This will remove all associated logs and external database tables. This action cannot be undone.
              </p>

              <div className="flex justify-between items-center mt-2">
                <button
                  onClick={() => setShowBulkDeleteModal(false)}
                  className="px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await handleBulkDeleteHistory();
                    setShowBulkDeleteModal(false);
                  }}
                  disabled={isBulkDeleting}
                  className="px-4 py-2 rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition-colors flex items-center"
                >
                  {isBulkDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Confirm Delete'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};



