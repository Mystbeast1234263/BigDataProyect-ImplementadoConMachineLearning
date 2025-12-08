import React, { useMemo } from 'react';
import LineChart from './Charts/LineChart';
import AreaChart from './Charts/AreaChart';
import BoxPlot from './Charts/BoxPlot';
import Heatmap from './Charts/Heatmap';
import ScatterPlot from './Charts/ScatterPlot';
import { KPICardsSection } from './KPICards';
import { groupBySensor, groupByHour, extractValues, calculateStats, formatNumber, createTrace, COLORS } from './utils/dataProcessing';

export const DashboardAir = ({ data = [] }) => {
  const processedData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        co2Values: [],
        tempValues: [],
        humidityValues: [],
        pressureValues: [],
        bySensor: {},
        byHour: {},
        kpis: [],
      };
    }

    const co2Values = extractValues(data, 'co2_ppm');
    const tempValues = extractValues(data, 'temperatura_c');
    const humidityValues = extractValues(data, 'humedad_percent');
    const pressureValues = extractValues(data, 'presion_hpa');

    const bySensor = groupBySensor(data);
    const byHour = groupByHour(data);

    const co2Stats = calculateStats(co2Values);
    const tempStats = calculateStats(tempValues);
    const humidityStats = calculateStats(humidityValues);

    return {
      co2Values,
      tempValues,
      humidityValues,
      pressureValues,
      bySensor,
      byHour,
      stats: { co2: co2Stats, temp: tempStats, humidity: humidityStats },
    };
  }, [data]);

  // KPI Cards
  const kpis = useMemo(() => {
    const { stats } = processedData;
    if (!stats.co2 || !stats.co2.count) return [];

    return [
      {
        title: 'Promedio CO2',
        value: formatNumber(stats.co2.avg || 0),
        unit: 'ppm',
        status: (stats.co2.avg || 0) > 500 ? 'warning' : 'good',
        description: (stats.co2.avg || 0) > 500 ? 'Elevado' : 'Normal',
      },
      {
        title: 'CO2 Máximo',
        value: formatNumber(stats.co2.max || 0),
        unit: 'ppm',
        status: (stats.co2.max || 0) > 550 ? 'critical' : 'good',
        description: (stats.co2.max || 0) > 550 ? 'Excede límite' : 'Dentro límite',
      },
      {
        title: 'Temperatura Prom',
        value: formatNumber(stats.temp?.avg || 0),
        unit: '°C',
        status: 'good',
        description: 'Moderado',
      },
      {
        title: 'Humedad Prom',
        value: formatNumber(stats.humidity?.avg || 0),
        unit: '%',
        status: 'good',
        description: 'Normal',
      },
    ];
  }, [processedData]);

  // Gráfico 1: Line Chart - CO2 vs Tiempo
  const co2TimeChart = useMemo(() => {
    if (Object.keys(processedData.bySensor).length === 0) return null;

    const traces = Object.entries(processedData.bySensor).map(([sensorName, sensorData], idx) => {
      if (!sensorData || sensorData.length === 0) return null;

      const sortedData = [...sensorData].sort((a, b) => new Date(a.time) - new Date(b.time));
      const xData = sortedData.map(d => d.time);
      const yData = sortedData.map(d => parseFloat(d.co2_ppm) || 0);

      return {
        x: xData,
        y: yData,
        name: sensorName,
        type: 'scatter',
        mode: 'lines',
        line: { color: COLORS[idx % COLORS.length], width: 2 },
        hovertemplate: `<b>${sensorName}</b><br>%{x}<br>CO2: %{y:.1f} ppm<extra></extra>`,
      };
    }).filter(t => t !== null);

    return traces.length > 0 ? traces : null;
  }, [processedData]);

  // Gráfico 2: Area Chart - Temperatura + Humedad
  const tempHumidityChart = useMemo(() => {
    if (data.length === 0) return null;

    const sortedData = [...data].sort((a, b) => new Date(a.time) - new Date(b.time));
    const xData = sortedData.map(d => d.time);

    const traces = [
      {
        x: xData,
        y: sortedData.map(d => parseFloat(d.temperatura_c) || 0),
        name: 'Temperatura (°C)',
        type: 'scatter',
        mode: 'lines',
        line: { color: '#ff7f0e', width: 2 },
        fill: 'tozeroy',
        opacity: 0.7,
        hovertemplate: '<b>Temperatura</b><br>%{x}<br>%{y:.1f}°C<extra></extra>',
      },
      {
        x: xData,
        y: sortedData.map(d => parseFloat(d.humedad_percent) || 0),
        name: 'Humedad (%)',
        type: 'scatter',
        mode: 'lines',
        line: { color: '#1f77b4', width: 2 },
        fill: 'tozeroy',
        opacity: 0.7,
        hovertemplate: '<b>Humedad</b><br>%{x}<br>%{y:.1f}%<extra></extra>',
      },
    ];

    return traces;
  }, [data]);

  // Gráfico 4: Box Plot - CO2 por Sensor
  const co2BoxPlot = useMemo(() => {
    if (Object.keys(processedData.bySensor).length === 0) return null;

    const traces = Object.entries(processedData.bySensor).map(([sensorName, sensorData]) => ({
      y: sensorData.map(d => parseFloat(d.co2_ppm) || 0).filter(v => v > 0),
      name: sensorName,
      type: 'box',
      boxmean: 'sd',
    }));

    return traces.length > 0 ? traces : null;
  }, [processedData]);

  // Gráfico 5: Heatmap - CO2 por Sensor y Hora
  const co2Heatmap = useMemo(() => {
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
        const avgCo2 = records.reduce((sum, r) => sum + r.co2_ppm, 0) / records.length;
        return avgCo2;
      });
    });

    return {
      z: zValues,
      x: hours.map(h => `${h}:00`),
      y: sensors,
      type: 'heatmap',
      colorscale: 'Viridis',
      hovertemplate: '<b>%{y}</b><br>%{x}<br>CO2: %{z:.1f} ppm<extra></extra>',
    };
  }, [data, processedData]);

  // Gráfico 6: Scatter - Temperatura vs Humedad
  const tempHumidityScatter = useMemo(() => {
    if (data.length === 0) return null;

    return {
      x: data.map(d => parseFloat(d.temperatura_c) || 0),
      y: data.map(d => parseFloat(d.humedad_percent) || 0),
      mode: 'markers',
      type: 'scatter',
      marker: {
        color: data.map(d => parseFloat(d.co2_ppm) || 0),
        colorscale: 'Viridis',
        size: 6,
        colorbar: { title: 'CO2 (ppm)' },
        line: { width: 0.5, color: 'white' },
      },
      hovertemplate: '<b>Temperatura:</b> %{x:.1f}°C<br><b>Humedad:</b> %{y:.1f}%<extra></extra>',
    };
  }, [data]);

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
        {/* 1. Line Chart - CO2 */}
        {co2TimeChart && (
          <LineChart
            data={co2TimeChart}
            title="CO2 vs Tiempo"
            xAxisTitle="Fecha/Hora"
            yAxisTitle="CO2 (ppm)"
          />
        )}

        {/* 2. Area Chart - Temperatura + Humedad */}
        <AreaChart
          data={tempHumidityChart}
          title="Temperatura y Humedad"
          xAxisTitle="Fecha/Hora"
          yAxisTitle="Valor"
        />

        {/* 3. Box Plot - CO2 por Sensor */}
        {co2BoxPlot && (
          <BoxPlot
            data={co2BoxPlot}
            title="Distribución CO2 por Sensor"
            yAxisTitle="CO2 (ppm)"
          />
        )}

        {/* 4. Scatter - Temperatura vs Humedad */}
        <ScatterPlot
          data={tempHumidityScatter}
          title="Correlación Temperatura vs Humedad"
          xAxisTitle="Temperatura (°C)"
          yAxisTitle="Humedad (%)"
        />
      </div>

      {/* 5. Heatmap - CO2 por Hora y Sensor */}
      {Object.keys(processedData.bySensor).length > 0 && (
        <Heatmap
          data={co2Heatmap}
          title="Mapa de Calor: CO2 por Sensor y Hora"
        />
      )}
    </div>
  );
};

export default DashboardAir;
