import { useState } from 'react';
import { sensorsAPI } from '../services/api';
import { FaSave, FaTimes } from 'react-icons/fa';

export default function GeneratedDataPreview({
  data,
  sensorType,
  onSaved,
  onClose,
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleSaveClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    setSaving(true);
    setError('');

    try {
      const response = await sensorsAPI.saveGeneratedData(sensorType, data);

      if (response.data.success) {
        onSaved(response.data.records_saved);
        setShowConfirmModal(false);
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Failed to save data. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  // Get column names from first record
  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  // Format display name for columns
  const formatColumnName = (col) => {
    return col
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format value for display
  const formatValue = (value) => {
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    return String(value);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-700 px-6 py-4 border-b border-slate-600 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              Generated {sensorType.charAt(0).toUpperCase() + sensorType.slice(1)} Data Preview
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {data.length} records ready to save
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border-b border-red-500 px-6 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="bg-slate-700 sticky top-0">
              <tr>
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-200 whitespace-nowrap"
                  >
                    {formatColumnName(col)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {data.map((record, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="hover:bg-slate-700/50 transition duration-200"
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className="px-4 py-3 text-sm text-slate-300"
                    >
                      {formatValue(record[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="bg-slate-700 px-6 py-4 border-t border-slate-600 flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Showing {data.length} records
          </p>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveClick}
              disabled={saving}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white rounded-lg transition duration-200"
            >
              <FaSave className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save to Database'}</span>
            </button>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 max-w-sm">
              <h3 className="text-lg font-bold text-white mb-4">
                Confirm Save to MongoDB
              </h3>
              <p className="text-slate-300 mb-6">
                Are you sure you want to save these{' '}
                <span className="font-semibold text-blue-400">{data.length}</span>{' '}
                records to MongoDB? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-700 text-white rounded-lg transition duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSave}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white rounded-lg transition duration-200"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
