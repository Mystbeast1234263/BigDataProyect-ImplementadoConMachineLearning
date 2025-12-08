import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { useLanguage } from '../contexts/LanguageContext';

export default function KPICards({ stats, sensorData = [] }) {
  const { t } = useLanguage();
  
  // Si no hay stats o está vacío, retornar sin mostrar nada (no mostrar errores)
  if (!stats || Object.keys(stats).length === 0) {
    return null;
  }

  // Filter out metadata fields that are not actual metrics
  // These should not be displayed as metric cards
  const metadataKeys = ['count', 'min_date', 'max_date', '_metadata'];
  const allMetrics = Object.entries(stats).filter(
    ([key]) => {
      const keyLower = key.toLowerCase();
      // Filter out metadata keys
      if (metadataKeys.includes(keyLower)) return false;
      // Only include entries that have metric data structure (with average, min_value, etc.)
      const value = stats[key];
      return value && typeof value === 'object' && ('average' in value || 'count' in value);
    }
  );
  
  // If no valid metrics, return empty state
  if (allMetrics.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <p className="text-slate-400 text-sm">{t('no_data_available')}</p>
        </div>
      </div>
    );
  }
  
  const metrics = allMetrics.slice(0, 3);
  
  // Extract metadata if available (for display in other components if needed)
  // Support both new format (_metadata) and old format (direct keys)
  const metadata = stats._metadata || {
    count: stats.count,
    min_date: stats.min_date,
    max_date: stats.max_date
  };

  // Prepare data for charts
  const sortedData = useMemo(() => {
    if (!sensorData || sensorData.length === 0) return [];
    return [...sensorData].sort((a, b) => new Date(a.time || a.timestamp) - new Date(b.time || b.timestamp));
  }, [sensorData]);

  return (
    <div className="mb-8">
      {/* Metrics Grid with Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metrics.map(([metricName, data]) => {
          // Map metric display names to actual field names in sensor data
          const metricFieldMap = {
            'co2 (ppm)': 'co2_ppm',
            'temperature (°c)': 'temperatura_c',
            'humidity (%)': 'humedad_percent',
            'pressure (hpa)': 'presion_hpa',
            'laeq (db)': 'laeq_db',
            'lai (db)': 'lai_db',
            'laimax (db)': 'laimax_db',
            'battery (%)': 'bateria_percent',
            'distance (mm)': 'distancia_mm',
            // Also try direct matches
            'co2_ppm': 'co2_ppm',
            'temperatura_c': 'temperatura_c',
            'humedad_percent': 'humedad_percent',
            'presion_hpa': 'presion_hpa',
            'laeq_db': 'laeq_db',
            'lai_db': 'lai_db',
            'laimax_db': 'laimax_db',
            'bateria_percent': 'bateria_percent',
            'distancia_mm': 'distancia_mm',
          };
          
          // Find the correct field name
          const metricKeyLower = metricName.toLowerCase().trim();
          const fieldName = metricFieldMap[metricKeyLower] || 
                          metricKeyLower.replace(/\s+/g, '_').replace(/[()]/g, '').replace('°c', 'c');
          
          // Get metric values from sensor data
          const metricValues = sortedData
            .map(d => {
              // Try multiple field name variations
              const value = d[fieldName] || 
                           d[metricKeyLower] || 
                           d[metricName] || 
                           d[metricName.toLowerCase()] ||
                           d[fieldName.replace('_', '')] ||
                           null;
              return value !== null && value !== undefined ? parseFloat(value) : null;
            })
            .filter(v => v !== null && !isNaN(v));
          
          const times = sortedData
            .map(d => d.time || d.timestamp)
            .filter(t => t);

          // Calculate statistics
          const avg = data.average || (metricValues.length > 0 ? metricValues.reduce((a, b) => a + b, 0) / metricValues.length : 0);
          const min = data.min_value || (metricValues.length > 0 ? Math.min(...metricValues) : 0);
          const max = data.max_value || (metricValues.length > 0 ? Math.max(...metricValues) : 0);
          const count = data.count || metricValues.length;

          // Determine color based on metric type
          const getColor = () => {
            if (metricName.toLowerCase().includes('co2') || metricName.toLowerCase().includes('co₂')) return '#3b82f6';
            if (metricName.toLowerCase().includes('temp') || metricName.toLowerCase().includes('temperatura')) return '#f97316';
            if (metricName.toLowerCase().includes('hum') || metricName.toLowerCase().includes('humedad')) return '#06b6d4';
            if (metricName.toLowerCase().includes('pres') || metricName.toLowerCase().includes('presion')) return '#8b5cf6';
            if (metricName.toLowerCase().includes('sound') || metricName.toLowerCase().includes('laeq') || metricName.toLowerCase().includes('lai')) return '#ef4444';
            if (metricName.toLowerCase().includes('dist') || metricName.toLowerCase().includes('distancia')) return '#10b981';
            return '#6366f1';
          };

          const chartColor = getColor();

          return (
            <div
              key={metricName}
              className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition"
            >
              {/* Metric Name */}
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-3 font-semibold">
                {metricName}
              </p>

              {/* Chart */}
              {metricValues.length > 0 && times.length > 0 ? (
                <div className="mb-4" style={{ height: '200px' }}>
                  <Plot
                    data={[
                      {
                        x: times,
                        y: metricValues,
                        type: 'scatter',
                        mode: metricValues.length < 50 ? 'lines+markers' : 'lines',
                        name: metricName,
                        line: { color: chartColor, width: 2 },
                        marker: { size: 4, color: chartColor },
                        fill: 'tozeroy',
                        fillcolor: `${chartColor}20`,
                        hovertemplate: `<b>${metricName}</b><br>%{x|%Y-%m-%d %H:%M}<br>%{y:.2f}<extra></extra>`,
                      },
                    ]}
                    layout={{
                      xaxis: {
                        showgrid: true,
                        gridcolor: '#334155',
                        color: '#94a3b8',
                        showticklabels: false,
                      },
                      yaxis: {
                        showgrid: true,
                        gridcolor: '#334155',
                        color: '#94a3b8',
                        rangemode: 'tozero',
                      },
                      plot_bgcolor: 'transparent',
                      paper_bgcolor: 'transparent',
                      font: { color: '#e2e8f0', size: 10 },
                      margin: { l: 30, r: 10, t: 10, b: 20 },
                      autosize: true,
                      hovermode: 'closest',
                      showlegend: false,
                    }}
                    style={{ width: '100%', height: '100%' }}
                    useResizeHandler={true}
                    config={{ responsive: true, displayModeBar: false }}
                  />
                </div>
              ) : (
                <div className="mb-4 h-[200px] flex items-center justify-center bg-slate-900/50 rounded">
                  <p className="text-slate-500 text-xs">{t('no_chart_data_available')}</p>
                </div>
              )}

              {/* Statistics */}
              <div className="space-y-3">
                {/* Average */}
                <div>
                  <p className="text-xs text-slate-500 mb-1">{t('average')}</p>
                  <p className="text-2xl font-bold" style={{ color: chartColor }}>
                    {avg?.toFixed(2) || 'N/A'}
                  </p>
                </div>

                {/* Min/Max Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">{t('min')}</p>
                    <p className="text-slate-200 font-semibold text-lg">
                      {min?.toFixed(2) || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">{t('max')}</p>
                    <p className="text-slate-200 font-semibold text-lg">
                      {max?.toFixed(2) || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Count */}
                <div className="text-xs text-slate-500 border-t border-slate-700 pt-2">
                  {t('count')}: <span className="text-slate-300 font-medium">{count}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
