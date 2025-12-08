import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart,
} from 'recharts';
import Plot from 'react-plotly.js';

const METRIC_CONFIGS = {
  // Air sensors
  co2_ppm: {
    label: 'CO₂ (ppm)',
    unit: 'ppm',
    color: '#3b82f6',
    warningThreshold: 800,
    criticalThreshold: 1000,
    description: 'Concentración de dióxido de carbono en el aire',
  },
  temperatura_c: {
    label: 'Temperatura (°C)',
    unit: '°C',
    color: '#f97316',
    warningThreshold: 30,
    criticalThreshold: 35,
    description: 'Temperatura ambiente',
  },
  humedad_percent: {
    label: 'Humedad (%)',
    unit: '%',
    color: '#06b6d4',
    warningThreshold: 80,
    criticalThreshold: 90,
    description: 'Humedad relativa del aire',
  },
  presion_hpa: {
    label: 'Presión (hPa)',
    unit: 'hPa',
    color: '#8b5cf6',
    warningThreshold: null,
    criticalThreshold: null,
    description: 'Presión atmosférica',
  },
  // Sound sensors
  laeq_db: {
    label: 'LAeq (dB)',
    unit: 'dB',
    color: '#ef4444',
    warningThreshold: 70,
    criticalThreshold: 85,
    description: 'Nivel de sonido equivalente',
  },
  lai_db: {
    label: 'LAI (dB)',
    unit: 'dB',
    color: '#ec4899',
    warningThreshold: 70,
    criticalThreshold: 85,
    description: 'Nivel de sonido instantáneo',
  },
  laimax_db: {
    label: 'LAI Máx (dB)',
    unit: 'dB',
    color: '#f43f5e',
    warningThreshold: 85,
    criticalThreshold: 100,
    description: 'Nivel máximo de sonido',
  },
  // Underground sensors
  distancia_mm: {
    label: 'Distancia (mm)',
    unit: 'mm',
    color: '#10b981',
    warningThreshold: null,
    criticalThreshold: null,
    description: 'Distancia medida por el sensor',
  },
  // Battery (common)
  bateria_percent: {
    label: 'Batería (%)',
    unit: '%',
    color: '#eab308',
    warningThreshold: 20,
    criticalThreshold: 10,
    description: 'Nivel de batería del sensor',
  },
};

export default function MetricDashboard({ metricKey, sensorData = [], stats = null }) {
  const [selectedView, setSelectedView] = useState('time'); // 'time', 'distribution', 'comparison'

  const config = METRIC_CONFIGS[metricKey];
  if (!config) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <p className="text-slate-400">Métrica no configurada: {metricKey}</p>
      </div>
    );
  }

  // Process data for charts
  const chartData = useMemo(() => {
    if (!sensorData || sensorData.length === 0) return [];

    const sortedData = [...sensorData].sort((a, b) => {
      const timeA = new Date(a.time || a.timestamp || 0);
      const timeB = new Date(b.time || b.timestamp || 0);
      return timeA - timeB;
    });

    return sortedData.map((record, idx) => {
      const value = parseFloat(record[metricKey] || record[metricKey.replace('_', '')] || 0);
      const time = record.time || record.timestamp;
      const date = time ? new Date(time) : new Date();
      
      return {
        index: idx,
        timestamp: time,
        date: date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
        datetime: date.toLocaleString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        hour: date.getHours(),
        value: isNaN(value) ? null : value,
        status: config.warningThreshold && config.criticalThreshold
          ? value >= config.criticalThreshold ? 'critical'
            : value >= config.warningThreshold ? 'warning'
            : 'normal'
          : 'normal',
      };
    }).filter(d => d.value !== null);
  }, [sensorData, metricKey]);

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!chartData.length) return null;
    
    const values = chartData.map(d => d.value).filter(v => v !== null && !isNaN(v));
    if (values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const median = sorted[Math.floor(sorted.length / 2)];
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;

    return { avg, min, max, median, q1, q3, iqr, count: values.length };
  }, [chartData]);

  // Group by hour for hourly analysis
  const hourlyData = useMemo(() => {
    if (!chartData.length) return [];
    
    const hourly = {};
    chartData.forEach(d => {
      const hour = d.hour;
      if (!hourly[hour]) {
        hourly[hour] = { hour, values: [], count: 0 };
      }
      hourly[hour].values.push(d.value);
      hourly[hour].count++;
    });

    return Object.values(hourly).map(h => ({
      hour: `${h.hour}:00`,
      hourNum: h.hour,
      avg: h.values.reduce((a, b) => a + b, 0) / h.values.length,
      min: Math.min(...h.values),
      max: Math.max(...h.values),
      count: h.count,
    })).sort((a, b) => a.hourNum - b.hourNum);
  }, [chartData]);

  // Distribution data for histogram
  const distributionData = useMemo(() => {
    if (!statistics) return [];
    
    const values = chartData.map(d => d.value).filter(v => v !== null);
    const bins = 20;
    const binSize = (statistics.max - statistics.min) / bins;
    const binsData = Array(bins).fill(0).map((_, i) => ({
      range: `${(statistics.min + i * binSize).toFixed(1)}-${(statistics.min + (i + 1) * binSize).toFixed(1)}`,
      min: statistics.min + i * binSize,
      max: statistics.min + (i + 1) * binSize,
      count: 0,
    }));

    values.forEach(v => {
      const binIndex = Math.min(Math.floor((v - statistics.min) / binSize), bins - 1);
      if (binsData[binIndex]) binsData[binIndex].count++;
    });

    return binsData;
  }, [chartData, statistics]);

  if (!chartData.length) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-2">{config.label}</h3>
        <p className="text-slate-400 text-sm">No hay datos disponibles para esta métrica</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-white mb-1">{config.label}</h3>
            <p className="text-slate-400 text-sm">{config.description}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedView('time')}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                selectedView === 'time'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Tiempo
            </button>
            <button
              onClick={() => setSelectedView('distribution')}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                selectedView === 'distribution'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Distribución
            </button>
            <button
              onClick={() => setSelectedView('comparison')}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                selectedView === 'comparison'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Comparación
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-700">
              <p className="text-xs text-slate-400 mb-1">Promedio</p>
              <p className="text-2xl font-bold text-white">{statistics.avg.toFixed(2)} {config.unit}</p>
            </div>
            <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-700">
              <p className="text-xs text-slate-400 mb-1">Mínimo</p>
              <p className="text-2xl font-bold text-white">{statistics.min.toFixed(2)} {config.unit}</p>
            </div>
            <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-700">
              <p className="text-xs text-slate-400 mb-1">Máximo</p>
              <p className="text-2xl font-bold text-white">{statistics.max.toFixed(2)} {config.unit}</p>
            </div>
            <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-700">
              <p className="text-xs text-slate-400 mb-1">Registros</p>
              <p className="text-2xl font-bold text-white">{statistics.count}</p>
            </div>
          </div>
        )}

        {/* Thresholds */}
        {(config.warningThreshold || config.criticalThreshold) && (
          <div className="mt-4 flex gap-4 text-xs">
            {config.warningThreshold && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-yellow-500"></div>
                <span className="text-slate-400">Advertencia: {config.warningThreshold} {config.unit}</span>
              </div>
            )}
            {config.criticalThreshold && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-500"></div>
                <span className="text-slate-400">Crítico: {config.criticalThreshold} {config.unit}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Time Series View */}
      {selectedView === 'time' && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h4 className="text-lg font-semibold text-white mb-4">Evolución Temporal</h4>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={chartData.slice(0, 500)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis 
                dataKey="datetime" 
                stroke="#94a3b8"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8' }}
                label={{ 
                  value: `${config.label} (${config.unit})`, 
                  angle: -90, 
                  position: 'insideLeft', 
                  style: { fill: '#94a3b8', textAnchor: 'middle' } 
                }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #475569', 
                  borderRadius: '8px',
                  color: '#e2e8f0'
                }}
                labelStyle={{ color: '#e2e8f0', marginBottom: '8px' }}
              />
              <Legend wrapperStyle={{ color: '#e2e8f0' }} />
              <Area
                type="monotone"
                dataKey="value"
                fill={config.color + '20'}
                stroke={config.color}
                strokeWidth={2}
                name={config.label}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={config.color}
                strokeWidth={2}
                dot={false}
                name={config.label}
              />
              {config.warningThreshold && (
                <Line
                  type="monotone"
                  dataKey={() => config.warningThreshold}
                  stroke="#eab308"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                  name={`Advertencia (${config.warningThreshold} ${config.unit})`}
                />
              )}
              {config.criticalThreshold && (
                <Line
                  type="monotone"
                  dataKey={() => config.criticalThreshold}
                  stroke="#ef4444"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                  name={`Crítico (${config.criticalThreshold} ${config.unit})`}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Distribution View */}
      {selectedView === 'distribution' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h4 className="text-lg font-semibold text-white mb-4">Distribución de Valores</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={distributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis 
                  dataKey="range" 
                  stroke="#94a3b8"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 9, fill: '#94a3b8' }}
                />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #475569', 
                    borderRadius: '8px',
                    color: '#e2e8f0'
                  }}
                />
                <Bar dataKey="count" fill={config.color} name="Frecuencia" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h4 className="text-lg font-semibold text-white mb-4">Estadísticas Detalladas</h4>
            {statistics && (
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-900/60 rounded">
                  <span className="text-slate-400">Mediana</span>
                  <span className="text-white font-semibold">{statistics.median.toFixed(2)} {config.unit}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-900/60 rounded">
                  <span className="text-slate-400">Q1 (25%)</span>
                  <span className="text-white font-semibold">{statistics.q1.toFixed(2)} {config.unit}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-900/60 rounded">
                  <span className="text-slate-400">Q3 (75%)</span>
                  <span className="text-white font-semibold">{statistics.q3.toFixed(2)} {config.unit}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-900/60 rounded">
                  <span className="text-slate-400">Rango Intercuartil (IQR)</span>
                  <span className="text-white font-semibold">{statistics.iqr.toFixed(2)} {config.unit}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Comparison View - Hourly */}
      {selectedView === 'comparison' && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h4 className="text-lg font-semibold text-white mb-4">Análisis por Hora del Día</h4>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis 
                dataKey="hour" 
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8' }}
              />
              <YAxis 
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8' }}
                label={{ 
                  value: `${config.label} (${config.unit})`, 
                  angle: -90, 
                  position: 'insideLeft', 
                  style: { fill: '#94a3b8', textAnchor: 'middle' } 
                }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #475569', 
                  borderRadius: '8px',
                  color: '#e2e8f0'
                }}
              />
              <Legend wrapperStyle={{ color: '#e2e8f0' }} />
              <Bar dataKey="avg" fill={config.color} name={`Promedio ${config.unit}`} />
              <Line
                type="monotone"
                dataKey="min"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                name="Mínimo"
              />
              <Line
                type="monotone"
                dataKey="max"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                name="Máximo"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
