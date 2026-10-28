// import { useState, useEffect } from 'react';
// import { AgentData, AgentHistoryItem } from '../types';
// import { Button } from '@/src/ui-kit';
// import { motion } from 'motion/react';
// import { CheckCircle2, Loader2, RotateCcw, Sparkles, ArrowRight, XCircle } from 'lucide-react';
// import { useConnectorContext } from '../../../context/ConnectorContext';

// export const HistoryItemCard = ({
//   item,
//   agent,
//   onAction,
//   onForward,
//   onScenarioConfirm
// }: {
//   item: AgentHistoryItem,
//   agent: AgentData,
//   onAction: (item: AgentHistoryItem, option?: string) => void,
//   onForward: (agentId: string, context: string, connectionName?: string) => void,
//   onScenarioConfirm?: (scenario: string) => void
// }) => {
//   const [activityIndex, setActivityIndex] = useState(() => {
//     return (item.status === 'pending_input' || item.status === 'completed' || item.status === 'failed')
//       ? (item.activities?.length || 1) - 1
//       : 0;
//   });

//   useEffect(() => {
//     if (item.status === 'processing' && item.activities && activityIndex < item.activities.length - 1) {
//       const timer = setInterval(() => {
//         setActivityIndex(prev => prev + 1);
//       }, 1000);
//       return () => clearInterval(timer);
//     }
//   }, [item.status, item.activities, activityIndex]);

//   useEffect(() => {
//     if (item.status === 'pending_input' || item.status === 'completed' || item.status === 'failed') {
//       setActivityIndex((item.activities?.length || 1) - 1);
//     }
//   }, [item.status, item.activities]);

//   const displayIndex = (item.status === 'pending_input' || item.status === 'completed' || item.status === 'failed')
//     ? (item.activities?.length || 1) - 1
//     : activityIndex;

//   const [tableAction, setTableAction] = useState('update');
//   const [selectedNewTables, setSelectedNewTables] = useState<string[]>([]);

//   // State for session analysis selection
//   const [selectedSessionTopics, setSelectedSessionTopics] = useState<string[]>([]);
//   const [selectedSessionDatabases, setSelectedSessionDatabases] = useState<string[]>([]);

//   const { selectedConnector: activeConnector, connectorResults } = useConnectorContext();

//   const situations = item.situations || connectorResults?.data?.situations || connectorResults?.situations;

//   useEffect(() => {
//     if (item.customInputType === 'table_selection' && item.customInputData?.newTables) {
//       setSelectedNewTables(item.customInputData.newTables);
//     } else if (item.customInputType === 'session_analysis_selection' && item.customInputData) {
//       if (item.customInputData.topics) setSelectedSessionTopics(item.customInputData.topics);
//       if (item.customInputData.databases) setSelectedSessionDatabases(item.customInputData.databases);
//     }
//   }, [item]);

//   const handleTableSelectionSubmit = () => {
//     const actionText = `Existing: ${tableAction === 'update' ? 'Update' : 'Replace'}, New: ${selectedNewTables.length > 0 ? selectedNewTables.join(', ') : 'None'}`;
//     onAction(item, actionText);
//   };

//   const handleSessionAnalysisSubmit = () => {
//     const payload = JSON.stringify({
//       topics: selectedSessionTopics,
//       databases: selectedSessionDatabases
//     });
//     onAction(item, `SESSION_ANALYSIS:${payload}`);
//   };

//   const getContinueText = (currentId: string) => {
//     if (currentId === 'connect') return 'Continue to Import';
//     if (currentId === 'ingest') return 'Continue to Process';
//     if (currentId === 'analyze') return 'Want to know more?';
//     return 'Open Query';
//   };


//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       className={`
//         p-3 rounded-xl border transition-all
//         ${item.status === 'processing' ? 'border-[var(--accent)] bg-[var(--accent)]/5 shadow-lg shadow-[var(--accent)]/10' :
//           item.status === 'failed' ? 'border-red-500/10 bg-red-500/[0.02]' :
//             item.status === 'pending_input' ? 'border-[var(--warning)]/20 bg-[var(--warning)]/[0.02]' :
//               'border-[var(--border)] bg-[var(--bg)]/50'}
//       `}
//     >
//       <div className="flex items-start justify-between gap-4 mb-3">
//         <div className="min-w-0">
//           <div className="flex flex-wrap items-center gap-2 mb-1">
//             {item.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-[var(--success)] shrink-0" />}
//             {item.status === 'failed' && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
//             {item.status === 'processing' && <Loader2 className="w-4 h-4 text-[var(--accent)] animate-spin shrink-0" />}
//             {item.status === 'pending_input' && <RotateCcw className="w-4 h-4 text-[var(--warning)] shrink-0" />}
//             <h4 className="font-bold text-[var(--text-primary)] truncate">
//               {item.action}
//             </h4>
//             {item.connectionName && (
//               <span className="text-[var(--accent)] font-medium text-xs bg-[var(--accent)]/10 px-2 py-0.5 rounded-full shrink-0">
//                 {item.connectionName}
//               </span>
//             )}
//           </div>
//           <p className="text-sm text-[var(--text-secondary)] break-words whitespace-pre-wrap">{item.details}</p>
//         </div>
//         <div className="text-[11px] shrink-0 whitespace-nowrap font-mono text-[var(--text-secondary)] bg-[var(--bg)]/50 px-2 py-1 rounded-md border border-[var(--border)]/50 h-fit">
//           {(() => {
//             const d = new Date(item.date);
//             const day = String(d.getUTCDate()).padStart(2, '0');
//             const month = String(d.getUTCMonth() + 1).padStart(2, '0');
//             const year = d.getUTCFullYear();
//             const hours = String(d.getUTCHours()).padStart(2, '0');
//             const minutes = String(d.getUTCMinutes()).padStart(2, '0');
//             return `${day}/${month}/${year} ${hours}:${minutes}`;
//           })()}
//         </div>
//       </div>

//       {item.activities && item.activities.length > 0 && (item.status === 'processing' || item.status === 'pending_input') && (
//         <div className="mt-4 mb-4 space-y-3 font-mono text-sm bg-[var(--bg)]/50 p-6 rounded-2xl border border-[var(--border)]">
//           <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-4">
//             {agent.name} Activity
//           </h4>
//           {item.activities.slice(0, displayIndex + 1).map((activity, i) => (
//             <motion.div
//               key={activity}
//               initial={{ opacity: 0, x: -10 }}
//               animate={{ opacity: 1, x: 0 }}
//               className="flex items-center gap-3"
//             >
//               {i === displayIndex && item.status === 'processing' ? (
//                 <Loader2 className="w-4 h-4 text-[var(--accent)] animate-spin" />
//               ) : (
//                 <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
//               )}
//               <span className={i === displayIndex && item.status === 'processing' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}>
//                 {activity}
//               </span>
//             </motion.div>
//           ))}
//         </div>
//       )}

//       {item.contextualInsights && item.contextualInsights.length > 0 && item.status === 'completed' && (
//         <div className="mt-4 bg-[var(--accent)]/5 rounded-xl border border-[var(--accent)]/20 p-4">
//           <div className="flex items-center gap-2 mb-3">
//             <Sparkles className="w-4 h-4 text-[var(--accent)]" />
//             <h5 className="text-[11px] font-bold uppercase tracking-widest text-[var(--accent)]">Contextual Insights</h5>
//           </div>
//           <ul className="space-y-2">
//             {item.contextualInsights.map((insight, idx) => (
//               <motion.li
//                 key={idx}
//                 initial={{ opacity: 0, y: 5 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ delay: idx * 0.1 }}
//                 className="text-sm text-[var(--text-primary)] flex items-start gap-2"
//               >
//                 <div className="w-1 h-1 rounded-full bg-[var(--accent)]/50 mt-2 shrink-0" />
//                 <span className="leading-relaxed">{insight}</span>
//               </motion.li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {item.status === 'completed' && (
//         <div className="mt-4 pt-4 border-t border-[var(--border)] flex justify-end">
//           <Button
//             variant="primary"
//             size="sm"
//             onClick={() => {
//               if (agent.id === 'connect') {
//                 onAction(item, 'Continue');
//               } else {
//                 onForward(agent.id, item.action, item.connectionName);
//               }
//             }}
//             className="shadow-lg shadow-[var(--accent)]/20"
//           >
//             {getContinueText(agent.id)}
//             {agent.id !== 'analyze' && <ArrowRight className="w-4 h-4 ml-2" />}
//           </Button>
//         </div>
//       )}

//       {(item.status === 'pending_input' || (item.status === 'processing' && agent.id === 'ingest')) && (
//         <div className="mt-4 pt-4 border-t border-[var(--border)]">
//           {(agent.id === 'ingest' && situations && situations.length > 0) ? (
//             <div className="space-y-4">
//               <div className="flex items-center gap-2 mb-4">
//                 <Sparkles className="w-4 h-4 text-[var(--accent)]" />
//                 <h5 className="text-sm font-bold">Situations Identified</h5>
//               </div>
//               <div className="grid grid-cols-1 gap-3">
//                 {situations.map((situation: any, idx: number) => (
//                   <div key={idx} className="p-4 rounded-xl border border-[var(--border)] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
//                     <p className="text-sm font-medium leading-relaxed flex-1">{situation.message}</p>
//                     <div className="flex gap-2 shrink-0">
//                       {situation.buttons.map((btn: string) => (
//                         <Button
//                           key={btn}
//                           variant={btn.toLowerCase() === 'no' ? 'outline' : 'primary'}
//                           size="sm"
//                           onClick={() => onScenarioConfirm?.(situation.message)}
//                           className="h-9 px-6"
//                         >
//                           {btn}
//                         </Button>
//                       ))}
//                     </div>
//                   </div>
//                 ))}
//               </div>

//               {item.customInputType === 'table_selection' && (
//                 <div className="mt-6 pt-6 border-t border-[var(--border)]">
//                   <h5 className="text-sm font-bold mb-4">Data Configuration</h5>
//                   <div className="space-y-6 bg-white p-4 rounded-xl border border-[var(--border)]">
//                     <div>
//                       <h5 className="text-sm font-semibold mb-3">Existing Tables Action</h5>
//                       <div className="flex gap-4">
//                         <label className="flex items-center gap-2 text-sm cursor-pointer">
//                           <input
//                             type="radio"
//                             name={`tableAction-${item.id}`}
//                             value="update"
//                             checked={tableAction === 'update'}
//                             onChange={(e) => setTableAction(e.target.value)}
//                             className="text-[var(--accent)] focus:ring-[var(--accent)]"
//                           />
//                           Update Existing
//                         </label>
//                         <label className="flex items-center gap-2 text-sm cursor-pointer">
//                           <input
//                             type="radio"
//                             name={`tableAction-${item.id}`}
//                             value="replace"
//                             checked={tableAction === 'replace'}
//                             onChange={(e) => setTableAction(e.target.value)}
//                             className="text-[var(--accent)] focus:ring-[var(--accent)]"
//                           />
//                           Replace All
//                         </label>
//                       </div>
//                     </div>

//                     {item.customInputData?.newTables && item.customInputData.newTables.length > 0 && (
//                       <div>
//                         <h5 className="text-sm font-semibold mb-3">New Tables Detected</h5>
//                         <div className="space-y-2">
//                           {item.customInputData.newTables.map((table: string) => (
//                             <label key={table} className="flex items-center gap-2 text-sm cursor-pointer">
//                               <input
//                                 type="checkbox"
//                                 checked={selectedNewTables.includes(table)}
//                                 onChange={(e) => {
//                                   if (e.target.checked) {
//                                     setSelectedNewTables([...selectedNewTables, table]);
//                                   } else {
//                                     setSelectedNewTables(selectedNewTables.filter(t => t !== table));
//                                   }
//                                 }}
//                                 className="rounded text-[var(--accent)] focus:ring-[var(--accent)]"
//                               />
//                               {table}
//                             </label>
//                           ))}
//                         </div>
//                       </div>
//                     )}

//                     <div className="flex justify-end pt-2">
//                       <Button
//                         variant="primary"
//                         size="sm"
//                         onClick={handleTableSelectionSubmit}
//                       >
//                         Confirm & Continue <ArrowRight className="w-4 h-4 ml-2" />
//                       </Button>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           ) : (
//             <>
//               {item.prompt && (
//                 <p className="text-sm font-medium mb-3 flex items-center gap-2">
//                   <RotateCcw className="w-4 h-4 text-[var(--accent)]" />
//                   {item.prompt}
//                 </p>
//               )}

//               {item.customInputType === 'table_selection' ? (
//                 // ... table selection UI ...
//                 <div className="space-y-6 mb-6 bg-white p-4 rounded-xl border border-[var(--border)]">
//                   <div>
//                     <h5 className="text-sm font-semibold mb-3">Existing Tables Action</h5>
//                     <div className="flex gap-4">
//                       <label className="flex items-center gap-2 text-sm cursor-pointer">
//                         <input
//                           type="radio"
//                           name={`tableAction-${item.id}`}
//                           value="update"
//                           checked={tableAction === 'update'}
//                           onChange={(e) => setTableAction(e.target.value)}
//                           className="text-[var(--accent)] focus:ring-[var(--accent)]"
//                         />
//                         Update Existing
//                       </label>
//                       <label className="flex items-center gap-2 text-sm cursor-pointer">
//                         <input
//                           type="radio"
//                           name={`tableAction-${item.id}`}
//                           value="replace"
//                           checked={tableAction === 'replace'}
//                           onChange={(e) => setTableAction(e.target.value)}
//                           className="text-[var(--accent)] focus:ring-[var(--accent)]"
//                         />
//                         Replace All
//                       </label>
//                     </div>
//                   </div>

//                   {item.customInputData?.newTables && item.customInputData.newTables.length > 0 && (
//                     <div>
//                       <h5 className="text-sm font-semibold mb-3">New Tables Detected</h5>
//                       <div className="space-y-2">
//                         {item.customInputData.newTables.map((table: string) => (
//                           <label key={table} className="flex items-center gap-2 text-sm cursor-pointer">
//                             <input
//                               type="checkbox"
//                               checked={selectedNewTables.includes(table)}
//                               onChange={(e) => {
//                                 if (e.target.checked) {
//                                   setSelectedNewTables([...selectedNewTables, table]);
//                                 } else {
//                                   setSelectedNewTables(selectedNewTables.filter(t => t !== table));
//                                 }
//                               }}
//                               className="rounded text-[var(--accent)] focus:ring-[var(--accent)]"
//                             />
//                             {table}
//                           </label>
//                         ))}
//                       </div>
//                     </div>
//                   )}

//                   <div className="flex justify-end pt-2">
//                     <Button
//                       variant="primary"
//                       size="sm"
//                       onClick={handleTableSelectionSubmit}
//                     >
//                       Confirm & Continue <ArrowRight className="w-4 h-4 ml-2" />
//                     </Button>
//                   </div>
//                 </div>
//               ) : item.customInputType === 'session_analysis_selection' ? (
//                 <div className="space-y-6 mb-6 bg-white p-4 rounded-xl border border-[var(--border)]">
//                   {item.customInputData?.topics && item.customInputData.topics.length > 0 && (
//                     <div>
//                       <h5 className="text-sm font-semibold mb-3">Include Web Topics</h5>
//                       <div className="space-y-2 max-h-40 overflow-y-auto">
//                         {item.customInputData.topics.map((topic: string) => (
//                           <label key={`topic-${topic}`} className="flex items-center gap-2 text-sm cursor-pointer">
//                             <input
//                               type="checkbox"
//                               checked={selectedSessionTopics.includes(topic)}
//                               onChange={(e) => {
//                                 if (e.target.checked) {
//                                   setSelectedSessionTopics([...selectedSessionTopics, topic]);
//                                 } else {
//                                   setSelectedSessionTopics(selectedSessionTopics.filter(t => t !== topic));
//                                 }
//                               }}
//                               className="rounded text-[var(--accent)] focus:ring-[var(--accent)]"
//                             />
//                             {topic}
//                           </label>
//                         ))}
//                       </div>
//                     </div>
//                   )}

//                   {item.customInputData?.databases && item.customInputData.databases.length > 0 && (
//                     <div>
//                       <h5 className="text-sm font-semibold mb-3">Include External Databases</h5>
//                       <div className="space-y-2 max-h-40 overflow-y-auto">
//                         {item.customInputData.databases.map((db: string) => (
//                           <label key={`db-${db}`} className="flex items-center gap-2 text-sm cursor-pointer">
//                             <input
//                               type="checkbox"
//                               checked={selectedSessionDatabases.includes(db)}
//                               onChange={(e) => {
//                                 if (e.target.checked) {
//                                   setSelectedSessionDatabases([...selectedSessionDatabases, db]);
//                                 } else {
//                                   setSelectedSessionDatabases(selectedSessionDatabases.filter(d => d !== db));
//                                 }
//                               }}
//                               className="rounded text-[var(--accent)] focus:ring-[var(--accent)]"
//                             />
//                             {db}
//                           </label>
//                         ))}
//                       </div>
//                     </div>
//                   )}

//                   <div className="flex items-center justify-end pt-4 border-t border-[var(--border)]">

//                     <Button
//                       variant="primary"
//                       size="sm"
//                       onClick={handleSessionAnalysisSubmit}
//                       disabled={selectedSessionTopics.length === 0 && selectedSessionDatabases.length === 0}
//                     >
//                       {getContinueText(agent.id)} <ArrowRight className="w-4 h-4 ml-2" />
//                     </Button>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="flex items-center justify-between gap-4 flex-wrap">
//                   {item.options && (
//                     <div className="flex flex-wrap gap-2">
//                       {item.options.map(opt => (
//                         <Button
//                           key={opt}
//                           variant="outline"
//                           size="sm"
//                           onClick={() => onAction(item, opt)}
//                           className="hover:border-[var(--accent)] hover:text-[var(--accent)]"
//                         >
//                           {opt}
//                         </Button>
//                       ))}
//                     </div>
//                   )}
//                   <Button
//                     variant="primary"
//                     size="sm"
//                     onClick={() => onAction(item, 'Continue')}
//                     className="ml-auto"
//                   >
//                     {getContinueText(agent.id)}
//                     {agent.id !== 'analyze' && <ArrowRight className="w-4 h-4 ml-2" />}
//                   </Button>
//                 </div>
//               )}
//             </>
//           )}
//         </div>
//       )}
//     </motion.div>
//   );
// };

import { useState, useEffect } from 'react';
import { AgentData, AgentHistoryItem } from '../types';
import { Button } from '@/src/ui-kit';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Loader2, RotateCcw, Sparkles, ArrowRight, XCircle, Trash2 } from 'lucide-react';
import { useConnectorContext } from '../../../context/ConnectorContext';

export const HistoryItemCard = ({
  item,
  agent,
  onAction,
  onForward,
  onScenarioConfirm,
  onDelete,
  isSelected,
  onSelect
}: {
  item: AgentHistoryItem,
  agent: AgentData,
  onAction: (item: AgentHistoryItem, option?: string) => void,
  onForward: (agentId: string, context: string, connectionName?: string) => void,
  onScenarioConfirm?: (scenario: string) => void,
  onDelete?: (item: AgentHistoryItem) => void,
  isSelected?: boolean,
  onSelect?: (id: string, selected: boolean) => void
}) => {
  const [activityIndex, setActivityIndex] = useState(() => {
    return (item.status === 'pending_input' || item.status === 'completed' || item.status === 'failed')
      ? (item.activities?.length || 1) - 1
      : 0;
  });

  const [isForwarding, setIsForwarding] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (item.status === 'processing' && item.activities && activityIndex < item.activities.length - 1) {
      const timer = setInterval(() => {
        setActivityIndex(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [item.status, item.activities, activityIndex]);

  useEffect(() => {
    if (item.status === 'pending_input' || item.status === 'completed' || item.status === 'failed') {
      setActivityIndex((item.activities?.length || 1) - 1);
    }
  }, [item.status, item.activities]);

  const displayIndex = (item.status === 'pending_input' || item.status === 'completed' || item.status === 'failed')
    ? (item.activities?.length || 1) - 1
    : activityIndex;

  const [tableAction, setTableAction] = useState('update');
  const [selectedNewTables, setSelectedNewTables] = useState<string[]>([]);

  // State for session analysis selection
  const [selectedSessionTopics, setSelectedSessionTopics] = useState<string[]>([]);
  const [selectedSessionDatabases, setSelectedSessionDatabases] = useState<string[]>([]);

  const { selectedConnector: activeConnector, connectorResults } = useConnectorContext();

  const situations = item.situations || connectorResults?.data?.situations || connectorResults?.situations;

  useEffect(() => {
    if (item.customInputType === 'table_selection' && item.customInputData?.newTables) {
      setSelectedNewTables(item.customInputData.newTables);
    } else if (item.customInputType === 'session_analysis_selection' && item.customInputData) {
      if (item.customInputData.topics) setSelectedSessionTopics(item.customInputData.topics);
      if (item.customInputData.databases) setSelectedSessionDatabases(item.customInputData.databases);
    }
  }, [item]);

  const handleTableSelectionSubmit = () => {
    const actionText = `Existing: ${tableAction === 'update' ? 'Update' : 'Replace'}, New: ${selectedNewTables.length > 0 ? selectedNewTables.join(', ') : 'None'}`;
    onAction(item, actionText);
  };

  const handleScenarioConfirm = async () => {
    setShowScenarioModal(false);
    if (onScenarioConfirm) {
      onScenarioConfirm('Custom Scenario');
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete(item);
      }
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleProcessAction = () => {
    const payload = JSON.stringify({
      topics: selectedSessionTopics,
      databases: selectedSessionDatabases
    });
    onAction(item, `SESSION_ANALYSIS:${payload}`);
  };

  const handleSessionAnalysisSubmit = () => {
    const payload = JSON.stringify({
      topics: selectedSessionTopics,
      databases: selectedSessionDatabases
    });
    onAction(item, `SESSION_ANALYSIS:${payload}`);
  };

  const getContinueText = (currentId: string) => {
    if (currentId === 'connect') return 'Continue to Import';
    if (currentId === 'ingest') return 'Continue to Process';
    if (currentId === 'analyze') return 'Want to know more?';
    return 'Open Query';
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        p-3 rounded-xl border transition-all
        ${item.status?.toLowerCase() === 'processing' ? 'border-[var(--accent)] bg-[var(--accent)]/5 shadow-lg shadow-[var(--accent)]/10' :
          item.status?.toLowerCase() === 'failed' || item.status?.toLowerCase() === 'error' ? 'border-red-500/10 bg-red-500/[0.02]' :
            item.status?.toLowerCase() === 'pending_input' ? 'border-[var(--warning)]/20 bg-[var(--warning)]/[0.02]' :
              'border-[var(--border)] bg-[var(--bg)]/50'}
      `}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0 flex items-start gap-3">
          {onSelect && (
            <div className="pt-0.5">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] bg-[var(--bg)] cursor-pointer"
                checked={!!isSelected}
                onChange={(e) => onSelect(item.id, e.target.checked)}
              />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {['completed', 'success'].includes(item.status?.toLowerCase() || '') && <CheckCircle2 className="w-4 h-4 text-[var(--success)] shrink-0" />}
              {['failed', 'error'].includes(item.status?.toLowerCase() || '') && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
              {item.status?.toLowerCase() === 'processing' && <Loader2 className="w-4 h-4 text-[var(--accent)] animate-spin shrink-0" />}
              {item.status?.toLowerCase() === 'pending_input' && <RotateCcw className="w-4 h-4 text-[var(--warning)] shrink-0" />}
              <h4 className="font-bold text-[var(--text-primary)] truncate">
                {item.action}
              </h4>
              {item.connectionName && (
                <span className="text-[var(--accent)] font-medium text-xs bg-[var(--accent)]/10 px-2 py-0.5 rounded-full shrink-0">
                  {item.connectionName}
                </span>
              )}
            </div>
            <p className="text-sm text-[var(--text-secondary)] break-words whitespace-pre-wrap">{item.details}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-[11px] shrink-0 whitespace-nowrap font-mono text-[var(--text-secondary)] bg-[var(--bg)]/50 px-2 py-1 rounded-md border border-[var(--border)]/50 h-fit">
            {(() => {
              const d = new Date(item.date);
              const day = String(d.getUTCDate()).padStart(2, '0');
              const month = String(d.getUTCMonth() + 1).padStart(2, '0');
              const year = d.getUTCFullYear();
              const hours = String(d.getUTCHours()).padStart(2, '0');
              const minutes = String(d.getUTCMinutes()).padStart(2, '0');
              return `${day}/${month}/${year} ${hours}:${minutes}`;
            })()}
          </div>
          {onDelete && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
              title="Delete this data"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {item.activities && item.activities.length > 0 && (item.status === 'processing' || item.status === 'pending_input') && (
        <div className="mt-4 mb-4 space-y-3 font-mono text-sm bg-[var(--bg)]/50 p-6 rounded-2xl border border-[var(--border)]">
          <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-4">
            {agent.name} Activity
          </h4>
          {item.activities.slice(0, displayIndex + 1).map((activity, i) => (
            <motion.div
              key={activity}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              {i === displayIndex && item.status === 'processing' ? (
                <Loader2 className="w-4 h-4 text-[var(--accent)] animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
              )}
              <span className={i === displayIndex && item.status === 'processing' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}>
                {activity}
              </span>
            </motion.div>
          ))}
        </div>
      )}

      {item.contextualInsights && item.contextualInsights.length > 0 && item.status === 'completed' && (
        <div className="mt-4 bg-[var(--accent)]/5 rounded-xl border border-[var(--accent)]/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-[var(--accent)]" />
            <h5 className="text-[11px] font-bold uppercase tracking-widest text-[var(--accent)]">Contextual Insights</h5>
          </div>
          <ul className="space-y-2">
            {item.contextualInsights.map((insight, idx) => (
              <motion.li
                key={idx}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="text-sm text-[var(--text-primary)] flex items-start gap-2"
              >
                <div className="w-1 h-1 rounded-full bg-[var(--accent)]/50 mt-2 shrink-0" />
                <span className="leading-relaxed">{insight}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      )}

      {item.status === 'completed' && agent.id !== 'connect' && (
        <div className="mt-4 pt-4 border-t border-[var(--border)] flex justify-end">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (agent.id === 'analyze') {
                setIsForwarding(true);
                setTimeout(() => {
                  setIsForwarding(false);
                  onForward(agent.id, item.action, item.connectionName);
                }, 800);
              } else if (agent.id === 'connect') {
                onAction(item, 'Continue');
              } else {
                onForward(agent.id, item.action, item.connectionName);
              }
            }}
            className="shadow-lg shadow-[var(--accent)]/20"
            disabled={isForwarding}
          >
            {isForwarding && agent.id === 'analyze' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                {getContinueText(agent.id)}
                {agent.id !== 'analyze' && <ArrowRight className="w-4 h-4 ml-2" />}
              </>
            )}
          </Button>
        </div>
      )}

      {(item.status === 'pending_input' || (item.status === 'processing' && agent.id === 'ingest')) && (
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          {(agent.id === 'ingest' && situations && situations.length > 0) ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                <h5 className="text-sm font-bold">Situations Identified</h5>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {situations.map((situation: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl border border-[var(--border)] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                    <p className="text-sm font-medium leading-relaxed flex-1">{situation.message}</p>
                    <div className="flex gap-2 shrink-0">
                      {situation.buttons.map((btn: string) => (
                        <Button
                          key={btn}
                          variant={btn.toLowerCase() === 'no' ? 'outline' : 'primary'}
                          size="sm"
                          onClick={() => onScenarioConfirm?.(situation.message)}
                          className="h-9 px-6"
                        >
                          {btn}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {item.customInputType === 'table_selection' && (
                <div className="mt-6 pt-6 border-t border-[var(--border)]">
                  <h5 className="text-sm font-bold mb-4">Data Configuration</h5>
                  <div className="space-y-6 bg-white p-4 rounded-xl border border-[var(--border)]">
                    <div>
                      <h5 className="text-sm font-semibold mb-3">Existing Tables Action</h5>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="radio"
                            name={`tableAction-${item.id}`}
                            value="update"
                            checked={tableAction === 'update'}
                            onChange={(e) => setTableAction(e.target.value)}
                            className="text-[var(--accent)] focus:ring-[var(--accent)]"
                          />
                          Update Existing
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="radio"
                            name={`tableAction-${item.id}`}
                            value="replace"
                            checked={tableAction === 'replace'}
                            onChange={(e) => setTableAction(e.target.value)}
                            className="text-[var(--accent)] focus:ring-[var(--accent)]"
                          />
                          Replace All
                        </label>
                      </div>
                    </div>

                    {item.customInputData?.newTables && item.customInputData.newTables.length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold mb-3">New Tables Detected</h5>
                        <div className="space-y-2">
                          {item.customInputData.newTables.map((table: string) => (
                            <label key={table} className="flex items-center gap-2 text-sm cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedNewTables.includes(table)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedNewTables([...selectedNewTables, table]);
                                  } else {
                                    setSelectedNewTables(selectedNewTables.filter(t => t !== table));
                                  }
                                }}
                                className="rounded text-[var(--accent)] focus:ring-[var(--accent)]"
                              />
                              {table}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end pt-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleTableSelectionSubmit}
                      >
                        Confirm & Continue <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {item.prompt && (
                <p className="text-sm font-medium mb-3 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-[var(--accent)]" />
                  {item.prompt}
                </p>
              )}

              {item.customInputType === 'table_selection' ? (
                // ... table selection UI ...
                <div className="space-y-6 mb-6 bg-white p-4 rounded-xl border border-[var(--border)]">
                  <div>
                    <h5 className="text-sm font-semibold mb-3">Existing Tables Action</h5>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name={`tableAction-${item.id}`}
                          value="update"
                          checked={tableAction === 'update'}
                          onChange={(e) => setTableAction(e.target.value)}
                          className="text-[var(--accent)] focus:ring-[var(--accent)]"
                        />
                        Update Existing
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name={`tableAction-${item.id}`}
                          value="replace"
                          checked={tableAction === 'replace'}
                          onChange={(e) => setTableAction(e.target.value)}
                          className="text-[var(--accent)] focus:ring-[var(--accent)]"
                        />
                        Replace All
                      </label>
                    </div>
                  </div>

                  {item.customInputData?.newTables && item.customInputData.newTables.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold mb-3">New Tables Detected</h5>
                      <div className="space-y-2">
                        {item.customInputData.newTables.map((table: string) => (
                          <label key={table} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedNewTables.includes(table)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedNewTables([...selectedNewTables, table]);
                                } else {
                                  setSelectedNewTables(selectedNewTables.filter(t => t !== table));
                                }
                              }}
                              className="rounded text-[var(--accent)] focus:ring-[var(--accent)]"
                            />
                            {table}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleTableSelectionSubmit}
                    >
                      Confirm & Continue <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              ) : item.customInputType === 'session_analysis_selection' ? (
                <div className="space-y-6 mb-6 bg-white p-4 rounded-xl border border-[var(--border)]">
                  {item.customInputData?.topics && item.customInputData.topics.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold mb-3">Include Web Topics</h5>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {item.customInputData.topics.map((topic: string) => (
                          <label key={`topic-${topic}`} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedSessionTopics.includes(topic)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSessionTopics([...selectedSessionTopics, topic]);
                                } else {
                                  setSelectedSessionTopics(selectedSessionTopics.filter(t => t !== topic));
                                }
                              }}
                              className="rounded text-[var(--accent)] focus:ring-[var(--accent)]"
                            />
                            {topic}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.customInputData?.databases && item.customInputData.databases.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold mb-3">Include External Databases</h5>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {item.customInputData.databases.map((db: string) => (
                          <label key={`db-${db}`} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedSessionDatabases.includes(db)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSessionDatabases([...selectedSessionDatabases, db]);
                                } else {
                                  setSelectedSessionDatabases(selectedSessionDatabases.filter(d => d !== db));
                                }
                              }}
                              className="rounded text-[var(--accent)] focus:ring-[var(--accent)]"
                            />
                            {db}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end pt-4 border-t border-[var(--border)]">

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        if (agent.id === 'analyze') {
                          setIsForwarding(true);
                          setTimeout(() => {
                            setIsForwarding(false);
                            handleSessionAnalysisSubmit();
                          }, 800);
                        } else {
                          handleSessionAnalysisSubmit();
                        }
                      }}
                      disabled={(selectedSessionTopics.length === 0 && selectedSessionDatabases.length === 0) || isForwarding}
                    >
                      {isForwarding && agent.id === 'analyze' ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          {getContinueText(agent.id)} <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  {item.options && (
                    <div className="flex flex-wrap gap-2">
                      {item.options.map(opt => (
                        <Button
                          key={opt}
                          variant="outline"
                          size="sm"
                          onClick={() => onAction(item, opt)}
                          className="hover:border-[var(--accent)] hover:text-[var(--accent)]"
                        >
                          {opt}
                        </Button>
                      ))}
                    </div>
                  )}
                  {agent.id !== 'connect' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        if (agent.id === 'analyze') {
                          setIsForwarding(true);
                          setTimeout(() => {
                            setIsForwarding(false);
                            onAction(item, 'Continue');
                          }, 800);
                        } else {
                          onAction(item, 'Continue');
                        }
                      }}
                      className="ml-auto"
                      disabled={isForwarding}
                    >
                      {isForwarding && agent.id === 'analyze' ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          {getContinueText(agent.id)}
                          {agent.id !== 'analyze' && <ArrowRight className="w-4 h-4 ml-2" />}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xl max-w-md w-full mx-4"
            >
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 whitespace-normal">
                Delete Data
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed whitespace-normal">
                Are you sure you want to delete <span className="font-bold text-[var(--text-primary)]">'{item.connectionName || item.topic || item.action || 'this data'}'</span>? This will remove all associated logs and external database tables. This action cannot be undone.
              </p>

              <div className="flex justify-between items-center mt-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (onDelete) onDelete(item);
                    setShowDeleteModal(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
