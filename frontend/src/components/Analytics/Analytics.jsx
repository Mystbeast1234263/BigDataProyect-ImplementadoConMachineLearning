import React, { useState, useEffect } from 'react';
import DashboardAir from './DashboardAir';
import DashboardSound from './DashboardSound';
import DashboardUnderground from './DashboardUnderground';
import { sensorsAPI } from '../../services/api';

export const Analytics = ({ dateFilter, recordLimit }) => {
  const [activeTab, setActiveTab] = useState('air');
  const [data, setData] = useState({
    air: [],
    sound: [],
    underground: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [effectiveFilter, setEffectiveFilter] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Obtener fechas para el filtro - usar el filtro actual o generar fechas por defecto
        let dateFrom = dateFilter?.from || dateFilter?.startDate;
        let dateTo = dateFilter?.to || dateFilter?.endDate;

        // Si no hay filtro, usar las últimas 2 semanas
        if (!dateFrom || !dateTo) {
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(endDate.getDate() - 14);

          dateFrom = startDate.toISOString().split('T')[0];
          dateTo = endDate.toISOString().split('T')[0];
        }

        const limit = recordLimit || 10000;

        // Obtener datos de los tres tipos de sensores usando sensorsAPI
        const [airRes, soundRes, undergroundRes] = await Promise.all([
          sensorsAPI.getSensorDataByDateRange('air', dateFrom, dateTo, limit),
          sensorsAPI.getSensorDataByDateRange('sound', dateFrom, dateTo, limit),
          sensorsAPI.getSensorDataByDateRange('underground', dateFrom, dateTo, limit),
        ]);

        setData({
          air: airRes.data.data || [],
          sound: soundRes.data.data || [],
          underground: undergroundRes.data.data || [],
        });

        setEffectiveFilter({ from: dateFrom, to: dateTo });
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError('Error al cargar datos de análisis. Intenta seleccionar un rango de fechas válido.');
        setData({ air: [], sound: [], underground: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateFilter, recordLimit]);

  const tabs = [
    { id: 'air', label: '🌍 Aire', icon: '💨' },
    { id: 'sound', label: '📢 Sonido', icon: '🔊' },
    { id: 'underground', label: '💧 Agua', icon: '💦' },
  ];

  return (
    <div className="w-full">
      {/* Header con instrucciones */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded text-slate-900">
        <p className="text-sm font-medium mb-2">
          📊 <strong>Análisis Interactivo</strong> - Usa los filtros de fecha para actualizar los gráficos
        </p>
        {effectiveFilter && (
          <p className="text-xs text-blue-600">
            📅 Período: {effectiveFilter.from} a {effectiveFilter.to}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium transition ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando datos de análisis...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
          <p className="text-red-700">⚠️ {error}</p>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <div>
          {activeTab === 'air' && <DashboardAir data={data.air} />}
          {activeTab === 'sound' && <DashboardSound data={data.sound} />}
          {activeTab === 'underground' && <DashboardUnderground data={data.underground} />}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && data[activeTab].length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">
            No hay datos disponibles para el período seleccionado
          </p>
          <p className="text-gray-400 text-sm">
            Intenta cambiar el rango de fechas o aumentar el límite de registros
          </p>
        </div>
      )}
    </div>
  );
};

export default Analytics;
