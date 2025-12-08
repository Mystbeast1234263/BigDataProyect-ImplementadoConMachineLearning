import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';

export default function SensorCharts({ data, sensorType }) {
  if (!data || data.length === 0) {
    return (
      <div className="p-6 text-center text-slate-400">
        No data available for charts
      </div>
    );
  }

  console.log(`📊 SensorCharts received ${data.length} records for ${sensorType}`);

  // Ordenar datos por fecha
  const sortedData = useMemo(() => {
    const sorted = [...data].sort((a, b) => new Date(a.time) - new Date(b.time));
    console.log('📊 Sorted data:', {
      total: sorted.length,
      first: sorted[0]?.time,
      last: sorted[sorted.length - 1]?.time,
    });
    return sorted;
  }, [data]);

  // AIRE: CO2 + Temperatura
  if (sensorType === 'air') {
    const co2Data = sortedData.map(d => parseFloat(d.co2_ppm) || 0);
    const tempData = sortedData.map(d => parseFloat(d.temperatura_c) || 0);
    const times = sortedData.map(d => d.time);

    console.log('📊 Air sensor data:', {
      co2_range: [Math.min(...co2Data), Math.max(...co2Data)],
      temp_range: [Math.min(...tempData), Math.max(...tempData)],
      time_range: [times[0], times[times.length - 1]],
      data_points: times.length,
    });

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CO2 vs Tiempo */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">CO2 Trend ({times.length} points)</h3>
          <div className="w-full">
            <Plot
              data={[
                {
                  x: times,
                  y: co2Data,
                  type: 'scatter',
                  mode: times.length < 50 ? 'lines+markers' : 'lines',
                  name: 'CO2 (ppm)',
                  line: { color: '#3b82f6', width: 2 },
                  marker: { size: 6, color: '#3b82f6' },
                  fill: 'tozeroy',
                  fillcolor: 'rgba(59, 130, 246, 0.1)',
                  hovertemplate: '<b>CO2</b><br>%{x|%Y-%m-%d %H:%M}<br>%{y:.1f} ppm<extra></extra>',
                },
              ]}
              layout={{
                xaxis: {
                  title: 'Time',
                  color: '#94a3b8',
                  showgrid: true,
                  gridcolor: '#334155',
                  tickformat: times.length < 50 ? '%H:%M' : '%m/%d',
                  tickangle: -45,
                },
                yaxis: {
                  title: 'CO2 (ppm)',
                  color: '#94a3b8',
                  showgrid: true,
                  gridcolor: '#334155',
                  rangemode: 'tozero',
                },
                plot_bgcolor: '#1e293b',
                paper_bgcolor: 'transparent',
                font: { color: '#e2e8f0' },
                margin: { l: 60, r: 20, t: 20, b: 80 },
                autosize: true,
                hovermode: 'closest',
              }}
              style={{ width: '100%', height: '350px' }}
              useResizeHandler={true}
              config={{ responsive: true, displayModeBar: true }}
            />
          </div>
        </div>

        {/* Temperatura vs Humedad */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Temperature vs Humidity ({times.length} points)</h3>
          <div className="w-full">
            <Plot
              data={[
                {
                  x: times,
                  y: tempData,
                  type: 'scatter',
                  mode: times.length < 50 ? 'lines+markers' : 'lines',
                  name: 'Temperatura (°C)',
                  line: { color: '#f97316', width: 2 },
                  marker: { size: 6, color: '#f97316' },
                  yaxis: 'y1',
                  hovertemplate: '<b>Temperatura</b><br>%{x|%Y-%m-%d %H:%M}<br>%{y:.1f}°C<extra></extra>',
                },
                {
                  x: times,
                  y: sortedData.map(d => parseFloat(d.humedad_percent) || 0),
                  type: 'scatter',
                  mode: times.length < 50 ? 'lines+markers' : 'lines',
                  name: 'Humedad (%)',
                  line: { color: '#06b6d4', width: 2 },
                  marker: { size: 6, color: '#06b6d4' },
                  yaxis: 'y2',
                  hovertemplate: '<b>Humedad</b><br>%{x|%Y-%m-%d %H:%M}<br>%{y:.1f}%<extra></extra>',
                },
              ]}
              layout={{
                xaxis: {
                  title: 'Time',
                  color: '#94a3b8',
                  showgrid: true,
                  gridcolor: '#334155',
                  tickformat: times.length < 50 ? '%H:%M' : '%m/%d',
                  tickangle: -45,
                },
                yaxis: {
                  title: 'Temperatura (°C)',
                  color: '#f97316',
                  side: 'left',
                  showgrid: true,
                  gridcolor: '#334155',
                },
                yaxis2: {
                  title: 'Humedad (%)',
                  color: '#06b6d4',
                  side: 'right',
                  overlaying: 'y',
                  showgrid: false,
                },
                plot_bgcolor: '#1e293b',
                paper_bgcolor: 'transparent',
                font: { color: '#e2e8f0' },
                margin: { l: 60, r: 60, t: 20, b: 80 },
                autosize: true,
                hovermode: 'x unified',
              }}
              style={{ width: '100%', height: '350px' }}
              useResizeHandler={true}
              config={{ responsive: true, displayModeBar: true }}
            />
          </div>
        </div>
      </div>
    );
  }

  // SONIDO: LAeq + LAI + LAImax
  if (sensorType === 'sound') {
    const laeqData = sortedData.map(d => parseFloat(d.laeq_db) || 0);
    const laiData = sortedData.map(d => parseFloat(d.lai_db) || 0);
    const laimaxData = sortedData.map(d => parseFloat(d.laimax_db) || 0);
    const times = sortedData.map(d => d.time);

    console.log('📊 Sound sensor data:', {
      laeq_range: [Math.min(...laeqData), Math.max(...laeqData)],
      lai_range: [Math.min(...laiData), Math.max(...laiData)],
      laimax_range: [Math.min(...laimaxData), Math.max(...laimaxData)],
      time_range: [times[0], times[times.length - 1]],
      data_points: times.length,
    });

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LAeq Trend */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Sound Level LAeq ({times.length} points)</h3>
          <div className="w-full">
            <Plot
              data={[
                {
                  x: times,
                  y: laeqData,
                  type: 'scatter',
                  mode: times.length < 50 ? 'lines+markers' : 'lines',
                  name: 'LAeq (dB)',
                  line: { color: '#ef4444', width: 2 },
                  marker: { size: 6, color: '#ef4444' },
                  fill: 'tozeroy',
                  fillcolor: 'rgba(239, 68, 68, 0.1)',
                  hovertemplate: '<b>LAeq</b><br>%{x|%Y-%m-%d %H:%M}<br>%{y:.1f} dB<extra></extra>',
                },
              ]}
              layout={{
                xaxis: {
                  title: 'Time',
                  color: '#94a3b8',
                  showgrid: true,
                  gridcolor: '#334155',
                  tickformat: times.length < 50 ? '%H:%M' : '%m/%d',
                  tickangle: -45,
                },
                yaxis: {
                  title: 'LAeq (dB)',
                  color: '#94a3b8',
                  showgrid: true,
                  gridcolor: '#334155',
                  rangemode: 'tozero',
                },
                plot_bgcolor: '#1e293b',
                paper_bgcolor: 'transparent',
                font: { color: '#e2e8f0' },
                margin: { l: 60, r: 20, t: 20, b: 80 },
                autosize: true,
                hovermode: 'closest',
              }}
              style={{ width: '100%', height: '350px' }}
              useResizeHandler={true}
              config={{ responsive: true, displayModeBar: true }}
            />
          </div>
        </div>

        {/* LAI + LAImax Comparison */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Sound Metrics Comparison ({times.length} points)</h3>
          <div className="w-full">
            <Plot
              data={[
                {
                  x: times,
                  y: laiData,
                  type: 'scatter',
                  mode: times.length < 50 ? 'lines+markers' : 'lines',
                  name: 'LAI',
                  line: { color: '#eab308', width: 2 },
                  marker: { size: 6, color: '#eab308' },
                  hovertemplate: '<b>LAI</b><br>%{x|%Y-%m-%d %H:%M}<br>%{y:.1f} dB<extra></extra>',
                },
                {
                  x: times,
                  y: laimaxData,
                  type: 'scatter',
                  mode: times.length < 50 ? 'lines+markers' : 'lines',
                  name: 'LAImax',
                  line: { color: '#d946ef', width: 2 },
                  marker: { size: 6, color: '#d946ef' },
                  hovertemplate: '<b>LAImax</b><br>%{x|%Y-%m-%d %H:%M}<br>%{y:.1f} dB<extra></extra>',
                },
              ]}
              layout={{
                xaxis: {
                  title: 'Time',
                  color: '#94a3b8',
                  showgrid: true,
                  gridcolor: '#334155',
                  tickformat: times.length < 50 ? '%H:%M' : '%m/%d',
                  tickangle: -45,
                },
                yaxis: {
                  title: 'dB',
                  color: '#94a3b8',
                  showgrid: true,
                  gridcolor: '#334155',
                },
                plot_bgcolor: '#1e293b',
                paper_bgcolor: 'transparent',
                font: { color: '#e2e8f0' },
                margin: { l: 60, r: 20, t: 20, b: 80 },
                autosize: true,
                hovermode: 'x unified',
              }}
              style={{ width: '100%', height: '350px' }}
              useResizeHandler={true}
              config={{ responsive: true, displayModeBar: true }}
            />
          </div>
        </div>
      </div>
    );
  }

  // AGUA/SOTERRADOS: Nivel de tanques
  if (sensorType === 'underground') {
    const times = sortedData.map(d => d.time);
    const distanceData = sortedData.map(d => parseFloat(d.distancia_mm) || 0);

    console.log('📊 Underground sensor data:', {
      distance_range: [Math.min(...distanceData), Math.max(...distanceData)],
      time_range: [times[0], times[times.length - 1]],
      data_points: times.length,
    });

    // Agrupar por sensor para gauges
    const bySensor = sortedData.reduce((acc, record) => {
      const name = record.sensor_nombre || record.sensor_name || 'Unknown';
      if (!acc[name]) acc[name] = [];
      acc[name].push(record);
      return acc;
    }, {});

    console.log('📊 Underground sensors grouped:', Object.keys(bySensor).length, 'sensors');

    // Calcular datos para cada gauge
    const sensorNames = Object.keys(bySensor);
    const gaugeData = sensorNames.map((name, index) => {
      const records = bySensor[name];
      const distances = records.map(r => parseFloat(r.distancia_mm) || 0);
      const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;

      // Invertir: menor distancia = tanque más lleno
      // Asumir que la distancia máxima posible es 100mm (ajusta según tu sensor)
      const maxPossibleDistance = 100;
      const percentFull = Math.round(((maxPossibleDistance - avgDistance) / maxPossibleDistance) * 100);
      const clampedPercent = Math.max(0, Math.min(100, percentFull));

      // Calcular posición en grid (2 columnas)
      const row = Math.floor(index / 2);
      const col = index % 2;

      return {
        type: 'indicator',
        mode: 'gauge+number',
        value: clampedPercent,
        title: {
          text: name,
          font: { size: 12, color: '#e2e8f0' }
        },
        number: {
          suffix: '%',
          font: { size: 24, color: '#e2e8f0' }
        },
        gauge: {
          axis: {
            range: [0, 100],
            tickwidth: 1,
            tickcolor: '#94a3b8'
          },
          bar: {
            color: clampedPercent > 70 ? '#22c55e' : clampedPercent > 40 ? '#eab308' : '#ef4444',
            thickness: 0.75
          },
          bgcolor: '#1e293b',
          borderwidth: 2,
          bordercolor: '#475569',
          steps: [
            { range: [0, 33], color: 'rgba(239, 68, 68, 0.15)' },
            { range: [33, 66], color: 'rgba(234, 179, 8, 0.15)' },
            { range: [66, 100], color: 'rgba(34, 197, 94, 0.15)' },
          ],
          threshold: {
            line: { color: '#ef4444', width: 2 },
            thickness: 0.75,
            value: 30,
          },
        },
        domain: {
          row: row,
          column: col
        },
      };
    });

    return (
      <div className="space-y-6">
        {/* Water Level Trend */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Water Level Trend ({times.length} points)</h3>
          <div className="w-full">
            <Plot
              data={[
                {
                  x: times,
                  y: distanceData,
                  type: 'scatter',
                  mode: times.length < 50 ? 'lines+markers' : 'lines',
                  name: 'Distance (mm)',
                  line: { color: '#06b6d4', width: 2, shape: 'hv' },
                  marker: { size: 6, color: '#06b6d4' },
                  fill: 'tozeroy',
                  fillcolor: 'rgba(6, 182, 212, 0.1)',
                  hovertemplate: '<b>Water Level</b><br>%{x|%Y-%m-%d %H:%M}<br>%{y:.1f} mm<extra></extra>',
                },
              ]}
              layout={{
                xaxis: {
                  title: 'Time',
                  color: '#94a3b8',
                  showgrid: true,
                  gridcolor: '#334155',
                  tickformat: times.length < 50 ? '%H:%M' : '%m/%d',
                  tickangle: -45,
                },
                yaxis: {
                  title: 'Distance (mm)',
                  color: '#94a3b8',
                  showgrid: true,
                  gridcolor: '#334155',
                  rangemode: 'tozero',
                },
                plot_bgcolor: '#1e293b',
                paper_bgcolor: 'transparent',
                font: { color: '#e2e8f0' },
                margin: { l: 60, r: 20, t: 20, b: 80 },
                autosize: true,
                hovermode: 'closest',
              }}
              style={{ width: '100%', height: '400px' }}
              useResizeHandler={true}
              config={{ responsive: true, displayModeBar: true }}
            />
          </div>
        </div>

        {/* Tank Status Gauges */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">
            Tank Status - Fill Level % ({sensorNames.length} tanks)
          </h3>
          <div className="w-full">
            <Plot
              data={gaugeData}
              layout={{
                grid: {
                  rows: Math.ceil(sensorNames.length / 2),
                  columns: 2,
                  pattern: 'independent'
                },
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                font: { color: '#e2e8f0' },
                margin: { l: 40, r: 40, t: 40, b: 40 },
                autosize: true,
              }}
              style={{ width: '100%', height: `${Math.max(400, Math.ceil(sensorNames.length / 2) * 250)}px` }}
              useResizeHandler={true}
              config={{ responsive: true, displayModeBar: false }}
            />
          </div>
        </div>
      </div>
    );
  }

  return null;
}
