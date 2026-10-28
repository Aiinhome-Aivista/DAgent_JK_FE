import { useChat, ChatMode } from "../hooks/useChat";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
  Badge,
  Button,
} from "@/src/ui-kit";
import {
  MessageSquare,
  Sparkles,
  MoreVertical,
  Database,
  Plus,
  ArrowRight,
  Loader2,
  ChevronDown,
  ChevronRight,
  Minus,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { Connector } from "../../connectors/types";

interface ChatWindowProps {
  initialMode?: ChatMode;
  onNewConnector?: () => void;
  initialMessage?: string;
  suggestedQuestions?: string[];
  onOpenDataSource?: () => void;
  onNewSessionCreated?: () => void;
  sessionId?: string;
  workspaceName?: string;
  onCollapseChange?: (collapsed: boolean) => void;
  chatKey?: number;
  isInitializing?: boolean;
}

export const ChatWindow = ({
  initialMode = "landing",
  onNewConnector,
  initialMessage,
  suggestedQuestions = [],
  onOpenDataSource,
  onNewSessionCreated,
  sessionId,
  workspaceName,
  onCollapseChange,
  chatKey,
  isInitializing = false,
}: ChatWindowProps) => {
  const {
    messages,
    sendMessage,
    isLoading,
    processingSteps,
    scrollRef,
    mode,
    completeWorkflow,
    startChat,
    followUpQuestions,
    isFetchingSuggestions,
  } = useChat(initialMode, initialMessage, sessionId, onNewSessionCreated, chatKey);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [isLoadingConnectors, setIsLoadingConnectors] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [chatSessionName, setChatSessionName] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    setChatSessionName(localStorage.getItem("selected_query_session_name"));
  }, [messages]);

  useEffect(() => {
    if (mode === "landing") {
      setIsLoadingConnectors(true);
      // TODO: Fetch connected data sources from the backend
      setConnectors([]);
      setIsLoadingConnectors(false);
    }
  }, [mode]);

  return (
    <Card className={`flex flex-col shadow-2xl shadow-black/20 border-[var(--border)] overflow-hidden bg-[var(--surface)]/30 backdrop-blur-xl transition-all duration-300 ${isCollapsed ? 'mt-auto' : 'h-full flex-1'}`}>
      <CardHeader className="flex flex-row items-center justify-between py-1.5 px-3 bg-[var(--surface)]/80 backdrop-blur-md border-b border-[var(--border)] relative z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              const newState = !isCollapsed;
              setIsCollapsed(newState);
              if (onCollapseChange) onCollapseChange(newState);
            }}
            className="w-6 h-6 rounded-[10px] bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center text-slate-800 border border-slate-200 shadow-inner cursor-pointer"
          >
            {isCollapsed ? <Plus className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
          </button>
          <div className="flex items-center gap-3">
            <h3 className="font-black text-base tracking-tight leading-none">
              Speak to your data
            </h3>
            {workspaceName && (
              <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)] tracking-normal font-bold">
                <span>{workspaceName}</span>
                <span className="opacity-50">•</span>
                <span>{chatSessionName || "New Query"}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="px-3 py-1 font-mono text-[10px] border-[var(--accent)]/30 text-[var(--accent)]"
          >
            AGENT_V2.4
          </Badge>
        </div>
      </CardHeader>

      {!isCollapsed && (
        <div
          className={`flex-1 flex min-h-0 ${mode === "chat" ? "flex-row" : "flex-col"}`}
        >
          <div
            className={`flex flex-col min-w-0 min-h-0 ${mode === "chat" ? "w-2/3 border-r border-[var(--border)]" : "w-full h-full"}`}
          >
          <CardContent
            ref={scrollRef}
            className="flex-1 min-h-0 overflow-y-auto px-3 scroll-smooth space-y-1 bg-[var(--bg)]/10 relative"
          >
            <AnimatePresence mode="wait">
              {mode === "landing" ? (
                <motion.div
                  key="landing"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center space-y-8 py-8"
                >
                  <div className="w-20 h-20 rounded-3xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] border border-[var(--accent)]/20">
                    <Database className="w-10 h-10" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-2">
                      Welcome to DAgent AI
                    </h2>
                    <p className="text-[var(--text-secondary)]">
                      To get started, select an existing data connector or set
                      up a new one.
                    </p>
                  </div>

                  <div className="w-full space-y-3 text-left">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                        Available Connectors
                      </h4>
                      <Badge variant="outline" className="text-[10px]">
                        {connectors.length} Active
                      </Badge>
                    </div>

                    {isLoadingConnectors ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
                      </div>
                    ) : (
                      connectors.map((conn) => (
                        <div
                          key={conn.id}
                          className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--surface)]"
                        >
                          <Button
                            variant="ghost"
                            className="w-full justify-between h-auto py-4 px-6 rounded-none hover:bg-[var(--surface-hover)] transition-all"
                            onClick={startChat}
                          >
                            <div className="flex items-center gap-3">
                              <Database className="w-5 h-5 text-[var(--accent)]" />
                              <div className="flex flex-col items-start">
                                <span className="font-bold text-[var(--text-primary)]">
                                  {conn.name}
                                </span>
                                <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-tighter">
                                  {conn.type}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-bold text-emerald-500 uppercase">
                                  Ready
                                </span>
                              </div>
                              <ArrowRight className="w-4 h-4 text-[var(--text-secondary)]" />
                            </div>
                          </Button>
                        </div>
                      ))
                    )}

                    <Button
                      className="w-full h-auto py-4 rounded-xl mt-6 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white font-bold shadow-lg shadow-[var(--accent)]/20"
                      onClick={onNewConnector}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Connect New Data Source
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {isInitializing ? (
                    <div className="flex flex-col gap-4 py-4 px-2">
                      <div className="bg-[var(--surface)] border border-[var(--border)] px-4 py-4 rounded-2xl rounded-tl-none w-3/4 animate-pulse">
                        <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
                        <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                      </div>
                      <div className="bg-[var(--accent)]/10 border border-[var(--accent)]/20 px-4 py-4 rounded-2xl rounded-tr-none w-2/3 self-end animate-pulse">
                        <div className="h-4 bg-[var(--accent)]/20 rounded w-full mb-2"></div>
                        <div className="h-4 bg-[var(--accent)]/20 rounded w-4/6"></div>
                      </div>
                      <div className="flex justify-center py-4 text-[var(--text-secondary)] text-sm flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading chat history...
                      </div>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <ChatMessage key={msg.id} message={msg} />
                    ))
                  )}

                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col mb-4"
                    >
                      <div className="flex justify-start mb-2">
                        <div className="bg-[var(--surface)] border border-[var(--border)] px-4 py-3 rounded-2xl rounded-tl-none flex gap-1.5 items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)]/40 animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)]/40 animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)]/40 animate-bounce" />
                        </div>
                      </div>
                      {processingSteps.length > 0 && (
                        <div className="pl-4 border-l-2 border-[var(--border)] ml-4 mt-2 space-y-2">
                          {processingSteps.map((step, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]"
                            >
                              {idx === processingSteps.length - 1 ? (
                                <Loader2 className="w-3 h-3 text-[var(--accent)] animate-spin" />
                              ) : (
                                <div className="w-3 h-3 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                </div>
                              )}
                              {step}
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>

          <CardFooter className="bg-[var(--surface)]/80 backdrop-blur-md border-t border-[var(--border)] relative z-30 w-full min-w-0 shrink-0">
            <div className="w-full px-3 min-w-0 flex flex-col justify-center py-3">
              <ChatInput
                value={chatInput}
                onChange={setChatInput}
                onSend={sendMessage}
                disabled={isLoading || mode !== "chat"}
                onOpenDataSource={onOpenDataSource}
              />
              {/* <div className="mt-0 flex items-center justify-center gap-4 text-[10px] text-[var(--text-secondary)]/60 uppercase tracking-[0.2em] font-black">
                <span className="w-1 h-1 rounded-full bg-[var(--border)]" />
              </div> */}
            </div>
          </CardFooter>
        </div>

        {/* Right Column: Critical Insights (1/3 width, only in chat mode) */}
        {mode === "chat" && (
          <div className="w-1/3 bg-[var(--surface)]/50 p-4 flex flex-col relative z-30 min-h-0">
            <h4 className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] mb-3 flex items-center gap-2 flex-shrink-0">
              <Sparkles className="w-3 h-3 text-[var(--accent)]" /> Critical
              Insights
            </h4>

            {isFetchingSuggestions && !isLoading && (
              <div className="flex flex-col items-center justify-center w-full h-full flex-1 gap-3 text-xs text-[var(--text-secondary)] opacity-70">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--accent)]" />
                <span>Fetching insights…</span>
              </div>
            )}

            <div className="flex flex-col gap-2 overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--border)] scrollbar-track-transparent flex-1 pr-2">
              {followUpQuestions.length > 0 &&
                !isLoading &&
                !isFetchingSuggestions &&
                followUpQuestions.map((q, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => {
                      setChatInput("");
                      sendMessage(q);
                    }}
                    className="cursor-pointer w-full text-left px-3 py-2 rounded-xl bg-[var(--accent)]/5 border border-[var(--accent)]/20 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent)]/10 hover:border-[var(--accent)]/40 transition-all shadow-sm flex items-start gap-2"
                  >
                    {q}
                  </motion.button>
                ))}

              {followUpQuestions.length === 0 &&
                messages.length <= 1 &&
                suggestedQuestions.length > 0 &&
                !isLoading &&
                !isFetchingSuggestions &&
                suggestedQuestions.map((q, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => {
                      setChatInput("");
                      sendMessage(q);
                    }}
                    className="cursor-pointer w-full text-left px-3 py-2 rounded-xl bg-[var(--accent)]/5 border border-[var(--accent)]/20 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent)]/10 hover:border-[var(--accent)]/40 transition-all shadow-sm flex items-start gap-2"
                  >
                    {q}
                  </motion.button>
                ))}
            </div>
          </div>
        )}
      </div>
      )}
    </Card>
  );
};
