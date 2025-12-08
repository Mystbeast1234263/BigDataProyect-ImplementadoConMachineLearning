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
    <div className="flex items-end space-x-3">
      <button
        onClick={onRefresh}
        disabled={loading}
        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg transition duration-200"
      >
        <FaSync className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        <span>{t('refresh')}</span>
      </button>

      {isAdmin && (
        <>
          <button
            onClick={() => setShowGenerateModal(true)}
            disabled={loading}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white rounded-lg transition duration-200"
          >
            <FaPlus className="w-4 h-4" />
            <span>{t('generate')}</span>
          </button>

          <button
            onClick={onClear}
            disabled={loading}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white rounded-lg transition duration-200"
          >
            <FaTrash className="w-4 h-4" />
            <span>{t('clear')}</span>
          </button>
        </>
      )}

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-sm mx-auto border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4">{t('generate_test_data')}</h3>
            <p className="text-slate-400 text-sm mb-4">
              {t('select_records')}
            </p>
            <div className="mb-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  {t('number_of_records')}: <span className="text-blue-400 font-bold">{generateCount}</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="10"
                  value={generateCount}
                  onChange={(e) => setGenerateCount(parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-slate-500 mt-2">{t('slide_to_select')}</p>
              </div>

              <div className="border-t border-slate-600 pt-4">
                <label className="flex items-center space-x-2 mb-3">
                  <input
                    type="checkbox"
                    checked={useDateRange}
                    onChange={(e) => setUseDateRange(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-slate-200">
                    {t('specify_date_range')}
                  </span>
                </label>

                {useDateRange && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">{t('start_date_label')}:</label>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                        max={dateTo || new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">{t('end_date_label')}:</label>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                        min={dateFrom}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <p className="text-xs text-slate-400">
                      {t('date_range_hint')}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white rounded-lg transition duration-200 font-medium"
              >
                {generating ? t('generating') : t('generate_preview')}
              </button>
              <button
                onClick={() => setShowGenerateModal(false)}
                disabled={generating}
                className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-700 text-white rounded-lg transition duration-200"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
