import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { useLanguage } from '../contexts/LanguageContext';
import { sensorsAPI } from '../services/api';
import Header from './Header';
import SensorTypeSelector from './SensorTypeSelector';
import ActionButtons from './ActionButtons';
import KPICards from './KPICards';
import SensorDataTable from './SensorDataTable';
import SensorDataModal from './SensorDataModal';
import SensorCharts from './SensorCharts';
import GeneratedDataPreview from './GeneratedDataPreview';
import DateRangeSelector from './DateRangeSelector';
import RecordLimitSelector from './RecordLimitSelector';
import FileUpload from './FileUpload';
import TimeSeriesChart from './Analytics/TimeSeriesChart';
import HeatmapChart from './Analytics/HeatmapChart';
import BarChartComparative from './Analytics/BarChartComparative';
import HistogramChart from './Analytics/HistogramChart';
import MLWizard from './MLWizard';
import MetricDashboard from './MetricDashboard';

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const { t } = useLanguage();

  const [selectedSensor, setSelectedSensor] = useState('air');
  const [sensorData, setSensorData] = useState([]);
  const [allSensorData, setAllSensorData] = useState([]); // Store all data without limit
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [daysBack, setDaysBack] = useState(30);
  const [dateFilter, setDateFilter] = useState({ from: null, to: null });
  const [recordLimit, setRecordLimit] = useState(500);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true); // Auto-refresh activado por defecto
  const [refreshInterval, setRefreshInterval] = useState(10); // Intervalo en segundos (10 segundos por defecto para verificar datos nuevos)
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [lastDataCheck, setLastDataCheck] = useState(new Date()); // Timestamp de última verificación de datos
  const [dateRangeRefreshKey, setDateRangeRefreshKey] = useState(0); // Key to force DateRangeSelector reload
  const [activeTab, setActiveTab] = useState('monitoring');
  const [showDataModal, setShowDataModal] = useState(false);

  // Load sensor data and stats
  const loadSensorData = useCallback(async (customFilter = null, silent = false) => {
    // Don't load if sensor is not selected
    if (!selectedSensor) {
      console.warn('Cannot load data: no sensor selected');
      return;
    }
    
    if (!silent) setLoading(true);
    if (!silent) setError('');
    try {
      const filter = customFilter || dateFilter;

      // Use date filter if available, otherwise use daysBack
      let dataRes, statsRes;
      if (filter.from && filter.to) {
        // Date range filtering - fetch ALL records without limit
        dataRes = await sensorsAPI.getSensorDataByDateRange(
          selectedSensor,
          filter.from,
          filter.to,
          10000 // Very high limit to get all matching records
        );
        statsRes = await sensorsAPI.getSensorStatsByDateRange(
          selectedSensor,
          filter.from,
          filter.to
        );
      } else {
        // Legacy daysBack filtering (no date filter, use days_back)
        dataRes = await sensorsAPI.getSensorData(selectedSensor, daysBack, recordLimit);
        statsRes = await sensorsAPI.getSensorStats(selectedSensor, daysBack);
      }

      // Store ALL data
      const allData = dataRes.data.data || [];
      setAllSensorData(allData);

      // Apply record limit for display
      const limitedData = allData.slice(0, recordLimit);
      setSensorData(limitedData);

      const metrics = statsRes.data.metrics || {};
      setStats(metrics);
    } catch (err) {
      console.error('❌ Error loading data:', err);
      const isOffline = localStorage.getItem('offline_mode') === 'true';
      if (isOffline) {
        // En modo offline, mostrar mensaje amigable y datos vacíos
        if (!silent) {
          setError('Modo offline: Los datos del servidor no están disponibles. Conecta el backend para ver datos reales.');
        }
      } else {
        setError(err.response?.data?.detail || 'Failed to load sensor data');
      }
      setSensorData([]);
      setAllSensorData([]);
      setStats(null);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [selectedSensor, daysBack, dateFilter, recordLimit]);

  // Initial load
  useEffect(() => {
    loadSensorData();
  }, [loadSensorData]);

  // Auto-refresh inteligente: solo carga cuando detecta datos nuevos
  useEffect(() => {
    if (!autoRefresh || !selectedSensor) return; // Si el auto-refresh está desactivado, no hacer nada

    const intervalId = setInterval(async () => {
      try {
        console.log('🔍 Verificando datos nuevos...');
        
        // Verificar si hay datos nuevos desde la última verificación
        const lastCheckISO = lastDataCheck.toISOString();
        const checkResult = await sensorsAPI.checkNewData(selectedSensor, lastCheckISO);
        
        if (checkResult.data?.has_new_data) {
          console.log(`✅ Se detectaron ${checkResult.data.new_count} registros nuevos. Cargando datos...`);
          // Solo cargar si hay datos nuevos
          await loadSensorData(null, true);
          setLastRefresh(new Date());
        } else {
          console.log('ℹ️ No hay datos nuevos. Saltando carga para ahorrar memoria.');
        }
        
        // Actualizar timestamp de última verificación
        setLastDataCheck(new Date());
      } catch (err) {
        console.warn('⚠️ Error verificando datos nuevos (continuando en segundo plano):', err);
        // No mostrar error al usuario, solo loguear
      }
    }, refreshInterval * 1000); // Convertir segundos a milisegundos

    // Limpiar el intervalo cuando el componente se desmonte o autoRefresh cambie
    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, selectedSensor, daysBack, dateFilter, loadSensorData, lastDataCheck]);

  // Apply record limit when it changes
  useEffect(() => {
    if (allSensorData.length > 0) {
      setSensorData(allSensorData.slice(0, recordLimit));
    }
  }, [recordLimit, allSensorData]);

  const handleGeneratePreview = async (params) => {
    setPreviewLoading(true);
    setError('');
    try {
      // Handle both old format (just count) and new format (object with params)
      const requestParams = typeof params === 'number' 
        ? { count: params, days_back: daysBack }
        : params;
      
      const response = await sensorsAPI.generateDataPreview(
        selectedSensor,
        requestParams.count || 50,
        requestParams.days_back || 30,
        requestParams.date_from,
        requestParams.date_to
      );

      if (response.data.data && response.data.data.length > 0) {
        setPreviewData(response.data.data);
        setShowPreview(true);
      } else {
        setError('Failed to generate data');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handlePreviewSaved = async (recordsSaved) => {
    setShowPreview(false);
    setPreviewData([]);
    // Clear any previous errors
    setError('');
    // Wait a moment for MongoDB to process the insert
    await new Promise(resolve => setTimeout(resolve, 1500));
    // Force DateRangeSelector to reload available dates
    setDateRangeRefreshKey(prev => prev + 1);
    // Reload data from DB to show the newly saved records
    await loadSensorData();
    // Show success message
    setError(`✅ ${recordsSaved} ${t('records_saved')}`);
    // Clear success message after 5 seconds
    setTimeout(() => setError(''), 5000);
  };

  const handleClearData = async () => {
    if (!confirm(`${t('delete_all_data')} ${selectedSensor} ${t('sensor_data_question')}`)) return;
    try {
      await sensorsAPI.clearSensorData(selectedSensor);
      setSensorData([]);
      setStats(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to clear data');
    }
  };

  const handleCSVUploadComplete = async (recordsInserted) => {
    // Wait a moment for MongoDB to process
    await new Promise(resolve => setTimeout(resolve, 1500));
    // Force DateRangeSelector to reload available dates
    setDateRangeRefreshKey(prev => prev + 1);
    // Reload data
    await loadSensorData();
    setError(`✅ ${recordsInserted} ${t('records_imported')}`);
    setTimeout(() => setError(''), 5000);
  };

  const isAdmin = user?.rol === 'admin';
  const isAdminOrOperator = user?.rol === 'admin' || user?.rol === 'operador';

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />

      <main className="w-full flex gap-0">
        {/* LEFT SIDEBAR */}
        <aside className="w-72 bg-slate-800 border-r border-slate-700 px-6 py-8 overflow-y-auto">
          {/* Page Title */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">{t('sidebar_title')}</h2>
            <p className="text-xs text-slate-400">{t('controls_filters')}</p>
          </div>

          {/* Auto-Refresh Toggle */}
          <div className="mb-6 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                <span className="text-sm font-semibold text-white">
                  {autoRefresh ? t('real_time_update') : t('manual_update')}
                </span>
              </div>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  autoRefresh
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-slate-600 hover:bg-slate-500 text-slate-200'
                }`}
              >
                {autoRefresh ? t('on') : t('off')}
              </button>
            </div>
            {autoRefresh && (
              <div className="mt-2">
                <label className="text-xs text-slate-300 block mb-1">
                  {t('interval')}: {refreshInterval}s
                </label>
                <input
                  type="range"
                  min="2"
                  max="30"
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>2s</span>
                  <span>15s</span>
                  <span>30s</span>
                </div>
              </div>
            )}
            {autoRefresh && (
              <div className="text-xs text-slate-400 mt-2 space-y-1">
                <p>{t('last_update')}: {lastRefresh.toLocaleTimeString()}</p>
                <p className="text-slate-500">{t('smart_mode')}</p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-900/20 border border-red-500 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Controls - Vertical Stack */}
          <div className="space-y-6">
            <div>
              <SensorTypeSelector
                selected={selectedSensor}
                onChange={setSelectedSensor}
              />
            </div>

            {selectedSensor && (
              <div>
                <DateRangeSelector
                  sensorType={selectedSensor}
                  onDateRangeChange={(dateRange) => {
                    // Update date filter and reload data
                    const newFilter = {
                      from: dateRange.from,
                      to: dateRange.to,
                    };
                    setDateFilter(newFilter);

                    // If apply flag is set, reload data immediately
                    if (dateRange.apply) {
                      loadSensorData(newFilter);
                    }
                  }}
                  loading={loading || previewLoading}
                  key={`${selectedSensor}-${dateRangeRefreshKey}`} // Force re-render when sensor changes or data is saved
                />
              </div>
            )}

            <div>
              <RecordLimitSelector
                value={recordLimit}
                onChange={setRecordLimit}
                loading={loading || previewLoading}
              />
            </div>

            <div>
              <FileUpload
                sensorType={selectedSensor}
                onUploadComplete={handleCSVUploadComplete}
                loading={loading || previewLoading}
              />
            </div>

            <div>
              <ActionButtons
                onGeneratePreview={handleGeneratePreview}
                onClear={handleClearData}
                onRefresh={loadSensorData}
                loading={loading || previewLoading}
                isAdmin={isAdminOrOperator}
              />
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <div className="flex-1 px-6 py-8">
          {/* Page Title */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">{t('sensor_dashboard')}</h2>
            <p className="text-slate-400">{t('real_time_monitoring')}</p>
            <div className="flex flex-wrap gap-3 mt-6">
              {[
                { id: 'monitoring', labelKey: 'monitoring' },
                { id: 'predictions', labelKey: 'ml_predictions' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {t(tab.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'monitoring' && (
            <>
              {/* KPI Cards with Charts */}
              <KPICards stats={stats} sensorData={sensorData} />

              {/* Charts Section */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  </div>
                  <p className="text-slate-400 mt-4">Loading sensor data...</p>
                </div>
              ) : (
                <>
                  {/* Dynamic Charts - Changes based on sensor type */}
                  <div className="mb-8">
                    <SensorCharts data={sensorData} sensorType={selectedSensor} />
                  </div>

                  {/* Metric-Specific Dashboards */}
                  {stats && Object.keys(stats).length > 0 && (
                    <div className="mb-8 space-y-8">
                      <div>
                        <h3 className="text-2xl font-semibold text-white mb-6">Dashboards por Métrica</h3>
                        <p className="text-slate-400 mb-6">
                          Visualizaciones detalladas para cada métrica del sensor. Selecciona diferentes vistas para analizar los datos.
                        </p>
                      </div>
                      {Object.entries(stats).slice(0, 4).map(([metricKey, metricStats]) => {
                        // Map metric names to field keys
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
                        };
                        const fieldKey = metricFieldMap[metricKey.toLowerCase()] || metricKey.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '').replace('°c', 'c');
                        return (
                          <MetricDashboard
                            key={metricKey}
                            metricKey={fieldKey}
                            sensorData={sensorData}
                            stats={metricStats}
                          />
                        );
                      })}
                    </div>
                  )}

                  {/* Analytical Charts Section */}
                  <div className="mb-8 space-y-8">
                    <div>
                      <h3 className="text-2xl font-semibold text-white mb-6">Análisis Avanzado</h3>
                    </div>

                    {/* Time Series Chart */}
                    <TimeSeriesChart data={sensorData} sensorType={selectedSensor} />

                    {/* Heatmap Chart */}
                    <HeatmapChart data={sensorData} sensorType={selectedSensor} />

                    {/* Bar Comparative and Histogram - Side by Side */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <BarChartComparative data={sensorData} sensorType={selectedSensor} />
                      <HistogramChart data={sensorData} sensorType={selectedSensor} />
                    </div>
                  </div>

                  {/* Data Table Button */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-white">Registros Detallados</h3>
                      <button
                        onClick={() => setShowDataModal(true)}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-lg hover:shadow-blue-500/50"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                        Ver Datos ({allSensorData.length} registros)
                      </button>
                    </div>
                    <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 text-center">
                      <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-slate-400 mb-2">Haz clic en "Ver Datos" para ver todos los registros</p>
                      <p className="text-sm text-slate-500">Total: {allSensorData.length} registros disponibles</p>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {activeTab === 'predictions' && (
            <div className="space-y-8">
              {/* Solo Clasificación ML - todo integrado */}
              <MLWizard 
                sensorType={selectedSensor} 
                dateFilter={dateFilter}
              />
            </div>
          )}
        </div>
      </main>

      {/* Generated Data Preview Modal */}
      {showPreview && (
        <GeneratedDataPreview
          data={previewData}
          sensorType={selectedSensor}
          onSaved={handlePreviewSaved}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Sensor Data Modal */}
      {showDataModal && (
        <SensorDataModal
          data={allSensorData}
          sensorType={selectedSensor}
          isOpen={showDataModal}
          onClose={() => setShowDataModal(false)}
        />
      )}
    </div>
  );
}
