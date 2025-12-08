import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function HistogramChart({ data, sensorType }) {
  // Process data for histogram
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Get the primary metric based on sensor type
    const getMetricValue = (record) => {
      if (sensorType === 'air') return record.co2_ppm;
      if (sensorType === 'sound') return record.laeq_db;
      if (sensorType === 'underground') return record.distancia_mm;
      return 0;
    };

    // Collect all values
    const values = data.map(getMetricValue).filter(v => v && v > 0);
    if (values.length === 0) return [];

    // Calculate range and bin size
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binCount = 15; // Number of bins
    const binSize = (max - min) / binCount;

    // Initialize bins
    const bins = Array.from({ length: binCount }, (_, i) => {
      const binStart = min + (i * binSize);
      const binEnd = binStart + binSize;
      return {
        range: `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`,
        rangeStart: binStart,
        rangeEnd: binEnd,
        count: 0,
        midpoint: (binStart + binEnd) / 2
      };
    });

    // Count values in each bin
    values.forEach(value => {
      const binIndex = Math.min(
        Math.floor((value - min) / binSize),
        binCount - 1 // Put max value in last bin
      );
      bins[binIndex].count += 1;
    });

    return bins;
  }, [data, sensorType]);

  const getTitle = () => {
    if (sensorType === 'air') return 'Distribución de Niveles de CO₂';
    if (sensorType === 'sound') return 'Distribución de Niveles de Sonido';
    if (sensorType === 'underground') return 'Distribución de Niveles de Agua';
    return 'Distribución de Valores';
  };

  const getMetricLabel = () => {
    if (sensorType === 'air') return 'CO₂ (ppm)';
    if (sensorType === 'sound') return 'LAeq (dB)';
    if (sensorType === 'underground') return 'Distancia (mm)';
    return 'Valor';
  };

  if (processedData.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">{getTitle()}</h3>
        <p className="text-slate-400 text-center py-12">No hay suficientes datos para el histograma</p>
      </div>
    );
  }

  // Calculate statistics
  const totalCount = processedData.reduce((sum, bin) => sum + bin.count, 0);
  const maxCount = Math.max(...processedData.map(bin => bin.count));

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <h3 className="text-lg font-semibold text-white mb-4">{getTitle()}</h3>
      <p className="text-sm text-slate-400 mb-6">
        Frecuencia de registros por rango de {getMetricLabel()}
      </p>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={processedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="range"
            stroke="#94a3b8"
            angle={-45}
            textAnchor="end"
            height={100}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            label={{
              value: getMetricLabel(),
              position: 'insideBottom',
              offset: -10,
              style: { fill: '#94a3b8' }
            }}
          />
          <YAxis
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8' }}
            label={{
              value: 'Frecuencia',
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#94a3b8' }
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#fff'
            }}
            formatter={(value, name) => {
              if (name === 'count') return [value, 'Registros'];
              return value;
            }}
            labelFormatter={(label) => `Rango: ${label}`}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            payload={[
              { value: 'Frecuencia de registros', type: 'rect', color: '#8b5cf6' }
            ]}
          />
          <Bar
            dataKey="count"
            fill="#8b5cf6"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Statistics */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div className="bg-slate-700 rounded p-3">
          <p className="text-slate-400">Total registros</p>
          <p className="text-white font-semibold text-lg">{totalCount}</p>
        </div>
        <div className="bg-slate-700 rounded p-3">
          <p className="text-slate-400">Rango más frecuente</p>
          <p className="text-white font-semibold text-lg">
            {processedData.find(bin => bin.count === maxCount)?.range || 'N/A'}
          </p>
        </div>
        <div className="bg-slate-700 rounded p-3">
          <p className="text-slate-400">Max frecuencia</p>
          <p className="text-white font-semibold text-lg">{maxCount}</p>
        </div>
      </div>
    </div>
  );
}
