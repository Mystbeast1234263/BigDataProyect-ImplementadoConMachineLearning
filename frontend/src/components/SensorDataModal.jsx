import { useState, useMemo } from 'react';
import SensorDataTable from './SensorDataTable';

export default function SensorDataModal({ data, sensorType, isOpen, onClose }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 500;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div className="glass-panel w-full max-w-7xl max-h-[90vh] flex flex-col rounded-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Datos de Sensores
            </h2>
            <p className="text-sm text-slate-400 mt-1 font-medium">
              Mostrando <span className="text-slate-200">{filteredData.length}</span> de <span className="text-slate-200">{data.length}</span> registros
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-all duration-200 p-2 hover:bg-white/10 rounded-full hover:rotate-90"
            aria-label="Cerrar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-white/10 bg-slate-900/30">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Buscar por sensor, ubicación..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              className="w-full px-4 py-3 pl-10 bg-slate-950/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 backdrop-blur-sm shadow-inner"
            />
            <svg
              className="absolute left-3 top-3.5 w-5 h-5 text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          <div className="p-1">
             <SensorDataTable data={paginatedData} sensorType={sensorType} />
          </div>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/10 bg-slate-900/50 backdrop-blur-md rounded-b-2xl">
          <div className="text-sm font-medium text-slate-400">
            Página <span className="text-white">{currentPage}</span> de <span className="text-white">{totalPages || 1}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 text-sm font-medium border border-white/5 disabled:hover:bg-slate-800"
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
                    className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 ${
                      currentPage === pageNum
                        ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-500/20 ring-1 ring-blue-400'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-white/5'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 text-sm font-medium border border-white/5 disabled:hover:bg-slate-800"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}








