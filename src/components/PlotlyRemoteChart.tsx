import React from "react";
import Plot from "react-plotly.js";

type Props = {
  code: string; // visualizacion_code
  text?: string | null; // texto opcional del mensaje
};

function computeApiBase(): string {
  const raw = (import.meta as any).env?.VITE_PLOTLY_API_URL as string | undefined;
  let base = (raw ?? "").trim();
  // Fix common typos like "http:127/0.0.1:8007" or missing protocol
  if (base && !/^https?:\/\//i.test(base)) {
    // if it starts with http: but missing slashes
    if (/^https?:/i.test(base)) {
      base = base.replace(/^https?:/i, (m) => m + "//");
    } else {
      base = "http://" + base;
    }
  }
  // Try URL validation, else fallback to default
  try {
    base = base.replace("127/0.0.1", "127.0.0.1");
    new URL(base);
    return base;
  } catch {
    return "http://127.0.0.1:8007";
  }
}

const API_BASE = computeApiBase();

function simpleHash(str: string): string {
  // djb2-like simple hash for caching; not cryptographically strong
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) + str.charCodeAt(i);
    h |= 0; // 32-bit
  }
  return (h >>> 0).toString(36);
}

function cacheGet(code: string): number | null {
  try {
    const raw = localStorage.getItem("vizfig-cache");
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, number>;
    const id = map[simpleHash(code)];
    return typeof id === "number" ? id : null;
  } catch {
    return null;
  }
}

function cacheSet(code: string, id: number) {
  try {
    const raw = localStorage.getItem("vizfig-cache");
    const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    map[simpleHash(code)] = id;
    localStorage.setItem("vizfig-cache", JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function PlotlyRemoteChart({ code, text }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [figure, setFigure] = React.useState<any>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!code) return;
      setLoading(true);
      setError(null);
      setFigure(null);
      try {
        // Intentar caché local primero para evitar insertar duplicados en viz_messages
        let figureId = cacheGet(code) ?? null;
        if (figureId) {
          const probe = await fetch(`${API_BASE}/api/figures/${figureId}`);
          if (probe.ok) {
            const figJson = await probe.json();
            if (!cancelled) setFigure(figJson);
            setLoading(false);
            return;
          }
        }

        // 1) Registrar el mensaje/figura en el servicio Plotly -> obtener figure_id
        const reg = await fetch(`${API_BASE}/api/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: text ?? undefined,
            visualizacion_code: code,
          }),
        });
        if (!reg.ok) {
          const raw = await reg.text().catch(() => "");
          throw new Error(`HTTP ${reg.status} al registrar figura: ${raw}`);
        }
        const regData = await reg.json();
        figureId = regData?.figure_id ?? regData?.msg_id ?? regData?.data?.figure_id;
        if (!figureId) throw new Error("No se recibió figure_id del backend");
        cacheSet(code, Number(figureId));

        // 2) Recuperar la figura JSON y renderizar
        const figRes = await fetch(`${API_BASE}/api/figures/${figureId}`);
        if (!figRes.ok) {
          const raw = await figRes.text().catch(() => "");
          throw new Error(`HTTP ${figRes.status} al obtener figura: ${raw}`);
        }
        const figJson = await figRes.json();
        if (!cancelled) setFigure(figJson);
      } catch (e: any) {
        // Fallback: si /api/messages falla, intentar /generate-graph con 'text' cuando esté disponible
        console.error("PlotlyRemoteChart error:", e);
        if (!cancelled && text && text.trim()) {
          try {
            const res = await fetch(`${API_BASE}/generate-graph`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ query: text }),
            });
            if (!res.ok) {
              const raw = await res.text().catch(() => "");
              throw new Error(`Fallback /generate-graph HTTP ${res.status}: ${raw}`);
            }
            const fig = await res.json();
            if (!cancelled) {
              setFigure(fig);
              setError(null);
              setLoading(false);
              return;
            }
          } catch (fallbackErr: any) {
            console.error("Fallback generate-graph error:", fallbackErr);
            if (!cancelled) setError((e?.message ?? String(e)) + " | " + (fallbackErr?.message ?? String(fallbackErr)));
          }
        } else {
          if (!cancelled) setError(e?.message ?? String(e));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [code, text]);

  if (!code) return null;

  if (loading) {
    return (
      <div className="my-4 text-xs text-muted-foreground">Generando visualización…</div>
    );
  }
  if (error) {
    return (
      <div className="my-4 text-xs text-destructive">No se pudo cargar la visualización: {error}</div>
    );
  }
  if (!figure) return null;

  return (
    <div className="my-4 rounded-lg border border-border p-3 bg-card">
      <Plot
        data={figure.data}
        layout={{
          ...(figure.layout || {}),
          autosize: true,
          paper_bgcolor: "transparent",
          plot_bgcolor: "transparent",
        }}
        style={{ width: "100%", height: "100%" }}
        config={{ responsive: true, displaylogo: false }}
        useResizeHandler
      />
    </div>
  );
}

export default PlotlyRemoteChart;
