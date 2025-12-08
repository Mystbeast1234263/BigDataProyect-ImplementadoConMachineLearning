import React from 'react';
import Plot from 'react-plotly.js';

export const GaugeChart = ({ gauges, title, height = 500 }) => {
  // gauges es un array de {name, value, max}
  const numGauges = gauges.length;
  const plotData = gauges.map((gauge, idx) => ({
    type: 'indicator',
    mode: 'gauge+number',
    value: gauge.value,
    title: { text: gauge.name },
    gauge: {
      axis: { range: [0, gauge.max || 100] },
      bar: { color: gauge.value > gauge.max * 0.7 ? '#ef4444' : gauge.value > gauge.max * 0.4 ? '#eab308' : '#22c55e' },
      steps: [
        { range: [0, gauge.max * 0.33], color: 'rgba(200,200,200,0.2)' },
        { range: [gauge.max * 0.33, gauge.max * 0.66], color: 'rgba(150,150,150,0.2)' },
        { range: [gauge.max * 0.66, gauge.max], color: 'rgba(100,100,100,0.2)' },
      ],
    },
    domain: { x: [idx % 3 * 0.33, (idx % 3 + 1) * 0.33], y: [1 - Math.floor(idx / 3) * 0.5 - 0.5, 1 - Math.floor(idx / 3) * 0.5] },
  }));

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg col-span-3">
      <h3 className="text-lg font-bold mb-4 text-gray-800">{title}</h3>
      <Plot
        data={plotData}
        layout={{
          title: '',
          height,
          margin: { l: 20, r: 20, t: 40, b: 20 },
          paper_bgcolor: 'rgba(0,0,0,0)',
          plot_bgcolor: 'rgba(240,240,240,0.5)',
        }}
        config={{ responsive: true, displayModeBar: false }}
      />
    </div>
  );
};

export default GaugeChart;
