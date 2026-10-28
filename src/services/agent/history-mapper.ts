import { AgentHistoryItem } from '../../features/workflow/types';

export class HistoryMapper {
  static mapHistoryToAgents(fullHistory: any[], agents: any[], sessionId: string): any[] {
    return agents.map(localAgent => {
      let mappedHistory: any[] = [];

      if (localAgent.id === 'connect') {
        // "connect" history is for connector-level actions
        mappedHistory = fullHistory
          .filter(h => h.action !== 'Session Data Imported')
          .map((h: any) => ({
            ...h,
            session_id: h.session_id || h.sessionId || h.sessionID || sessionId,
            connectorId: h.id,
            id: h.id || Math.random().toString(36).substr(2, 9)
          }));
      } else if (localAgent.id === 'ingest') {
        // "ingest" history focuses on the imported state
        mappedHistory = fullHistory
          .filter(h => {
            const status = h.status?.toLowerCase();
            return h.action === 'Session Data Imported' || status === 'completed' || status === 'success' || status === 'processing';
          })
          .map((h: any) => ({
            ...h,
            session_id: h.session_id || h.sessionId || h.sessionID || sessionId,
            connectorId: h.id,
            id: h.id || Math.random().toString(36).substr(2, 9)
          }));
      } else if (localAgent.id === 'analyze') {
        // "analyze" history for reports and insights
        mappedHistory = fullHistory
          .filter(h => h.db_type === 'session_analysis_result')
          .map((h: any) => ({
            ...h,
            session_id: h.session_id || h.sessionId || h.sessionID || sessionId,
            id: h.id || Math.random().toString(36).substr(2, 9)
          }));
      }

      if (mappedHistory.length > 0) {
        mappedHistory.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
      
      return { ...localAgent, history: mappedHistory };
    });
  }
}
