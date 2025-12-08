import React from 'react';
import Plot from 'react-plotly.js';

export const AreaChart = ({ data, title, xAxisTitle, yAxisTitle, height = 400 }) => {
  const plotData = Array.isArray(data) ? data : [data];
  const enhancedData = plotData.map(trace => ({
    ...trace,
    fill: 'tozeroy',
    opacity: 0.7,
  }));

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-bold mb-4 text-gray-800">{title}</h3>
      <Plot
        data={enhancedData}
        layout={{
          title: '',
          xaxis: { title: xAxisTitle },
          yaxis: { title: yAxisTitle },
          hovermode: 'x unified',
          height,
          margin: { l: 60, r: 40, t: 40, b: 60 },
          paper_bgcolor: 'rgba(0,0,0,0)',
          plot_bgcolor: 'rgba(240,240,240,0.5)',
        }}
        config={{ responsive: true, displayModeBar: true }}
      />
    </div>
  );
};

export default AreaChart;
