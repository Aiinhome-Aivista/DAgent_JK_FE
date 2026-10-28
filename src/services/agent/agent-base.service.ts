import { AgentData, AgentHistoryItem } from '../../features/workflow/types';
import { connectorService } from '../connector.service';
import { INITIAL_AGENTS } from './agent.constants';
import { HistoryMapper } from './history-mapper';

export class AgentBaseService {
  protected agents: AgentData[] = [...INITIAL_AGENTS];
  protected sessionSourcesCache: Record<string, any> = {};

  async fetchAgentsFromApi(userId: number | null, fetchFromApi: boolean): Promise<AgentData[]> {
    const sessionId = localStorage.getItem('DAgent_session_id');
    
    if (!sessionId || !fetchFromApi) {
      return this.agents.map(agent => ({ ...agent, history: [...agent.history] }));
    }

    try {
      const response = await connectorService.getConnectionHistory(sessionId);
      if (response && response.status === 'success' && response.history) {
        this.agents = HistoryMapper.mapHistoryToAgents(response.history, this.agents, sessionId);
        return this.agents;
      }
      return this.agents;
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      return this.agents;
    }
  }

  getAgentById(agentId: string): AgentData | undefined {
    return this.agents.find(a => a.id === agentId);
  }

  clearState(): void {
    this.agents = INITIAL_AGENTS.map(agent => ({ ...agent, history: [] }));
    this.sessionSourcesCache = {};
  }
}
