export interface Visualization {
  type: 'table' | 'bar_chart' | 'pie_chart' | 'line_chart' | 'csv_export';
  title?: string;
  columns?: { key: string; label: string }[];
  data?: any[];
  xKey?: string;
  yKey?: string;
  seriesKey?: string;
  filename?: string;
  total_records?: number;
  threshold?: number;
  sql_query?: string;
  session_id?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: any;
  visualizations?: Visualization[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: Date;
}
