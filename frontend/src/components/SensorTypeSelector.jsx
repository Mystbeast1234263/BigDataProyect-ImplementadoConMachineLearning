import { FaWind, FaVolumeUp, FaWater } from 'react-icons/fa';
import { useLanguage } from '../contexts/LanguageContext';

export default function SensorTypeSelector({ selected, onChange }) {
  const { t } = useLanguage();
  
  const sensors = [
    {
      id: 'air',
      nameKey: 'air_quality',
      descriptionKey: 'co2_temperature_humidity',
      icon: FaWind,
      color: 'bg-sky-600',
    },
    {
      id: 'sound',
      nameKey: 'sound_level',
      descriptionKey: 'decibels',
      icon: FaVolumeUp,
      color: 'bg-purple-600',
    },
    {
      id: 'underground',
      nameKey: 'water_level',
      descriptionKey: 'underground_level',
      icon: FaWater,
      color: 'bg-blue-600',
    },
  ];

  return (
    <div>
      <label className="block text-sm font-medium text-slate-200 mb-2">
        {t('sensor_type')}
      </label>
      <select
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
      >
        {sensors.map((sensor) => (
          <option key={sensor.id} value={sensor.id}>
            {t(sensor.nameKey)}
          </option>
        ))}
      </select>
    </div>
  );
}
