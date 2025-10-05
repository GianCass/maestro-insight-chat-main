// src/api/plotlyService.ts
export async function generatePlot(query: string) {
  const API_URL = import.meta.env.VITE_PLOTLY_API_URL || "http://127.0.0.1:8007";

  const response = await fetch(`${API_URL}/generate-graph`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query })
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}: no se pudo generar la visualización`);
  }

  const data = await response.json();
  return data;
}
