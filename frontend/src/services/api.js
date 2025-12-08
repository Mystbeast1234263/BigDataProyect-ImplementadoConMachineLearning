import axios from 'axios';

// Crear instancia de axios
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Timeout de 10 segundos para evitar peticiones colgadas
  timeout: 10000,
});

// Agregar token a las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// AUTH API CALLS
// ============================================================================

export const authAPI = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  register: (email, password) =>
    api.post('/auth/register', { email, password }),

  logout: () =>
    api.post('/auth/logout'),

  getCurrentUser: () =>
    api.get('/auth/me'),

  refreshToken: () =>
    api.post('/auth/refresh'),

  getDemoUsers: () =>
    api.get('/auth/demo-users'),
};

// ============================================================================
// SENSORS API CALLS
// ============================================================================

export const sensorsAPI = {
  listSensors: () =>
    api.get('/sensors'),

  getAvailableDates: () =>
    api.get('/sensors/available-dates'),

  getSensorData: (sensorType, daysBack = 30, limit = null) => {
    const params = new URLSearchParams();
    params.append('days_back', daysBack);
    if (limit) params.append('limit', limit);
    return api.get(`/sensors/${sensorType}/data?${params.toString()}`);
  },

  getSensorStats: (sensorType, daysBack = 30, metricName = null, sensorName = null) => {
    const params = new URLSearchParams();
    params.append('days_back', daysBack);
    if (metricName) params.append('metric_name', metricName);
    if (sensorName) params.append('sensor_name', sensorName);
    return api.get(`/sensors/${sensorType}/stats?${params.toString()}`);
  },

  // NEW: Get sensor data filtered by date range
  getSensorDataByDateRange: (sensorType, dateFrom, dateTo, limit = 400) => {
    const params = new URLSearchParams();
    params.append('date_from', dateFrom);
    params.append('date_to', dateTo);
    params.append('limit', limit);
    return api.get(`/sensors/${sensorType}/data?${params.toString()}`);
  },

  // NEW: Get sensor stats filtered by date range
  getSensorStatsByDateRange: (sensorType, dateFrom, dateTo, sensorName = null) => {
    const params = new URLSearchParams();
    params.append('date_from', dateFrom);
    params.append('date_to', dateTo);
    if (sensorName) params.append('sensor_name', sensorName);
    return api.get(`/sensors/${sensorType}/stats?${params.toString()}`);
  },

  // Get list of unique sensor names for a sensor type
  getSensorNames: (sensorType) => {
    return api.get(`/sensors/${sensorType}/sensor-names`);
  },

  // NEW: Generate preview (does NOT save to DB)
  generateDataPreview: (sensorType, count = 50, daysBack = 30, dateFrom = null, dateTo = null) => {
    const body = { count, days_back: daysBack };
    if (dateFrom) body.date_from = dateFrom;
    if (dateTo) body.date_to = dateTo;
    return api.post(`/sensors/${sensorType}/generate-preview`, body);
  },

  // NEW: Save generated data to MongoDB (requires confirmation)
  saveGeneratedData: (sensorType, data) =>
    api.post(`/sensors/${sensorType}/save-generated`, {
      data,
    }),

  // OLD: Generate and auto-save (keeping for backward compatibility)
  generateRandomData: (sensorType, count = 100, daysBack = 14) =>
    api.post(`/sensors/${sensorType}/generate`, {
      sensor_type: sensorType,
      count,
      days_back: daysBack,
    }),

  clearSensorData: (sensorType) =>
    api.delete(`/sensors/${sensorType}/clear`),

  // Upload CSV file
  uploadCSV: (sensorType, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/sensors/${sensorType}/upload-csv`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Check for new data since last check
  checkNewData: (sensorType, lastCheckTimestamp = null) => {
    const params = new URLSearchParams();
    if (lastCheckTimestamp) {
      params.append('last_check', lastCheckTimestamp);
    }
    return api.get(`/sensors/${sensorType}/check-new-data?${params.toString()}`);
  },
};

// ============================================================================
// PREDICTIONS API
// ============================================================================

export const predictionsAPI = {
  getPredictions: (sensorType, {
    metricName = null,
    horizonHours = 24,
    intervalMinutes = 60,
    daysBack = 30,
    limit = 2000,
    modelType = 'linear',
    dateFrom = null,
    dateTo = null,
  } = {}) => {
    const params = new URLSearchParams();
    params.append('horizon_hours', horizonHours);
    params.append('interval_minutes', intervalMinutes);
    params.append('days_back', daysBack);
    params.append('limit', limit);
    params.append('model_type', modelType);
    if (metricName) params.append('metric_name', metricName);
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    return api.get(`/predictions/${sensorType}?${params.toString()}`);
  },
  
  getSensorHealth: (sensorType, {
    daysBack = 7,
    limit = 1000,
  } = {}) => {
    const params = new URLSearchParams();
    params.append('days_back', daysBack);
    params.append('limit', limit);
    return api.get(`/predictions/${sensorType}/health?${params.toString()}`);
  },
};

// ============================================================================
// ML CLASSIFICATION API
// ============================================================================

export const mlAPI = {
  trainModel: (sensorType, metric, options = {}) => {
    return api.post('/ml/train', {
      sensor_type: sensorType,
      metric: metric,
      model_type: options.modelType || 'auto',
      date_from: options.dateFrom,
      date_to: options.dateTo,
      days_back: options.daysBack || 90,
      limit: options.limit || 5000,
      test_size: options.testSize || 0.2,
      random_state: options.randomState || 42,
    });
  },

  predict: (sensorType, metric, options = {}) => {
    return api.post('/ml/predict', {
      sensor_type: sensorType,
      metric: metric,
      prediction_date: options.predictionDate,
      date_from: options.dateFrom,
      date_to: options.dateTo,
      model_key: options.modelKey,
    });
  },

  predictByDate: (sensorType, metric, date, modelKey = null) => {
    const params = new URLSearchParams();
    params.append('date', date);
    if (modelKey) params.append('model_key', modelKey);
    return api.get(`/ml/predict/date/${sensorType}/${metric}?${params.toString()}`);
  },

  // predictByPeriod y predictByWeek no se usan - removidos

  getMetrics: (modelKey) => {
    return api.get(`/ml/metrics/${modelKey}`);
  },

  getVisualizations: (modelKey) => {
    return api.get(`/ml/visualizations/${modelKey}`);
  },

  listModels: () => {
    return api.get('/ml/models');
  },

  // Predicción de regresión (valores numéricos) usando modelos de clasificación ML
  predictRegression: (sensorType, metric, options = {}) => {
    return api.post('/ml/predict/regression', {
      sensor_type: sensorType,
      metric: metric,
      prediction_date: options.predictionDate,
      prediction_month: options.predictionMonth,
      model_key: options.modelKey,
    });
  },
};

export default api;
