import { useState, useCallback, useRef, useEffect } from 'react';
import { Message } from '../types';
import { connectorService } from '@/src/services/connector.service';
import { chatHistoryService } from '@/src/services/chatHistory.service';
import { useAuthContext } from '@/src/context/AuthContext';

export type ChatMode = 'landing' | 'workflow' | 'chat';

export const useChat = (initialMode: ChatMode = 'landing', initialMessage?: string, sessionId?: string, onNewSessionCreated?: () => void, chatKey?: number) => {
  const { userId } = useAuthContext();
  const [mode, setMode] = useState<ChatMode>(initialMode);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<string[]>([]);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, mode, processingSteps, scrollToBottom]);

  const startWorkflow = useCallback(() => {
    setMode('workflow');
  }, []);

  const startChat = useCallback(() => {
    setMode('chat');
    setMessages([]);
  }, []);

  const completeWorkflow = useCallback(() => {
    startChat();
  }, [startChat]);

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    // We will update messages below based on branching
    setIsLoading(true);
    setFollowUpQuestions([]);
    setProcessingSteps(['Analyzing query...']);

    try {
      const chatSessionId = sessionId || localStorage.getItem('DAgent_session_id');

      // Check if we are currently in the read-only default chat
      const isDefaultChat = localStorage.getItem('is_default_chat') === 'true';
      let currentVisitNumber = localStorage.getItem('current_visit_number');

      if (isDefaultChat) {
        // We branch out into a NEW chat session based on this query.
        localStorage.removeItem('current_visit_number');
        localStorage.removeItem('is_default_chat');
        currentVisitNumber = null;
        
        // Clear the UI messages to create a fresh chat view
        setMessages([userMessage]);
      } else {
        setMessages((prev) => [...prev, userMessage]);
      }

      const response: any = await connectorService.sendSessionChat({
        session_id: chatSessionId,
        question: content,
        user_id: userId,
        ...(currentVisitNumber ? { visit_number: parseInt(currentVisitNumber, 10) } : { is_new_query: true })
      });

      if (response?.visit_number) {
        localStorage.setItem('current_visit_number', response.visit_number.toString());
      }

      const answerText = response?.answer || '';
      const followUps: string[] = response?.follow_up_questions || response?.suggested_questions || [];
      
      let visData = response?.visualizations || [];
      if (visData.length === 0 && response?.chart_data) {
        visData = [response.chart_data];
      }
      
      visData = visData.map((viz: any) => {
        if (viz.chart_type && viz.labels && viz.datasets) {
          const rechartsData = viz.labels.map((label: string, index: number) => {
            const dataPoint: any = { label };
            viz.datasets.forEach((dataset: any) => {
              dataPoint[dataset.label] = dataset.data[index];
            });
            return dataPoint;
          });
          
          let rechartsType = 'bar_chart';
          if (viz.chart_type === 'pie') rechartsType = 'pie_chart';
          if (viz.chart_type === 'line') rechartsType = 'line_chart';
          
          return {
            type: rechartsType,
            title: viz.title || '',
            data: rechartsData,
            xKey: 'label',
            yKey: viz.datasets[0]?.label || 'value'
          };
        }
        return viz;
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: answerText,
        timestamp: new Date(),
        visualizations: visData
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setFollowUpQuestions(followUps);

      // Dispatch event to update dashboard metrics
      window.dispatchEvent(new CustomEvent('chat-metrics-update', {
        detail: { question: content, answer: answerText }
      }));

      if (isDefaultChat || !currentVisitNumber) {
        // Update localStorage with the new session's data so the UI
        // (header + sidebar) reflects the newly created query session
        // instead of staying stuck on the old default or a blank unselected state.
        const newSessionHistory = [{
          question: content,
          answer: answerText,
          visualizations: visData,
          follow_up_questions: followUps
        }];
        localStorage.setItem('selected_query_session', JSON.stringify(newSessionHistory));
        localStorage.setItem('selected_query_session_name', response?.query_session_name || content);

        if (onNewSessionCreated) {
          // Trigger sidebar refresh so the new chat shows up and gets selected
          setTimeout(() => {
            onNewSessionCreated();
          }, 500); // short delay to ensure DB transaction completes
        }
      }
    } catch (error: any) {
      console.error('Session Chat Error:', error);
      
      const errorMsg = error?.response?.data?.message || 'Sorry, something went wrong while processing your request.';
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMsg,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setProcessingSteps([]);
    }
  }, [sessionId]);

  const fetchChatHistory = useCallback(async () => {
    try {
      const storedSession = localStorage.getItem('selected_query_session');
      if (storedSession) {
        const querySessionHistory = JSON.parse(storedSession);

        const historyMessages: Message[] = [];
        querySessionHistory.forEach((item: any, idx: number) => {
          const isSystemQuestion = item.question.startsWith('default_') || item.question === 'Updated Analysis from newly uploaded files' || item.question === 'Context Update';

          if (!isSystemQuestion) {
            historyMessages.push({
              id: `user-${idx}`,
              role: 'user',
              content: item.question,
              timestamp: item.timestamp ? new Date(item.timestamp) : (item.created_at ? new Date(item.created_at) : new Date())
            });
          }

          let assistantContent = item.answer;
          try {
            const parsed = JSON.parse(item.answer);
            if (parsed && typeof parsed === 'object') {
              const extracted = parsed.report || parsed.description || parsed.report_content;
              if (extracted) {
                assistantContent = typeof extracted === 'string' ? extracted : JSON.stringify(extracted);
              }
            }
          } catch (e) {
            // Not JSON, use as is
          }

          let visData = item.visualizations || [];
          visData = visData.map((viz: any) => {
            if (viz.chart_type && viz.labels && viz.datasets) {
              const rechartsData = viz.labels.map((label: string, index: number) => {
                const dataPoint: any = { label };
                viz.datasets.forEach((dataset: any) => {
                  dataPoint[dataset.label] = dataset.data[index];
                });
                return dataPoint;
              });
              
              let rechartsType = 'bar_chart';
              if (viz.chart_type === 'pie') rechartsType = 'pie_chart';
              if (viz.chart_type === 'line') rechartsType = 'line_chart';
              
              return {
                type: rechartsType,
                title: viz.title || '',
                data: rechartsData,
                xKey: 'label',
                yKey: viz.datasets[0]?.label || 'value'
              };
            }
            return viz;
          });

          historyMessages.push({
            id: `assistant-${idx}`,
            role: 'assistant',
            content: assistantContent,
            timestamp: item.timestamp ? new Date(item.timestamp) : (item.created_at ? new Date(item.created_at) : new Date()),
            visualizations: visData
          });
        });

        let hasFollowUps = false;
        if (querySessionHistory.length > 0) {
          const lastItem = querySessionHistory[querySessionHistory.length - 1];
          if (lastItem && lastItem.follow_up_questions && Array.isArray(lastItem.follow_up_questions) && lastItem.follow_up_questions.length > 0) {
            setFollowUpQuestions(lastItem.follow_up_questions);
            hasFollowUps = true;
          }
        }

        if (historyMessages.length > 0) {
          setMessages(historyMessages);
          return { hasHistory: true, hasFollowUps };
        }
        
        setMessages([]);
        return { hasHistory: false, hasFollowUps };
      }
      setMessages([]);
      setFollowUpQuestions([]);
      return { hasHistory: false, hasFollowUps: false };
    } catch (error) {
      console.error('Failed to parse selected chat history:', error);
      setMessages([]);
      setFollowUpQuestions([]);
      return { hasHistory: false, hasFollowUps: false };
    }
  }, []);

  const fetchSuggestedQuestions = useCallback(async () => {
    try {
      const chatSessionId = sessionId || localStorage.getItem('DAgent_session_id');
      if (!chatSessionId) return;

      setIsFetchingSuggestions(true);
      const response: any = await connectorService.sendSessionChat({
        session_id: chatSessionId,
        question: "",
        user_id: userId
      });

      const followUps: string[] = response?.follow_up_questions || response?.suggested_questions || [];
      setFollowUpQuestions(followUps);
    } catch (error) {
      console.error('Failed to fetch suggested questions:', error);
    } finally {
      setIsFetchingSuggestions(false);
    }
  }, [sessionId, userId]);

  useEffect(() => {
    if (mode === 'chat') {
      fetchChatHistory().then((result) => {
        // Fetch suggestions if there are no existing follow-ups
        if (!result.hasFollowUps) {
          fetchSuggestedQuestions();
        }
      });
    }
  }, [mode, fetchChatHistory, fetchSuggestedQuestions, chatKey]);

  return {
    messages,
    sendMessage,
    isLoading,
    processingSteps,
    scrollRef,
    mode,
    completeWorkflow,
    startChat,
    startWorkflow,
    followUpQuestions,
    fetchSuggestedQuestions,
    isFetchingSuggestions
  };
};
