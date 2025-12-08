import { FaList } from 'react-icons/fa';
import { useLanguage } from '../contexts/LanguageContext';

export default function RecordLimitSelector({
  value = 500,
  onChange,
  loading = false,
}) {
  const { t } = useLanguage();
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <FaList className="text-purple-400 w-4 h-4" />
        <h3 className="text-sm font-semibold text-white">{t('records_limit')}</h3>
      </div>

      {/* Record Limit Info */}
      <div className="text-xs text-slate-400 bg-slate-900 rounded p-2">
        <p>
          {t('showing')}:{' '}
          <span className="text-purple-400 font-mono font-bold">
            {value.toLocaleString()}
          </span>{' '}
          {t('records_max')}
        </p>
      </div>

      {/* Record Limit Selector */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-2">
          {t('display_limit')}
        </label>
        <select
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={loading}
          className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-slate-300 text-sm focus:border-purple-500 focus:outline-none disabled:opacity-50"
        >
          <option value={500}>500 {t('records')}</option>
          <option value={1000}>1,000 {t('records')}</option>
          <option value={2000}>2,000 {t('records')}</option>
          <option value={10000}>10,000 {t('records')}</option>
        </select>
      </div>

      {/* Info Text */}
      <div className="text-xs text-slate-500 bg-slate-900/50 rounded p-2 border border-slate-700">
        <p>
          {t('limit_info')}
        </p>
      </div>
    </div>
  );
}
