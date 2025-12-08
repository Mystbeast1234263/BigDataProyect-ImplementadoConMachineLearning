import React from 'react';
import Plot from 'react-plotly.js';

export const BoxPlot = ({ data, title, yAxisTitle, height = 400 }) => {
  const plotData = Array.isArray(data) ? data : [data];

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-bold mb-4 text-gray-800">{title}</h3>
      <Plot
        data={plotData}
        layout={{
          title: '',
          yaxis: { title: yAxisTitle },
          hovermode: 'closest',
          height,
          margin: { l: 60, r: 40, t: 40, b: 80 },
          paper_bgcolor: 'rgba(0,0,0,0)',
          plot_bgcolor: 'rgba(240,240,240,0.5)',
        }}
        config={{ responsive: true, displayModeBar: true }}
      />
    </div>
  );
};

export default BoxPlot;
