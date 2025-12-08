/**
 * Procesa datos de sensores para gráficos
 */

// Colores para múltiples líneas
export const COLORS = [
  '#1f77b4', // azul
  '#ff7f0e', // naranja
  '#2ca02c', // verde
  '#d62728', // rojo
  '#9467bd', // púrpura
  '#8c564b', // marrón
];

// Agrupar datos por sensor
export const groupBySensor = (data) => {
  return data.reduce((acc, record) => {
    const sensorName = record.sensor_nombre || 'Unknown';
    if (!acc[sensorName]) {
      acc[sensorName] = [];
    }
    acc[sensorName].push(record);
    return acc;
  }, {});
};

// Agrupar datos por hora
export const groupByHour = (data) => {
  return data.reduce((acc, record) => {
    const date = new Date(record.time);
    const hour = date.getHours();
    const key = `${hour.toString().padStart(2, '0')}:00`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(record);
    return acc;
  }, {});
};

// Calcular estadísticas básicas
export const calculateStats = (values) => {
  if (!values || values.length === 0) return {};

  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  const avg = sum / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const median = values.length % 2 === 0
    ? (sorted[values.length / 2 - 1] + sorted[values.length / 2]) / 2
    : sorted[Math.floor(values.length / 2)];

  const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  return { min, max, avg, median, stdDev, count: values.length };
};

// Extraer valores de un array de objetos
export const extractValues = (data, key) => {
  return data.map(item => item[key]).filter(val => val !== null && val !== undefined);
};

// Formatear números
export const formatNumber = (num, decimals = 2) => {
  return typeof num === 'number' ? num.toFixed(decimals) : '0.00';
};

// Crear trace para Plotly
export const createTrace = (x, y, name, color = null, type = 'scatter', mode = 'lines') => {
  return {
    x,
    y,
    name,
    type,
    mode,
    line: color ? { color, width: 2 } : { width: 2 },
    hovertemplate: `<b>${name}</b><br>%{x}<br>%{y:.2f}<extra></extra>`,
  };
};
