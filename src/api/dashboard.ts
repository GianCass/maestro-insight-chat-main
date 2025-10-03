import { getApiBase, authHeaders } from './config';

const API = getApiBase();
const ASK_URL = `${API}/ask`;
const ASK_STREAM_URL = `${API}/ask/stream`;

export async function askQuery(query: string, top_k = 10, threshold = 0.7) {
  const res = await fetch(ASK_URL, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ question: query, top_k, threshold }),
  });
  if (!res.ok) throw new Error(`Ask failed: ${res.status} ${res.statusText}`);
  return res.json(); // { answer?/results?, chart?, total? } según tu API
}

export async function askQueryStream(query: string, top_k = 10, threshold = 0.7, onChunk?: (data:any)=>void) {
  try {
    const pre = await fetch(ASK_STREAM_URL, { method: 'OPTIONS', headers: await authHeaders() });
    if (!pre.ok) throw new Error('stream not available');
  } catch {
    return null; // el caller debe hacer fallback a askQuery(...)
  }

  const res = await fetch(ASK_STREAM_URL, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ question: query, top_k, threshold }),
  });
  if (!res.ok || !res.body) return null;

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      const raw = line.trim();
      if (!raw) continue;
      try { onChunk?.(JSON.parse(raw)); } catch {}
    }
  }
  return true;
}

// Legacy exports for compatibility with existing code
export async function sendDashboardQuery({ query, top_k, threshold }: { query: string; top_k?: number; threshold?: number }) {
  return askQuery(query, top_k, threshold);
}

export async function sendDashboardQueryStream({ query, top_k, threshold }: { query: string; top_k?: number; threshold?: number }) {
  const results: any[] = [];
  const success = await askQueryStream(query, top_k, threshold, (data) => {
    results.push(data);
  });
  
  if (success) {
    return {
      async *[Symbol.asyncIterator]() {
        for (const result of results) {
          yield result;
        }
      }
    };
  }
  
  // Fallback to regular query
  const result = await askQuery(query, top_k, threshold);
  return {
    async *[Symbol.asyncIterator]() {
      yield result;
    }
  };
}