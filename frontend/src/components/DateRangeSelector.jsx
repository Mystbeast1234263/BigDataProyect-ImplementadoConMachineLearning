import { useState, useEffect } from 'react';
import { sensorsAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { FaCalendar } from 'react-icons/fa';

export default function DateRangeSelector({
  sensorType,
  onDateRangeChange,
  loading = false,
}) {
  const { t } = useLanguage();
  const [dateRange, setDateRange] = useState({
    minDate: null,
    maxDate: null,
  });

  const [selectedDates, setSelectedDates] = useState({
    from: null,
    to: null,
  });

  const [error, setError] = useState('');
  const [loadingDates, setLoadingDates] = useState(false);

  // Load available dates on component mount and when sensorType changes
  // This will also reload when the component key changes (forced refresh from parent)
  useEffect(() => {
    if (sensorType) {
      loadAvailableDates();
    }
  }, [sensorType]);

  const loadAvailableDates = async () => {
    if (!sensorType) return; // Don't load if sensorType is empty
    
    setLoadingDates(true);
    setError('');

    try {
      const response = await sensorsAPI.getAvailableDates();
      const data = response.data.date_ranges[sensorType.toLowerCase()];

      if (data && data.min_date && data.max_date) {
        // Handle date strings correctly without timezone conversion
        const minDate = data.min_date.split('T')[0]; // Just take the date part
        const maxDate = data.max_date.split('T')[0]; // Just take the date part

        setDateRange({
          minDate,
          maxDate,
        });

        // Always update selected dates to show the full range when dates are reloaded
        // This ensures new data ranges (like December 2024) are visible
        const shouldUpdateSelection = !selectedDates.from || !selectedDates.to || 
          selectedDates.to < maxDate || selectedDates.from > minDate;
        
        if (shouldUpdateSelection) {
          setSelectedDates({
            from: minDate,
            to: maxDate,
          });

          // Notify parent of the updated date range
          onDateRangeChange({
            from: minDate,
            to: maxDate,
          });
        }
      } else if (data && data.error) {
        setError(`${t('no_data_available_for')} ${sensorType}`);
      } else if (data && (!data.min_date || !data.max_date)) {
        setError(t('no_date_range_found'));
      }
    } catch (err) {
      setError(t('loading_date_ranges'));
      console.error('Error loading dates:', err);
    } finally {
      setLoadingDates(false);
    }
  };

  const handleFromDateChange = (newFrom) => {
    setSelectedDates({ ...selectedDates, from: newFrom });
    setError(''); // Clear error when user makes a change
  };

  const handleToDateChange = (newTo) => {
    setSelectedDates({ ...selectedDates, to: newTo });
    setError(''); // Clear error when user makes a change
  };

  const handleApplyFilter = () => {
    // Validate dates
    if (!selectedDates.from || !selectedDates.to) {
      setError(t('please_select_dates'));
      return;
    }

    if (selectedDates.from > selectedDates.to) {
      setError(t('invalid_date_range'));
      return;
    }

    setError('');
    // Send ONLY date filter to parent with apply flag
    onDateRangeChange({
      from: selectedDates.from,
      to: selectedDates.to,
      apply: true, // Signal to parent to reload data with date filter
    });
  };

  const handleReset = () => {
    if (dateRange.minDate && dateRange.maxDate) {
      setSelectedDates({
        from: dateRange.minDate,
        to: dateRange.maxDate,
      });
      setError('');
      // Reset to full date range
      onDateRangeChange({
        from: dateRange.minDate,
        to: dateRange.maxDate,
        apply: true,
      });
    }
  };

  if (loadingDates) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
          <span className="text-slate-400 text-sm">{t('loading_date_ranges')}</span>
        </div>
      </div>
    );
  }

  if (error && !dateRange.minDate) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <FaCalendar className="text-blue-400 w-4 h-4" />
        <h3 className="text-sm font-semibold text-white">{t('date_range_filter')}</h3>
      </div>

      {/* Date Range Info */}
      {dateRange.minDate && dateRange.maxDate && (
        <div className="text-xs text-slate-400 bg-slate-900 rounded p-2">
          <p>{t('available_data')}: <span className="text-blue-400 font-mono">{dateRange.minDate}</span> to <span className="text-blue-400 font-mono">{dateRange.maxDate}</span></p>
        </div>
      )}

      {/* Date Inputs */}
      <div className="grid grid-cols-2 gap-3">
        {/* From Date */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            {t('start_date')}
          </label>
          <input
            type="date"
            min={dateRange.minDate}
            max={dateRange.maxDate}
            value={selectedDates.from || ''}
            onChange={(e) => handleFromDateChange(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-slate-300 text-sm focus:border-blue-500 focus:outline-none disabled:opacity-50"
          />
        </div>

        {/* To Date */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            {t('end_date')}
          </label>
          <input
            type="date"
            min={dateRange.minDate}
            max={dateRange.maxDate}
            value={selectedDates.to || ''}
            onChange={(e) => handleToDateChange(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-slate-300 text-sm focus:border-blue-500 focus:outline-none disabled:opacity-50"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && dateRange.minDate && (
        <div className="text-xs text-red-400 bg-red-900/20 rounded p-2">
          {error}
        </div>
      )}

      {/* Selected Range Display */}
      {selectedDates.from && selectedDates.to && (
        <div className="text-xs text-slate-400 bg-slate-900 rounded p-2">
          <p>{t('selected')}: <span className="text-green-400 font-mono">{selectedDates.from}</span> to <span className="text-green-400 font-mono">{selectedDates.to}</span></p>
        </div>
      )}

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleApplyFilter}
          disabled={loading || !selectedDates.from || !selectedDates.to}
          className="px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition disabled:opacity-50 disabled:bg-slate-600"
        >
          {t('apply_filter')}
        </button>
        <button
          onClick={handleReset}
          disabled={loading}
          className="px-3 py-2 text-xs font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 rounded transition disabled:opacity-50"
        >
          {t('reset_range')}
        </button>
      </div>
    </div>
  );
}
