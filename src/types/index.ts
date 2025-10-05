// Sistema Pricing Inteligente - Type Definitions

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  evidences?: Evidence[];
  confidence?: number;

  type?: 'text' | 'table' | 'aggregate';
  items?: ProductRow[];
  sources?: Array<{
    id: string;
    title: string;
    score?: number;
    url?: string;
    snippet?: string;
    source?: string;
  }>;
  result?: AggregateResult;
}

export interface ProductRow {
  name: string;
  brand: string;
  store: string;
  price: number;
  currency: string;
  url?: string;
}

export interface AggregateGroup {
  key: string;
  min?: number;
  max?: number;
  avg?: number;
  count?: number;
}

export interface AggregateResult {
  total?: number;
  groups: AggregateGroup[];
}

export interface Evidence {
  id: string;
  title: string;
  score: number;
  url?: string;
  snippet?: string;
  source: string;
}

export interface ChatRequest {
  message: string;
  model?: string;
  strictMode?: boolean;
  confidenceThreshold?: number;
}

export interface ChatResponse {
  message: string;
  evidences: Evidence[];
  confidence: number;
  intent?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface MetricsSummary {
  totalQueries: number;
  noDataPercentage: number;
  averageLatency: number;
  p50Latency: number;
  p95Latency: number;
  evidenceClickthrough: number;
}

export interface TimeseriesPoint {
  timestamp: string;
  value: number;
  label: string;
}

export interface IntentMetric {
  intent: string;
  count: number;
  percentage: number;
}

export interface ProductMetric {
  product: string;
  queries: number;
  relevanceScore: number;
}

export interface SessionFilter {
  dateFrom?: string;
  dateTo?: string;
  intent?: string;
  country?: string;
  minConfidence?: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}