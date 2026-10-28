import { AgentData, AgentHistoryItem } from '../features/workflow/types';
import { AgentBaseService } from './agent/agent-base.service';

class AgentService extends AgentBaseService {
  async getAgents(userId: number | null, fetchFromApi: boolean = true): Promise<AgentData[]> {
    return this.fetchAgentsFromApi(userId, fetchFromApi);
  }

  async getAgentHistory(agentId: string): Promise<AgentHistoryItem[]> {
    const agent = this.getAgentById(agentId);
    return agent?.history || [];
  }

  async addHistoryItem(agentId: string, item: Omit<AgentHistoryItem, 'id' | 'date'>): Promise<AgentHistoryItem> {
    // History is now strictly API-driven. We return a temporary representation 
    // but the next getAgents poll will overwrite with official API data.
    return {
      ...item,
      id: 'temp-' + Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString()
    } as AgentHistoryItem;
  }

  async updateHistoryItem(agentId: string, itemId: string, updates: Partial<AgentHistoryItem>): Promise<void> {
    // No-op: official status updates should come from the server through the polling cycle
    console.log(`Update requested for ${agentId}/${itemId}, awaiting server sync.`);
  }

  reset(): void {
    this.clearState();
  }
}

export const agentService = new AgentService();
