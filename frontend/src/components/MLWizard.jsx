import { useState, useEffect, useMemo } from 'react';
import { mlAPI, sensorsAPI } from '../services/api';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

const METRICS_BY_SENSOR = {
  air: [
    { value: 'co2_ppm', label: 'CO₂ (ppm)', description: 'Nivel de dióxido de carbono en el aire' },
    { value: 'temperatura_c', label: 'Temperatura (°C)', description: 'Temperatura ambiente' },
    { value: 'humedad_percent', label: 'Humedad (%)', description: 'Humedad relativa del aire' },
    { value: 'presion_hpa', label: 'Presión (hPa)', description: 'Presión atmosférica' },
  ],
  sound: [
    { value: 'laeq_db', label: 'LAeq (dB)', description: 'Nivel de sonido equivalente' },
    { value: 'lai_db', label: 'LAI (dB)', description: 'Nivel de sonido instantáneo' },
    { value: 'laimax_db', label: 'LAI Máx (dB)', description: 'Nivel máximo de sonido' },
    { value: 'bateria_percent', label: 'Batería (%)', description: 'Nivel de batería del sensor' },
  ],
  underground: [
    { value: 'distancia_mm', label: 'Distancia (mm)', description: 'Distancia medida por el sensor' },
    { value: 'bateria_percent', label: 'Batería (%)', description: 'Nivel de batería del sensor' },
  ],
};

const STEPS = [
  { 
    id: 1, 
    title: 'Verificar Datos', 
    description: 'Comprobamos que hay suficientes datos para entrenar (mínimo 50 registros)',
    tips: [
      'El sistema necesita al menos 50 registros para entrenar un modelo confiable',
      'Puedes usar un rango de fechas específico o los últimos 90 días',
      'Más datos generalmente mejoran la precisión del modelo'
    ]
  },
  { 
    id: 2, 
    title: 'Configurar Entrenamiento', 
    description: 'Selecciona la métrica que quieres predecir y el rango de fechas para entrenar',
    tips: [
      'Elige la métrica más importante para tu análisis',
      'El rango de fechas debe incluir datos representativos',
      'El modelo clasificará valores en: Normal, Warning, Critical'
    ]
  },
  { 
    id: 3, 
    title: 'Entrenar Modelo', 
    description: 'El sistema entrena automáticamente tres modelos y selecciona el mejor',
    tips: [
      'El sistema prueba: Random Forest, Logistic Regression y Decision Tree',
      'Se selecciona el modelo con mejor F1-score',
      'El entrenamiento puede tomar 5-30 segundos dependiendo de los datos'
    ]
  },
  { 
    id: 4, 
    title: 'Ver Resultados', 
    description: 'Revisa las métricas de precisión y visualizaciones del modelo entrenado',
    tips: [
      'Accuracy: Porcentaje de predicciones correctas',
      'F1-Score: Balance entre precisión y recall (métrica principal)',
      'La matriz de confusión muestra cómo clasifica cada estado'
    ]
  },
  { 
    id: 5, 
    title: 'Hacer Predicciones', 
    description: 'Usa el modelo entrenado para predecir estados en fechas específicas o períodos',
    tips: [
      'Puedes predecir por fecha específica o por rango de fechas',
      'Cada predicción incluye probabilidades para Normal, Warning y Critical',
      'La confianza indica qué tan seguro está el modelo de su predicción'
    ]
  },
];

export default function MLWizard({ sensorType, dateFilter = null }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [dataAvailable, setDataAvailable] = useState(null);
  const [dataStats, setDataStats] = useState(null);
  const [checkingData, setCheckingData] = useState(false);
  
  const [selectedMetric, setSelectedMetric] = useState('');
  const [selectedSensorName, setSelectedSensorName] = useState(''); // Sensor específico (EMS-6993, etc.)
  const [availableSensorNames, setAvailableSensorNames] = useState([]);
  const [loadingSensorNames, setLoadingSensorNames] = useState(false);
  const [trainingDateFrom, setTrainingDateFrom] = useState('');
  const [trainingDateTo, setTrainingDateTo] = useState('');
  const [useDateFilter, setUseDateFilter] = useState(true);
  
  const [training, setTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState('');
  const [trainedModel, setTrainedModel] = useState(null);
  const [modelMetrics, setModelMetrics] = useState(null);
  const [visualizations, setVisualizations] = useState(null);
  const [availableModels, setAvailableModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);
  
  const [predictionMode, setPredictionMode] = useState('date'); // 'date' or 'month'
  const [predictionDate, setPredictionDate] = useState('');
  const [predictionMonth, setPredictionMonth] = useState(''); // Format: YYYY-MM
  const [predictions, setPredictions] = useState(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [regressionMode, setRegressionMode] = useState(true); // Mostrar valores numéricos
  const [selectedClassFilter, setSelectedClassFilter] = useState(null); // null = todas las clases, 'normal' | 'warning' | 'critical'
  
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const availableMetrics = METRICS_BY_SENSOR[sensorType] || [];

  // Inicializar métrica por defecto
  useEffect(() => {
    if (availableMetrics.length > 0 && !selectedMetric) {
      setSelectedMetric(availableMetrics[0].value);
    }
  }, [sensorType, availableMetrics.length]);

  // Inicializar fechas desde dateFilter
  useEffect(() => {
    if (dateFilter?.from && dateFilter?.to) {
      setTrainingDateFrom(dateFilter.from);
      setTrainingDateTo(dateFilter.to);
    }
  }, [dateFilter]);

  // Cargar lista de sensores disponibles
  useEffect(() => {
    loadSensorNames();
  }, [sensorType]);

  const loadSensorNames = async () => {
    setLoadingSensorNames(true);
    try {
      const response = await sensorsAPI.getSensorNames(sensorType);
      const names = response.data.sensor_names || [];
      setAvailableSensorNames(names);
      // Si hay sensores disponibles y no hay uno seleccionado, no seleccionar automáticamente
      // El usuario puede elegir "Todos" o un sensor específico
    } catch (err) {
      console.error('Error loading sensor names:', err);
      setAvailableSensorNames([]);
    } finally {
      setLoadingSensorNames(false);
    }
  };

  // Cargar modelos disponibles
  useEffect(() => {
    loadAvailableModels();
  }, [sensorType, selectedMetric]);

  const loadAvailableModels = async () => {
    setLoadingModels(true);
    try {
      const response = await mlAPI.listModels();
      const models = response.data.models || [];
      // Filtrar modelos del sensor y métrica actual
      const relevantModels = models.filter(m => {
        const modelKey = m.model_key || '';
        return modelKey.startsWith(`${sensorType}_`) && 
               (selectedMetric ? modelKey.includes(`_${selectedMetric}_`) : true);
      });
      setAvailableModels(relevantModels);
      
      // Si hay un modelo para la métrica seleccionada, cargarlo automáticamente
      if (selectedMetric && relevantModels.length > 0) {
        const modelForMetric = relevantModels.find(m => 
          m.model_key.includes(`_${selectedMetric}_`)
        );
        if (modelForMetric && modelForMetric.has_metrics) {
          setTrainedModel(modelForMetric.model_key);
          loadModelData(modelForMetric.model_key);
        }
      }
    } catch (err) {
      console.error('Error loading models:', err);
    } finally {
      setLoadingModels(false);
    }
  };

  const loadModelData = async (modelKey) => {
    try {
      const metricsResponse = await mlAPI.getMetrics(modelKey);
      setModelMetrics(metricsResponse.data.metrics);
      
      const vizResponse = await mlAPI.getVisualizations(modelKey);
      setVisualizations(vizResponse.data.visualizations);
    } catch (err) {
      console.error('Error loading model data:', err);
    }
  };

  // Paso 1: Verificar datos
  const checkDataAvailability = async () => {
    setCheckingData(true);
    setError('');
    setInfo('');
    
    try {
      const dateFrom = useDateFilter && trainingDateFrom ? trainingDateFrom : null;
      const dateTo = useDateFilter && trainingDateTo ? trainingDateTo : null;
      
      let response;
      if (dateFrom && dateTo) {
        response = await sensorsAPI.getSensorStatsByDateRange(
          sensorType, 
          dateFrom, 
          dateTo,
          selectedSensorName || null
        );
      } else {
        response = await sensorsAPI.getSensorStats(
          sensorType, 
          90, 
          null, 
          selectedSensorName || null
        );
      }
      
      const stats = response.data.metrics || {};
      setDataStats(stats);
      
      // Verificar si hay suficientes datos (mínimo 50 registros)
      // Support both new format (_metadata) and old format (direct key)
      const totalRecords = stats._metadata?.count || stats.count || 0;
      
      if (totalRecords === 0) {
        // Si no hay datos, no mostrar error, solo indicar que no hay datos
        setDataAvailable(false);
        setError('');
        setInfo('ℹ️ No se encontraron datos para este sensor y rango de fechas. Por favor, carga datos o selecciona un rango diferente.');
      } else if (totalRecords < 50) {
        setDataAvailable(false);
        setError(`⚠️ Datos insuficientes: Solo se encontraron ${totalRecords} registros. Se necesitan al menos 50 registros para entrenar un modelo. Por favor, carga más datos o selecciona un rango de fechas diferente.`);
      } else {
        setDataAvailable(true);
        setInfo(`✅ Se encontraron ${totalRecords} registros. Suficientes para entrenar el modelo.`);
      }
    } catch (err) {
      setDataAvailable(false);
      setError(err.response?.data?.detail || 'Error verificando datos. Asegúrate de que hay datos disponibles para este sensor.');
      console.error('Error checking data:', err);
    } finally {
      setCheckingData(false);
    }
  };

  // Avanzar al siguiente paso
  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
      setError('');
      setInfo('');
    }
  };

  // Retroceder al paso anterior
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError('');
      setInfo('');
    }
  };

  // Ir a un paso específico
  const goToStep = (step) => {
    if (step >= 1 && step <= STEPS.length) {
      setCurrentStep(step);
      setError('');
      setInfo('');
    }
  };

  // Paso 3: Entrenar modelo
  const trainModel = async () => {
    if (!selectedMetric) {
      setError('Por favor selecciona una métrica');
      return;
    }

    setTraining(true);
    setError('');
    setInfo('');
    setTrainingProgress('Iniciando entrenamiento...');
    
    try {
      // Usar los mismos parámetros que se usaron en la verificación de datos
      const dateFrom = useDateFilter && trainingDateFrom ? trainingDateFrom : null;
      const dateTo = useDateFilter && trainingDateTo ? trainingDateTo : null;

      setTrainingProgress('Cargando datos históricos...');
      
      const response = await mlAPI.trainModel(sensorType, selectedMetric, {
        dateFrom,
        dateTo,
        daysBack: dateFrom && dateTo ? 90 : 365, // Si hay fechas específicas, usar menos días; si no, usar más
        limit: 10000, // Aumentar límite para tener más datos
        modelType: 'auto',
      });

      setTrainingProgress('Entrenamiento completado!');
      
      const modelKey = response.data.model_key;
      setTrainedModel(modelKey);
      setModelMetrics(response.data.metrics);
      
      // Cargar visualizaciones
      setTrainingProgress('Generando visualizaciones...');
      const vizResponse = await mlAPI.getVisualizations(modelKey);
      setVisualizations(vizResponse.data.visualizations);
      
      // Recargar lista de modelos
      await loadAvailableModels();
      
      setInfo('✅ Modelo entrenado exitosamente!');
      // Avanzar automáticamente al paso 4 (Ver Resultados) después de entrenar
      setTimeout(() => {
        nextStep(); // Avanzar al paso 4
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error entrenando modelo. Verifica que hay suficientes datos y que la métrica seleccionada existe.');
      console.error('Error training model:', err);
    } finally {
      setTraining(false);
      setTrainingProgress('');
    }
  };

  // Paso 5: Hacer predicción (regresión - valores numéricos)
  const makePrediction = async () => {
    if (!trainedModel) {
      setError('Por favor entrena un modelo primero');
      return;
    }

    setLoadingPrediction(true);
    setError('');
    setInfo('');
    setSelectedClassFilter(null); // Limpiar filtro al hacer nueva predicción
    
    try {
      let response;
      
      if (regressionMode) {
        // Usar predicción de regresión (valores numéricos)
        response = await mlAPI.predictRegression(sensorType, selectedMetric, {
          predictionDate: predictionMode === 'date' ? predictionDate : null,
          predictionMonth: predictionMode === 'month' ? predictionMonth : null,
          modelKey: trainedModel
        });
      } else {
        // Predicción de clasificación (clases)
        if (predictionMode === 'date' && predictionDate) {
          response = await mlAPI.predictByDate(sensorType, selectedMetric, predictionDate, trainedModel);
        } else {
          setError('Por favor completa los campos de predicción');
          return;
        }
      }

      setPredictions(response.data);
      setInfo('✅ Predicción generada exitosamente!');
    } catch (err) {
      setError(err.response?.data?.detail || 'Error generando predicción');
      console.error('Error making prediction:', err);
    } finally {
      setLoadingPrediction(false);
    }
  };

  return (
    <section className="bg-slate-800 rounded-2xl border border-slate-700 shadow-lg p-6">
      {/* Header */}
      <div className="mb-8">
        <h3 className="text-3xl font-bold text-white mb-2">🎯 Asistente de Machine Learning</h3>
        <p className="text-slate-400">
          Sigue estos pasos para entrenar y usar modelos de clasificación ML de forma sencilla
        </p>
      </div>

      {/* Indicador de Pasos */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <button
                  onClick={() => goToStep(step.id)}
                  disabled={step.id > currentStep}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    step.id < currentStep
                      ? 'bg-green-600 text-white'
                      : step.id === currentStep
                      ? 'bg-blue-600 text-white ring-4 ring-blue-300'
                      : 'bg-slate-700 text-slate-400'
                  } ${step.id <= currentStep ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed'}`}
                >
                  {step.id < currentStep ? '✓' : step.id}
                </button>
                <p className={`text-xs mt-2 text-center ${step.id === currentStep ? 'text-white font-semibold' : 'text-slate-400'}`}>
                  {step.title}
                </p>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-1 mx-2 ${step.id < currentStep ? 'bg-green-600' : 'bg-slate-700'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contenido del Paso Actual */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-700 p-6 mb-6">
        <div className="mb-6">
          <h4 className="text-xl font-semibold text-white mb-2">
            Paso {currentStep}: {STEPS[currentStep - 1].title}
          </h4>
          <p className="text-sm text-slate-400 mb-4">{STEPS[currentStep - 1].description}</p>
          
          {/* Tips Section */}
          {STEPS[currentStep - 1].tips && (
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 mt-4">
              <p className="text-sm font-semibold text-blue-300 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Consejos útiles:
              </p>
              <ul className="text-sm text-blue-200 space-y-1 ml-6 list-disc">
                {STEPS[currentStep - 1].tips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Paso 1: Verificar Datos */}
        {currentStep === 1 && (
          <div>
            {/* Selector de Sensor Específico */}
            <div className="mb-6">
              <label className="text-sm text-slate-400 mb-2 block">
                Seleccionar Sensor Específico (Opcional)
              </label>
              {loadingSensorNames ? (
                <div className="text-slate-400 text-sm">Cargando sensores...</div>
              ) : (
                <select
                  value={selectedSensorName}
                  onChange={(e) => setSelectedSensorName(e.target.value)}
                  className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 border border-slate-600 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Todos los sensores ({availableSensorNames.length} disponibles)</option>
                  {availableSensorNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              )}
              {selectedSensorName && (
                <p className="text-xs text-blue-400 mt-2">
                  ✓ Filtrando datos para: <strong>{selectedSensorName}</strong>
                </p>
              )}
              {!selectedSensorName && availableSensorNames.length > 0 && (
                <p className="text-xs text-slate-500 mt-2">
                  Mostrando datos de todos los sensores. Selecciona uno específico para filtrar.
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={useDateFilter}
                  onChange={(e) => setUseDateFilter(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-white">Usar rango de fechas específico</span>
              </label>
              
              {useDateFilter && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Desde (YYYY-MM-DD)</label>
                    <input
                      type="date"
                      value={trainingDateFrom}
                      onChange={(e) => setTrainingDateFrom(e.target.value)}
                      className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 border border-slate-600"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Hasta (YYYY-MM-DD)</label>
                    <input
                      type="date"
                      value={trainingDateTo}
                      onChange={(e) => setTrainingDateTo(e.target.value)}
                      className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 border border-slate-600"
                    />
                  </div>
                </div>
              )}
              
              {!useDateFilter && (
                <p className="text-sm text-slate-400 mt-2">
                  Se usarán los últimos 90 días de datos disponibles
                </p>
              )}
            </div>

            <button
              onClick={checkDataAvailability}
              disabled={checkingData}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {checkingData ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Verificando datos...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Verificar Datos Disponibles</span>
                </>
              )}
            </button>

            {dataStats && (
              <div className="mt-4 p-4 bg-slate-800 rounded-lg">
                <p className="text-sm text-slate-400 mb-2">Estadísticas de datos:</p>
                <ul className="text-sm text-white space-y-1">
                  <li>Total de registros: <span className="font-semibold">{dataStats.count || 0}</span></li>
                  {dataStats.min_date && (
                    <li>Fecha más antigua: <span className="font-semibold">{dataStats.min_date.split('T')[0]}</span></li>
                  )}
                  {dataStats.max_date && (
                    <li>Fecha más reciente: <span className="font-semibold">{dataStats.max_date.split('T')[0]}</span></li>
                  )}
                </ul>
                {dataAvailable && (
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <p className="text-xs text-green-400">
                      ✅ Los datos son suficientes para entrenar un modelo de Machine Learning
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Paso 2: Configurar Entrenamiento */}
        {currentStep === 2 && (
          <div>
            {!dataAvailable && (
              <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                <p className="text-yellow-300 text-sm">
                  ⚠️ Asegúrate de haber verificado los datos en el paso anterior. Si no hay suficientes datos, el entrenamiento fallará.
                </p>
              </div>
            )}
            
            <div className="mb-6">
              <label className="text-sm text-slate-400 mb-2 block">Selecciona la métrica a predecir</label>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 border border-slate-600 focus:outline-none focus:border-blue-500"
              >
                {availableMetrics.map((metric) => (
                  <option key={metric.value} value={metric.value}>
                    {metric.label} - {metric.description}
                  </option>
                ))}
              </select>
              {selectedMetric && (
                <p className="text-xs text-slate-500 mt-2">
                  Métrica seleccionada: <span className="text-slate-300">{availableMetrics.find(m => m.value === selectedMetric)?.label}</span>
                </p>
              )}
            </div>

            <div className="mb-6">
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={useDateFilter}
                  onChange={(e) => setUseDateFilter(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-white">Usar rango de fechas específico para entrenamiento</span>
              </label>
              
              {useDateFilter && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Desde (YYYY-MM-DD)</label>
                    <input
                      type="date"
                      value={trainingDateFrom}
                      onChange={(e) => setTrainingDateFrom(e.target.value)}
                      className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 border border-slate-600"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Hasta (YYYY-MM-DD)</label>
                    <input
                      type="date"
                      value={trainingDateTo}
                      onChange={(e) => setTrainingDateTo(e.target.value)}
                      className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 border border-slate-600"
                    />
                  </div>
                </div>
              )}
              
              {!useDateFilter && (
                <p className="text-sm text-slate-400 mt-2">
                  Se usarán los últimos 90 días de datos disponibles
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                <p className="text-sm text-blue-300 mb-3">
                  <strong>💡 Información:</strong> El modelo clasificará los valores en tres estados:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-green-900/20 border border-green-700 rounded p-3">
                    <p className="text-green-300 font-semibold text-sm mb-1">✅ Normal</p>
                    <p className="text-green-200 text-xs">Valores dentro del rango aceptable y seguro</p>
                  </div>
                  <div className="bg-yellow-900/20 border border-yellow-700 rounded p-3">
                    <p className="text-yellow-300 font-semibold text-sm mb-1">⚠️ Warning</p>
                    <p className="text-yellow-200 text-xs">Valores que requieren atención y monitoreo</p>
                  </div>
                  <div className="bg-red-900/20 border border-red-700 rounded p-3">
                    <p className="text-red-300 font-semibold text-sm mb-1">🚨 Critical</p>
                    <p className="text-red-200 text-xs">Valores críticos que requieren acción inmediata</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <p className="text-sm text-slate-300 mb-2">
                  <strong className="text-white">Umbrales de clasificación para {availableMetrics.find(m => m.value === selectedMetric)?.label}:</strong>
                </p>
                {selectedMetric === 'co2_ppm' && (
                  <ul className="text-xs text-slate-400 space-y-1 ml-4">
                    <li>• Normal: ≤ 800 ppm</li>
                    <li>• Warning: 800-1000 ppm</li>
                    <li>• Critical: &gt; 1000 ppm</li>
                  </ul>
                )}
                {selectedMetric === 'temperatura_c' && (
                  <ul className="text-xs text-slate-400 space-y-1 ml-4">
                    <li>• Normal: 5-35°C</li>
                    <li>• Warning: 0-5°C o 35-40°C</li>
                    <li>• Critical: &lt; 0°C o &gt; 40°C</li>
                  </ul>
                )}
                {selectedMetric === 'humedad_percent' && (
                  <ul className="text-xs text-slate-400 space-y-1 ml-4">
                    <li>• Normal: 30-70%</li>
                    <li>• Warning: 20-30% o 70-80%</li>
                    <li>• Critical: &lt; 20% o &gt; 80%</li>
                  </ul>
                )}
                {selectedMetric === 'laeq_db' && (
                  <ul className="text-xs text-slate-400 space-y-1 ml-4">
                    <li>• Normal: ≤ 65 dB</li>
                    <li>• Warning: 65-75 dB</li>
                    <li>• Critical: &gt; 75 dB</li>
                  </ul>
                )}
                {selectedMetric === 'distancia_mm' && (
                  <ul className="text-xs text-slate-400 space-y-1 ml-4">
                    <li>• Normal: 50-500 mm</li>
                    <li>• Warning: 20-50 mm o 500-1000 mm</li>
                    <li>• Critical: &lt; 20 mm o &gt; 1000 mm</li>
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Paso 3: Entrenar Modelo */}
        {currentStep === 3 && (
          <div>
            <div className="mb-6">
              <div className="bg-slate-800 rounded-lg p-4 mb-4">
                <p className="text-white mb-2">
                  <strong>Métrica seleccionada:</strong> {availableMetrics.find(m => m.value === selectedMetric)?.label || selectedMetric}
                </p>
                {selectedMetric && (
                  <p className="text-slate-300 text-sm">
                    {availableMetrics.find(m => m.value === selectedMetric)?.description}
                  </p>
                )}
              </div>
              
              <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-4 border border-blue-700/50">
                <p className="text-slate-300 text-sm mb-3">
                  <strong className="text-white">¿Cómo funciona el entrenamiento?</strong>
                </p>
                <ul className="text-slate-300 text-sm space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">1.</span>
                    <span>El sistema carga los datos históricos y los prepara automáticamente</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">2.</span>
                    <span>Entrena tres algoritmos diferentes: Random Forest, Logistic Regression y Decision Tree</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">3.</span>
                    <span>Evalúa cada modelo usando métricas de precisión (Accuracy, F1-Score, etc.)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">4.</span>
                    <span>Selecciona automáticamente el modelo con mejor rendimiento (mayor F1-Score)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">5.</span>
                    <span>Guarda el modelo para usarlo en predicciones futuras</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Modelos disponibles */}
            {availableModels.length > 0 && (
              <div className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
                <p className="text-sm text-slate-400 mb-3">Modelos ya entrenados para esta métrica:</p>
                <div className="space-y-2">
                  {availableModels
                    .filter(m => m.model_key.includes(`_${selectedMetric}_`))
                    .map((model) => (
                      <div key={model.model_key} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                        <div className="flex-1">
                          <p className="text-white text-sm font-semibold">{model.model_key}</p>
                          {model.metrics && (
                            <div className="flex gap-4 mt-1">
                              <p className="text-xs text-slate-400">
                                Accuracy: <span className="text-green-400">{(model.metrics.accuracy * 100).toFixed(1)}%</span>
                              </p>
                              <p className="text-xs text-slate-400">
                                F1-Score: <span className="text-blue-400">{(model.metrics.f1_score * 100).toFixed(1)}%</span>
                              </p>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setTrainedModel(model.model_key);
                            loadModelData(model.model_key);
                            setInfo('✅ Modelo cargado exitosamente');
                            setTimeout(() => nextStep(), 500);
                          }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-all ml-3"
                        >
                          Usar este modelo
                        </button>
                      </div>
                    ))}
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  💡 Puedes usar un modelo existente o entrenar uno nuevo con datos actualizados
                </p>
              </div>
            )}

            {training && (
              <div className="mb-6 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                <p className="text-blue-300 mb-2">{trainingProgress}</p>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
            )}

            <button
              onClick={trainModel}
              disabled={training || !selectedMetric}
              className="w-full px-6 py-3 bg-green-600 hover:bg-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {training ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Entrenando modelo...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Iniciar Entrenamiento</span>
                </>
              )}
            </button>
            
            {!selectedMetric && (
              <p className="text-xs text-slate-500 mt-2 text-center">
                Por favor selecciona una métrica en el paso anterior
              </p>
            )}
          </div>
        )}

        {/* Paso 4: Ver Resultados */}
        {currentStep === 4 && (
          <div>
            {modelMetrics ? (
              <>
                <div className="mb-6">
                  <h5 className="text-lg font-semibold text-white mb-4">Métricas del Modelo (Clasificación)</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-800 p-4 rounded-lg">
                      <p className="text-xs text-slate-400 uppercase">Accuracy</p>
                      <p className="text-2xl font-bold text-white">{(modelMetrics.accuracy * 100).toFixed(1)}%</p>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-lg">
                      <p className="text-xs text-slate-400 uppercase">Precision</p>
                      <p className="text-2xl font-bold text-white">{(modelMetrics.precision * 100).toFixed(1)}%</p>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-lg">
                      <p className="text-xs text-slate-400 uppercase">Recall</p>
                      <p className="text-2xl font-bold text-white">{(modelMetrics.recall * 100).toFixed(1)}%</p>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-lg">
                      <p className="text-xs text-slate-400 uppercase">F1-Score</p>
                      <p className="text-2xl font-bold text-white">{(modelMetrics.f1_score * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                </div>

                {/* Métricas de Regresión Lineal */}
                {(modelMetrics.r2_score !== null && modelMetrics.r2_score !== undefined) || 
                 (modelMetrics.rmse !== null && modelMetrics.rmse !== undefined) || 
                 (modelMetrics.mae !== null && modelMetrics.mae !== undefined) ? (
                  <div className="mb-6">
                    <h5 className="text-lg font-semibold text-white mb-4">Métricas de Regresión Lineal</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {modelMetrics.r2_score !== null && modelMetrics.r2_score !== undefined && (
                        <div className="bg-blue-900/20 border border-blue-700 p-4 rounded-lg">
                          <p className="text-xs text-blue-300 uppercase mb-1">R-Squared (R²)</p>
                          <p className="text-2xl font-bold text-blue-400">
                            {modelMetrics.r2_score >= 0 ? modelMetrics.r2_score.toFixed(4) : 'N/A'}
                          </p>
                          <p className="text-xs text-blue-200 mt-2">
                            Coeficiente de Determinación: {modelMetrics.r2_score >= 0 ? (modelMetrics.r2_score * 100).toFixed(2) : 'N/A'}%
                          </p>
                        </div>
                      )}
                      {modelMetrics.rmse !== null && modelMetrics.rmse !== undefined && (
                        <div className="bg-orange-900/20 border border-orange-700 p-4 rounded-lg">
                          <p className="text-xs text-orange-300 uppercase mb-1">RMSE</p>
                          <p className="text-2xl font-bold text-orange-400">
                            {modelMetrics.rmse.toFixed(4)}
                          </p>
                          <p className="text-xs text-orange-200 mt-2">
                            Root Mean Squared Error
                          </p>
                        </div>
                      )}
                      {modelMetrics.mae !== null && modelMetrics.mae !== undefined && (
                        <div className="bg-purple-900/20 border border-purple-700 p-4 rounded-lg">
                          <p className="text-xs text-purple-300 uppercase mb-1">MAE</p>
                          <p className="text-2xl font-bold text-purple-400">
                            {modelMetrics.mae.toFixed(4)}
                          </p>
                          <p className="text-xs text-purple-200 mt-2">
                            Mean Absolute Error
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {visualizations && (
                  <div className="mb-6">
                    <h5 className="text-lg font-semibold text-white mb-4">Visualizaciones</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {visualizations.confusion_matrix && (
                        <div>
                          <p className="text-sm text-slate-400 mb-2">Matriz de Confusión</p>
                          <img 
                            src={`data:image/png;base64,${visualizations.confusion_matrix}`} 
                            alt="Matriz de Confusión"
                            className="w-full rounded-lg border border-slate-700"
                          />
                        </div>
                      )}
                      {visualizations.class_distribution && (
                        <div>
                          <p className="text-sm text-slate-400 mb-2">Distribución de Clases</p>
                          <img 
                            src={`data:image/png;base64,${visualizations.class_distribution}`} 
                            alt="Distribución de Clases"
                            className="w-full rounded-lg border border-slate-700"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                    <p className="text-green-300 text-sm font-semibold mb-2">
                      ✅ Modelo entrenado exitosamente!
                    </p>
                    <p className="text-green-200 text-xs mb-4">
                      El modelo está listo para hacer predicciones de regresión (valores numéricos). 
                      Avanza al siguiente paso para generar predicciones.
                    </p>
                    <button
                      onClick={() => nextStep()}
                      className="w-full px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <span>Ir a Predicciones de Regresión →</span>
                    </button>
                  </div>
                  
                  {modelMetrics && (
                    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                      <p className="text-sm text-slate-300 mb-3">
                        <strong className="text-white">Interpretación de métricas:</strong>
                      </p>
                      <div className="space-y-4">
                        {/* Métricas de Clasificación */}
                        <div>
                          <p className="text-xs text-slate-400 mb-2 uppercase font-semibold">Métricas de Clasificación:</p>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <p className="text-slate-400">Accuracy: {(modelMetrics.accuracy * 100).toFixed(1)}%</p>
                              <p className="text-slate-500 text-xs mt-1">Porcentaje de predicciones correctas</p>
                            </div>
                            <div>
                              <p className="text-slate-400">F1-Score: {(modelMetrics.f1_score * 100).toFixed(1)}%</p>
                              <p className="text-slate-500 text-xs mt-1">Balance entre precisión y recall (métrica principal)</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Precision: {(modelMetrics.precision * 100).toFixed(1)}%</p>
                              <p className="text-slate-500 text-xs mt-1">De las predicciones positivas, cuántas son correctas</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Recall: {(modelMetrics.recall * 100).toFixed(1)}%</p>
                              <p className="text-slate-500 text-xs mt-1">De los casos reales, cuántos detectó correctamente</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Métricas de Regresión */}
                        {((modelMetrics.r2_score !== null && modelMetrics.r2_score !== undefined) || 
                          (modelMetrics.rmse !== null && modelMetrics.rmse !== undefined) || 
                          (modelMetrics.mae !== null && modelMetrics.mae !== undefined)) && (
                          <div>
                            <p className="text-xs text-slate-400 mb-2 uppercase font-semibold">Métricas de Regresión Lineal:</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                              {modelMetrics.r2_score !== null && modelMetrics.r2_score !== undefined && (
                                <div>
                                  <p className="text-blue-400">R-Squared (R²): {modelMetrics.r2_score >= 0 ? modelMetrics.r2_score.toFixed(4) : 'N/A'}</p>
                                  <p className="text-slate-500 text-xs mt-1">
                                    Proporción de varianza explicada. Valor ideal cercano a 1. 
                                    {modelMetrics.r2_score >= 0 ? ` ${(modelMetrics.r2_score * 100).toFixed(2)}% de la varianza es explicada por el modelo.` : ''}
                                  </p>
                                </div>
                              )}
                              {modelMetrics.rmse !== null && modelMetrics.rmse !== undefined && (
                                <div>
                                  <p className="text-orange-400">RMSE: {modelMetrics.rmse.toFixed(4)}</p>
                                  <p className="text-slate-500 text-xs mt-1">
                                    Raíz del Error Cuadrático Medio. Mide qué tan cerca están las predicciones de los valores reales. 
                                    Un valor más bajo indica mejor rendimiento.
                                  </p>
                                </div>
                              )}
                              {modelMetrics.mae !== null && modelMetrics.mae !== undefined && (
                                <div>
                                  <p className="text-purple-400">MAE: {modelMetrics.mae.toFixed(4)}</p>
                                  <p className="text-slate-500 text-xs mt-1">
                                    Error Absoluto Medio. Magnitud promedio de los errores. 
                                    Menos sensible a valores atípicos que RMSE.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-400 mb-4">No hay resultados disponibles. Por favor, entrena un modelo primero.</p>
                <button
                  onClick={() => goToStep(3)}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
                >
                  Ir a Entrenar Modelo
                </button>
              </div>
            )}
          </div>
        )}

        {/* Paso 5: Predicciones de Regresión - Todo Integrado */}
        {currentStep === 5 && (
          <div>
            {/* Selector Rápido: Modelo y Métrica para Predicciones Directas - Siempre visible */}
            <div className="mb-6 bg-slate-800 rounded-lg p-4 border border-slate-700">
              <h5 className="text-lg font-semibold text-white mb-2">Predicciones Rápidas</h5>
              <p className="text-xs text-slate-400 mb-4">
                Elige un modelo ML ya entrenado y la métrica para hacer predicciones directamente.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Modelo ML Entrenado</label>
                  <select
                    value={trainedModel || ''}
                    onChange={(e) => {
                      const modelKey = e.target.value;
                      if (modelKey) {
                        setTrainedModel(modelKey);
                        // Extraer métrica del nombre del modelo (formato: sensor_metric_model)
                        // Ejemplo: air_co2_ppm_random_forest -> co2_ppm
                        const parts = modelKey.split('_');
                        if (parts.length >= 3) {
                          // Intentar encontrar la métrica en el nombre del modelo
                          const possibleMetrics = availableMetrics.map(m => m.value);
                          // Probar diferentes combinaciones
                          for (let i = 1; i < parts.length - 1; i++) {
                            const testMetric = parts.slice(1, i + 1).join('_');
                            if (possibleMetrics.includes(testMetric)) {
                              setSelectedMetric(testMetric);
                              break;
                            }
                          }
                          // Si no se encontró, intentar con el segundo y tercer elemento
                          if (parts.length >= 4) {
                            const altMetric = parts[1] + '_' + parts[2];
                            if (possibleMetrics.includes(altMetric)) {
                              setSelectedMetric(altMetric);
                            }
                          }
                        }
                        loadModelData(modelKey);
                      } else {
                        setTrainedModel(null);
                        setModelMetrics(null);
                        setVisualizations(null);
                        setPredictions(null);
                      }
                    }}
                    className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 border border-slate-600"
                  >
                    <option value="">Seleccionar modelo entrenado...</option>
                    {availableModels.length === 0 && (
                      <option value="" disabled>No hay modelos entrenados. Entrena uno primero.</option>
                    )}
                    {availableModels.map((model) => (
                      <option key={model.model_key} value={model.model_key}>
                        {model.model_key} {model.metrics ? `(Accuracy: ${(model.metrics.accuracy * 100).toFixed(1)}%)` : ''}
                      </option>
                    ))}
                  </select>
                  {availableModels.length === 0 && (
                    <p className="text-xs text-yellow-400 mt-2">
                      No hay modelos entrenados para este sensor. Ve a los pasos anteriores para entrenar uno.
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Métrica</label>
                  <select
                    value={selectedMetric}
                    onChange={(e) => setSelectedMetric(e.target.value)}
                    className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 border border-slate-600"
                    disabled={!trainedModel}
                  >
                    {availableMetrics.map((metric) => (
                      <option key={metric.value} value={metric.value}>
                        {metric.label}
                      </option>
                    ))}
                  </select>
                  {!trainedModel && (
                    <p className="text-xs text-slate-500 mt-2">Selecciona un modelo primero</p>
                  )}
                </div>
              </div>
            </div>

            {trainedModel ? (
              <>
                {/* Resumen: Modelo, Métrica y Métricas - Todo en una sección integrada */}
                <div className="mb-6 bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl border border-slate-700 p-6">
                  <h5 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Información del Modelo y Métricas
                  </h5>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* Modelo ML */}
                    <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-700">
                      <p className="text-xs text-slate-400 mb-1">Modelo ML</p>
                      <p className="text-white font-semibold text-sm break-all">{trainedModel}</p>
                    </div>
                    
                    {/* Métrica */}
                    <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-700">
                      <p className="text-xs text-slate-400 mb-1">Métrica</p>
                      <p className="text-white font-semibold text-sm">
                        {availableMetrics.find(m => m.value === selectedMetric)?.label || selectedMetric}
                      </p>
                    </div>

                    {/* Tipo de Modelo */}
                    {modelMetrics && (
                      <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-700">
                        <p className="text-xs text-slate-400 mb-1">Tipo de Modelo</p>
                        <p className="text-white font-semibold text-sm capitalize">
                          {trainedModel.split('_').pop()?.replace('forest', 'Forest') || 'ML'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Métricas del Modelo - Integradas */}
                  {modelMetrics && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-700">
                      <div className="text-center">
                        <p className="text-xs text-slate-400 mb-1">Accuracy</p>
                        <p className="text-2xl font-bold text-white">{(modelMetrics.accuracy * 100).toFixed(1)}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-400 mb-1">Precision</p>
                        <p className="text-2xl font-bold text-white">{(modelMetrics.precision * 100).toFixed(1)}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-400 mb-1">Recall</p>
                        <p className="text-2xl font-bold text-white">{(modelMetrics.recall * 100).toFixed(1)}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-400 mb-1">F1-Score</p>
                        <p className="text-2xl font-bold text-blue-400">{(modelMetrics.f1_score * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Configuración de Predicción de Regresión */}
                <div className="mb-6 bg-slate-800 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h5 className="text-lg font-semibold text-white mb-1">Predicciones de Regresión</h5>
                      <p className="text-xs text-slate-400">
                        Genera valores numéricos usando el modelo de clasificación ML. Las clases (normal, warning, critical) se convierten a valores numéricos basados en datos históricos.
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-sm text-slate-400 mb-2 block">Modo de Predicción</label>
                      <select
                        value={predictionMode}
                        onChange={(e) => setPredictionMode(e.target.value)}
                        className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 border border-slate-600"
                      >
                        <option value="date">Por Fecha Específica</option>
                        <option value="month">Por Mes Completo</option>
                      </select>
                    </div>

                    {predictionMode === 'date' && (
                      <div>
                        <label className="text-sm text-slate-400 mb-2 block">Fecha (YYYY-MM-DD)</label>
                        <input
                          type="date"
                          value={predictionDate}
                          onChange={(e) => setPredictionDate(e.target.value)}
                          className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 border border-slate-600"
                        />
                      </div>
                    )}

                    {predictionMode === 'month' && (
                      <div>
                        <label className="text-sm text-slate-400 mb-2 block">Mes (YYYY-MM)</label>
                        <input
                          type="month"
                          value={predictionMonth}
                          onChange={(e) => setPredictionMonth(e.target.value)}
                          className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 border border-slate-600"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={makePrediction}
                    disabled={loadingPrediction || (predictionMode === 'date' && !predictionDate) || (predictionMode === 'month' && !predictionMonth)}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    {loadingPrediction ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Generando predicción...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>Generar Predicción de Regresión</span>
                      </>
                    )}
                  </button>
                </div>

                {predictions && (
                  <>
                    {/* Dashboard de Predicciones con Gráficos */}
                    <div className="mb-6 bg-slate-800 rounded-lg p-4 border border-slate-700">
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="text-lg font-semibold text-white">Dashboard de Predicciones</h5>
                        <button
                          onClick={makePrediction}
                          disabled={loadingPrediction}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white text-sm rounded-lg transition-all flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Recalcular
                        </button>
                      </div>
                      
                      {/* Resumen de Predicciones */}
                      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-700">
                          <p className="text-xs text-slate-400 mb-1">
                            {predictionMode === 'date' 
                              ? 'Total de predicciones según el día' 
                              : 'Total de predicciones'
                            }
                          </p>
                          <p className="text-white font-bold text-2xl">
                            {predictionMode === 'date' 
                              ? `3` 
                              : predictions.total_predictions
                            }
                          </p>
                          {predictionMode === 'date' && (
                            <p className="text-xs text-slate-500 mt-1">(Mañana, Tarde, Noche)</p>
                          )}
                        </div>
                        {predictions.prediction_date && (
                          <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-700">
                            <p className="text-xs text-slate-400 mb-1">Fecha</p>
                            <p className="text-white font-semibold text-lg">{predictions.prediction_date}</p>
                          </div>
                        )}
                        {predictions.prediction_month && (
                          <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-700">
                            <p className="text-xs text-slate-400 mb-1">Mes</p>
                            <p className="text-white font-semibold text-lg">{predictions.prediction_month}</p>
                          </div>
                        )}
                      </div>

                      {/* Gráfico de Predicciones - Valores Predichos (Filtrado) */}
                      {predictions.predictions && predictions.predictions.length > 0 && (() => {
                        const filteredPredictions = selectedClassFilter 
                          ? predictions.predictions.filter(p => p.predicted_class === selectedClassFilter)
                          : predictions.predictions;
                        
                        return (
                          <div className="mb-6 bg-slate-900/40 rounded-lg p-4 border border-slate-700">
                            <div className="flex items-center justify-between mb-4">
                              <h6 className="text-sm font-semibold text-white">
                                Gráfico de Predicciones: {availableMetrics.find(m => m.value === selectedMetric)?.label || selectedMetric}
                                {selectedClassFilter && (
                                  <span className="ml-2 text-xs text-slate-400 capitalize">(Filtrado: {selectedClassFilter})</span>
                                )}
                              </h6>
                              {selectedClassFilter && (
                                <span className="text-xs text-slate-400">
                                  {filteredPredictions.length} de {predictions.predictions.length} predicciones
                                </span>
                              )}
                            </div>
                            {filteredPredictions.length > 0 ? (() => {
                              // Ajustar cantidad de datos según el modo de predicción
                              let dataToShow = filteredPredictions;
                              const isDateMode = predictionMode === 'date';
                              const isMonthMode = predictionMode === 'month';
                              
                              if (isDateMode) {
                                // Por fecha: mostrar las 3 predicciones (mañana, tarde, noche)
                                // El backend genera exactamente 3 predicciones por fecha
                                dataToShow = filteredPredictions.slice(0, 3);
                              } else if (isMonthMode) {
                                // Por mes: mostrar TODAS las predicciones (todos los días del mes)
                                // El backend ya genera predicciones para todos los días
                                dataToShow = filteredPredictions;
                              }
                              
                              return (
                                <ResponsiveContainer width="100%" height={400}>
                                  <LineChart 
                                    data={dataToShow.map((pred, idx) => {
                                      let dateStr;
                                      let dateValue;
                                      
                                      if (pred.timestamp) {
                                        const date = new Date(pred.timestamp);
                                        dateValue = date;
                                        if (isDateMode) {
                                          // Por fecha: mostrar hora
                                          dateStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                                        } else {
                                          // Por mes: mostrar solo la fecha (día del mes) sin hora
                                          dateStr = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                                        }
                                      } else if (pred.prediction_date) {
                                        const date = new Date(pred.prediction_date);
                                        dateValue = date;
                                        // Agregar hora basada en el índice (24 horas)
                                        date.setHours(idx % 24, (idx % 4) * 15, 0);
                                        dateStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                                      } else if (pred.prediction_month) {
                                        // Para mes, crear fecha basada en el índice
                                        const [year, month] = pred.prediction_month.split('-');
                                        const day = Math.min(30, Math.floor(idx / (filteredPredictions.length / 30)) + 1);
                                        dateValue = new Date(year, month - 1, day);
                                        dateStr = dateValue.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                                      } else {
                                        dateValue = new Date();
                                        dateStr = `#${idx + 1}`;
                                      }
                                      
                                      return {
                                        fecha: dateStr,
                                        fechaValue: dateValue.getTime(), // Para ordenamiento
                                        valor: pred.predicted_value,
                                        clase: pred.predicted_class,
                                        confianza: parseFloat((pred.confidence * 100).toFixed(1))
                                      };
                                    }).sort((a, b) => a.fechaValue - b.fechaValue)} // Ordenar por fecha
                                  margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                                  <XAxis 
                                    dataKey="fecha" 
                                    stroke="#94a3b8"
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                                  />
                                  <YAxis 
                                    stroke="#94a3b8"
                                    tick={{ fill: '#94a3b8' }}
                                    label={{ 
                                      value: availableMetrics.find(m => m.value === selectedMetric)?.label?.match(/\(([^)]+)\)/)?.[1] || 'Valor', 
                                      angle: -90, 
                                      position: 'insideLeft', 
                                      style: { fill: '#94a3b8', textAnchor: 'middle' } 
                                    }}
                                  />
                                  <Tooltip 
                                    contentStyle={{ 
                                      backgroundColor: '#1e293b', 
                                      border: '1px solid #475569', 
                                      borderRadius: '8px',
                                      color: '#e2e8f0'
                                    }}
                                    labelStyle={{ color: '#e2e8f0', marginBottom: '8px' }}
                                    formatter={(value, name) => {
                                      if (name === 'valor') {
                                        return [`${value.toFixed(2)} ${availableMetrics.find(m => m.value === selectedMetric)?.label?.match(/\(([^)]+)\)/)?.[1] || ''}`, 'Valor Predicho'];
                                      }
                                      return [value, name];
                                    }}
                                  />
                                  <Legend wrapperStyle={{ color: '#e2e8f0' }} />
                                  <Line 
                                    type="monotone" 
                                    dataKey="valor" 
                                    stroke={selectedClassFilter === 'normal' ? '#10b981' : selectedClassFilter === 'warning' ? '#eab308' : selectedClassFilter === 'critical' ? '#ef4444' : '#3b82f6'}
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: selectedClassFilter === 'normal' ? '#10b981' : selectedClassFilter === 'warning' ? '#eab308' : selectedClassFilter === 'critical' ? '#ef4444' : '#3b82f6' }}
                                    name={`Valor Predicho${selectedClassFilter ? ` (${selectedClassFilter})` : ''}`}
                                    isAnimationActive={false}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                              );
                            })() : (
                              <div className="h-96 flex items-center justify-center">
                                <p className="text-slate-400">No hay predicciones para la clase seleccionada</p>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Distribución de Clases - Interactiva */}
                      {predictions.predictions && (
                        <div className="mb-6 bg-slate-900/40 rounded-lg p-4 border border-slate-700">
                          <div className="flex items-center justify-between mb-4">
                            <h6 className="text-sm font-semibold text-white">Distribución de Clases Predichas</h6>
                            {selectedClassFilter && (
                              <button
                                onClick={() => setSelectedClassFilter(null)}
                                className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-700/50"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Limpiar filtro
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            {['normal', 'warning', 'critical'].map((cls) => {
                              // Calcular cantidad por día en lugar del total
                              const totalCount = predictions.predictions?.filter(p => p.predicted_class === cls).length || 0;
                              
                              // Calcular cantidad según el modo
                              let count, countLabel, predictionsByDay = {};
                              if (predictionMode === 'month' && predictions.predictions && predictions.predictions.length > 0) {
                                // Modo mes: calcular cantidad de días con esta clase (no el total)
                                predictions.predictions.forEach(pred => {
                                  if (pred.timestamp) {
                                    const date = new Date(pred.timestamp);
                                    const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
                                    if (!predictionsByDay[dayKey]) {
                                      predictionsByDay[dayKey] = [];
                                    }
                                    predictionsByDay[dayKey].push(pred);
                                  }
                                });
                                
                                // Contar cuántos días tienen esta clase (no el total de predicciones)
                                const daysWithClass = Object.values(predictionsByDay).filter(dayPreds => 
                                  dayPreds.some(p => p.predicted_class === cls)
                                ).length;
                                
                                count = daysWithClass;
                                countLabel = daysWithClass.toString();
                              } else if (predictionMode === 'date') {
                                // Modo fecha: mostrar cuántas de las 3 predicciones (mañana, tarde, noche) son de esta clase
                                count = totalCount; // Ya son solo 3 predicciones (mañana, tarde, noche)
                                countLabel = count.toString();
                              } else {
                                // Otros modos: mostrar el total
                                count = totalCount;
                                countLabel = count.toString();
                              }
                              
                              // Calcular porcentaje según el modo
                              let percentage;
                              if (predictionMode === 'date') {
                                // Para modo fecha: porcentaje de las 3 predicciones
                                percentage = (totalCount / 3 * 100).toFixed(1);
                              } else {
                                // Para otros modos: porcentaje del total
                                percentage = predictions.total_predictions > 0 ? (totalCount / predictions.total_predictions * 100).toFixed(1) : 0;
                              }
                              const isSelected = selectedClassFilter === cls;
                              const colorClasses = {
                                normal: {
                                  base: 'bg-green-900/20 border-green-700 text-green-400',
                                  hover: 'hover:bg-green-900/30 hover:border-green-600',
                                  selected: 'bg-green-900/40 border-green-500 ring-2 ring-green-500/50 shadow-lg shadow-green-500/20',
                                  text: 'text-green-400'
                                },
                                warning: {
                                  base: 'bg-yellow-900/20 border-yellow-700 text-yellow-400',
                                  hover: 'hover:bg-yellow-900/30 hover:border-yellow-600',
                                  selected: 'bg-yellow-900/40 border-yellow-500 ring-2 ring-yellow-500/50 shadow-lg shadow-yellow-500/20',
                                  text: 'text-yellow-400'
                                },
                                critical: {
                                  base: 'bg-red-900/20 border-red-700 text-red-400',
                                  hover: 'hover:bg-red-900/30 hover:border-red-600',
                                  selected: 'bg-red-900/40 border-red-500 ring-2 ring-red-500/50 shadow-lg shadow-red-500/20',
                                  text: 'text-red-400'
                                }
                              };
                              const colors = colorClasses[cls];
                              return (
                                <button
                                  key={cls}
                                  onClick={() => setSelectedClassFilter(isSelected ? null : cls)}
                                  className={`
                                    ${isSelected ? colors.selected : colors.base}
                                    ${!isSelected ? colors.hover : ''}
                                    rounded-lg p-4 text-center border transition-all duration-200 cursor-pointer
                                    transform ${isSelected ? 'scale-105' : 'hover:scale-102'}
                                    relative overflow-hidden
                                  `}
                                  title={isSelected ? `Mostrando solo ${cls}. Click para mostrar todas` : `Click para filtrar solo ${cls}`}
                                >
                                  {/* Indicador de selección */}
                                  {isSelected && (
                                    <div className="absolute top-2 right-2">
                                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  )}
                                  <p className="text-xs text-slate-400 mb-1 capitalize font-medium">{cls}</p>
                                  <p className={`text-2xl font-bold ${colors.text} transition-colors`}>{count}</p>
                                  <p className="text-xs text-slate-500 mt-1">
                                    {predictionMode === 'month' 
                                      ? `días (de ${Object.keys(predictionsByDay).length || predictions.total_predictions} total)`
                                      : predictionMode === 'date'
                                        ? `de 3 predicciones (${percentage}%)`
                                        : `${percentage}%`
                                    }
                                  </p>
                                </button>
                              );
                            })}
                          </div>
                          {selectedClassFilter && (
                            <div className="mt-4 pt-4 border-t border-slate-700">
                              <p className="text-xs text-slate-400">
                                Mostrando solo predicciones de clase: <span className="font-semibold text-white capitalize">{selectedClassFilter}</span>
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Tabla de Resultados Detallados (Filtrada) */}
                    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="text-lg font-semibold text-white">
                          Resultados Detallados
                          {selectedClassFilter && (
                            <span className="ml-2 text-sm text-slate-400 capitalize">(Filtrado: {selectedClassFilter})</span>
                          )}
                        </h5>
                        {selectedClassFilter && (
                          <span className="text-xs text-slate-400">
                            {(() => {
                              const filtered = predictions.predictions?.filter(p => p.predicted_class === selectedClassFilter) || [];
                              return `${filtered.length} de ${predictions.predictions?.length || 0} predicciones`;
                            })()}
                          </span>
                        )}
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        <table className="min-w-full divide-y divide-slate-700">
                          <thead className="sticky top-0 bg-slate-800 z-10">
                            <tr className="text-left text-xs font-semibold text-slate-400">
                              <th className="px-4 py-3">Fecha/Hora</th>
                              <th className="px-4 py-3">Valor Predicho</th>
                              <th className="px-4 py-3">Clase</th>
                              <th className="px-4 py-3">Confianza</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {(() => {
                              const filteredPredictions = selectedClassFilter 
                                ? predictions.predictions?.filter(p => p.predicted_class === selectedClassFilter) || []
                                : predictions.predictions || [];
                              
                              if (filteredPredictions.length === 0) {
                                return (
                                  <tr>
                                    <td colSpan="4" className="px-4 py-8 text-center text-slate-400">
                                      No hay predicciones para la clase seleccionada
                                    </td>
                                  </tr>
                                );
                              }
                              
                              // Para modo fecha, mostrar todas las 3 predicciones (sin límite)
                              // Para modo mes, limitar a 50 para no sobrecargar
                              const maxResults = predictionMode === 'date' ? filteredPredictions.length : 50;
                              return filteredPredictions.slice(0, maxResults).map((pred, idx) => {
                                // Formatear fecha/hora según el modo
                                let dateTimeStr = 'N/A';
                                if (pred.timestamp) {
                                  const date = new Date(pred.timestamp);
                                  if (predictionMode === 'date') {
                                    // Para modo fecha: mostrar hora con etiqueta (Mañana, Tarde, Noche)
                                    const hour = date.getHours();
                                    let timeLabel = '';
                                    if (hour === 8) timeLabel = 'Mañana';
                                    else if (hour === 14) timeLabel = 'Tarde';
                                    else if (hour === 20) timeLabel = 'Noche';
                                    
                                    const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                                    dateTimeStr = `${timeLabel} (${timeStr})`;
                                  } else {
                                    // Para modo mes: mostrar fecha
                                    dateTimeStr = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                                  }
                                } else if (pred.prediction_date) {
                                  dateTimeStr = pred.prediction_date;
                                } else if (pred.prediction_month) {
                                  dateTimeStr = pred.prediction_month;
                                }
                                
                                return (
                                  <tr key={idx} className="hover:bg-slate-700/50 transition-colors">
                                    <td className="px-4 py-3 text-slate-300 text-xs">
                                      {dateTimeStr}
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className="text-blue-400 font-bold text-lg">{pred.predicted_value?.toFixed(2) || pred.predicted_value}</span>
                                      <span className="text-xs text-slate-500 ml-1">
                                        {availableMetrics.find(m => m.value === selectedMetric)?.label?.match(/\(([^)]+)\)/)?.[1] || ''}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className={`px-2 py-1 rounded text-xs capitalize ${
                                        pred.predicted_class === 'normal' ? 'bg-green-900/30 text-green-300' :
                                        pred.predicted_class === 'warning' ? 'bg-yellow-900/30 text-yellow-300' :
                                        'bg-red-900/30 text-red-300'
                                      }`}>
                                        {pred.predicted_class}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-300">{(pred.confidence * 100).toFixed(1)}%</td>
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-400 mb-4">No hay modelo entrenado. Por favor, entrena un modelo primero.</p>
                <button
                  onClick={() => goToStep(3)}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
                >
                  Ir a Entrenar Modelo
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mensajes de Error e Info */}
      {error && (
        <div className="mb-6 p-4 rounded-lg border border-red-500 text-red-300 bg-red-900/20">
          {error}
        </div>
      )}

      {info && (
        <div className="mb-6 p-4 rounded-lg border border-green-500 text-green-300 bg-green-900/20">
          {info}
        </div>
      )}

      {/* Navegación */}
      <div className="flex justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className="px-6 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg transition-all"
        >
          ← Anterior
        </button>
        
        {currentStep === 1 && dataAvailable && (
          <button
            onClick={nextStep}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all"
          >
            Siguiente →
          </button>
        )}
        
        {currentStep === 2 && (
          <button
            onClick={nextStep}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all"
          >
            Siguiente →
          </button>
        )}
        
        {currentStep === 4 && modelMetrics && (
          <button
            onClick={nextStep}
            className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-all flex items-center gap-2"
          >
            <span>Predicciones de Regresión</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        )}
        
        {currentStep === 5 && (
          <div className="text-sm text-slate-400">
            Paso final - Predicciones de Regresión
          </div>
        )}
      </div>
    </section>
  );
}



