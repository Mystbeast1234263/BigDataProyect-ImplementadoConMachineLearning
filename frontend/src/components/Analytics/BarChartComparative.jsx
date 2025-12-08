import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

export default function BarChartComparative({ data, sensorType }) {
  // Process data to compare by sensor
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const sensorGroups = {};

    // Group by sensor name and calculate averages
    data.forEach(record => {
      const sensorName = record.sensor_nombre || record.sensor_name || 'Unknown';

      if (!sensorGroups[sensorName]) {
        sensorGroups[sensorName] = {
          sensorName,
          count: 0,
          sum: {}
        };
      }

      sensorGroups[sensorName].count += 1;

      if (sensorType === 'air') {
        sensorGroups[sensorName].sum.co2 = (sensorGroups[sensorName].sum.co2 || 0) + (record.co2_ppm || 0);
        sensorGroups[sensorName].sum.temperatura = (sensorGroups[sensorName].sum.temperatura || 0) + (record.temperatura_c || 0);
        sensorGroups[sensorName].sum.humedad = (sensorGroups[sensorName].sum.humedad || 0) + (record.humedad_percent || 0);
      } else if (sensorType === 'sound') {
        sensorGroups[sensorName].sum.laeq = (sensorGroups[sensorName].sum.laeq || 0) + (record.laeq_db || 0);
        sensorGroups[sensorName].sum.lai = (sensorGroups[sensorName].sum.lai || 0) + (record.lai_db || 0);
        sensorGroups[sensorName].sum.laimax = (sensorGroups[sensorName].sum.laimax || 0) + (record.laimax_db || 0);
      } else if (sensorType === 'underground') {
        sensorGroups[sensorName].sum.distancia = (sensorGroups[sensorName].sum.distancia || 0) + (record.distancia_mm || 0);
        sensorGroups[sensorName].sum.bateria = (sensorGroups[sensorName].sum.bateria || 0) + (record.bateria_percent || 0);
      }
    });

    // Calculate averages and format
    return Object.values(sensorGroups).map(group => {
      const result = {
        sensorName: group.sensorName,
        shortName: group.sensorName.substring(0, 10) // Shortened for display
      };

      Object.keys(group.sum).forEach(key => {
        result[key] = group.sum[key] / group.count;
      });

      return result;
    });
  }, [data, sensorType]);

  // Define bars based on sensor type
  const getBars = () => {
    if (sensorType === 'air') {
      return [
        { dataKey: 'co2', fill: '#3b82f6', name: 'CO₂ (ppm)' },
      ];
    } else if (sensorType === 'sound') {
      return [
        { dataKey: 'laeq', fill: '#3b82f6', name: 'LAeq (dB)' },
      ];
    } else if (sensorType === 'underground') {
      return [
        { dataKey: 'distancia', fill: '#3b82f6', name: 'Distancia (mm)' },
      ];
    }
    return [];
  };

  const getTitle = () => {
    if (sensorType === 'air') return 'Nivel de CO₂ Promedio por Sensor';
    if (sensorType === 'sound') return 'Nivel de Sonido Promedio por Sensor';
    if (sensorType === 'underground') return 'Nivel de Agua Promedio por Sensor';
    return 'Comparación por Sensor';
  };

  // Generate colors for bars
  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

  if (processedData.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">{getTitle()}</h3>
        <p className="text-slate-400 text-center py-12">No hay suficientes datos para comparar sensores</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <h3 className="text-lg font-semibold text-white mb-4">{getTitle()}</h3>
      <p className="text-sm text-slate-400 mb-6">
        Comparación de valores promedio entre diferentes sensores
      </p>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={processedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="shortName"
            stroke="#94a3b8"
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fill: '#94a3b8', fontSize: 12 }}
          />
          <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#fff'
            }}
            formatter={(value) => value.toFixed(2)}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          {getBars().map((bar, index) => (
            <Bar key={bar.dataKey} dataKey={bar.dataKey} name={bar.name}>
              {processedData.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={colors[idx % colors.length]} />
              ))}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>

      {/* Sensor names legend */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
        {processedData.map((sensor, idx) => (
          <div key={sensor.sensorName} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: colors[idx % colors.length] }}
            />
            <span className="text-xs text-slate-300">{sensor.sensorName}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
