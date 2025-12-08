import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import StepChart from './Charts/StepChart';
import BarChart from './Charts/BarChart';
import Heatmap from './Charts/Heatmap';
import GaugeChart from './Charts/GaugeChart';
import { KPICardsSection } from './KPICards';
import { groupBySensor, extractValues, calculateStats, formatNumber, createTrace, COLORS } from './utils/dataProcessing';

export const DashboardUnderground = ({ data = [] }) => {
  const processedData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        distanceValues: [],
        bySensor: {},
        states: {},
        positions: {},
        kpis: [],
      };
    }

    const distanceValues = extractValues(data, 'distancia_mm');
    const bySensor = groupBySensor(data);
    const states = data.reduce((acc, d) => {
      acc[d.estado] = (acc[d.estado] || 0) + 1;
      return acc;
    }, {});
    const positions = data.reduce((acc, d) => {
      const pos = d.posicion || d.position || 'N/A';
      acc[pos] = (acc[pos] || 0) + 1;
      return acc;
    }, {});

    const distanceStats = calculateStats(distanceValues);

    return {
      distanceValues,
      bySensor,
      states,
      positions,
      stats: { distance: distanceStats },
    };
  }, [data]);

  // KPI Cards
  const kpis = useMemo(() => {
    const { stats, bySensor, states } = processedData;
    if (!stats.distance || !stats.distance.count) return [];

    const fullTanks = states['Lleno'] || 0;
    const emptyTanks = states['Vacío'] || 0;
    const totalTanks = Object.keys(bySensor).length;
    const unknownPercent = data.length > 0 ? (((states['Desconocido'] || 0) / data.length) * 100).toFixed(1) : 0;

    return [
      {
        title: 'Tanques LLENOS',
        value: fullTanks,
        unit: `/${totalTanks}`,
        status: fullTanks >= totalTanks * 0.7 ? 'good' : 'warning',
        description: fullTanks >= totalTanks * 0.7 ? '✓ Buena cobertura' : '⚠ Revisar tanques',
      },
      {
        title: 'Tanques VACÍOS',
        value: emptyTanks,
        unit: `/${totalTanks}`,
        status: emptyTanks > 0 ? 'critical' : 'good',
        description: emptyTanks > 0 ? 'Crítico' : 'Normal',
      },
      {
        title: 'Distancia Media',
        value: formatNumber(stats.distance.avg || 0),
        unit: 'mm',
        status: 'good',
        description: 'Promedio',
      },
      {
        title: 'Estado Desconocido',
        value: unknownPercent,
        unit: '%',
        status: unknownPercent > 20 ? 'warning' : 'good',
        description: unknownPercent > 20 ? 'Revisar sensores' : 'Normal',
      },
    ];
  }, [processedData, data]);

  // Gráfico 1: Step Chart - Distancia vs Tiempo
  const distanceTimeChart = useMemo(() => {
    if (Object.keys(processedData.bySensor).length === 0) return null;

    const traces = Object.entries(processedData.bySensor).map(([sensorName, sensorData], idx) => {
      if (!sensorData || sensorData.length === 0) return null;

      const sortedData = [...sensorData].sort((a, b) => new Date(a.time) - new Date(b.time));
      const xData = sortedData.map(d => d.time);
      const yData = sortedData.map(d => parseFloat(d.distancia_mm) || 0);

      return {
        x: xData,
        y: yData,
        name: sensorName,
        type: 'scatter',
        mode: 'lines',
        line: { color: COLORS[idx % COLORS.length], width: 2, shape: 'hv' },
        hovertemplate: `<b>${sensorName}</b><br>%{x}<br>Distancia: %{y:.1f} mm<extra></extra>`,
      };
    }).filter(t => t !== null);

    return traces.length > 0 ? traces : null;
  }, [processedData]);

  // Gráfico 2: Gauge Array - 9 Tanques
  const tankGauges = useMemo(() => {
    return Object.entries(processedData.bySensor).map(([sensorName, sensorData]) => {
      if (!sensorData || sensorData.length === 0) return null;

      const distances = sensorData.map(r => parseFloat(r.distancia_mm) || 0);
      const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
      const maxDistance = Math.max(...distances);
      const percentFull = maxDistance > 0 ? Math.round((avgDistance / maxDistance) * 100) : 0;

      return {
        name: sensorName.substring(0, 15),
        value: percentFull,
        max: 100,
      };
    }).filter(g => g !== null);
  }, [processedData]);

  // Gráfico 3: Bar Chart - Estados
  const stateBarChart = useMemo(() => {
    const states = processedData.states;
    if (Object.keys(states).length === 0) return null;

    const colorMap = {
      'Lleno': '#22c55e',
      'Medio lleno': '#eab308',
      'Vacío': '#ef4444',
      'Desconocido': '#808080',
    };

    return {
      x: Object.keys(states),
      y: Object.values(states),
      type: 'bar',
      marker: {
        color: Object.keys(states).map(state => colorMap[state] || '#999999'),
      },
      hovertemplate: '<b>%{x}</b><br>Registros: %{y}<extra></extra>',
    };
  }, [processedData]);

  // Gráfico 4: Line Chart - Tanques Críticos (< 50mm)
  const criticalTanksChart = useMemo(() => {
    const criticalTanks = Object.entries(processedData.bySensor)
      .filter(([, sensorData]) => {
        const distances = sensorData.map(d => parseFloat(d.distancia_mm) || 0);
        const minDistance = Math.min(...distances);
        return minDistance < 50;
      })
      .slice(0, 3); // Top 3 críticos

    if (criticalTanks.length === 0) return null;

    const traces = criticalTanks.map(([sensorName, sensorData], idx) => {
      if (!sensorData || sensorData.length === 0) return null;

      const sortedData = [...sensorData].sort((a, b) => new Date(a.time) - new Date(b.time));
      const xData = sortedData.map(d => d.time);
      const yData = sortedData.map(d => parseFloat(d.distancia_mm) || 0);

      return {
        x: xData,
        y: yData,
        name: sensorName,
        type: 'scatter',
        mode: 'lines',
        line: { color: COLORS[idx % COLORS.length], width: 2 },
        hovertemplate: `<b>${sensorName}</b><br>%{x}<br>Distancia: %{y:.1f} mm<extra></extra>`,
      };
    }).filter(t => t !== null);

    return traces.length > 0 ? traces : null;
  }, [processedData]);

  // Gráfico 5: Heatmap - Consumo por Sensor y Hora
  const consumptionHeatmap = useMemo(() => {
    const sensors = Object.keys(processedData.bySensor);
    if (sensors.length === 0 || data.length === 0) return null;

    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));

    const zValues = sensors.map(sensor => {
      return hours.map(hour => {
        const records = data.filter(d => {
          const sensorMatch = d.sensor_nombre === sensor;
          const hourMatch = new Date(d.time).getHours().toString().padStart(2, '0') === hour;
          return sensorMatch && hourMatch;
        });

        if (records.length === 0) return 0;
        const distances = records.map(r => parseFloat(r.distancia_mm) || 0);
        const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
        return avgDistance;
      });
    });

    return {
      z: zValues,
      x: hours.map(h => `${h}:00`),
      y: sensors,
      type: 'heatmap',
      colorscale: 'Blues',
      hovertemplate: '<b>%{y}</b><br>%{x}<br>Distancia: %{z:.1f} mm<extra></extra>',
    };
  }, [data, processedData]);

  if (data.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>No hay datos disponibles para mostrar. Selecciona un rango de fechas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <KPICardsSection cards={kpis} />

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Step Chart - Distancia */}
        {distanceTimeChart && (
          <StepChart
            data={distanceTimeChart}
            title="Nivel de Agua vs Tiempo (Cambios Discretos)"
            xAxisTitle="Fecha/Hora"
            yAxisTitle="Distancia (mm)"
          />
        )}

        {/* 3. Bar Chart - Estados */}
        <BarChart
          data={stateBarChart}
          title="Distribución de Estados de Tanques"
          xAxisTitle="Estado"
          yAxisTitle="Cantidad de Registros"
        />

        {/* 4. Critical Tanks */}
        {criticalTanksChart && (
          <LineChart
            data={criticalTanksChart}
            title="Tanques Críticos (Bajo Nivel)"
            xAxisTitle="Fecha/Hora"
            yAxisTitle="Distancia (mm)"
          />
        )}
      </div>

      {/* 2. Gauge Array - Tanques */}
      {tankGauges.length > 0 && (
        <GaugeChart
          gauges={tankGauges}
          title="Panel de Control: Estado de Todos los Tanques"
          height={600}
        />
      )}

      {/* 5. Heatmap - Consumo */}
      {Object.keys(processedData.bySensor).length > 0 && (
        <Heatmap
          data={consumptionHeatmap}
          title="Mapa de Consumo por Hora y Tanque"
        />
      )}
    </div>
  );
};

// Helper component para LineChart usado en criticalTanksChart
const LineChart = ({ data, title, xAxisTitle, yAxisTitle, height = 400 }) => (
  <div className="bg-white p-6 rounded-lg shadow-lg">
    <h3 className="text-lg font-bold mb-4 text-gray-800">{title}</h3>
    <Plot
      data={data}
      layout={{
        title: '',
        xaxis: { title: xAxisTitle },
        yaxis: { title: yAxisTitle },
        hovermode: 'x unified',
        height,
        margin: { l: 60, r: 40, t: 40, b: 60 },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(240,240,240,0.5)',
      }}
      config={{ responsive: true, displayModeBar: true }}
    />
  </div>
);

export default DashboardUnderground;
