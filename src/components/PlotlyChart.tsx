// src/components/PlotlyChart.tsx
import Plot from "react-plotly.js";

interface PlotlyChartProps {
  figure: any;
}

export const PlotlyChart = ({ figure }: PlotlyChartProps) => {
  if (!figure) return null;

  return (
    <div className="my-6 rounded-lg border border-border p-4 bg-card">
      <Plot
        data={figure.data}
        layout={{
          ...figure.layout,
          autosize: true,
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent'
        }}
        style={{ width: "100%", height: "100%" }}
        useResizeHandler
      />
    </div>
  );
};
