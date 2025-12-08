import React from 'react';
import Plot from 'react-plotly.js';

export const Heatmap = ({ data, title, height = 450 }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg col-span-2">
      <h3 className="text-lg font-bold mb-4 text-gray-800">{title}</h3>
      <Plot
        data={[data]}
        layout={{
          title: '',
          height,
          margin: { l: 120, r: 40, t: 40, b: 80 },
          paper_bgcolor: 'rgba(0,0,0,0)',
          plot_bgcolor: 'rgba(240,240,240,0.5)',
          colorscale: 'Viridis',
        }}
        config={{ responsive: true, displayModeBar: true }}
      />
    </div>
  );
};

export default Heatmap;
