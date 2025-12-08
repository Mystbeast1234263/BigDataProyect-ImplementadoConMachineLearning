import React, { useMemo } from 'react';
import LineChart from './Charts/LineChart';
import Histogram from './Charts/Histogram';
import BoxPlot from './Charts/BoxPlot';
import Heatmap from './Charts/Heatmap';
import GaugeChart from './Charts/GaugeChart';
import { KPICardsSection } from './KPICards';
import { groupBySensor, extractValues, calculateStats, formatNumber, createTrace, COLORS } from './utils/dataProcessing';

export const DashboardSound = ({ data = [] }) => {
  const processedData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        laeqValues: [],
        laiValues: [],
        laimaxValues: [],
        batteryValues: [],
        bySensor: {},
        kpis: [],
      };
    }

    const laeqValues = extractValues(data, 'laeq_db');
    const laiValues = extractValues(data, 'lai_db');
    const laimaxValues = extractValues(data, 'laimax_db');
    const batteryValues = extractValues(data, 'bateria_percent');

    const bySensor = groupBySensor(data);

    const laeqStats = calculateStats(laeqValues);
    const batteryStats = calculateStats(batteryValues);

    return {
      laeqValues,
      laiValues,
      laimaxValues,
      batteryValues,
      bySensor,
      stats: { laeq: laeqStats, battery: batteryStats },
    };
  }, [data]);

  // KPI Cards
  const kpis = useMemo(() => {
    const { stats } = processedData;
    if (!stats.laeq || !stats.laeq.count) return [];

    const hoursOver70 = data.filter(d => d.laeq_db > 70).length;
    const percentOver70 = data.length > 0 ? ((hoursOver70 / data.length) * 100).toFixed(1) : 0;

    return [
      {
        title: 'LAeq Promedio',
        value: formatNumber(stats.laeq.avg || 0),
        unit: 'dB',
        status: (stats.laeq.avg || 0) > 65 ? 'warning' : 'good',
        description: (stats.laeq.avg || 0) > 65 ? 'Elevado' : 'Dentro límite',
      },
      {
        title: 'LAeq Máximo',
        value: formatNumber(stats.laeq.max || 0),
        unit: 'dB',
        status: (stats.laeq.max || 0) > 80 ? 'critical' : 'good',
        description: (stats.laeq.max || 0) > 80 ? 'Excede límite' : 'Dentro límite',
      },
      {
        title: 'Horas > 70 dB',
        value: percentOver70,
        unit: '%',
        status: percentOver70 > 30 ? 'critical' : percentOver70 > 10 ? 'warning' : 'good',
        description: 'Del período',
      },
      {
        title: 'Batería Prom',
        value: formatNumber(stats.battery?.avg || 0),
        unit: '%',
        status: (stats.battery?.avg || 0) < 70 ? 'warning' : 'good',
        description: (stats.battery?.avg || 0) < 70 ? 'Baja' : 'Funcional',
      },
    ];
  }, [processedData, data]);

  // Gráfico 1: Line Chart - LAeq vs Tiempo (con patrón día/noche)
  const laeqTimeChart = useMemo(() => {
    if (Object.keys(processedData.bySensor).length === 0) return null;

    const traces = Object.entries(processedData.bySensor).map(([sensorName, sensorData], idx) => {
      if (!sensorData || sensorData.length === 0) return null;

      const sortedData = [...sensorData].sort((a, b) => new Date(a.time) - new Date(b.time));
      const xData = sortedData.map(d => d.time);
      const yData = sortedData.map(d => parseFloat(d.laeq_db) || 0);

      return {
        x: xData,
        y: yData,
        name: sensorName,
        type: 'scatter',
        mode: 'lines',
        line: { color: COLORS[idx % COLORS.length], width: 2 },
        hovertemplate: `<b>${sensorName}</b><br>%{x}<br>LAeq: %{y:.1f} dB<extra></extra>`,
      };
    }).filter(t => t !== null);

    return traces.length > 0 ? traces : null;
  }, [processedData]);

  // Gráfico 2: Histogram - Distribución LAeq
  const laeqHistogram = useMemo(() => {
    if (data.length === 0) return null;

    return {
      x: data.map(d => parseFloat(d.laeq_db) || 0),
      type: 'histogram',
      nbinsx: 30,
      name: 'LAeq',
      marker: { color: '#1f77b4' },
      hovertemplate: '<b>LAeq dB</b><br>Registros: %{y}<extra></extra>',
    };
  }, [data]);

  // Gráfico 3: Stacked Area - LAeq + LAI + LAImax
  const stackedAreaChart = useMemo(() => {
    if (data.length === 0) return null;

    const sortedData = [...data].sort((a, b) => new Date(a.time) - new Date(b.time));
    const xData = sortedData.map(d => d.time);

    const traces = [
      {
        x: xData,
        y: sortedData.map(d => parseFloat(d.laeq_db) || 0),
        name: 'LAeq (Promedio)',
        type: 'scatter',
        mode: 'lines',
        line: { color: '#1f77b4', width: 2 },
        fill: 'tozeroy',
        hovertemplate: '<b>LAeq</b><br>%{x}<br>%{y:.1f} dB<extra></extra>',
      },
      {
        x: xData,
        y: sortedData.map(d => parseFloat(d.lai_db) || 0),
        name: 'LAI (Variabilidad)',
        type: 'scatter',
        mode: 'lines',
        line: { color: '#ff7f0e', width: 2 },
        fill: 'tozeroy',
        hovertemplate: '<b>LAI</b><br>%{x}<br>%{y:.1f} dB<extra></extra>',
      },
      {
        x: xData,
        y: sortedData.map(d => parseFloat(d.laimax_db) || 0),
        name: 'LAImax (Picos)',
        type: 'scatter',
        mode: 'lines',
        line: { color: '#d62728', width: 2 },
        fill: 'tozeroy',
        hovertemplate: '<b>LAImax</b><br>%{x}<br>%{y:.1f} dB<extra></extra>',
      },
    ];

    return traces;
  }, [data]);

  // Gráfico 4: Box Plot - LAeq por Sensor
  const laeqBoxPlot = useMemo(() => {
    if (Object.keys(processedData.bySensor).length === 0) return null;

    const traces = Object.entries(processedData.bySensor).map(([sensorName, sensorData]) => ({
      y: sensorData.map(d => parseFloat(d.laeq_db) || 0).filter(v => v > 0),
      name: sensorName,
      type: 'box',
      boxmean: 'sd',
    }));

    return traces.length > 0 ? traces : null;
  }, [processedData]);

  // Gráfico 5: Heatmap - LAeq por Sensor y Hora
  const laeqHeatmap = useMemo(() => {
    const sensors = Object.keys(processedData.bySensor);
    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));

    const zValues = sensors.map(sensor => {
      return hours.map(hour => {
        const records = data.filter(d => {
          const sensorMatch = d.sensor_nombre === sensor;
          const hourMatch = new Date(d.time).getHours().toString().padStart(2, '0') === hour;
          return sensorMatch && hourMatch;
        });

        if (records.length === 0) return 0;
        const avgLaeq = records.reduce((sum, r) => sum + r.laeq_db, 0) / records.length;
        return avgLaeq;
      });
    });

    return {
      z: zValues,
      x: hours.map(h => `${h}:00`),
      y: sensors,
      type: 'heatmap',
      colorscale: 'RdYlGn_r',
      hovertemplate: '<b>%{y}</b><br>%{x}<br>LAeq: %{z:.1f} dB<extra></extra>',
    };
  }, [data, processedData]);

  // Gráfico 6: Gauge - Batería de Sensores
  const batteryGauges = useMemo(() => {
    return Object.entries(processedData.bySensor).map(([sensorName, sensorData]) => {
      const avgBattery = sensorData.reduce((sum, r) => sum + (r.bateria_percent || 0), 0) / sensorData.length;
      return {
        name: sensorName,
        value: avgBattery,
        max: 100,
      };
    });
  }, [processedData]);

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
        {/* 1. Line Chart - LAeq */}
        {laeqTimeChart && (
          <LineChart
            data={laeqTimeChart}
            title="LAeq vs Tiempo (Patrón Día/Noche)"
            xAxisTitle="Fecha/Hora"
            yAxisTitle="LAeq (dB)"
          />
        )}

        {/* 2. Histogram - LAeq */}
        <Histogram
          data={laeqHistogram}
          title="Distribución de LAeq"
          xAxisTitle="LAeq (dB)"
          yAxisTitle="Frecuencia (Registros)"
        />

        {/* 3. Stacked Area - LAeq + LAI + LAImax */}
        <LineChart
          data={stackedAreaChart}
          title="LAeq + LAI + LAImax (Superpuesto)"
          xAxisTitle="Fecha/Hora"
          yAxisTitle="Nivel de Sonido (dB)"
        />

        {/* 4. Box Plot - LAeq por Sensor */}
        {laeqBoxPlot && (
          <BoxPlot
            data={laeqBoxPlot}
            title="Distribución LAeq por Ubicación"
            yAxisTitle="LAeq (dB)"
          />
        )}
      </div>

      {/* 5. Heatmap - LAeq por Hora y Sensor */}
      {Object.keys(processedData.bySensor).length > 0 && (
        <Heatmap
          data={laeqHeatmap}
          title="Mapa de Calor: LAeq por Sensor y Hora (Detecta Patrones de Ruido)"
        />
      )}

      {/* 6. Gauge - Batería */}
      {batteryGauges.length > 0 && (
        <GaugeChart
          gauges={batteryGauges}
          title="Estado de Batería de Sensores"
        />
      )}
    </div>
  );
};

export default DashboardSound;
