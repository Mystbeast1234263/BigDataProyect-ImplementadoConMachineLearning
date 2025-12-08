import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function TimeSeriesChart({ data, sensorType }) {
  // Process data for time series
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Sort by time
    const sorted = [...data].sort((a, b) => {
      const timeA = new Date(a.time || a.tiempo);
      const timeB = new Date(b.time || b.tiempo);
      return timeA - timeB;
    });

    // Sample data if too many points (keep every nth point for performance)
    const maxPoints = 200;
    const step = Math.ceil(sorted.length / maxPoints);
    const sampled = sorted.filter((_, index) => index % step === 0);

    // Format for chart
    return sampled.map(record => {
      const time = new Date(record.time || record.tiempo);
      const formattedTime = `${time.getDate()}/${time.getMonth() + 1} ${time.getHours()}:${String(time.getMinutes()).padStart(2, '0')}`;

      if (sensorType === 'air') {
        return {
          time: formattedTime,
          fullTime: time.toISOString(),
          co2: record.co2_ppm,
          temperatura: record.temperatura_c,
          humedad: record.humedad_percent,
        };
      } else if (sensorType === 'sound') {
        return {
          time: formattedTime,
          fullTime: time.toISOString(),
          laeq: record.laeq_db,
          lai: record.lai_db,
          laimax: record.laimax_db,
        };
      } else if (sensorType === 'underground') {
        return {
          time: formattedTime,
          fullTime: time.toISOString(),
          distancia: record.distancia_mm,
          bateria: record.bateria_percent,
        };
      }
      return {};
    });
  }, [data, sensorType]);

  // Define lines based on sensor type
  const getLines = () => {
    if (sensorType === 'air') {
      return [
        { dataKey: 'co2', stroke: '#3b82f6', name: 'CO₂ (ppm)' },
        { dataKey: 'temperatura', stroke: '#ef4444', name: 'Temp (°C)' },
        { dataKey: 'humedad', stroke: '#10b981', name: 'Humedad (%)' },
      ];
    } else if (sensorType === 'sound') {
      return [
        { dataKey: 'laeq', stroke: '#3b82f6', name: 'LAeq (dB)' },
        { dataKey: 'lai', stroke: '#f59e0b', name: 'LAI (dB)' },
        { dataKey: 'laimax', stroke: '#ef4444', name: 'LAImax (dB)' },
      ];
    } else if (sensorType === 'underground') {
      return [
        { dataKey: 'distancia', stroke: '#3b82f6', name: 'Distancia (mm)' },
        { dataKey: 'bateria', stroke: '#10b981', name: 'Batería (%)' },
      ];
    }
    return [];
  };

  const getTitle = () => {
    if (sensorType === 'air') return 'Evolución de Calidad del Aire';
    if (sensorType === 'sound') return 'Evolución del Nivel de Sonido';
    if (sensorType === 'underground') return 'Evolución del Nivel de Agua';
    return 'Evolución Temporal';
  };

  if (processedData.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">{getTitle()}</h3>
        <p className="text-slate-400 text-center py-12">No hay suficientes datos para mostrar la evolución temporal</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <h3 className="text-lg font-semibold text-white mb-4">{getTitle()}</h3>
      <p className="text-sm text-slate-400 mb-6">
        Tendencia de las métricas principales a lo largo del tiempo
      </p>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={processedData}
          margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="time"
            stroke="#94a3b8"
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fill: '#94a3b8', fontSize: 12 }}
          />
          <YAxis
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#fff'
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          {getLines().map(line => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.stroke}
              name={line.name}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
