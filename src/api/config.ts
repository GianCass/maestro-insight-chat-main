import { supabase } from '@/integrations/supabase/client';

// export function getApiBase(): string {
//   // Primero VITE_PUBLIC_API_BASE (Lovable/Prod), luego VITE_API_BASE (fallback), luego local
//   return (
//     import.meta.env.VITE_PUBLIC_API_BASE ??
//     import.meta.env.VITE_API_BASE ??
//     'http://127.0.0.1:8000'
//   );
// }

export function getApiBase() {
    return import.meta.env.VITE_PUBLIC_API_BASE || 'http://127.0.0.1:8000';
}

export async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    // si tenemos Supabase, agrega el token; si no, ignora
    const { data: { session } } = await supabase.auth.getSession?.() ?? { data: { session: null } };
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
  } catch {}
  return headers;
}