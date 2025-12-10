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

// ... (imports remain the same)

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

  // ... (Load sensor data and stats logic remains the same)
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
    <div className="min-h-screen">
      <Header />

      <main className="w-full flex gap-0 h-[calc(100vh-64px)] overflow-hidden">
        {/* LEFT SIDEBAR - Glass Effect */}
        <aside className="w-80 bg-slate-900/60 backdrop-blur-md border-r border-white/5 px-6 py-8 overflow-y-auto custom-scrollbar shadow-2xl z-10">
          {/* Page Title */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-2">{t('sidebar_title')}</h2>
            <p className="text-xs text-slate-400 font-medium tracking-wide">{t('controls_filters')}</p>
          </div>

          {/* Auto-Refresh Toggle */}
          <div className="mb-8 p-5 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-white/5 shadow-inner">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                   <div className={`w-3 h-3 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                   {autoRefresh && <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping opacity-75"></div>}
                </div>
                <span className="text-sm font-semibold text-white tracking-wide">
                  {autoRefresh ? t('real_time_update') : t('manual_update')}
                </span>
              </div>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-1 text-xs font-bold uppercase rounded-md transition-all duration-300 ${
                  autoRefresh
                    ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {autoRefresh ? t('on') : t('off')}
              </button>
            </div>
            {autoRefresh && (
              <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-xs text-slate-400 font-medium block mb-2 flex justify-between">
                  <span>{t('interval')}</span>
                  <span className="text-blue-400">{refreshInterval}s</span>
                </label>
                <input
                  type="range"
                  min="2"
                  max="30"
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>2s</span>
                  <span>15s</span>
                  <span>30s</span>
                </div>
              </div>
            )}
            {autoRefresh && (
              <div className="text-[10px] text-slate-500 mt-3 pt-3 border-t border-white/5 flex flex-col gap-1">
                <p className="flex justify-between"><span>{t('last_update')}:</span> <span className="font-mono text-slate-400">{lastRefresh.toLocaleTimeString()}</span></p>
                <p className="text-blue-500/70 italic flex items-center gap-1">
                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                   {t('smart_mode')}
                </p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm shadow-sm backdrop-blur-sm animate-in shake">
              <div className="flex gap-2 items-start">
                 <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                 <span>{error}</span>
              </div>
            </div>
          )}

          {/* Controls - Vertical Stack */}
          <div className="space-y-6">
            <div className="glass-card p-2 rounded-xl">
              <SensorTypeSelector
                selected={selectedSensor}
                onChange={setSelectedSensor}
              />
            </div>

            {selectedSensor && (
              <div className="glass-card p-4 rounded-xl">
                <DateRangeSelector
                  sensorType={selectedSensor}
                  onDateRangeChange={(dateRange) => {
                    const newFilter = { from: dateRange.from, to: dateRange.to };
                    setDateFilter(newFilter);
                    if (dateRange.apply) loadSensorData(newFilter);
                  }}
                  loading={loading || previewLoading}
                  key={`${selectedSensor}-${dateRangeRefreshKey}`}
                />
              </div>
            )}

            <div className="glass-card p-4 rounded-xl">
              <RecordLimitSelector
                value={recordLimit}
                onChange={setRecordLimit}
                loading={loading || previewLoading}
              />
            </div>

            <div className="glass-card p-4 rounded-xl">
              <FileUpload
                sensorType={selectedSensor}
                onUploadComplete={handleCSVUploadComplete}
                loading={loading || previewLoading}
              />
            </div>

            <div className="pt-4 border-t border-white/5">
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

        {/* MAIN CONTENT - Scrollable */}
        <div className="flex-1 px-8 py-8 overflow-y-auto custom-scrollbar scroll-smooth">
          {/* Page Title & Tabs */}
          <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-white/5">
             <div>
               <h2 className="text-4xl font-black text-white mb-2 tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                  {t('sensor_dashboard')}
               </h2>
               <p className="text-slate-400 font-medium text-lg">{t('real_time_monitoring')}</p>
             </div>
             
             <div className="flex p-1 bg-slate-900/50 backdrop-blur-md rounded-full border border-white/5 shadow-inner">
               {[
                 { id: 'monitoring', labelKey: 'monitoring', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                 { id: 'predictions', labelKey: 'ml_predictions', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
               ].map((tab) => (
                 <button
                   key={tab.id}
                   type="button"
                   onClick={() => setActiveTab(tab.id)}
                   className={`px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all duration-300 ${
                     activeTab === tab.id
                       ? 'bg-blue-600 shadow-lg shadow-blue-500/30 text-white scale-105'
                       : 'text-slate-400 hover:text-white hover:bg-white/5'
                   }`}
                 >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} /></svg>
                   {t(tab.labelKey)}
                 </button>
               ))}
             </div>
          </div>

          {activeTab === 'monitoring' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* KPI Cards with Charts */}
              <KPICards stats={stats} sensorData={sensorData} />

              {/* Charts Section */}
              {loading ? (
                <div className="glass-panel rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                       <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <p className="text-slate-300 mt-6 font-medium text-lg animate-pulse">Cargando datos del sensor...</p>
                </div>
              ) : (
                <>
                  {/* Dynamic Charts - Changes based on sensor type */}
                  <div className="glass-panel rounded-2xl p-6 border border-white/5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 transition-all duration-1000 group-hover:bg-blue-500/10"></div>
                    <SensorCharts data={sensorData} sensorType={selectedSensor} />
                  </div>

                  {/* Metric-Specific Dashboards */}
                  {stats && Object.keys(stats).length > 0 && (
                    <div className="space-y-8">
                      <div className="flex items-center gap-4 py-4">
                        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent flex-1"></div>
                        <h3 className="text-2xl font-bold text-white whitespace-nowrap">Dashboards por Métrica</h3>
                        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent flex-1"></div>
                      </div>
                      
                      {Object.entries(stats).slice(0, 4).map(([metricKey, metricStats]) => {
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
                           <div className="glass-panel rounded-2xl p-1 overflow-hidden transition-all hover:border-white/10" key={metricKey}>
                              <MetricDashboard
                                 metricKey={fieldKey}
                                 sensorData={sensorData}
                                 stats={metricStats}
                              />
                           </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Analytical Charts Section */}
                  <div className="space-y-8">
                     <div className="flex items-center gap-4 py-4 mt-8">
                        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent flex-1"></div>
                        <h3 className="text-2xl font-bold text-white whitespace-nowrap">Análisis Avanzado</h3>
                        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent flex-1"></div>
                     </div>

                    <div className="glass-panel p-6 rounded-2xl border border-white/5">
                       <TimeSeriesChart data={sensorData} sensorType={selectedSensor} />
                    </div>

                    <div className="glass-panel p-6 rounded-2xl border border-white/5">
                       <HeatmapChart data={sensorData} sensorType={selectedSensor} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                       <div className="glass-panel p-6 rounded-2xl border border-white/5">
                          <BarChartComparative data={sensorData} sensorType={selectedSensor} />
                       </div>
                       <div className="glass-panel p-6 rounded-2xl border border-white/5">
                          <HistogramChart data={sensorData} sensorType={selectedSensor} />
                       </div>
                    </div>
                  </div>

                  {/* Data Table Button */}
                  <div className="mt-12 mb-8">
                     <div className="glass-panel rounded-2xl p-8 text-center border border-white/10 bg-gradient-to-b from-slate-900/50 to-slate-900/80 relative overflow-hidden">
                        <div className="absolute inset-0 bg-blue-500/5 blur-3xl"></div>
                        <div className="relative z-10 flex flex-col items-center">
                           <div className="p-4 bg-white/5 rounded-full mb-4 ring-1 ring-white/10">
                              <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                           </div>
                           <h3 className="text-2xl font-bold text-white mb-2">Explora los Datos Crudos</h3>
                           <p className="text-slate-400 mb-6 max-w-lg mx-auto">
                              Accede a la tabla completa con los {allSensorData.length} registros disponibles para realizar un análisis detallado fila por fila.
                           </p>
                           
                           <button
                              onClick={() => setShowDataModal(true)}
                              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-500/30 hover:-translate-y-1 flex items-center gap-3 group"
                           >
                              <span>Ver Base de Datos Completa</span>
                              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                              </svg>
                           </button>
                           <p className="text-xs text-slate-500 mt-4 font-mono bg-slate-950/50 px-3 py-1 rounded-full border border-white/5">
                              {allSensorData.length} registros cargados en memoria
                           </p>
                        </div>
                     </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'predictions' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
