import { AgentData } from '../../features/workflow/types';

export const INITIAL_AGENTS: AgentData[] = [
  {
    id: 'connect',
    name: 'Data source',
    historyName: 'Data source',
    icon: 'database',
    description: 'Establishing secure link to database',
    history: []
  },
  {
    id: 'ingest',
    name: 'Import',
    historyName: 'Import',
    icon: 'server',
    description: 'Fetching and storing remote data',
    history: []
  },
  {
    id: 'analyze',
    name: 'Process',
    historyName: 'Process',
    icon: 'bar-chart',
    description: 'Generating insights and visuals',
    history: []
  },
  {
    id: 'query',
    name: 'Query',
    historyName: 'Query',
    icon: 'message-square',
    description: 'Ready to answer your questions',
    history: []
  }
];
