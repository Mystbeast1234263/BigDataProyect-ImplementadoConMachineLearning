import { useMemo } from 'react';

export default function HeatmapChart({ data, sensorType }) {
  // Process data for heatmap
  const { heatmapData, maxValue, minValue } = useMemo(() => {
    if (!data || data.length === 0) return { heatmapData: {}, maxValue: 0, minValue: 0 };

    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Initialize matrix
    const matrix = {};
    const counts = {};

    dayNames.forEach(day => {
      matrix[day] = {};
      counts[day] = {};
      hours.forEach(hour => {
        matrix[day][hour] = 0;
        counts[day][hour] = 0;
      });
    });

    // Get the metric to analyze
    const getMetricValue = (record) => {
      if (sensorType === 'air') return record.co2_ppm;
      if (sensorType === 'sound') return record.laeq_db;
      if (sensorType === 'underground') return record.distancia_mm;
      return 0;
    };

    // Aggregate data
    data.forEach(record => {
      const time = new Date(record.time || record.tiempo);
      const dayOfWeek = time.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const hour = time.getHours();

      // Convert Sunday (0) to be last day
      const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const dayName = dayNames[dayIndex];

      const metricValue = getMetricValue(record);
      if (metricValue) {
        matrix[dayName][hour] += metricValue;
        counts[dayName][hour] += 1;
      }
    });

    // Calculate averages
    dayNames.forEach(day => {
      hours.forEach(hour => {
        if (counts[day][hour] > 0) {
          matrix[day][hour] = matrix[day][hour] / counts[day][hour];
        }
      });
    });

    // Find min/max for color scaling
    let max = -Infinity;
    let min = Infinity;
    dayNames.forEach(day => {
      hours.forEach(hour => {
        const value = matrix[day][hour];
        if (value > 0) {
          if (value > max) max = value;
          if (value < min) min = value;
        }
      });
    });

    return { heatmapData: matrix, maxValue: max, minValue: min };
  }, [data, sensorType]);

  // Get color based on value
  const getColor = (value) => {
    if (value === 0 || !value) return 'rgb(30, 41, 59)'; // slate-800

    const normalized = (value - minValue) / (maxValue - minValue);

    // Color scale: blue (low) -> yellow (medium) -> red (high)
    if (normalized < 0.33) {
      const intensity = Math.floor(normalized * 3 * 255);
      return `rgb(59, ${100 + intensity}, ${200 + intensity})`;
    } else if (normalized < 0.66) {
      const intensity = Math.floor((normalized - 0.33) * 3 * 255);
      return `rgb(${100 + intensity}, ${200 - intensity * 0.5}, 100)`;
    } else {
      const intensity = Math.floor((normalized - 0.66) * 3 * 255);
      return `rgb(${200 + intensity * 0.2}, ${100 - intensity * 0.4}, 50)`;
    }
  };

  const getTitle = () => {
    if (sensorType === 'air') return 'Patrón de CO₂: Hora del Día vs. Día de la Semana';
    if (sensorType === 'sound') return 'Patrón de Ruido: Hora del Día vs. Día de la Semana';
    if (sensorType === 'underground') return 'Patrón de Nivel: Hora del Día vs. Día de la Semana';
    return 'Patrón Temporal';
  };

  const getMetricLabel = () => {
    if (sensorType === 'air') return 'CO₂ (ppm)';
    if (sensorType === 'sound') return 'LAeq (dB)';
    if (sensorType === 'underground') return 'Distancia (mm)';
    return 'Valor';
  };

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayLabels = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  if (Object.keys(heatmapData).length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">{getTitle()}</h3>
        <p className="text-slate-400 text-center py-12">No hay suficientes datos para el heatmap temporal</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <h3 className="text-lg font-semibold text-white mb-4">{getTitle()}</h3>
      <p className="text-sm text-slate-400 mb-6">
        Mapa de calor mostrando {getMetricLabel()} promedio por hora y día
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border border-slate-600 px-2 py-2 text-xs text-slate-300 bg-slate-700 sticky left-0 z-10">
                Hora
              </th>
              {dayLabels.map((day, idx) => (
                <th
                  key={day}
                  className="border border-slate-600 px-2 py-2 text-xs text-slate-300 bg-slate-700 min-w-[80px]"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hours.map(hour => (
              <tr key={hour}>
                <td className="border border-slate-600 px-2 py-2 text-xs text-slate-300 bg-slate-700 font-semibold sticky left-0 z-10">
                  {String(hour).padStart(2, '0')}:00
                </td>
                {dayNames.map((dayName, idx) => {
                  const value = heatmapData[dayName][hour];
                  const displayValue = value > 0 ? value.toFixed(1) : '-';
                  const bgColor = getColor(value);

                  return (
                    <td
                      key={`${dayName}-${hour}`}
                      className="border border-slate-600 px-2 py-2 text-xs text-center transition-all hover:scale-105 cursor-pointer"
                      style={{ backgroundColor: bgColor }}
                      title={`${dayLabels[idx]} ${hour}:00 - ${getMetricLabel()}: ${displayValue}`}
                    >
                      <span className={value > (maxValue * 0.6) ? 'text-white font-semibold' : 'text-slate-200'}>
                        {displayValue}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-4">
        <span className="text-xs text-slate-400">Bajo</span>
        <div className="flex gap-1">
          {[0, 0.2, 0.4, 0.6, 0.8, 1.0].map((value, idx) => (
            <div
              key={idx}
              className="w-8 h-4 border border-slate-600"
              style={{ backgroundColor: getColor(minValue + (maxValue - minValue) * value) }}
            />
          ))}
        </div>
        <span className="text-xs text-slate-400">Alto</span>
        <span className="text-xs text-slate-500 ml-4">
          Min: {minValue.toFixed(1)} | Max: {maxValue.toFixed(1)}
        </span>
      </div>
    </div>
  );
}
