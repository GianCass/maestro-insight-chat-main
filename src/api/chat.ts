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

// 👇 NUEVO
export type ChatStreamPart = {
  content?: string;
  delta?: string; // nuevo: fragmento incremental
  confidence?: number;
  sources?: RawSource[];
  type?: ChatIntentType;
  items?: PriceTableItem[];
  result?: unknown;
  vizPrompt?: string; // <— NUEVO
};






export type PriceTableItem = {
  product_id?: string;
  name: string;
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
  evidence?: RawSource[];
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

type StreamYield = {
  content?: string;
  delta?: string;
  confidence?: number;
  sources?: RawSource[];
  type?: ChatIntentType;
  items?: PriceTableItem[];
  result?: unknown;
  vizPrompt?: string;
};

/* ======================= Utilidades ======================= */
export const generateSessionId = () =>
  "sid-" + Math.random().toString(36).slice(2) + "-" + Date.now().toString(36);

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
  // ⬇⬇ ESTE ES EL CAMBIO CLAVE: esperar los headers antes de usarlos
  const extraHeaders = await authHeaders();

  const resp = await fetch(`${getApiBase()}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders, // ⬅ ya NO es una Promise
    },
    body: JSON.stringify({
      message,
      session_id: sessionId,
      strict: !!strict,
      threshold,
    }),
  });

  if (!resp.ok) throw new Error(`HTTP ${resp.status} al llamar /chat`);

  const data = (await resp.json()) as ApiResp;

  return {
    message: data.message ?? data.reply ?? data.content ?? "",
    confidence: data.confidence,
    sources: (data.sources ?? data.evidence) || [],
    type: data.type,
    items: data.items,
    result: data.result,
  };
}


/* ======================= /chat/stream (SSE / ReadableStream) ======================= */
export async function sendChatStream({
  message,
  sessionId,
  strict,
  threshold,
  signal,
}: ChatStreamRequest) {
  // ⬇⬇ IGUAL: esperar los headers
  const extraHeaders = await authHeaders();

  const resp = await fetch(`${getApiBase()}/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...extraHeaders, // ⬅ ya NO es una Promise
    },
    body: JSON.stringify({
      message,
      session_id: sessionId,
      strict: !!strict,
      threshold,
    }),
    signal,
  });

  if (!resp.ok || !resp.body) {
    throw new Error(
      `No se pudo abrir el stream: HTTP ${resp.status} / body=${!!resp.body}`
    );
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

  return {
    async *[Symbol.asyncIterator](): AsyncIterator<{
      content?: string;
      delta?: string;
      confidence?: number;
      sources?: RawSource[];
      type?: ChatIntentType;
      items?: PriceTableItem[];
      result?: unknown;
      vizPrompt?: string;
    }> {
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          pending += chunk;

          const lines = pending.split(/\r?\n/);
          pending = lines.pop() ?? "";

          for (let line of lines) {
            line = line.replace(/^data:\s*/, "").trim();
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

            try {
              const j = JSON.parse(line) as Partial<ApiResp>;
              const token =
                j.delta ?? j.content ?? j.message ?? j.reply ?? "";

              if (token) {
                accText += token;
                yield { content: accText, delta: token };
              }

              if (j.confidence !== undefined) meta.confidence = j.confidence;
              if (j.sources || j.evidence)
                meta.sources = (j.sources ?? j.evidence) ?? undefined;
              if (j.type) meta.type = j.type;
              if (j.items) meta.items = j.items;
              if (j.result) meta.result = j.result;
            } catch {
              accText += line;
              // cuando la línea no es JSON, la consideramos un delta completo
              yield { content: accText, delta: line };

              if (/\[(FIN|DONE)\]\s*$/.test(line)) {
                yield {
                  content: accText.replace(/\s*\[(FIN|DONE)\]\s*$/, ""),
                  delta: undefined,
                  confidence: meta.confidence,
                  sources: meta.sources,
                  type: meta.type,
                  items: meta.items,
                  result: meta.result,
                };
                return;
              }
            }
          }
        }
      } finally {
        try {
          reader.releaseLock();
        } catch (_err) {
          // ignoramos: el stream pudo cerrarse ya
        }
      }

      yield {
        content: accText,
        delta: undefined,
        confidence: meta.confidence,
        sources: meta.sources,
        type: meta.type,
        items: meta.items,
        result: meta.result,
      };
    },
  };
}

