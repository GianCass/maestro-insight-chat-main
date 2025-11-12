import { getApiBase, authHeaders } from "./config";
import type { ChatMessage } from "@/types";

/* ======================= Tipos ======================= */
export type ChatIntentType = "text" | "table" | "aggregate";

export type RawSource = {
  id?: string;
  product_id?: string;
  title?: string;
  name?: string;
  score?: number;
  url?: string;
  snippet?: string;
  source?: string;
};

export type PriceTableItem = {
  id?: string;
  product_id?: string;
  title?: string;
  name?: string;
  brand?: string;
  store?: string;
  price?: number;
  currency?: string;
  url?: string;
};

type ApiResp = {
  message?: string;
  reply?: string;
  delta?: string;
  content?: string;
  confidence?: number;
  sources?: RawSource[];
  type?: ChatIntentType;
  items?: PriceTableItem[];
  result?: unknown;
};

export type ChatRequest = {
  message: string;
  sessionId: string;
  strict?: boolean;
  threshold?: number;
};

export type ChatStreamRequest = ChatRequest & {
  signal?: AbortSignal;
};

export type StreamEvent = {
  content?: string;
  vizPrompt?: string;
  confidence?: number;
  sources?: RawSource[];
  type?: ChatIntentType;
  items?: PriceTableItem[];
  result?: unknown;
};

/* ======================= Utilidades ======================= */

// Genera un id de sesión estable y legible
export function generateSessionId(): string {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 8);
  return `s_${t}${r}`;
}

// Historial simple en localStorage (la UI lo usa como chatHistory)
export const chatHistory = {
  load(sessionId: string): ChatMessage[] {
    try {
      const raw = localStorage.getItem(`chat-${sessionId}`);
      return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
    } catch {
      return [];
    }
  },
  save(sessionId: string, messages: ChatMessage[]) {
    localStorage.setItem(`chat-${sessionId}`, JSON.stringify(messages));
  },
  clear(sessionId: string) {
    localStorage.removeItem(`chat-${sessionId}`);
  },
};

/* ======================= /chat (no stream) ======================= */
export async function sendChat({
  message,
  sessionId,
  strict,
  threshold,
}: ChatRequest) {
  const extraHeaders = await authHeaders();

  const resp = await fetch(`${getApiBase()}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders,
    },
    body: JSON.stringify({
      message,
      sessionId,
      strict,
      threshold,
    }),
  });

  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status}`);
  }

  const data = (await resp.json()) as ApiResp;
  return {
    content: data.reply ?? data.message ?? data.content ?? "",
    confidence: data.confidence,
    sources: data.sources,
    type: data.type,
    items: data.items,
    result: data.result,
  };
}

/* ======================= /chat (stream) ======================= */
export function streamChat({
  message,
  sessionId,
  strict,
  threshold,
  signal,
}: ChatStreamRequest): AsyncIterable<StreamEvent> {
  const controller = new AbortController();
  if (signal) signal.addEventListener("abort", () => controller.abort(), { once: true });

  const iterable = (async function* (): AsyncGenerator<StreamEvent, void, unknown> {
    const extraHeaders = await authHeaders();

    const resp = await fetch(`${getApiBase()}/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...extraHeaders,
      },
      body: JSON.stringify({ message, sessionId, strict, threshold }),
      signal: controller.signal,
    });

    if (!resp.ok || !resp.body) {
      throw new Error(`HTTP ${resp.status}: no stream body`);
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let accText = "";
    const meta: {
      confidence?: number;
      sources?: RawSource[];
      type?: ChatIntentType;
      items?: PriceTableItem[];
      result?: unknown;
    } = {};

    let pending = "";

    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        pending += chunk;

        const lines = pending.split(/\r?\n/);
        pending = lines.pop() ?? "";

        for (const raw of lines) {
          // NO trim: mantiene espacios significativos
          const line = raw.replace(/^data:\s?/, "");
          if (!line) continue;

          if (line.startsWith("[VIZ_PROMPT]")) {
            const vizPrompt = line.replace(/^\[VIZ_PROMPT\]\s*/, "");
            yield { vizPrompt };
            continue;
          }

          if (line === "[FIN]" || line === "[DONE]") {
            yield {
              content: accText,
              confidence: meta.confidence,
              sources: meta.sources,
              type: meta.type,
              items: meta.items,
              result: meta.result,
            };
            return;
          }

          // Intenta JSON; si falla, trata como texto plano
          try {
            const j = JSON.parse(line) as Partial<ApiResp>;
            const token = j.delta ?? j.content ?? j.message ?? j.reply ?? "";
            if (token) {
              accText += token;
              yield { content: accText };
            }
            if (j.confidence !== undefined) meta.confidence = j.confidence;
            if (j.sources !== undefined) meta.sources = j.sources;
            if (j.type !== undefined) meta.type = j.type;
            if (j.items !== undefined) meta.items = j.items;
            if (j.result !== undefined) meta.result = j.result;
          } catch {
            accText += line;
            yield { content: accText };
          }
        }
      }

      // Vacía lo que quedó pendiente
      if (pending) {
        const line = pending.replace(/^data:\s?/, "");
        if (line && line !== "[FIN]" && line !== "[DONE]") {
          try {
            const j = JSON.parse(line) as Partial<ApiResp>;
            const token = j.delta ?? j.content ?? j.message ?? j.reply ?? "";
            if (token) {
              accText += token;
              yield { content: accText };
            }
            if (j.confidence !== undefined) meta.confidence = j.confidence;
            if (j.sources !== undefined) meta.sources = j.sources;
            if (j.type !== undefined) meta.type = j.type;
            if (j.items !== undefined) meta.items = j.items;
            if (j.result !== undefined) meta.result = j.result;
          } catch {
            accText += line;
            yield { content: accText };
          }
        }
      }

      yield {
        content: accText,
        confidence: meta.confidence,
        sources: meta.sources,
        type: meta.type,
        items: meta.items,
        result: meta.result,
      };
    } finally {
      try {
        reader.releaseLock();
      } catch {
        /* ignore */
      }
    }
  })();

  return iterable;
}

/* Wrapper con el nombre que espera tu UI */
export async function sendChatStream(
  args: ChatStreamRequest
): Promise<AsyncIterable<StreamEvent>> {
  return streamChat(args);
}
