export default function SensorDataTable({ data, sensorType }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-12 border border-slate-700 text-center">
        <p className="text-slate-400">No sensor data available</p>
      </div>
    );
  }


  // Define columns based on sensor type
  const renderTableHeaders = () => {
    const commonHeaders = (
      <>
        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">
          Sensor Name
        </th>
        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">
          Timestamp
        </th>
      </>
    );

    if (sensorType === 'air') {
      return (
        <>
          {commonHeaders}
          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">
            CO2 (ppm)
          </th>
          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">
            Temperature (°C)
          </th>
          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">
            Humidity (%)
          </th>
          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">
            Pressure (hPa)
          </th>
          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">
            Location
          </th>
        </>
      );
    } else if (sensorType === 'sound') {
      return (
        <>
          {commonHeaders}
          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">
            LAeq (dB)
          </th>
          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">
            LAI (dB)
          </th>
          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">
            LAImax (dB)
          </th>
          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">
            Battery (%)
          </th>
          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">
            Location
          </th>
        </>
      );
    } else if (sensorType === 'underground') {
      return (
        <>
          {commonHeaders}
          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">
            Distance (mm)
          </th>
          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">
            State
          </th>
          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">
            Position
          </th>
          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">
            Battery (%)
          </th>
          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">
            Location
          </th>
        </>
      );
    }

    return commonHeaders;
  };

  const renderTableRow = (record, index) => {
    const commonCells = (
      <>
        <td className="px-6 py-4 text-sm text-white">
          {record.sensor_name}
        </td>
        <td className="px-6 py-4 text-sm text-slate-400">
          {new Date(record.time).toLocaleString()}
        </td>
      </>
    );

    if (sensorType === 'air') {
      return (
        <tr
          key={index}
          className="hover:bg-slate-700/50 transition duration-200"
        >
          {commonCells}
          <td className="px-6 py-4 text-sm font-semibold text-blue-400">
            {record.co2_ppm?.toFixed(2) || 'N/A'}
          </td>
          <td className="px-6 py-4 text-sm font-semibold text-orange-400">
            {record.temperatura_c?.toFixed(2) || 'N/A'}
          </td>
          <td className="px-6 py-4 text-sm font-semibold text-cyan-400">
            {record.humedad_percent?.toFixed(2) || 'N/A'}
          </td>
          <td className="px-6 py-4 text-sm font-semibold text-purple-400">
            {record.presion_hpa?.toFixed(2) || 'N/A'}
          </td>
          <td className="px-6 py-4 text-sm text-slate-400">
            {record.ubicacion || 'N/A'}
          </td>
        </tr>
      );
    } else if (sensorType === 'sound') {
      return (
        <tr
          key={index}
          className="hover:bg-slate-700/50 transition duration-200"
        >
          {commonCells}
          <td className="px-6 py-4 text-sm font-semibold text-red-400">
            {record.laeq_db?.toFixed(2) || 'N/A'}
          </td>
          <td className="px-6 py-4 text-sm font-semibold text-yellow-400">
            {record.lai_db?.toFixed(2) || 'N/A'}
          </td>
          <td className="px-6 py-4 text-sm font-semibold text-pink-400">
            {record.laimax_db?.toFixed(2) || 'N/A'}
          </td>
          <td className="px-6 py-4 text-sm font-semibold text-green-400">
            {record.bateria_percent?.toFixed(2) || 'N/A'}
          </td>
          <td className="px-6 py-4 text-sm text-slate-400">
            {record.ubicacion || 'N/A'}
          </td>
        </tr>
      );
    } else if (sensorType === 'underground') {
      return (
        <tr
          key={index}
          className="hover:bg-slate-700/50 transition duration-200"
        >
          {commonCells}
          <td className="px-6 py-4 text-sm font-semibold text-cyan-400">
            {record.distancia_mm?.toFixed(2) || 'N/A'}
          </td>
          <td className="px-6 py-4 text-sm font-semibold text-blue-400">
            {record.estado !== null && record.estado !== undefined ? record.estado : 'N/A'}
          </td>
          <td className="px-6 py-4 text-sm text-slate-300">
            {record.posicion || 'N/A'}
          </td>
          <td className="px-6 py-4 text-sm font-semibold text-green-400">
            {record.bateria_percent?.toFixed(2) || 'N/A'}
          </td>
          <td className="px-6 py-4 text-sm text-slate-400">
            {record.ubicacion || 'N/A'}
          </td>
        </tr>
      );
    }

    return null;
  };

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-700">
            <tr>
              {renderTableHeaders()}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {data.map((record, index) => renderTableRow(record, index))}
          </tbody>
        </table>
      </div>

      {/* Pagination Info */}
      <div className="bg-slate-700/50 px-6 py-3 text-sm text-slate-400">
        Showing {data.length} records
      </div>
    </div>
  );
}
