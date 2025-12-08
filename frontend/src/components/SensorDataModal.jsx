import { useState, useMemo } from 'react';
import SensorDataTable from './SensorDataTable';

export default function SensorDataModal({ data, sensorType, isOpen, onClose }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 50;

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    const term = searchTerm.toLowerCase();
    return data.filter((record) => {
      const sensorName = (record.sensor_name || '').toLowerCase();
      const location = (record.ubicacion || '').toLowerCase();
      const address = (record.direccion || '').toLowerCase();
      
      return sensorName.includes(term) || 
             location.includes(term) || 
             address.includes(term);
    });
  }, [data, searchTerm]);

  // Paginate filtered data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Datos de Sensores</h2>
            <p className="text-sm text-slate-400 mt-1">
              Mostrando {filteredData.length} de {data.length} registros
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg"
            aria-label="Cerrar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-slate-700">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por sensor, ubicación o dirección..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              className="w-full px-4 py-3 pl-10 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <svg
              className="absolute left-3 top-3.5 w-5 h-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto">
          <SensorDataTable data={paginatedData} sensorType={sensorType} />
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-700 bg-slate-700/50">
          <div className="text-sm text-slate-400">
            Página {currentPage} de {totalPages || 1}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
            >
              Anterior
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 rounded ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-600 hover:bg-slate-500 text-slate-200'
                    } transition-colors text-sm`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}








