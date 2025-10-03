import { getApiBase, authHeaders } from './config';
import type { ChatMessage } from '@/types';

/* ===== Tipos del backend (FastAPI) ===== */

export type ChatIntentType = 'text' | 'table' | 'aggregate';

export interface ProductRow {
  product_id: string;
  name: string;
  brand?: string;
  size?: string | number;
  unit?: string;
  price: number;
  currency: string;
  store?: string;
  country?: string;
}

export interface AggregateGroup {
  key: string;         // store | category | country
  min?: number;
  max?: number;
  avg?: number;
  count?: number;
}

export interface AggregateResult {
  total?: number;
  groups: AggregateGroup[];
}

/** Lo que puede venir como evidencia/fuente desde el backend */
type RawSource = {
  id?: string;
  product_id?: string;
  title?: string;
  name?: string;
  score?: number;
  url?: string;
  snippet?: string;
  source?: string;
  store?: string;
  brand?: string;
  size?: string | number;
  unit?: string;
};

/** Respuesta cruda del backend para /chat */
type ApiResp = {
  // contenido
  message?: string;        // normalizado en algunas rutas
  reply?: string;          // algunas rutas devuelven "reply"
  confidence?: number;

  // evidencia
  sources?: RawSource[];
  evidence?: RawSource[];

  // tipos de resultado
  type?: ChatIntentType;

  // table
  count?: number;
  items?: ProductRow[];

  // aggregate
  result?: AggregateResult;
};

export interface ChatRequest {
  message: string;
  sessionId?: string;
  strict?: boolean;
  threshold?: number;
}

/** Tipo ya normalizado para la UI */
export type ChatResponseUI = {
  message: string;
  confidence?: number;
  sources?: Array<{
    id: string;
    title: string;
    score?: number;
    url?: string;
    snippet?: string;
    source?: string;
  }>;
  type?: ChatIntentType;
  count?: number;
  items?: ProductRow[];
  result?: AggregateResult;
};

const API = getApiBase();
const CHAT_URL = `${API}/chat`;
const CHAT_STREAM_URL = `${API}/chat/stream`;

async function checkChatStreamEndpoint(): Promise<boolean> {
  try {
    const r = await fetch(CHAT_STREAM_URL, { method: 'OPTIONS', headers: await authHeaders() });
    return r.ok;
  } catch {
    return false;
  }
}

function normalizeChatResponse(data: ApiResp): ChatResponseUI {
  const rawSources = data.sources ?? data.evidence ?? [];
  const sources = Array.isArray(rawSources)
    ? rawSources.map((s: RawSource) => ({
        id: s.id ?? s.product_id ?? crypto.randomUUID(),
        title: s.title ?? s.name ?? 'Fuente',
        score: s.score ?? 0,
        url: s.url,
        snippet: s.snippet ?? [s.brand, s.size, s.unit].filter(Boolean).join(' '),
        source: s.source ?? s.store ?? 'API',
      }))
    : [];

  return {
    message: data.message ?? data.reply ?? '',
    confidence: data.confidence,
    sources,
    type: data.type,
    count: data.count,
    items: data.items,
    result: data.result,
  };
}

export async function sendChat(req: ChatRequest): Promise<ChatResponseUI> {
  // (opcional) intento de stream si existe /chat/stream
  const canStream = await checkChatStreamEndpoint();
  if (canStream) {
    try {
      const res = await fetch(CHAT_STREAM_URL, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({
          message: req.message,
          session_id: req.sessionId,
          metadata: { source: 'lovable', ui: 'chatbot', strict: !!req.strict, threshold: req.threshold ?? 0.7 },
        }),
      });

      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = '';
        const meta: { confidence?: number; sources?: RawSource[] } = {};

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split('\n')) {
            const raw = line.replace(/^data:\s*/, '').trim();
            if (!raw) continue;

            try {
              const j = JSON.parse(raw) as ApiResp;
              if (j.message) acc += j.message;
              if (j.reply) acc += j.reply;
              if (j.confidence !== undefined) meta.confidence = j.confidence;
              if (j.sources || j.evidence) meta.sources = (j.sources ?? j.evidence) as RawSource[];
            } catch {
              acc += raw; // texto suelto
            }
          }
        }

        return normalizeChatResponse({
          message: acc,
          confidence: meta.confidence,
          sources: meta.sources ?? [],
        });
      }
    } catch {
      // si falla el stream, cae a no-stream
    }
  }

  // Fallback a POST /chat (no-stream)
  try {
    const resp = await fetch(CHAT_URL, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({
        message: req.message,
        session_id: req.sessionId,
        metadata: { source: 'lovable', ui: 'chatbot', strict: !!req.strict, threshold: req.threshold ?? 0.7 },
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text().catch(() => '');
      throw new Error(`Chat request failed: ${resp.status} ${resp.statusText} ${txt}`);
    }

    const data = (await resp.json().catch(() => ({}))) as ApiResp;
    return normalizeChatResponse(data);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('Failed to fetch')) {
      throw new Error('No se pudo conectar con el servidor. Verifica VITE_PUBLIC_API_BASE y CORS en el backend.');
    }
    throw error;
  }
}

/* ===== Historial (tipado con ChatMessage) ===== */

export function generateSessionId(): string {
  return crypto.randomUUID();
}

export const chatHistory = {
  save(sessionId: string, messages: ChatMessage[]) {
    try {
      const limited = messages.slice(-50);
      localStorage.setItem(`pricing-chat:${sessionId}`, JSON.stringify(limited));
    } catch (err) {
      console.warn('Error saving chat history:', err);
    }
  },

  load(sessionId: string): ChatMessage[] {
    try {
      const stored = localStorage.getItem(`pricing-chat:${sessionId}`);
      if (!stored) return [];
      const parsed = JSON.parse(stored) as unknown;
      return Array.isArray(parsed) ? (parsed as ChatMessage[]) : [];
    } catch (err) {
      console.warn('Error loading chat history:', err);
      return [];
    }
  },

  clear(sessionId: string) {
    try {
      localStorage.removeItem(`pricing-chat:${sessionId}`);
    } catch (err) {
      console.warn('Error clearing chat history:', err);
    }
  },
};

/* ===== (Opcional/legacy) Wrapper de "stream" para compatibilidad ===== */

export interface ChatStreamRequest {
  message: string;
  sessionId: string;
  strict?: boolean;
  threshold?: number;
}

export async function sendChatStream({ message, sessionId, strict, threshold }: ChatStreamRequest) {
  const result = await sendChat({ message, sessionId, strict, threshold });
  return {
    async *[Symbol.asyncIterator]() {
      yield {
        content: result.message,
        confidence: result.confidence,
        sources: result.sources,
      };
    },
  };
}
