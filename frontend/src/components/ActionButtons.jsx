import { FaSync, FaPlus, FaTrash } from 'react-icons/fa';
import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export default function ActionButtons({
  onGeneratePreview,
  onClear,
  onRefresh,
  loading,
  isAdmin,
}) {
  const { t } = useLanguage();
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateCount, setGenerateCount] = useState(50);
  const [generating, setGenerating] = useState(false);
  const [useDateRange, setUseDateRange] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const params = {
        count: generateCount,
        days_back: 30,
      };
      
      if (useDateRange && dateFrom && dateTo) {
        params.date_from = dateFrom;
        params.date_to = dateTo;
      }
      
      await onGeneratePreview(params);
      setShowGenerateModal(false);
      setGenerateCount(50);
      setUseDateRange(false);
      setDateFrom('');
      setDateTo('');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className={`grid ${isAdmin ? 'grid-cols-2' : 'grid-cols-1'} gap-3 w-full`}>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700/50 disabled:text-slate-500 text-white rounded-xl transition-all duration-200 shadow-lg shadow-blue-900/20 hover:shadow-blue-500/30 border border-blue-500/20 group"
          title={t('refresh')}
        >
          <FaSync className={`w-4 h-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
          <span>{t('refresh')}</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setShowGenerateModal(true)}
            disabled={loading}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700/50 disabled:text-slate-500 text-white rounded-xl transition-all duration-200 shadow-lg shadow-emerald-900/20 hover:shadow-emerald-500/30 border border-emerald-500/20 group"
            title={t('generate')}
          >
            <FaPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>{t('generate')}</span>
          </button>
        )}
      </div>

      {isAdmin && (
        <button
          onClick={onClear}
          disabled={loading}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600/10 hover:bg-red-600 disabled:bg-slate-700/50 disabled:text-slate-500 text-red-500 hover:text-white rounded-xl transition-all duration-300 border border-red-500/30 hover:border-red-500 shadow-lg hover:shadow-red-500/20 group backdrop-blur-sm"
        >
          <FaTrash className="w-4 h-4 group-hover:shake" />
          <span>{t('clear')}</span>
        </button>
      )}

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-sm mx-4 p-0 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/10 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
               <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                     <FaPlus className="w-4 h-4" />
                  </span>
                  {t('generate_test_data')}
               </h3>
               <p className="text-slate-400 text-sm mt-2 ml-10">
                 {t('select_records')}
               </p>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3 flex justify-between">
                  <span>{t('number_of_records')}</span>
                  <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{generateCount}</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="10"
                  value={generateCount}
                  onChange={(e) => setGenerateCount(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <p className="text-xs text-slate-500 mt-2 flex justify-between font-mono">
                   <span>10</span>
                   <span>500</span>
                </p>
              </div>

              <div className="border-t border-white/10 pt-4">
                <label className="flex items-center space-x-3 mb-4 cursor-pointer group">
                  <div className="relative">
                     <input
                        type="checkbox"
                        checked={useDateRange}
                        onChange={(e) => setUseDateRange(e.target.checked)}
                        className="peer sr-only"
                     />
                     <div className="w-10 h-6 bg-slate-700 rounded-full peer peer-checked:bg-emerald-600 peer-focus:ring-2 peer-focus:ring-emerald-500/50 transition-colors"></div>
                     <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                  </div>
                  <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                    {t('specify_date_range')}
                  </span>
                </label>

                {useDateRange && (
                  <div className="space-y-4 animate-in slide-in-from-top-2 duration-300 bg-slate-900/30 p-4 rounded-xl border border-white/5">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-bold">{t('start_date_label')}</label>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950/50 border border-slate-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                        max={dateTo || new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-bold">{t('end_date_label')}</label>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950/50 border border-slate-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                        min={dateFrom}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 bg-slate-900/30 border-t border-white/10 flex space-x-3">
              <button
                onClick={() => setShowGenerateModal(false)}
                disabled={generating}
                className="flex-1 px-4 py-2.5 bg-transparent hover:bg-white/5 text-slate-300 hover:text-white border border-slate-600 hover:border-slate-500 rounded-xl transition-all duration-200 text-sm font-medium"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl transition-all duration-200 shadow-lg shadow-emerald-900/20 text-sm font-bold flex items-center justify-center gap-2"
              >
                {generating ? (
                   <>
                     <FaSync className="animate-spin" />
                     {t('generating')}
                   </>
                ) : (
                   <>
                     <FaPlus />
                     {t('generate_preview')}
                   </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
