import { useState } from 'react';
import { FaUpload, FaFileCsv, FaTimes } from 'react-icons/fa';
import { sensorsAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

export default function FileUpload({ sensorType, onUploadComplete, loading }) {
  const { t } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      handleFileUpload(file);
    } else {
      setError(t('upload_csv_only'));
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith('.csv')) {
      handleFileUpload(file);
    } else {
      setError(t('select_csv_file'));
    }
  };

  const handleFileUpload = async (file) => {
    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const response = await sensorsAPI.uploadCSV(sensorType, file);
      
      if (response.data.success) {
        setSuccess(
          `✅ ${response.data.records_inserted} ${t('records_imported')}`
        );
        // Wait a moment for MongoDB to process
        await new Promise(resolve => setTimeout(resolve, 500));
        // Call callback to reload data
        if (onUploadComplete) {
          onUploadComplete(response.data.records_inserted);
        }
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err) {
      setError(
        err.response?.data?.detail || t('upload_error')
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mb-6">
      <div
        className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-slate-600 bg-slate-700/30'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <FaFileCsv className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-sm text-slate-300 mb-2">
            {t('drag_csv_here')}
          </p>
          <label className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors">
            <FaUpload className="w-4 h-4 mr-2" />
            <span>{t('select_file')}</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading || loading}
            />
          </label>
          <p className="text-xs text-slate-400 mt-2">
            {t('csv_files_only')}
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-900/20 border border-red-500 rounded-lg text-red-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError('')}
            className="text-red-400 hover:text-red-300"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="mt-3 p-3 bg-green-900/20 border border-green-500 rounded-lg text-green-400 text-sm flex items-center justify-between">
          <span>{success}</span>
          <button
            onClick={() => setSuccess('')}
            className="text-green-400 hover:text-green-300"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>
      )}

      {uploading && (
        <div className="mt-3 text-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <p className="text-sm text-slate-400 mt-2">{t('uploading_file')}</p>
        </div>
      )}
    </div>
  );
}

